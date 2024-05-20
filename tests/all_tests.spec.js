
    import { test } from '@playwright/test';
    import { executeDynamicCommand } from '../lib/command';
    
    test.beforeEach(async ({ page }) => {
        await page.goto("https://eu.phrase-qa.com/");
      });
    


test('Verify User Can create a workflow', async ({ page }) => {

    await executeDynamicCommand("Enter text into the \"shray.sharma\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the Username field.", page);
    await executeDynamicCommand("enter password \"Kidsnextdoor123!\"", page);
    await executeDynamicCommand("verify that the password is entered.", page);
    await executeDynamicCommand("click login", page);
    await executeDynamicCommand("user should be succesfully logged in", page);
    await executeDynamicCommand("Click on phrase orchestrator tile", page);
    await executeDynamicCommand("User should see orchestrator landing page, with workflows on top as title", page);
});
