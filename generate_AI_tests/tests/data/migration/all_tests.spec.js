
import { test } from '@playwright/test';
import { generatePlaywrightTest } from '../../../lib/command';

test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:8080/username.html");
});


test('user can login', async ({ page }, testInfo) => {
    const commandsWithExpectedResults = [
    "Enter in the username field: shray.sharma+orchprov1@phrase.com",
    "Verify that the value is shown in the username field \"shray.sharma+orchprov1@phrase.com\" ",
    "Enter password in the password field: Verygoodpassword123!",
    "Verify that the password field has \"Verygoodpassword123!\" shown in it<br /><br />",
    "Click on login"
];

    await generatePlaywrightTest(commandsWithExpectedResults,page,testInfo);
});
