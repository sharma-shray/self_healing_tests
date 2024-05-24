import Groq from 'groq-sdk';
import { load } from 'cheerio';

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
/* // code for function calling using python
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

  // Send the request to the Python server
  try {
    const response = await axios.post('http://127.0.0.1:5000/process', {
      user_prompt: userInput,
      DOM: PageDOMBody
    });

    const groqResponse = response.data.result;
    console.log("groqResponse", groqResponse);

    const result = await page.evaluate(groqResponse);
    console.log("evaluation result : ", result);
    await page.waitForTimeout(100);
  } catch (error) {
    console.error("Failed to process request:", error);
  }
}*/

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
  let response=chatCompletion.choices[0].message.content;
  if (!response.includes("page.evaluate") || !response.includes("Here is")) {
    console.log(` Retrying...`);
    
    messages.push({
      role: "user",
      content: `You replied with ${response}, Please stick to the format provided, in earlier messages `
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
  return response;
}






















///////////---------------------------Library-------------------------------///////////

async function cleanResponse(response: string): Promise<string> {
  const replacedValue = response.replace(/`/g, '');
  const extractedCode = await extractCode(replacedValue);
  const code = await extractCodeFromPageEvaluate(extractedCode);

  return code;
}
async function extractCode(text: string): Promise<string> {
  // Regular expression to match code blocks in the format ---javascript
  const codePattern = /---(?:javascript|typescript|js)\s*([\s\S]*?)\s*---/;

  // Find the match in the text
  const match = text.match(codePattern);

  // Log the matched code for debugging
  if (match) {
    console.log("Extracted code:", match[1].trim());
  } else {
    console.log("No code block found in the text.");
  }

  // Return the extracted code or an empty string if no match is found
  return match ? match[1].trim() : '';
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
export function createMessages(userInput: string, parts: string[]): Message[] {
  const messages: Message[] = [
    {
      role: "system",
      //content: "You generate values for 'x' in page.evaluate(x) for questions asked. You will get the requirements in English and the page DOM as input and you have to return only JavaScript code. No description, no explanation, only respond with code ,without the wrapper of page.evaluate(...)."
      content:  `You are a javascript code generator, and generate only code no conversation.
      The user will pass you the DOM of a page, and ask you to generate a code to code which he will feed in page.evaluate(..) function.
      Criterion:
      - Respond without details, without conversation, without any details and explanations.
      - Respond with only code.
      - Keep your response to only code.
      - Adhere strictly to what is asked and the DOM , do not assume DOM structure or details
      - A sample format for a good reply "
      Here is the code to accept cookies for the provided DOM:
\`\`\`javascript
page.evaluate(() => {
  document.querySelector('#onetrust-accept-btn-handler').click();
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
    content: "I am passing your response as is into page.evaluate() function make sure you repond with a working reply if passed to the function ,Task:" + userInput + ", for the DOM provided in above chat"
  });
  return messages;
}