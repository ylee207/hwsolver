const multiparty = require('multiparty');
const pdf = require('pdf-parse');

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

// Main handler function
exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

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
    const pdfContent = files.file[0].buffer;
    const text = await pdfToText(pdfContent);

    // ... rest of the function ...
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};