"use client";

import { exportRawStore, exportStore } from "@/lib/storage/export";
import { readRawStore } from "@/lib/storage/storage";
import { useStore } from "@/lib/storage/store-provider";

export function StorageRecoveryBanner() {
  const { store, storageError, resetStore } = useStore();

  if (storageError === null) {
    return null;
  }

  function handleExport() {
    if (store !== null) {
      exportStore(store);
      return;
    }
    const raw = readRawStore();
    exportRawStore(raw ?? "");
  }

  return (
    <div className="border-b border-rule bg-paper px-6 py-4 font-sans text-sm text-ink">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
        <p>
          Your saved progress could not be {store === null ? "loaded" : "saved"}{" "}
          just now ({storageError}).
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded border border-rule px-3 py-1.5 text-ink"
          >
            Export what&apos;s readable
          </button>
          {store === null && (
            <button
              type="button"
              onClick={resetStore}
              className="rounded border border-rule px-3 py-1.5 text-ink"
            >
              Start fresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
