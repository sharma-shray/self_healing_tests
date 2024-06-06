
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