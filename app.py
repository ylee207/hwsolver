# app.py
from flask import Flask, request, jsonify, render_template
import PyPDF2
import os
import json
import logging
from anthropic import Anthropic

# Set up logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# Configure your Anthropic client
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
client = Anthropic(api_key=ANTHROPIC_API_KEY)

def pdf_to_text(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def send_to_claude(text):
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1500,
            temperature=0,
            system="You are a LaTeX expert and a homework helper. Given the text, please solve all of the problems and return it in a LaTeX format. DO NOT say anything other than the answers to the homework",
            messages=[
                {
                    "role": "user",
                    "content": f"Please convert the following text into a LaTeX document:\n\n{text}"
                }
            ]
        )
        
        return message.content[0].text
    except Exception as e:
        return f"Error sending request to Claude API: {str(e)}"


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    if file and file.filename.endswith('.pdf'):
        try:
            text = pdf_to_text(file)
            latex_response = send_to_claude(text)
            
            return jsonify({
                'latex_response': latex_response,
                'message': 'PDF processed and converted to LaTeX successfully'
            })
        except Exception as e:
            error_msg = f"Error processing PDF or converting to LaTeX: {str(e)}"
            return jsonify({'error': error_msg})
    return jsonify({'error': 'Invalid file type'})

if __name__ == '__main__':
    app.run(debug=True)