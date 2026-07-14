"use client";

import { useState } from "react";

/**
 * Subscribe the current search to WhatsApp alerts.
 * Posts to /api/saved-searches; delivery happens via scripts/notify.ts.
 */
export function SaveSearchForm({ query }: { query: Record<string, string | undefined> }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          whatsappPhone: phone.trim(),
          name: query.q || undefined,
          query: Object.fromEntries(
            Object.entries(query).filter(([k, v]) => v && k !== "page")
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setState("done");
      setMessage("Saved! You'll get a WhatsApp message when new matching jobs appear.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
      >
        💬 Get WhatsApp alerts for this search
      </button>
    );
  }

  if (state === "done") {
    return <p className="text-sm font-medium text-emerald-700">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+974 5xxx xxxx"
        className="h-9 w-44 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600"
      />
      <button
        type="submit"
        disabled={state === "saving"}
        className="h-9 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {state === "saving" ? "Saving…" : "Subscribe"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-slate-500 hover:text-slate-700"
      >
        Cancel
      </button>
      {state === "error" && <p className="w-full text-xs text-red-600">{message}</p>}
    </form>
  );
}
