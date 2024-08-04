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
  try {
    console.log('Received event:', JSON.stringify(event));

    let pdfContent;
    if (event.httpMethod === 'POST') {
      // Handle multipart form data
      const { files } = await parseMultipartForm(event);
      pdfContent = files.file[0].content;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request method' }),
      };
    }

    if (!pdfContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No PDF content found' }),
      };
    }

    // Extract text from PDF
    const text = await pdfToText(pdfContent);

    // Prepare prompt for GPT-4
    const prompt = `Convert the following text into a LaTeX document:\n\n${text}`;

    // Send request to GPT-4
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

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latex_response: latexResponse,
        message: 'PDF processed and converted to LaTeX successfully',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};