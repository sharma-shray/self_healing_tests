import Groq from 'groq-sdk';
import { load } from 'cheerio';
import ollama from 'ollama';

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

//console.log("passing this DOM",PageDOMBody)
  // Split the PageDOMBody into parts of 20k words each
  const parts = splitTextIntoParts(PageDOMBody, 200000);
  const groqResponse = await groqCall(userInput, parts)
  console.log("groqResponse", groqResponse);
  const groqCleanedResponse = await cleanResponse(groqResponse);

   //const locallamma = await cleanResponse(await localhostLamma(userInput, PageDOMBody));
  // console.log("localhost: ", locallamma);

  const result = await page.evaluate(groqCleanedResponse);
  console.log("evaluation result : ", result)
  await page.waitForTimeout(100);
}

// Function for calling groq
async function groqCall(userInput: string, parts: string[]): Promise<string> {
  const groq = new Groq();

  // Create the message section with the parts and additional message
  const messages = createMessages(userInput, parts);

  const chatCompletion = await groq.chat.completions.create({
    messages: messages,
    model: "mixtral-8x7b-32768",
    temperature: 0,
    max_tokens: 1024,
    top_p: 0,
    stream: false,
    stop: null
  });
  return chatCompletion.choices[0].message.content;
}

async function cleanResponse(response: string): Promise<string> {
  const replacedValue = response.replace(/`/g, '');
  const extractedCode = await extractCode(replacedValue);
  const code = await extractCodeFromPageEvaluate(extractedCode);

  return code;
}
/*
// Function for calling locally hosted llama
async function localhostLamma(userInput: string, PageDOMBody: string): Promise<string> {
  const response = await ollama.chat({
    model: 'llama3',
    messages: [
      {
        role: "system",
        content: "you generate values for 'x' in page.evaluate(x) function in playwright. example : document.querySelector('#username').value = 'user'.You will get the requirements in English and the page DOM as input and you have to return only javascript code, no communication."
      },
      {
        role: "user",
        content: "Create a javascript code to run in page.evaluate() function Task:" + userInput + ", the DOM is " + PageDOMBody
      }
    ],
  });
  return response.message.content;
}
*/
// If LLM responds with some communication, we take only code
async function extractCode(text: string): Promise<string> {
  return text;
  // Regular expression to match code blocks in the format ```typescript or ```js
  // const codePattern = /```(?:typescript|js)?\s*([\s\S]*?)\s*```/;

  // console.log("text is 2", text);
  // // Find the match in the text
  // const match = text.match(codePattern);

  // // Log the matched code for debugging
  // if (match) {
  //   console.log("Extracted code:", match[1].trim());
  // } else {
  //   console.log("No code block found in the text.");
  // }

  // // Return the extracted code or an empty string if no match is found
  // return match ? match[1].trim() : '';
}

// If LLM wraps it in page.evaluate, we unwrap it
async function extractCodeFromPageEvaluate(text) {
  
  // Updated pattern to correctly match everything between page.evaluate( and )
  const pattern = /page\.evaluate\(([^)]+)\);/;
  const match = text.match(pattern);
  console.log("text is", match ? match[1].trim() : '');
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
function createMessages(userInput: string, parts: string[]): Message[] {
  const messages: Message[] = [
    {
      role: "system",
      //content: "You generate values for 'x' in page.evaluate(x) for questions asked. You will get the requirements in English and the page DOM as input and you have to return only JavaScript code. No description, no explanation, only respond with code ,without the wrapper of page.evaluate(...)."
      content:  `You are a javascript code generator, and generate only code no conversation.
      The user will pass you the DOM of a page, and ask you to generate a code to code which he will feed in page.evaluate(..) function.
      Criterion:
      - Respond without details, without conversation, without any details and explanations.
      - Respond with only code.
      - DO NOT WRAP YOUR RESPONSES IN PAGE.EVALUATE(...) user is passing your output in that function already.
      - Keep your response to only code.
      - Adhere strictly to what is asked and the DOM , do not assume DOM structure or details
      - A sample of a good replies: document.querySelector('.tms-tile-title--orchestrator').click() , document.querySelector('#sign-in-form [name="password"]').value = 'your_password'`
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
    content: "Resposnd for the value for X, page.evaluate('X') ,Task:" + userInput + ", write a value of X in typescript for the task to return only one sinlge line of code, for the DOM provided in above chat"
  });
  return messages;
}
