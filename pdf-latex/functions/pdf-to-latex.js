const { OpenAI } = require('openai');
const busboy = require('busboy');
const pdf = require('pdf-parse');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const parseMultipartForm = (event) => {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;

    const bb = busboy({ headers: event.headers });

    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        files[name] = Buffer.concat(chunks);
      });
    });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('finish', () => resolve({ fields, files }));
    bb.on('error', reject);

    bb.end(body);
  });
};

const pdfToText = async (pdfBuffer) => {
  const data = await pdf(pdfBuffer);
  return data.text;
};

exports.handler = async (event, context) => {
  console.log('Function started');
  const startTime = Date.now();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    console.log('Parsing form data');
    const { files } = await parseMultipartForm(event);
    
    if (!files || !files.file) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file uploaded' }),
      };
    }

    console.log('Extracting text from PDF');
    const text = await pdfToText(files.file);

    console.log('Sending to OpenAI');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // Using a faster model
      messages: [
        { role: 'system', content: 'Solve the problems in the document and return a solved answer in a correct, well-structured LaTex file. Do not say anything outside the content of the document.' },
        { role: 'user', content: text },
      ],
      max_tokens: 1000,  // Limiting the response size
    });

    const latexResponse = completion.choices[0].message.content;
    console.log('OpenAI response received');

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(`Function completed in ${executionTime} seconds`);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latex_response: latexResponse,
        execution_time: executionTime,
        message: 'PDF processed and converted to LaTeX successfully',
      }),
    };
  } catch (error) {
    console.error('Error in handler:', error);
    const executionTime = (Date.now() - startTime) / 1000;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message,
        execution_time: executionTime
      }),
    };
  }
};