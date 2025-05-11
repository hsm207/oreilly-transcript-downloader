document.addEventListener("DOMContentLoaded", function () {
  const downloadButton = document.getElementById("download-transcript");
  const downloadAllButton = document.getElementById("download-all-transcripts");

  function sendMessageToActiveTab(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length === 0) {
        alert("Error: No active tab found");
        return;
      }

      try {
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
          if (chrome.runtime.lastError) {
            alert(
              "Error: Could not connect to the page. Make sure you're on an O'Reilly video page and refresh if needed.",
            );
          }
        });
      } catch (error) {
        alert("Error sending message: " + error.message);
      }
    });
  }

  downloadButton.addEventListener("click", function () {
    sendMessageToActiveTab({ action: "downloadTranscript" });
  });

  downloadAllButton.addEventListener("click", function () {
    sendMessageToActiveTab({ action: "downloadAllTranscripts" });
  });
});
