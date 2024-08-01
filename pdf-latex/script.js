const API_ENDPOINT = '{{API_ENDPOINT}}'; // Netlify will replace this during build

console.log('API Endpoint:', API_ENDPOINT);

document.getElementById('uploadForm').onsubmit = function(e) {
    e.preventDefault();
    console.log('Form submitted');
    var outputContent = document.getElementById('outputContent');
    var downloadButton = document.getElementById('downloadButton');
    outputContent.textContent = 'Processing... Please wait.';
    downloadButton.style.display = 'none';
    
    var formData = new FormData(this);
    fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        console.log('Response received', response);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(function(data) {
        console.log('Data received:', data);
        if (data.error) {
            throw new Error(data.error);
        }
        outputContent.textContent = data.latex_response || 'No LaTeX content received';
        if (data.latex_response) {
            downloadButton.style.display = 'inline-flex';
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        outputContent.textContent = 'An error occurred: ' + error.message;
    });
};

// ... rest of your script
document.getElementById('downloadButton').onclick = function() {
    var content = document.getElementById('outputContent').textContent;
    var blob = new Blob([content], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'response.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};