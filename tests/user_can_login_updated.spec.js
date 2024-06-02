
import { test } from '@playwright/test';

test('user can login', async ({ page }) => {
await page.fill('#username', 'shray.sharma+orchprov1@phrase.com');
await page.evaluate(() => {const usernameInput = document.querySelector('#username');
  if (usernameInput.value === 'shray.sharma+orchprov1@phrase.com') {
    console.log('Username field contains the correct value.');
  } else {
    throw new Error('Verification failure');
  }});
await page.fill('[name="password"]', 'Verygoodpassword123!');
await page.evaluate(() => {const passwordInput = document.querySelector('#password');
  if (passwordInput.value) {
    console.log('Password field has a value.');
  } else {
    throw new Error('Verification failure: Password field is empty.');
  }});
await page.click('input[type="submit"]');
});
