
import { expect,test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/username.html");
});

test('user can login', async ({ page }) => {
await page.fill('#username', 'shray.sharma+orchprov1@phrase.com');
await expect(page.locator('#username')).toHaveValue('shray.sharma+orchprov1@phrase.com');
await page.fill('[name="password"]', 'Verygoodpassword123!');
await expect(page.locator('#password')).toHaveValue('Verygoodpassword123!');
await page.click('input[type="submit"]');
});
