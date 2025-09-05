import "./styles.css";
import {
  encode,
  decode,
  compressToUrl,
  decompressFromUrl,
  compressForStorage,
  decompressFromStorage,
  saveToLocalStorage,
  loadFromLocalStorage
} from "@effective/rison";

const sourceEl = document.getElementById("source") as HTMLTextAreaElement;
const convertedEl = document.getElementById("converted") as HTMLTextAreaElement;
const restoredEl = document.getElementById("restored") as HTMLTextAreaElement;
const modeRadios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="mode"]'));
const sourceMetaEl = document.getElementById("sourceMeta") as HTMLSpanElement;
const sourceWarnEl = document.getElementById("sourceWarn") as HTMLSpanElement;
const btnShort = document.getElementById("btnShort") as HTMLButtonElement;
const btnMedium = document.getElementById("btnMedium") as HTMLButtonElement;
const btnLong = document.getElementById("btnLong") as HTMLButtonElement;
const convertedMetaEl = document.getElementById("convertedMeta") as HTMLSpanElement;
const storageTokenEl = document.getElementById("storageToken") as HTMLTextAreaElement;
const storageRestoredEl = document.getElementById("storageRestored") as HTMLTextAreaElement;
const storageMetaEl = document.getElementById("storageMeta") as HTMLSpanElement;
const storageEncodingRadios = Array.from(
  document.querySelectorAll<HTMLInputElement>('input[name="storageEncoding"]')
);
const btnSaveLS = document.getElementById("btnSaveLS") as HTMLButtonElement;
const btnLoadLS = document.getElementById("btnLoadLS") as HTMLButtonElement;
const btnClearLS = document.getElementById("btnClearLS") as HTMLButtonElement;
const lsStatusEl = document.getElementById("lsStatus") as HTMLSpanElement;

function safeEval(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {}
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict";return (${input})`)();
  } catch {
    return input;
  }
}

function sortKeysDeep<T>(v: T): T {
  if (Array.isArray(v)) return v.map(sortKeysDeep) as any;
  if (v && typeof v === "object") {
    const out: Record<string, any> = {};
    Object.keys(v as any)
      .sort()
      .forEach((k) => {
        out[k] = sortKeysDeep((v as any)[k]);
      });
    return out as any;
  }
  return v;
}

function stringifySorted(v: unknown): string {
  return JSON.stringify(sortKeysDeep(v), null, 2);
}

async function update() {
  const raw = sourceEl.value.trim();
  try {
    const value = safeEval(raw);
    const selected = modeRadios.find((r) => r.checked)?.value as "auto" | "gzip" | "deflate" | "none" | undefined;
    const mode = selected ?? "auto";
    const storageEncoding =
      (storageEncodingRadios.find((r) => r.checked)?.value as "base32768" | "base64" | undefined) ??
      "base32768";
    // Compute uncompressed Rison once to avoid whitespace noise from the source JSON
    const r = encode(value as any);
    if (mode === "none") {
      convertedEl.value = r;
      const back = decode(r);
      restoredEl.value = stringifySorted(back);
    } else {
      const compressed = await compressToUrl(value as any, { mode });
      convertedEl.value = compressed;
      const back = await decompressFromUrl(compressed);
      restoredEl.value = stringifySorted(back);
    }

    // Storage token and roundtrip
    if (mode === "none") {
      storageTokenEl.value = r;
      storageRestoredEl.value = stringifySorted(decode(r));
    } else {
      const storageToken = await compressForStorage(value as any, {
        mode,
        encoding: storageEncoding
      });
      storageTokenEl.value = storageToken;
      const storageBack = await decompressFromStorage(storageToken, { encoding: storageEncoding });
      storageRestoredEl.value = stringifySorted(storageBack);
    }
    convertedEl.classList.remove("error");
    restoredEl.classList.remove("error");
  } catch (e: any) {
    convertedEl.value = String(e?.message || e);
    restoredEl.value = "";
    convertedEl.classList.add("error");
    restoredEl.classList.add("error");
  }

  // Update meta info (character counts and compression %)
  const convLen = convertedEl.value.length;
  // Base length is the uncompressed Rison length; use strict JSON parsing only (ignore whitespace),
  // and if it's not valid JSON, report a baseline warning and skip the metric.
  let baseLen = 0;
  try {
    const obj = JSON.parse(sourceEl.value);
    baseLen = encode(obj as any).length;
    sourceWarnEl.textContent = "";
  } catch {
    sourceWarnEl.textContent = "Baseline requires strict JSON input";
  }
  sourceMetaEl.textContent = `Characters: ${baseLen}`;
  const effStr =
    baseLen > 0
      ? (() => {
          const eff = Math.round(((baseLen - convLen) / baseLen) * 100);
          return eff > 0 ? `${eff}%` : eff < 0 ? `-${Math.abs(eff)}%` : "0%";
        })()
      : "n/a";
  convertedMetaEl.textContent = `Characters: ${convLen} • Compression: ${effStr}`;

  // Storage meta
  const storageLen = storageTokenEl.value.length;
  const storageEffStr =
    baseLen > 0
      ? (() => {
          const eff = Math.round(((baseLen - storageLen) / baseLen) * 100);
          return eff > 0 ? `${eff}%` : eff < 0 ? `-${Math.abs(eff)}%` : "0%";
        })()
      : "n/a";
  storageMetaEl.textContent = `Characters: ${storageLen} • Compression: ${storageEffStr}`;
}

