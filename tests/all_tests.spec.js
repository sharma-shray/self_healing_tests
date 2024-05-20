
import { test } from '@playwright/test';
import { executeDynamicCommand } from '../lib/command';


test('Verify User Can Fill in Username', async ({ page }) => {

    await executeDynamicCommand("Naviagte to http://localhost:8080/username.html", page);
    await executeDynamicCommand("Verify usr is succesfully navigated", page);
    await executeDynamicCommand("Enter text into the \"Username\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Username\" field.", page);
});

test('Verify User Can Fill in Password', async ({ page }) => {

    await executeDynamicCommand("Naviagte to http://localhost:8080/username.html", page);
    await executeDynamicCommand("Verify user is succesfully navigated.", page);
    await executeDynamicCommand("Enter text into the \"Password\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Password\" field as asterisks or dots (masked).", page);
});

test('Verify User Can Submit Login Form', async ({ page }) => {

    await executeDynamicCommand("Naviagte to http://localhost:8080/username.html", page);
    await executeDynamicCommand("Verify user is sccuesfully navigated.", page);
    await executeDynamicCommand("Enter text into the \"Username\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Username\" field.", page);
    await executeDynamicCommand("Enter text into the \"Password\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Password\" field as asterisks or dots (masked).", page);
    await executeDynamicCommand("Click the \"Login\" button.", page);
    await executeDynamicCommand("The login form should submit successfully, and the user should be redirected to the dashboard page.", page);
});

test('Verify Dashboard Page After Successful Login', async ({ page }) => {

    await executeDynamicCommand("Naviagte to http://localhost:8080/username.html", page);
    await executeDynamicCommand("Validate that the user is navigated to http://localhost:8080/username.html", page);
    await executeDynamicCommand("Enter text into the \"Username\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Username\" field.", page);
    await executeDynamicCommand("Enter text into the \"Password\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Password\" field as asterisks or dots (masked).", page);
    await executeDynamicCommand("Click the \"Login\" button.", page);
    await executeDynamicCommand("The login form should submit successfully, and the user should be redirected to the welcome page.", page);
    await executeDynamicCommand("Observe the dashboard page.", page);
    await executeDynamicCommand("The user should see the dashboard page with the message \"Welcome to Your Dashboard\". The page should include a thank you message and a link to the main website.", page);
});

test('Verify Link to Main Website on Dashboard Page', async ({ page }) => {

    await executeDynamicCommand("Naviagte to http://localhost:8080/username.html", page);
    await executeDynamicCommand("Verify that user is succesfully navigated", page);
    await executeDynamicCommand("Enter text into the \"Username\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Username\" field.", page);
    await executeDynamicCommand("Enter text into the \"Password\" field.", page);
    await executeDynamicCommand("The entered text should be visible in the \"Password\" field as asterisks or dots (masked).", page);
    await executeDynamicCommand("Click the \"Login\" button.", page);
    await executeDynamicCommand("The login form should submit successfully, and the user should be redirected to the welcome page.", page);
    await executeDynamicCommand("Click the link labeled \"main website\" on the dashboard page.", page);
    await executeDynamicCommand("The link should open the main website in a new tab or window, displaying the main website's homepage.", page);
});
