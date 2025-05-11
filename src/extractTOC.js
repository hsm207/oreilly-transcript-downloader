/**
 * Returns the TOC root element if present, otherwise null.
 * @param {Document|Element} domRoot
 * @returns {Element|null}
 */
function extractTOCRoot(domRoot) {
  return domRoot.querySelector("div._tocScrollWrapper_kshag_1");
}

/**
 * Extracts module titles and URLs from the O'Reilly course TOC DOM.
 * @param {Element} tocRoot - The TOC root element to search within.
 * @returns {Array<{title: string, url: string}>}
 */
function extractModuleLinksFromTOC(tocRoot) {
  if (!tocRoot) return [];
  const links = tocRoot.querySelectorAll("a.orm-Link-root[href]");
  return Array.from(links).map((link) => ({
    title: link.textContent.replace(/\s+/g, " ").trim(),
    url: link.getAttribute("href"),
  }));
}

if (typeof module !== "undefined") {
  module.exports = { extractTOCRoot, extractModuleLinksFromTOC };
}

// Attach to window for browser usage (content script)
if (typeof window !== "undefined") {
  window.extractTOCRoot = extractTOCRoot;
  window.extractModuleLinksFromTOC = extractModuleLinksFromTOC;
}