sourceEl.addEventListener("input", () => {
  void update();
});
modeRadios.forEach((r) =>
  r.addEventListener("change", () => {
    void update();
  })
);
storageEncodingRadios.forEach((r) =>
  r.addEventListener("change", () => {
    void update();
  })
);
btnShort.addEventListener("click", () => {
  const v = { a: 1, b: true, name: "short", tags: ["x", "y"] };
  sourceEl.value = stringifySorted(v);
  void update();
});
btnMedium.addEventListener("click", () => {
  const v = {
    columns: ["id", "createdAt", "customer", "status", "total", "currency", "items"],
    columnVisibility: { customerEmail: false, internalNotes: false },
    filters: {
      createdAt: { from: "2024-01-01", to: "2024-06-30" },
      customer: { like: "smith" },
      status: ["paid", "shipped"],
      total: { gte: 100, lte: 1000 }
    },
    pagination: { page: 7, pageSize: 50 },
    sorting: [
      { id: "createdAt", desc: true },
      { id: "total", desc: false }
    ],
    tableId: "orders"
  };
  sourceEl.value = stringifySorted(v);
  void update();
});
btnLong.addEventListener("click", () => {
  const columns = Array.from({ length: 50 }, (_, i) => `col${i + 1}`);
  const countries = [
    "DE",
    "FR",
    "GB",
    "US",
    "CA",
    "JP",
    "CN",
    "IT",
    "ES",
    "SE",
    "NO",
    "DK",
    "FI",
    "PL",
    "NL",
    "BE",
    "AT",
    "CH",
    "PT",
    "IE",
    "CZ",
    "SK",
    "HU",
    "RO",
    "BG",
    "GR",
    "TR",
    "AU",
    "NZ",
    "BR",
    "AR",
    "MX",
    "ZA",
    "IN",
    "SG",
    "KR"
  ];
  const users = Array.from({ length: 200 }, (_, i) => `u${i + 1}`);
  const views = Array.from({ length: 15 }, (_, i) => ({
    id: `v${i + 1}`,
    name: `View ${i + 1}`,
    filters: {
      status: ["paid", "shipped", "processing"],
      total: { gte: i * 50, lte: i * 120 + 1000 }
    }
  }));
  const v = {
    tableId: "orders-large",
    pagination: { page: 25, pageSize: 200 },
    sorting: [
      { id: "createdAt", desc: true },
      { id: "total", desc: false },
      { id: "status", desc: false }
    ],
    columnVisibility: { internalNotes: false, customerEmail: false, debug: false },
    filters: {
      status: ["paid", "shipped", "processing", "cancelled"],
      total: { gte: 50, lte: 20000 },
      createdAt: { from: "2024-01-01", to: "2024-12-31" },
      customer: { like: "john" },
      country: countries,
      userIds: users
    },
    columns: [
      "id",
      "createdAt",
      "customer",
      "status",
      "total",
      "currency",
      "items",
      "notes",
      "country",
      "salesRep",
      "priority",
      ...columns
    ],
    views
  };
  sourceEl.value = stringifySorted(v);
  void update();
});
void update();

// Make "Medium" the default preset content on load
(function setDefaultMedium() {
  const v = {
    columns: ["id", "createdAt", "customer", "status", "total", "currency", "items"],
    columnVisibility: { customerEmail: false, internalNotes: false },
    filters: {
      createdAt: { from: "2024-01-01", to: "2024-06-30" },
      customer: { like: "smith" },
      status: ["paid", "shipped"],
      total: { gte: 100, lte: 1000 }
    },
    pagination: { page: 7, pageSize: 50 },
    sorting: [
      { id: "createdAt", desc: true },
      { id: "total", desc: false }
    ],
    tableId: "orders"
  };
  sourceEl.value = stringifySorted(v);
  void update();
})();

// LocalStorage demo actions
const LS_KEY = "rison:demo";
btnSaveLS.addEventListener("click", async () => {
  lsStatusEl.textContent = "";
  try {
    const value = safeEval(sourceEl.value.trim());
    const selected = modeRadios.find((r) => r.checked)?.value as "auto" | "gzip" | "deflate" | "none" | undefined;
    const mode = selected ?? "auto";
    const storageEncoding =
      (storageEncodingRadios.find((r) => r.checked)?.value as "base32768" | "base64" | undefined) ??
      "base32768";
    await saveToLocalStorage(LS_KEY, value as any, { mode, encoding: storageEncoding });
    lsStatusEl.textContent = "Saved";
  } catch (e: any) {
    lsStatusEl.textContent = String(e?.message || e);
  }
});

btnLoadLS.addEventListener("click", async () => {
  lsStatusEl.textContent = "";
  try {
    const storageEncoding =
      (storageEncodingRadios.find((r) => r.checked)?.value as "base32768" | "base64" | undefined) ??
      "base32768";
    const data = await loadFromLocalStorage(LS_KEY, { encoding: storageEncoding });
    if (data == null) {
      lsStatusEl.textContent = "No value";
      return;
    }
    storageRestoredEl.value = stringifySorted(data);
    lsStatusEl.textContent = "Loaded";
  } catch (e: any) {
    lsStatusEl.textContent = String(e?.message || e);
  }
});

btnClearLS.addEventListener("click", () => {
  try {
    localStorage.removeItem(LS_KEY);
    lsStatusEl.textContent = "Cleared";
  } catch (e: any) {
    lsStatusEl.textContent = String(e?.message || e);
  }
});
