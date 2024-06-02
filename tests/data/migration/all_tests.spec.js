
import { test } from '@playwright/test';
import { generatePlaywrightTest } from '../../../lib/command';

test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:8080/username.html");
});


test('user can login', async ({ page }, testInfo) => {
    const commandsWithExpectedResults = [
    "Enter in the username field: shray.sharma+orchprov1@phrase.com",
    "Verify that the value \"shray.sharma+orchprov1@phrase.com\" is entered in the username field",
    "ENter password in the password field: Verygoodpassword123!",
    "Verify that the password field has value in it",
    "Click on login"
];

    await generatePlaywrightTest(commandsWithExpectedResults,page,testInfo);
});
