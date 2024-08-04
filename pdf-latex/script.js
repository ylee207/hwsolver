const API_ENDPOINT = '/.netlify/functions/pdf-to-latex';

console.log('API Endpoint:', API_ENDPOINT);

document.getElementById('uploadForm').onsubmit = async function(e) {
    e.preventDefault();
    console.log('Form submitted');
    const outputContent = document.getElementById('outputContent');
    const downloadButton = document.getElementById('downloadButton');
    const submitButton = document.getElementById('submitButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    outputContent.textContent = '';
    downloadButton.style.display = 'none';
    submitButton.disabled = true;
    loadingIndicator.style.display = 'block';
    
    const formData = new FormData(this);
    try {
        console.log('Sending request to:', API_ENDPOINT);
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        const data = await response.json();
        console.log('Data received:', data);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${data.error || 'Unknown error'}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        outputContent.textContent = data.latex_response || 'No LaTeX content received';
        if (data.latex_response) {
            downloadButton.style.display = 'inline-flex';
        }
    } catch (error) {
        console.error('Error:', error);
        outputContent.textContent = 'An error occurred: ' + error.message;
    } finally {
        submitButton.disabled = false;
        loadingIndicator.style.display = 'none';
    }
};

document.getElementById('downloadButton').onclick = function() {
    const content = document.getElementById('outputContent').textContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'response.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};