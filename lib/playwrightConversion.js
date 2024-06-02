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
        content:  `You are a playwright code generator.
        The user will pass you the javascript code and you convert it to one line playwright syntax.
        Response Criterion:
        - ONLY VALID ,compliable code
        - Stick to below format
        - A sample format for a good reply "
        Here is the Playwright code equivalent to the provided JavaScript code:
        \`\`\`javascript
        await page.fill('#username', 'shray.sharma+orchprov1@phrase.com');
        \`\`\`
        Verifications:
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
    const pageEvaluateRegex = /await page\.evaluate\(\(\) => {([^}]+)}/g;
    const commands = [];
    let match;
    while ((match = pageEvaluateRegex.exec(testFile)) !== null) {
        commands.push(match[1]);
    }
    return commands;
}

// Function to replace page.evaluate commands with GROQ responses
async function replacePageEvaluateCommandsWithGROQResponses(testFile) {
  const commands = extractPageEvaluateCommands(testFile);
  let updatedTestFile = testFile;
  for (const command of commands) {
      const message = createGroqMessages(command);
      const response = await sendCommandToGROQ(message);
      console.log(response);

      // Escape special characters for regex
      const escapedCommand = command.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`await page\\.evaluate\\(\\(\\) => \\{${escapedCommand}\\}\\);`, 'gm');
      console.log(regex);

      const replaced = updatedTestFile.replace(regex, `${response}`);
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
    fs.writeFileSync('./tests/user_can_login_updated.spec.js', updatedTestFile);
}

main();
