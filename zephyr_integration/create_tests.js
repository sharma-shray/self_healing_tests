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
    const filePath = './tests/all_tests.spec.js';
    ensureDirectoryExistence(filePath); // Ensure the directory exists

    // Check if the file exists and delete it if it does
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Map each testCase to a Playwright test
    const testScripts = testCases.map(testCase => {
        // Map each step in a testCase to commands in the test
        const commands = testCase.steps.map(step => {
            const command = `    await executeDynamicCommand("${step.inline.description.replace(/"/g, '\\"')}", page);`;
            const expected = step.inline.expectedResult ? `    await executeDynamicCommand("${step.inline.expectedResult.replace(/"/g, '\\"')}", page);` : '';
            return `${command}\n${expected}`;
        }).join('\n');

        // Define the initial steps for each test globala setup
        const initialSteps = '';

        // Add the initial steps to each test
        return `
test('${testCase.name}', async ({ page }) => {
${initialSteps}
${commands}
});`;
    }).join('\n');

    const fullTestScript = `
    import { test } from '@playwright/test';
    import { executeDynamicCommand } from '../lib/command';
    
    test.beforeEach(async ({ page }) => {
        //await page.goto("https://eu.phrase-qa.com");
       // await page.waitForURL("https://eu.phrase-qa.com/idm-ui/signin");
       await page.goto("http://127.0.0.1:8080/username.html");
            
      });
    

${testScripts}
`;
/*
//Wait for page load so that we can enter the login credentials
            await page.waitForSelector("body[data-hydrated]");
    
            await page.waitForSelector('button[name="Accept all cookies"]', { state: "hidden" });
            await page.getByRole('button', { name: 'Accept all cookies' }).click();
            await page.locator('input[name="username"]').fill("shray.sharma+orchprov1@phrase.com");
            await page.locator('input[name="password"]').fill("Verygoodpassword123!");
            await page.locator('[data-testid="account-signin-form--keep-logged-checkbox"]').click();
            await page.locator('[data-testid="account-signin-form-submit"]').click();
        
            await page.waitForURL("https://eu.phrase-qa.com/idm-ui/dashboard");
            await page.waitForSelector('text="Phrase Orchestrator"', { state: "visible" });*/
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
