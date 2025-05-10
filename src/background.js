const downloadTranscript = (transcript) => {
  const blob = new Blob([transcript], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transcript.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadTranscript") {
    const transcript = request.transcript;
    downloadTranscript(transcript);
    sendResponse({ status: "success" });
  }
});
