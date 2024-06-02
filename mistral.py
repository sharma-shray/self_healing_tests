from flask import Flask, request, jsonify
import os
import json
import logging
from mistralai.client import MistralClient

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Ensure the API key is set
api_key = os.getenv('MISTRAL_API_KEY')
if not api_key:
    raise ValueError("MISTRAL_API_KEY environment variable is not set")

client = MistralClient(api_key=api_key)
MODEL = 'codestral-latest'

def code_without_wrapper(code):
    """Evaluate the code which is generated"""
    # Here you would put the code that actually evaluates the JavaScript code
    # For this example, we'll just return the code as-is
    return code

@app.route('/process', methods=['POST'])
def process():
    try:
        data = request.get_json()
        #logger.debug("Received data: %s", data)
        
        if not data:
            return jsonify({"error": "No data provided"}), 400

        user_prompt = data.get('user_prompt')

        result = run_conversation(user_prompt)
        return jsonify({"result": result})

    except Exception as e:
        logger.exception("An error occurred during request processing")
        return jsonify({"error": str(e)}), 500

def run_conversation(user_prompt):

    response = client.completion(
        model=MODEL,
        prompt=user_prompt,
        max_tokens=4096
    )

    response_message = response.choices[0].message.content
    code_without_wrapper(response_message)
    return response_message

if __name__ == '__main__':
    app.run(port=5000)
