// When deployed, this page and the built files live at the same root.
// Copy step in CI places the build under ./dist, so import from there.
const sourceEl = document.getElementById("source");
const convertedEl = document.getElementById("converted");
const restoredEl = document.getElementById("restored");
const useCompressionEl = document.getElementById("useCompression");

let encode, decode, compressToUrl, decompressFromUrl;
async function loadLib() {
  // Resolve path relative to this module to avoid GitHub Pages base path issues
  const url = new URL("./dist/rison.js", import.meta.url);
  const mod = await import(url.href);
  ({ encode, decode, compressToUrl, decompressFromUrl } = mod);
}

function safeEval(input) {
  try {
    // Try JSON first
    return JSON.parse(input);
  } catch {}
  try {
    // Fallback to JS expression (sandboxed via Function)
    // eslint-disable-next-line no-new-func
    return Function(`"use strict";return (${input})`)();
  } catch {
    return input; // treat as string
  }
}

function update() {
  const raw = sourceEl.value.trim();
  try {
    const value = safeEval(raw);
    const useCompression = !!useCompressionEl?.checked;
    if (useCompression) {
      const compressed = compressToUrl(value);
      convertedEl.value = compressed;
      const back = decompressFromUrl(compressed);
      restoredEl.value = JSON.stringify(back, null, 2);
    } else {
      const r = encode(value);
      convertedEl.value = r;
      const back = decode(r);
      restoredEl.value = JSON.stringify(back, null, 2);
    }
    convertedEl.classList.remove("error");
    restoredEl.classList.remove("error");
  } catch (e) {
    convertedEl.value = String(e.message || e);
    restoredEl.value = "";
    convertedEl.classList.add("error");
    restoredEl.classList.add("error");
  }
}

await loadLib();
sourceEl.addEventListener("input", update);
useCompressionEl?.addEventListener("change", update);
update();
