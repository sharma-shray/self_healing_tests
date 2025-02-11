const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Fetch list of test cases from Zephyr API
async function fetchTestCases() {
    const config = {
        method: 'get',
        url: 'https://api.zephyrscale.smartbear.com/v2/testcases',
        headers: {
            'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjb250ZXh0Ijp7ImJhc2VVcmwiOiJodHRwczovL3NoYXJtYXNocmF5OTIuYXRsYXNzaWFuLm5ldCIsInVzZXIiOnsiYWNjb3VudElkIjoiNjAzZGYwMzMyMDEyMmIwMDY4NmVlYjQ2In19LCJpc3MiOiJjb20ua2Fub2FoLnRlc3QtbWFuYWdlciIsInN1YiI6Ijk1NTUzZGNmLTFlZDctM2FmYi05NDFlLWU0MmM1MTRjNGYxMSIsImV4cCI6MTc0NzEzNjI5MiwiaWF0IjoxNzE1NjAwMjkyfQ.XHW8_gbynwCQXfYaKlPCYCQRJLDOw_hJ4_yoWEwP888'
        }
    };

    try {
        const response = await axios(config);
        return response.data.values; // Return test cases if the API call succeeds
    } catch (error) {
        console.error('Error fetching test cases:', error);
        return null; // Return null in case of an error
    }
}

// Fetch detailed steps for a specific test case by its key
async function fetchTestCaseDetails(testCaseKey) {
    const config = {
        method: 'get',
        url: `https://api.zephyrscale.smartbear.com/v2/testcases/${testCaseKey}/teststeps`,
        headers: {
            'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjb250ZXh0Ijp7ImJhc2VVcmwiOiJodHRwczovL3NoYXJtYXNocmF5OTIuYXRsYXNzaWFuLm5ldCIsInVzZXIiOnsiYWNjb3VudElkIjoiNjAzZGYwMzMyMDEyMmIwMDY4NmVlYjQ2In19LCJpc3MiOiJjb20ua2Fub2FoLnRlc3QtbWFuYWdlciIsInN1YiI6Ijk1NTUzZGNmLTFlZDctM2FmYi05NDFlLWU0MmM1MTRjNGYxMSIsImV4cCI6MTc0NzEzNjI5MiwiaWF0IjoxNzE1NjAwMjkyfQ.XHW8_gbynwCQXfYaKlPCYCQRJLDOw_hJ4_yoWEwP888'
        }
    };

    try {
        const response = await axios(config);
        return response.data.values; // Return test steps if the API call succeeds
    } catch (error) {
        console.error(`Error fetching details for test case ${testCaseKey}:`, error);
        return null; // Return null in case of an error
    }
}

// Ensures the existence of the directory where the test file will be saved
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}


// Generates a Playwright test script from fetched test cases
function generatePlaywrightTests(testCases) {
    const filePath = './tests/data/migration/all_tests.spec.js';
    ensureDirectoryExistence(filePath); // Ensure the directory exists

    // Check if the file exists and delete it if it does
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Map each testCase to a Playwright test
    const testScripts = testCases.map(testCase => {
        // Create an array of commands for each test case
        const commandsWithExpectedResults = testCase.steps.reduce((acc, step) => {
            acc.push(step.inline.description);
            if (step.inline.expectedResult) {
                acc.push(step.inline.expectedResult);
            }
            return acc;
        }, []);

        // Define the initial steps for each test
        const initialSteps = '';

        // Add the initial steps to each test
        return `
test(\`${testCase.name}\`, async ({ page }, testInfo) => {
    const commandsWithExpectedResults = ${JSON.stringify(commandsWithExpectedResults, null, 4)};

    await generatePlaywrightTest(commandsWithExpectedResults,page,testInfo);
});`;
    }).join('\n');

    const fullTestScript = `
import { test } from '@playwright/test';
import { generatePlaywrightTest } from '../../../lib/command';

test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:8080/username.html");
});

${testScripts}
`;

    fs.writeFileSync(filePath, fullTestScript);
    console.log(`Generated Playwright test file at ${filePath}`);
}

// Main function to orchestrate the fetching of test cases and generating tests
async function main() {
    const fetchedTestCases = await fetchTestCases();
    if (Array.isArray(fetchedTestCases)) {
        const detailedTestCases = [];

        for (const testCase of fetchedTestCases) {
            const details = await fetchTestCaseDetails(testCase.key);
            if (details) {
                detailedTestCases.push({
                    name: testCase.name,
                    steps: details
                });
            }
        }

        if (detailedTestCases.length > 0) {
            generatePlaywrightTests(detailedTestCases);
        }
    } else {
        console.log('Received data is not an array:', fetchedTestCases);
    }
}

main();  // Execute the main function
