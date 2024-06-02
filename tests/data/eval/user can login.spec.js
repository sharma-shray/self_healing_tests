
import { test } from '@playwright/test';

test('user can login', async ({ page }) => {
await page.evaluate(() => {document.querySelector('#username').value = 'shray.sharma+orchprov1@phrase.com';});
await page.evaluate(() => {const usernameInput = document.querySelector('#username');
  if (usernameInput.value === 'shray.sharma+orchprov1@phrase.com') {
    console.log('Username field contains the correct value.');
  } else {
    throw new Error('Verification failure');
  }});
await page.evaluate(() => {document.querySelector('[name="password"]').value = 'Verygoodpassword123!';});
await page.evaluate(() => {const passwordInput = document.querySelector('#password');
  if (passwordInput.value) {
    console.log('Password field has a value.');
  } else {
    throw new Error('Verification failure: Password field is empty.');
  }});
await page.evaluate(() => {const loginButton = document.querySelector('input[type="submit"]');
    loginButton.click();});
});
