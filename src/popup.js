document.addEventListener("DOMContentLoaded", function () {
  const downloadButton = document.getElementById("download-transcript");

  downloadButton.addEventListener("click", function () {
    // Send a message to the content script to initiate the download
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "downloadTranscript" });
    });
  });
});
