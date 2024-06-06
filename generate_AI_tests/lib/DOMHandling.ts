// Define the Message type
interface Message {
    role: 'system' | 'user';
    content: string;
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
        - DO NOT WRAP YOUR RESPONSES IN PAGE.EVALUATE(...) user is passing your output in that function already.
        - Keep your response to only code.
        - Adhere strictly to what is asked and the DOM , do not assume DOM structure or details
        - A sample good code "
        page.evaluate(() => {
          document.querySelector('#onetrust-accept-btn-handler').click();
        });
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