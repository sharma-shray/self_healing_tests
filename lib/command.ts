import Groq from 'groq-sdk';
import { load } from 'cheerio';
import { error } from 'console';

// Define the Message type
interface Message {
  role: 'system' | 'user';
  content: string;
}

export async function executeDynamicCommand(userInput: string, page: any): Promise<void> {
  // Extract the current page's entire DOM as a string
  let pageDOMAll: string;
  try {
    await page.waitForSelector('body');
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
  // Split the PageDOMBody into parts of 20k words each
  const parts = splitTextIntoParts(PageDOMBody, 200000);

  // Create the message section with the parts and additional message
  const messages = createMessages(userInput, parts);
  
  let groqResponse = await groqCall(messages, userInput);
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

  await page.waitForTimeout(100);
}



// calling groq
async function groqCall(messages,userInput): Promise<string> {
  const groq = new Groq();

  // Create the message section with the parts and additional message
  //const messages = createMessages(userInput, parts);

  const chatCompletion = await groq.chat.completions.create({
    messages: messages,
    model: "mixtral-8x7b-32768",
    temperature: 0,
    max_tokens: 1024,
    top_p: 0,
    stream: false,
    stop: null
  });
  let response=chatCompletion.choices[0].message.content;
  if ((!response.includes("page.evaluate(") )|| (userInput.includes("Verify")&&!response.includes("if"))||(userInput.includes("Verify")&&!response.includes("else"))||(userInput.includes("Verify")&&!response.includes("console.log"))) {
    console.log(` Retrying...`);
    
    messages.push({
      role: "user",
      content: `You replied with ${response},stick to the formats provided, in earlier messages `
    });
    const chatCompletion2 = await groq.chat.completions.create({
      messages: messages,
      model: "mixtral-8x7b-32768",
      temperature: 0,
      max_tokens: 1024,
      top_p: 0,
      stream: false,
      stop: null
    });
    response=chatCompletion2.choices[0].message.content
  }
//  console.log("unclean response: ", response)
  const groqCleanedResponse = await cleanResponse(response);
  return groqCleanedResponse;
}






















///////////---------------------------Library-------------------------------///////////

async function cleanResponse(response: string): Promise<string> {
  const replacedValue = response.replace(/`/g, '');
  const code = await extractCodeFromPageEvaluate(replacedValue);

  return code;
}
// If LLM wraps it in page.evaluate, we unwrap it
async function extractCodeFromPageEvaluate(text) {
  
  // Updated pattern to correctly match everything between page.evaluate( and )
  const codePattern = /page\.evaluate\(\(\) => \{([\s\S]*?)\}\);/;
  const match = text.match(codePattern);
  return match ? match[1].trim() : '';
}
// Function to split text into parts with a specified max length
function splitTextIntoParts(text: string, maxLength: number): string[] {
  const words = text.split(' ');
  const parts: string[] = [];
  let part: string[] = [];

  for (const word of words) {
    if (part.join(' ').length + word.length + 1 > maxLength) {
      parts.push(part.join(' '));
      part = [];
    }
    part.push(word);
  }

  if (part.length > 0) {
    parts.push(part.join(' '));
  }

  return parts;
}



// Function to create the message section
export function createMessages(userInput: string, parts: string[]): Message[] {
  const messages: Message[] = [
    {
      role: "system",
      content:  `You are a javascript code generator.
      The user will pass you the DOM of a page, and ask you to generate a code to code which he will feed in page.evaluate(..) function.
      Response Criterion:
      - Adhere strictly to the DOM
      - ONLY VALID ,compliable code
      - NO return statements
      - A sample format for a good reply "
      Here is the code to accept cookies for the provided DOM:
\`\`\`javascript
page.evaluate(() => {
  document.querySelector('[name="username"]').value = 'apples';
});
\`\`\`

For verification steps create both if and else statements and throw "Verification Faliure"
 in case of faliure
Here is the code to check if the user has been navigated to the dashboard page for the provided DOM:
\`\`\`javascript
page.evaluate(() => {
  const currentUrl = window.location.href;
  if (currentUrl.includes('/idm-ui/dashboard')) {
    return 'User has been navigated to the dashboard page.';
  }
  else (currentUrl.includes('/idm-ui/dashboard')) {
    throw new Error('Verification faliure');
  }
});
\`\`\`
      `
    },
    {
      role: "user",
      content: `The next ${parts.length} messages will be the DOM of the page, understand the DOM completely.`
    }
  ];

  parts.forEach(part => {
    messages.push({
      role: "user",
      content: `The DOM is ${part}`
    });
  });

  messages.push({
    role: "user",
    content: "Task:" + userInput + ", for the DOM provided in above chat. DO not create code with return statememnts"
  });
  return messages;
}