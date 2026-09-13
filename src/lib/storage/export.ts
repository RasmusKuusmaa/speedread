import type { Store } from "./types";

export function exportStore(store: Store): void {
  const json = JSON.stringify(store, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reading-trainer-${date}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}
