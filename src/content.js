chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "downloadTranscript") {
    handleDownloadSingleTranscript(sendResponse);
    return true; // Indicates that the response will be sent asynchronously or synchronously by the handler
  }
  if (request.action === "downloadAllTranscripts") {
    handleDownloadAllTranscripts(sendResponse); // Changed: Direct call, IIFE removed
    return true; // Indicates that the response will be sent asynchronously
  }
});

function handleDownloadSingleTranscript(sendResponse) {
  const transcriptBody = window.getTranscriptBodyElement?.();
  if (!transcriptBody) {
    alert(
      "Transcript body not found! Please make sure the transcript is enabled on this page.",
    );
    sendResponse({ status: "not_found" });
    return;
  }
  const fullTranscript = window.extractTranscriptFromDOM(transcriptBody);
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
  downloadTextFile(filename, fullTranscript);
  sendResponse({ status: "success" });
}

// --- TOC extraction integration ---
// These are attached to window for browser usage by extractTOC.js
async function handleDownloadAllTranscripts(sendResponse) {
  const extractTOCRoot = window.extractTOCRoot;
  const extractModuleLinksFromTOC = window.extractModuleLinksFromTOC;
  if (!extractTOCRoot || !extractModuleLinksFromTOC) {
    alert("TOC extraction functions not available.");
    sendResponse({
      status: "error",
      message: "TOC extraction functions not available.",
    });
    return;
  }
  const tocRoot = extractTOCRoot(document);
  if (!tocRoot) {
    alert("Table of Contents not found! Please open the TOC and try again.");
    sendResponse({ status: "error", message: "Table of Contents not found." });
    return;
  }
  const modules = extractModuleLinksFromTOC(tocRoot);
  if (!modules.length) {
    alert("No modules found in the TOC.");
    sendResponse({ status: "error", message: "No modules found in the TOC." });
    return;
  }

  try {
    for (let i = 0; i < modules.length; i++) {
      const { title, url } = modules[i];
      console.log(`Processing module ${i + 1}/${modules.length}: ${title}`);

      const link = tocRoot.querySelector(`a.orm-Link-root[href='${url}']`);
      if (!link) {
        console.warn(
          `Link not found for module: ${title} (${url}) - skipping this module.`,
        );
        continue;
      }

      link.click();

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const transcriptBody = window.getTranscriptBodyElement?.();
      if (!transcriptBody) {
        console.warn(
          `Transcript body not found for module: ${title} (${url}) - skipping this module.`,
        );
        continue;
      }

      const transcript = window.extractTranscriptFromDOM(transcriptBody);
      if (transcript.length === 0) {
        console.warn(
          `Empty transcript extracted for module: ${title} (${url}) - skipping this module.`,
        );
        continue;
      }

      const currentPageTitle =
        document.title || title || `transcript-module-${i + 1}`;
      const filename = currentPageTitle.replace(/[^a-z0-9_.-]/gi, "_") + ".txt";
      downloadTextFile(filename, transcript);

      await new Promise((r) => setTimeout(r, 2000));
    }
    alert("All transcripts downloaded!");
    sendResponse({ status: "completed" });
  } catch (error) {
    alert("Error downloading all transcripts: " + error.message);
    sendResponse({ status: "error", message: error.message });
  }
}

// Helper to download a text file with a given filename
function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
