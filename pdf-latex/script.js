const API_ENDPOINT = '{{API_ENDPOINT}}'; // Netlify will replace this during build

console.log('Script is running');
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
        console.log('Response received');
        return response.json();
    })
    .then(function(data) {
        console.log('Data received:', data);
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