import Groq from 'groq-sdk';
import { load } from 'cheerio';
import ollama from 'ollama'
export async function executeDynamicCommand(userInput,page) {
  // Extract the current page's entire DOM as a string
  let pageDOMAll ;
  try{  pageDOMAll = await page.content();}

  catch(e){
    //nothing
  }

  //extract only the body
    // Load the HTML content into cheerio
    const pageDOM = load(pageDOMAll);

    // Extract the content of the <body> tag
    const PageDOMBody = pageDOM('body').html();
  const groqResponse=await cleanResponse(await groqCall(userInput,PageDOMBody));

  //const locallamma=await cleanResponse(await localhostLamma(userInput,PageDOMBody));
  //console.log("localhost: ",locallamma);
    

 console.log("groq response: ",groqResponse);
    const result =   page.evaluate(groqResponse);
    await page.waitForTimeout(100);
}

//Function for calling groq
async function groqCall(userInput,PageDOMBody){
//groq
const groq = new Groq();
const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role":"system",
      "content": "you generate values for 'x' in page.evaluate(x) for questions asked . example : document.querySelector('#username').value = 'user'.You will get the requirements in English and the page DOM as input and you have to return only javascript code."
    },
    {
      "role": "user",
      "content": "Resposnd for the value for X, page.evaluate('X') ,Task:"+userInput+", write a value of X in typescript for the task to return only one sinlge line of code.the DOM is "+PageDOMBody+ ""
    }
  ],
  "model": "llama3-8b-8192",
  "temperature": 0,
  "max_tokens": 1024,
  "top_p": 0,
  "stream": false,
  "stop": null
});
const response=chatCompletion.choices[0].message.content;
//const cleanedString = response.replace(/`/g, '');
return response;
}

async function cleanResponse(response){
  const replacedValue= response.replace(/`/g, '')
      const extractedCode=await extractCode(replacedValue)
      const code= await extractCodeFromPageEvaluate(extractedCode);

return code
}

//function for calling local hosted llama
async function localhostLamma(userInput,PageDOMBody){
  const response = await ollama.chat({
    model: 'llama3',
    messages: [
      {
        "role":"system",
        "content": "you generate values for 'x' in page.evaluate(x) for questions asked . example : document.querySelector('#username').value = 'user'.You will get the requirements in English and the page DOM as input and you have to return only javascript code."
      },{
      "role": "user",
      "content": "Resposnd for the value for X, page.evaluate('X') ,Task:"+userInput+", write a value of X in typescript for the task to return only one sinlge line of code.the DOM is "+PageDOMBody+ ""
    }],
  })
  return (response.message.content)
}


//if LLM response with some communication we take only code
async function extractCode(text) {
  console.log("extract code: ",text)
  const codePattern = /```(?:javascript|js)?([\s\S]*?)```/;
  const match = text.match(codePattern);
  return match ? match[1].trim() : '';
}
// if LLM wraps it in page.evaluate we unwrap it
async function extractCodeFromPageEvaluate(text) {
  const pattern = /page\.evaluate\('([\s\S]*?)'\);/;
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

