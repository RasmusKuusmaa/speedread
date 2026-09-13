"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { exportStore } from "@/lib/storage/export";
import { importStore } from "@/lib/storage/import";
import { useStore } from "@/lib/storage/store-provider";

export default function SettingsPage() {
  const { store, update } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (store === null) {
    return null;
  }

  function handleExport() {
    if (store !== null) {
      exportStore(store);
    }
  }

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const text = await file.text();
    const result = importStore(text);
    if (result.ok) {
      setImportError(null);
      update(() => result.value);
    } else {
      setImportError(result.error);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <h1 className="font-serif text-2xl text-ink">Settings</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-sans text-sm text-muted">Your data</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
          >
            Export progress
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
          >
            Import progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportChange}
            className="hidden"
          />
        </div>
        {importError !== null && (
          <p className="font-sans text-sm text-signal">{importError}</p>
        )}
      </section>
    </main>
  );
}
