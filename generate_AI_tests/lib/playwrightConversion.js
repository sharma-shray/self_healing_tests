const fs = require('fs');
const axios = require('axios');
const Groq = require('groq-sdk');

// Function to send a command to GROQ and return the response
async function sendCommandToGROQ(messages) {
    const groq = new Groq();
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "mixtral-8x7b-32768",
      temperature: 0,
      max_tokens: 50,
      top_p: 0,
      stream: false,
      stop: null
    });

    return extractCode(chatCompletion.choices[0].message.content);
}

// Function to create the message section
function createGroqMessages(command) {
    const messages = [
      {
        role: "system",
        content:  `You are a playwright code generator which works according to best practices of playwright documentation only.
        The user will pass you the javascript code and you convert it to its equivalent working standalone playwright code.
        Response Criterion:
        - ONLY VALID ,compliable code
        - DO NOT send incomplete replies
        - Stick to below format
        - Use expect for javascript code with if and else
        - A sample format for a good reply "
        Here is the Playwright code equivalent to the provided JavaScript code:
        \`\`\`javascript
        await page.fill('#username', 'shray.sharma+orchprov1@phrase.com');
        \`\`\`
        For code with if and else:
        Here is the Playwright code equivalent to the provided JavaScript code:
        \`\`\`javascript
        await expect(page.getByText("dummy note")).toBeVisible();
        \`\`\`
        `
      },
      {
        role: "user",
        content: `Convert this : ${command} into one line playwright code`
      }
    ];
    return messages;
}



    function extractCode(inputString) {
      const startIndex = inputString.indexOf('javascript') + 'javascript'.length;
      let endIndex = inputString.indexOf('`', startIndex);
      if (endIndex === -1) {
        endIndex = inputString.length;
      }
      if (startIndex !== -1) {
        return inputString.substring(startIndex, endIndex).trim();
      } else {
        throw new Error('Invalid input string');
      }
    }

// Function to extract page.evaluate commands from a test file
function extractPageEvaluateCommands(testFile) {
    const pageEvaluateRegex = /await page\.evaluate\(\(\) => {(.*?)}\);/gs;
    const commands = [];
    let match;
    while ((match = pageEvaluateRegex.exec(testFile)) !== null) {
        commands.push(match[1]);
    }
    return commands;
}

// Function to extract page.evaluate commands from a test file
async function validateGroqResponse(message,response) {
  let validity=false;
  while(!validity){
    //console.log("inside while value of response",response)
  if((message.includes("if") && message.includes("else") && !response.includes("expect"))|| response.includes("page.evaluate"))
  { console.log("matched if")
    message.push({
      role: "user",
      content: `Rethink how you would acheive this with only playwright code,stick to the formats provided, in earlier messages , use expect function in playwright`
    });
    console.log("new message" ,message)
    response = await sendCommandToGROQ(message);
  }
  else{
    //console.log("i passed the if with " ,response)
    validity=true;
   }
}
return response;
}

// Function to replace page.evaluate commands with GROQ responses
async function replacePageEvaluateCommandsWithGROQResponses(testFile) {
  const commands = extractPageEvaluateCommands(testFile);
  let updatedTestFile = testFile;
  for (const command of commands) {
      const message = createGroqMessages(command);
      const response = await sendCommandToGROQ(message);
      const validateResposne=await validateGroqResponse(message,response);
      console.log("groq's response",validateResposne);

      // Escape special characters for regex
      const escapedCommand = command.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      //console.log("escaped command:",escapedCommand);
      const regex = new RegExp(`await page\\.evaluate\\(\\(\\) => \\{${escapedCommand}\\}\\);`, 'gms');
      //console.log("regex generated",regex);

      const replaced = updatedTestFile.replace(regex, `${validateResposne}`);
      if (replaced === updatedTestFile) {
          console.log(`Command not matched: ${command}`);
      } else {
          updatedTestFile = replaced;
      }
  }

  return updatedTestFile;
}

async function main() {
    // Read the test file
    const testFile = fs.readFileSync('./tests/data/eval/user can login.spec.js', 'utf-8');

    // Replace page.evaluate commands with GROQ responses
    const updatedTestFile = await replacePageEvaluateCommandsWithGROQResponses(testFile);

    // Write the updated test file to a new file
    fs.writeFileSync('../playwright_tests/tests/user_login.spec.js', updatedTestFile);
}

main();
