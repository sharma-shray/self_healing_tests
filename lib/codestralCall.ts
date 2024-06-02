import axios from 'axios';
import {cleanResponse } from "./groqCall"
const BASE_URL = 'http://127.0.0.1:5000'; 
let BaseMessage= 
`Generate javascript code to run inside a page.evaluate function.
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
\`\`\``
export async function callFlaskAPI(message,userInput) {
    const endpoint = `${BASE_URL}/process`;
    let requestBody = {
      user_prompt: message
    };
    let response = await axios.post(endpoint, requestBody);
    let responseData = response.data;
    console.log(response.data)
    if ((!responseData.includes("page.evaluate(") )|| (userInput.includes("Verify")&&!responseData.includes("if"))||(userInput.includes("Verify")&&!responseData.includes("else"))||(userInput.includes("Verify")&&!responseData.includes("console.log"))||(userInput.includes("Verify")&&!responseData.includes("throw new Error("))) {
      console.log(` Retrying...`);
      message=await appendToMessage(message,`You replied with ${response},stick to the formats provided, in earlier messages `);

    response = await axios.post(endpoint, requestBody);
    }
    const cleanedResponse=await cleanResponse(response.data.result)
    return cleanedResponse; // Assuming the result is returned in the response
  }

  export async function generateMessageCodestral(userInput,PageDOMBody){
    let message = `${BaseMessage}\n The task is: ${userInput} and the DOM is : ${PageDOMBody}`;
    console.log(" Message type:", typeof message);
    return message
  }
  
  export async function appendToMessage(oldMessage, additionalContent) {
    let newMessage = `${oldMessage}\n${additionalContent}`;
    return newMessage;
  }
  
  