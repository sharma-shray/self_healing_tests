
import {groqCall ,createGroqMessages} from "./groqCall"
import {callFlaskAPI,generateMessageCodestral } from "./codestralCall"
import { load } from 'cheerio';

const BASE_URL = 'http://127.0.0.1:5000'; 
// Define the Message type
interface Message {
  role: 'system' | 'user';
  content: string;
}

export async function executeDynamicCommand(userInput: string, page: any): Promise<void> {
  // Extract the current page's entire DOM as a string
  let pageDOMAll: string;
  await page.waitForSelector('body');
  try {
   
    pageDOMAll = await page.content();
  } catch (e) {
    // Handle error
    console.error("Failed to get page content:", e);
    return;
  }

  // Load the HTML content into cheerio
  const pageDOM = await load(pageDOMAll);

  // Extract the content of the <body> tag
  const PageDOMBody = await pageDOM('body').html();
 // Check if PageDOMBody is null and handle it
 if (PageDOMBody === null) {
  console.error("Failed to extract body content");
  return;
}
  console.log("User input : ", userInput);
  //console.log("passing this DOM",PageDOMBody)

   // await evaluateCodestralCall(userInput,PageDOMBody,page);
  await evaluateGroqCall(userInput,PageDOMBody,page)

  await page.waitForTimeout(100);
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
}












