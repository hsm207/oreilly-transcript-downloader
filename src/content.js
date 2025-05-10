document.addEventListener("DOMContentLoaded", function () {
  const downloadButton = document.createElement("button");
  downloadButton.textContent = "Download Transcript";
  document.body.appendChild(downloadButton);

  downloadButton.addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "downloadTranscript" });
  });
});

function enableTranscript() {
  const transcriptButton = document.querySelector(
    ".transcript-button-selector",
  ); // Update with actual selector
  if (transcriptButton) {
    transcriptButton.click();
  }
}

function fetchTranscript() {
  const transcriptElement = document.querySelector(
    ".transcript-element-selector",
  ); // Update with actual selector
  if (transcriptElement) {
    return transcriptElement.innerText;
  }
  return "";
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "downloadTranscript") {
    const transcriptBody = getTranscriptBodyElement();
    if (!transcriptBody) {
      alert(
        "Transcript body not found! Please make sure the transcript is enabled on this page.",
      );
      sendResponse({ status: "not_found" });
      return;
    }
    const fullTranscript = extractTranscriptFromDOM(transcriptBody);
    if (fullTranscript.length === 0) {
      alert(
        "No transcript text could be extracted. Please check if the transcript is visible and try again.",
      );
      sendResponse({ status: "empty" });
      return;
    }
    const pageTitle = document.title || "transcript";
    // Sanitize filename
    const filename = pageTitle.replace(/[^a-z0-9_.-]/gi, "_") + ".txt";
    const blob = new Blob([fullTranscript], {
      type: "text/plain;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    sendResponse({ status: "success" });
  }
});
