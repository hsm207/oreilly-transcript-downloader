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
  // Renamed and sendResponse added
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
    // Moved try/catch block here
    for (let i = 0; i < modules.length; i++) {
      const { title, url } = modules[i];
      // Navigate to the module (simulate click)
      const link = tocRoot.querySelector(`a.orm-Link-root[href='${url}']`);
      if (link) link.click();
      // Wait for transcript to load
      await new Promise((resolve) => {
        let attempts = 0;
        function check() {
          const transcriptBody = window.getTranscriptBodyElement?.();
          if (transcriptBody) return resolve();
          if (++attempts > 40) {
            console.warn(
              "Max attempts reached waiting for transcript to load for module:",
              title,
            );
            return resolve(); // Resolve anyway to not block the whole process
          }
          setTimeout(check, 500);
        }
        check();
      });
      const transcriptBody = window.getTranscriptBodyElement?.();
      if (!transcriptBody) {
        console.warn(
          "Transcript body not found for module:",
          title,
          "- skipping this module.",
        );
        // Optionally, send a partial error or notification if desired
        // For now, we just log and continue
        await new Promise((r) => setTimeout(r, 1000)); // Wait before next module
        continue;
      }
      const transcript = window.extractTranscriptFromDOM(transcriptBody);
      if (transcript.length === 0) {
        console.warn(
          "Empty transcript extracted for module:",
          title,
          "- skipping this module.",
        );
        await new Promise((r) => setTimeout(r, 1000)); // Wait before next module
        continue;
      }

      // Use the current page title for the filename rather than the module title from TOC
      // This ensures we're naming the file based on the module we're currently viewing
      const currentPageTitle =
        document.title || title || `transcript-module-${i + 1}`;
      const filename = currentPageTitle.replace(/[^a-z0-9_.-]/gi, "_") + ".txt";
      downloadTextFile(filename, transcript);
      // Wait a bit before next module
      await new Promise((r) => setTimeout(r, 1000));
    }
    alert("All transcripts downloaded!");
    sendResponse({ status: "completed" }); // Moved sendResponse here
  } catch (error) {
    alert("Error downloading all transcripts: " + error.message);
    sendResponse({ status: "error", message: error.message }); // Moved sendResponse here
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
