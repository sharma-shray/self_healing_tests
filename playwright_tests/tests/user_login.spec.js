
import { test } from '@playwright/test';

test('user can login', async ({ page }) => {
test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:8080/username.html");
});
await page.fill('#username', 'shray.sharma+orchprov1@phrase.com');
await expect(page.fill('#username', 'shray.sharma+orchprov1@phrase.com')).toBeFilled();
await page.fill('[name="password"]', 'Verygoodpassword123!');
await expect(page.fill('#password', 'Verygoodpassword123!')).toBeComplete();
await page.click('input[type="submit"]');
});
