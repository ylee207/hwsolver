const API_ENDPOINT = '/.netlify/functions/pdf-to-latex'; // Path to your Netlify function

console.log('API Endpoint:', API_ENDPOINT);

document.getElementById('uploadForm').onsubmit = function(e) {
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
    fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Response received', response);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Data received:', data);
        if (data.error) {
            throw new Error(data.error);
        }
        outputContent.textContent = data.latex_response || 'No LaTeX content received';
        if (data.latex_response) {
            downloadButton.style.display = 'inline-flex';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        outputContent.textContent = 'An error occurred: ' + error.message;
    })
    .finally(() => {
        submitButton.disabled = false;
        loadingIndicator.style.display = 'none';
    });
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