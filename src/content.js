document.addEventListener('DOMContentLoaded', function() {
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Transcript';
    document.body.appendChild(downloadButton);

    downloadButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'downloadTranscript' });
    });
});

function enableTranscript() {
    const transcriptButton = document.querySelector('.transcript-button-selector'); // Update with actual selector
    if (transcriptButton) {
        transcriptButton.click();
    }
}

function fetchTranscript() {
    const transcriptElement = document.querySelector('.transcript-element-selector'); // Update with actual selector
    if (transcriptElement) {
        return transcriptElement.innerText;
    }
    return '';
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'downloadTranscript') {
        const transcriptBody = document.querySelector('div[data-testid="transcript-body"]');


        if (!transcriptBody) {
            alert("Transcript body not found! Please make sure the transcript is enabled on this page.");
            sendResponse({ status: 'not_found' });
            return;
        }

        const segments = transcriptBody.querySelectorAll('button.css-1twdxea');


        if (segments.length === 0) {
            alert("No transcript segments found! The transcript may be empty or not loaded.");
            sendResponse({ status: 'no_segments' });
            return;
        }

        let fullTranscript = "";
        const pageTitle = document.title || 'transcript';

        segments.forEach(button => {
            const paragraphs = button.querySelectorAll('p');
            const timestampP = paragraphs[0];
            const textP = paragraphs[1];

            if (timestampP && textP) {
                const timestamp = timestampP.textContent.trim();
                const text = textP.textContent.trim();
                fullTranscript += `${timestamp}\n${text}\n\n`;
            }
        });


        if (fullTranscript.trim().length === 0) {
            alert("No transcript text could be extracted. Please check if the transcript is visible and try again.");
            sendResponse({ status: 'empty' });
            return;
        }

        // Sanitize filename
        const filename = (pageTitle.replace(/[^a-z0-9_.-]/gi, '_') + '.txt');

        const blob = new Blob([fullTranscript], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        sendResponse({ status: 'success' });
    }
});