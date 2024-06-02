
    import { test } from '@playwright/test';
    import { executeDynamicCommand } from '../lib/command';
    
    test.beforeEach(async ({ page }) => {
        //await page.goto("https://eu.phrase-qa.com");
       // await page.waitForURL("https://eu.phrase-qa.com/idm-ui/signin");
       await page.goto("http://127.0.0.1:8080/username.html");
            
      });
    


test('Verify User Can create a workflow', async ({ page }) => {

    await executeDynamicCommand("Click on the orchestrator button", page);
    await executeDynamicCommand("Verify that the user is navigated to orchestrator and url consists of \"orchestrator/manage/workflows\"", page);
    await executeDynamicCommand("Click on the create buton on top left of the screen", page);
    await executeDynamicCommand("Verify create menu is open", page);
    await executeDynamicCommand("Click on \"create-new-workflow\" inside the create button", page);
    await executeDynamicCommand("Verify a modal box for creating new workflow is open", page);
    await executeDynamicCommand("Write name of workflow as \"groq\"", page);
    await executeDynamicCommand("Verify that the workflow name\"groq\" has been entered.", page);
    await executeDynamicCommand("Click on save", page);
    await executeDynamicCommand("Verify user is navigated to editor screen", page);
});

test('Verify User Can create actions in workflow', async ({ page }) => {

    await executeDynamicCommand("Click on the orchestrator button", page);
    await executeDynamicCommand("Verify that the user is navigated to orchestrator and url consists of \"orchestrator/manage/workflows\"", page);
    await executeDynamicCommand("Click on the create buton on top left of the screen", page);
    await executeDynamicCommand("Verify create menu is open", page);
    await executeDynamicCommand("Click on \"create-new-workflow\" inside the create button", page);
    await executeDynamicCommand("Verify a modal box for creating new workflow is open", page);
    await executeDynamicCommand("Write name of workflow as \"workflow 1\"", page);
    await executeDynamicCommand("Verify that the workflow name\"workflow 1\" has been entered.", page);
    await executeDynamicCommand("Click on save", page);
    await executeDynamicCommand("Verify user is navigated to editor screen", page);
    await executeDynamicCommand("Click on \"triggers\" ", page);
    await executeDynamicCommand("Verify that the search bar is shown , with text \"Search triggers\"", page);
    await executeDynamicCommand("Type\"dummy trigger\" in the trigger search bar", page);
    await executeDynamicCommand("dummy trigger \"draggable-block\" should be shown", page);
    await executeDynamicCommand("drag the dummy trigger draggable-block to the canvas", page);
    await executeDynamicCommand("dummy trigger draggable-block should be in the canvas", page);
});

test('user can login', async ({ page }) => {

    await executeDynamicCommand("Enter in the username field: shray.sharma+orchprov1@phrase.com", page);
    await executeDynamicCommand("Verify that the value \"shray.sharma+orchprov1@phrase.com\" is entered in the username field", page);
    await executeDynamicCommand("ENter password in the password field: Verygoodpassword123!", page);
    await executeDynamicCommand("Verify that the password field has value in it", page);
    await executeDynamicCommand("Click on login", page);

});
