import type { Store } from "./types";

function downloadJson(content: string, filenamePrefix: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${date}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function exportStore(store: Store): void {
  downloadJson(JSON.stringify(store, null, 2), "reading-trainer");
}

export function exportRawStore(raw: string): void {
  downloadJson(raw, "reading-trainer-unreadable");
}
