
    import { test } from '@playwright/test';
    import { executeDynamicCommand } from '../lib/command';
    
    test.beforeEach(async ({ page }) => {
        await page.goto("https://eu.phrase-qa.com/");
      });
    


test('Verify User Can create a workflow', async ({ page }) => {

    await executeDynamicCommand("Accept the cookies", page);
    await executeDynamicCommand("Verify that the Cookie banner is no longer visible", page);
    await executeDynamicCommand("Enter text into the \"shray.sharma+orchprov1@phrase.com\" field.", page);
    await executeDynamicCommand("Verify that \"shray.sharma+orchprov1@phrase.com\" should be visible in the Username field.", page);
    await executeDynamicCommand("enter password \"Verygoodpassword123!\"", page);
    await executeDynamicCommand("verify that the password field now has some value in it", page);
    await executeDynamicCommand("click on the login button", page);
    await executeDynamicCommand("Verify that the user should be succesfully navigated to dashboard page the url should contain ( idm-ui/dashboard)", page);
    await executeDynamicCommand("Click on phrase orchestrator", page);
    await executeDynamicCommand("Verify that User should see orchestrator landing page, with workflows on top as title", page);
});
