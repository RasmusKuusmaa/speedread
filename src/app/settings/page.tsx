"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { exportStore } from "@/lib/storage/export";
import { importStore } from "@/lib/storage/import";
import { defaultStore } from "@/lib/storage/storage";
import { useStore } from "@/lib/storage/store-provider";
import type { RecallDepth } from "@/lib/storage/types";

const RESET_PHRASE = "RESET";

export default function SettingsPage() {
  const { store, update } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState("");

  if (store === null) {
    return null;
  }

  function handleExport() {
    if (store !== null) {
      exportStore(store);
    }
  }

  function handleReset() {
    if (resetConfirmation !== RESET_PHRASE) {
      return;
    }
    update(() => defaultStore());
    setResetConfirmation("");
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
        <h2 className="font-sans text-sm text-muted">Recall</h2>
        <p className="font-sans text-sm text-muted">
          How much you write about a passage before answering questions on it.
        </p>
        <select
          value={store.settings.recallDepth}
          onChange={(event) => {
            const value = event.target.value as RecallDepth;
            update((current) => ({
              ...current,
              settings: { ...current.settings, recallDepth: value },
            }));
          }}
          className="w-fit rounded border border-rule px-3 py-2 font-sans text-sm text-ink"
        >
          <option value="full">Full</option>
          <option value="brief">Brief</option>
          <option value="off">Off</option>
        </select>
      </section>

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

      <section className="flex flex-col gap-3">
        <h2 className="font-sans text-sm text-muted">Reset</h2>
        <p className="font-sans text-sm text-muted">
          This deletes every session, retest, and calibration result. Type{" "}
          {RESET_PHRASE} to confirm.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={resetConfirmation}
            onChange={(event) => setResetConfirmation(event.target.value)}
            placeholder={RESET_PHRASE}
            className="rounded border border-rule px-3 py-2 font-sans text-sm text-ink"
          />
          <button
            type="button"
            onClick={handleReset}
            disabled={resetConfirmation !== RESET_PHRASE}
            className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink disabled:opacity-40"
          >
            Reset all progress
          </button>
        </div>
      </section>
    </main>
  );
}
