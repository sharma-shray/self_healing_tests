
import { expect,test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/username.html");
});

test('user can login', async ({ page }) => {
await page.evaluate(() => {document.querySelector('#username').value = 'shray.sharma+orchprov1@phrase.com';});
await page.evaluate(() => {const usernameInput = document.querySelector('#username');
  if (usernameInput.value === 'shray.sharma+orchprov1@phrase.com') {
    console.log('The value is shown in the username field.');
  } else {
    throw new Error('Verification failure');
  }});
await page.evaluate(() => {document.querySelector('[name="password"]').value = 'Verygoodpassword123!';});
await page.evaluate(() => {const passwordInput = document.querySelector('#password');
  if (passwordInput.value === 'Verygoodpassword123!') {
    console.log('Password field has the correct value.');
  } else {
    throw new Error('Verification failure');
  }});
await page.evaluate(() => {const loginButton = document.querySelector('input[type="submit"]');
    loginButton.click();});
});
