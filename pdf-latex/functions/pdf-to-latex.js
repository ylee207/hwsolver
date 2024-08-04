const { OpenAI } = require('openai');
const multiparty = require('multiparty');
const pdf = require('pdf-parse');

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to parse multipart form data
const parseMultipartForm = async (event) => {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(event, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

// Helper function to extract text from PDF
const pdfToText = async (pdfBuffer) => {
  try {
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
};

// Main handler function
exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Check if it's a POST request
  if (event.httpMethod !== 'POST') {
    console.log('Received non-POST request:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed', method: event.httpMethod }),
    };
  }

  try {
    console.log('Parsing multipart form data');
    const { files } = await parseMultipartForm(event);
    
    if (!files || !files.file || !files.file[0]) {
      console.log('No file uploaded');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file uploaded' }),
      };
    }

    console.log('File received, extracting text');
    const pdfContent = files.file[0].content;
    const text = await pdfToText(pdfContent);

    console.log('Text extracted, sending to OpenAI');
    const prompt = `Convert the following text into a LaTeX document:\n\n${text}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a LaTeX expert. Convert the given text into a well-structured LaTeX document. Include appropriate LaTeX commands and environments.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
    });

    const latexResponse = completion.choices[0].message.content;

    console.log('Response received from OpenAI');
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latex_response: latexResponse,
        message: 'PDF processed and converted to LaTeX successfully',
      }),
    };
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};