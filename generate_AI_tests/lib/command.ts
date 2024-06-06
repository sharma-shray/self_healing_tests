
import {groqCall ,createGroqMessages} from "./groqCall"
import {callFlaskAPI,generateMessageCodestral } from "./codestralCall"
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5000'; 
// Define the Message type
interface Message {
  role: 'system' | 'user';
  content: string;
}


export async function generatePlaywrightTest(commandsWithExpectedResults, page,testInfo) {
  const generatedCommands: string[] = [];
  generatedCommands.push(`test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:8080/username.html");
});`);
  for (const command of commandsWithExpectedResults) {
      try {
          const generatedCode = await executeDynamicCommand(command, page);
          generatedCommands.push(`await page.evaluate(() => {${generatedCode}});`);
      } catch (error) {
          console.error(`Test 'user can login' failed:`, error);
          return; // Exit the test if any command fails
      }
  }

  // If all commands executed successfully, append them to successful_tests.js
  appendCommandsToNewFile(testInfo.title, generatedCommands);
}


// Append generated commands to a new file
function appendCommandsToNewFile(testName, commands) {
  const filePath = `./tests/data/eval/${testName}.spec.js`;
  ensureDirectoryExistence(filePath); // Ensure the directory exists

  const testScript = `
import { test } from '@playwright/test';

test('${testName}', async ({ page }) => {
${commands.join('\n')}
});
`;

  fs.writeFileSync(filePath, testScript);
  console.log(`Created test '${testName}' at ${filePath}`);
}

// Ensures the existence of the directory where the test file will be saved
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
  }
}



export async function executeDynamicCommand(userInput, page): Promise<string> {
  // Extract the current page's entire DOM as a string
  let pageDOMAll;
  await page.waitForSelector('body');
  try {
      pageDOMAll = await page.content();
  } catch (e) {
      // Handle error
      console.error("Failed to get page content:", e);
      return "Failed to get page content";
  }

  // Load the HTML content into cheerio
  const pageDOM = await load(pageDOMAll);

  // Extract the content of the <body> tag
  const PageDOMBody = await pageDOM('body').html();
  // Check if PageDOMBody is null and handle it
  if (PageDOMBody === null) {
      console.error("Failed to extract body content");
      return "Failed to extract body content";
  }

  console.log("User input : ", userInput);

  let response=await evaluateGroqCall(userInput, PageDOMBody, page);

  await page.waitForTimeout(100);

  return response;
}

async function evaluateCodestralCall(userInput,PageDOMBody,page){
  let codestralMessage=(await generateMessageCodestral(userInput,PageDOMBody)).toString();
  console.log("Codestral Message type:", typeof codestralMessage);
  const reply=await callFlaskAPI(codestralMessage,userInput)
  console.log(reply);
}


async function evaluateGroqCall(userInput,PageDOMBody,page){
  // Create the message section with the parts and additional message
  const messages = createGroqMessages(userInput, PageDOMBody,200000);
  let groqResponse = await groqCall( messages,PageDOMBody);
  console.log("Initial GROQ response: ", groqResponse);
  let result;
  const maxAttempts = 3;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      result = await page.evaluate(groqResponse);
      console.log("Attempt", attempts + 1);
      
      // If evaluation is successful and no issues detected, break the loop
      break;
    } catch (e) {
      const errorMessage = e.message.split('\n')[0];
      if(errorMessage.includes("Verification failure"))
      {throw new Error(errorMessage)}
      console.log("Error during attempt", attempts + 1, "of page evaluation:", errorMessage);

      attempts++;
      
      if (attempts < maxAttempts) {
        messages.push({
          role: "user",
          content: `on running it the issue was this: ${errorMessage}. Refer again to the DOM and the error message and think of another way of doing the task`
        });
        
        groqResponse = await groqCall(messages, userInput);
        console.log("New GROQ response for attempt", attempts + 1, ": ", groqResponse);
      } else {
        // If maximum attempts reached, throw the final error
        throw new Error(`Failed after ${maxAttempts} attempts with error: ${errorMessage}`);
      }
    }
  }
  return groqResponse;
}












