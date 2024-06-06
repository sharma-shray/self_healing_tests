from flask import Flask, request, jsonify
import os
import json
from groq import Groq

app = Flask(__name__)

# Ensure the API key is set
api_key = os.getenv('GROQ_API_KEY')
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set")

client = Groq(api_key=api_key)
MODEL = 'mixtral-8x7b-32768'

def code_without_wrapper():
    """Evaluate the code which is generated"""

@app.route('/process', methods=['POST'])
def process():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        user_prompt = data.get('user_prompt')
        DOM = data.get('DOM')

        if not user_prompt or not DOM:
            return jsonify({"error": "Missing user_prompt or DOM"}), 400

        user_prompt_with_DOM = f"{user_prompt}\n\nDOM:\n{DOM}"
        result = run_conversation(user_prompt_with_DOM)
        return jsonify({"result": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def run_conversation(user_prompt):
    messages = [
        {
            "role": "system",
            "content": """You are a Code assistant for a page.evaluate function that creates only javascript code to acheive tasks that user needs. After which you call the function code_without_wrapper with correct javascript code. The user will pass you the DOM and the task. 
            - After creating the call for the function recheck all the values. 
            - Locators priorities  id, Name, Xpath,css Selector
            - DO NOT create a function call unless the code is ready
            - DO NOT create invalid function calls e.g. /* INSERT CODE HERE */ or any filler text only use real values"""
        },
        {
            "role": "user",
            "content": user_prompt,
        }
    ]
    tools = [
        {
            "type": "function",
            "function": {
                "name": "code_without_wrapper",
                "description": "page.evaulate function from playwright",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code_explaination": {
                            "type": "string",
                            "description": "The explanation of the code you have generated",
                        },
                        "code_with_wrapper": {
                            "type": "string",
                            "description": "The code which has been generated (e.g. 'page.evaluate(document.querySelector('div.flex.flex-col.gap-5.justify-end.mx-auto > div:nth-child(1) > h2'))')",
                        },
                        "code_without_wrapper": {
                            "type": "string",
                            "description": "The code without the page.evaluate wrapper (e.g. 'document.querySelector('div.flex.flex-col.gap-5.justify-end.mx-auto > div:nth-child(1) > h2')')",
                        }
                    },
                    "required": ["code_without_wrapper", "code_with_wrapper"],
                },
            },
        }
    ]
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=tools,
        tool_choice="auto",
        max_tokens=4096
    )

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    if tool_calls:
        for tool_call in tool_calls:
            function_arguments = json.loads(tool_call.function.arguments)
            code_without_wrapper = function_arguments.get("code_without_wrapper")
            print(code_without_wrapper)
            return code_without_wrapper

    return "No function calls were made by the model."

if __name__ == '__main__':
    app.run(port=5000)
