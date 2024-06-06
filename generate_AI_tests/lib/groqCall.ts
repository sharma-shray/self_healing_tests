
import Groq from 'groq-sdk';

// Define the Message type
interface Message {
    role: 'system' | 'user';
    content: string;
  }
// calling groq
export async function groqCall(messages,userInput): Promise<string> {
    const groq = new Groq();
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
    if ((!response.includes("page.evaluate(") )|| (userInput.includes("Verify")&&!response.includes("if"))||(userInput.includes("Verify")&&!response.includes("else"))||(userInput.includes("Verify")&&!response.includes("console.log"))||(userInput.includes("Verify")&&!response.includes("throw new Error("))) {
      console.log(` Retrying...`);
      
      messages.push({
        role: "user",
        content: `You replied with ${response},stick to the formats provided, in earlier messages `
      });
      const chatCompletion2 = await groq.chat.completions.create({
        messages: messages,
        model: "mixtral-8x7b-32768",
        temperature: 0,
        max_tokens: 100024,
        top_p: 0,
        stream: false,
        stop: null
      });
      response=chatCompletion2.choices[0].message.content
    }
    //console.log("unclean response: ", response)
    const groqCleanedResponse = await cleanResponse(response);
    return groqCleanedResponse;
  }




///////////---------------------------Library-------------------------------///////////

export async function cleanResponse(response: string): Promise<string> {
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
  export function createGroqMessages(userInput: string,PageDOMBody,partSize): Message[] {
    // Split the PageDOMBody into parts of 20k words each
    const parts = splitTextIntoParts(PageDOMBody, partSize);
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
      console.log( 'User has been navigated to the dashboard page.');
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