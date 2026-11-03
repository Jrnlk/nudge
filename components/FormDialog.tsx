"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FORMS } from "@/lib/forms";
import { useStore } from "@/lib/store";
import type { Prefill } from "@/lib/services/prefill";

/** One add/edit dialog for applications, people, and target companies. Mounted once in the app shell. */
export function FormDialog() {
  const { editor, closeEditor } = useStore();
  return (
    <Modal open={!!editor} onClose={closeEditor}>
      {editor && <FormBody key={`${editor.kind}:${editor.id ?? "new"}`} />}
    </Modal>
  );
}

function FormBody() {
  const store = useStore();
  const { editor, closeEditor, save, remove } = store;
  const kind = editor!.kind;
  const def = FORMS[kind];
  const item = (editor!.id ? (store[kind] as { id: string }[]).find((x) => x.id === editor!.id) : undefined) as
    | Record<string, string | undefined>
    | undefined;
  const formRef = useRef<HTMLFormElement>(null);
  const [armed, setArmed] = useState(false);
  const [fillNote, setFillNote] = useState("");

  const field = (k: string) => formRef.current?.elements.namedItem(k) as HTMLInputElement | null;

  async function fill() {
    const link = field("link")?.value.trim();
    if (!link) return;
    setFillNote("");
    try {
      const res = await fetch("/api/prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const body = (await res.json()) as Prefill & { error?: string };
      if (!res.ok) return setFillNote(body.error ?? "Could not read that link.");
      (["company", "role", "location"] as const).forEach((k) => {
        const el = field(k);
        if (el && body[k] && !el.value) el.value = body[k]!;
      });
      if (!body.company) setFillNote("That link has no details in it. Fill in the rest by hand.");
      else if (!body.role) setFillNote("Got the company. Check the spelling, then add the role.");
    } catch {
      setFillNote("Could not reach the server. Fill in the details by hand.");
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const trimmed = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.trim()]));
    if (!trimmed[def.required]) return field(def.required)?.focus();
    save(kind, { ...trimmed, id: editor!.id });
    closeEditor();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="p-6">
      <h2 className="mb-4 text-[22px] font-extrabold">
        {editor!.id ? "Edit" : "Add"} {def.label}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {def.fields.map((f) => (
          <div key={f.key} className={`grid gap-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
            <label htmlFor={`f_${f.key}`} className="text-[13px] font-bold">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea id={`f_${f.key}`} name={f.key} defaultValue={item?.[f.key] ?? ""} className="input" />
            ) : f.type === "select" ? (
              <select id={`f_${f.key}`} name={f.key} defaultValue={item?.[f.key] ?? f.options?.[kind === "apps" ? 1 : 0]} className="input">
                {f.options!.map((o) => (
                  <option key={o} value={o}>{o || "Not set"}</option>
                ))}
              </select>
            ) : f.type === "url" ? (
              <div className="flex gap-2">
                <input
                  id={`f_${f.key}`}
                  name={f.key}
                  type="url"
                  placeholder="Paste a job link"
                  defaultValue={item?.[f.key] ?? ""}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  className="input"
                />
                <Button onClick={fill}>Fill in</Button>
              </div>
            ) : (
              <input id={`f_${f.key}`} name={f.key} type={f.type} defaultValue={item?.[f.key] ?? ""} className="input" />
            )}
            {f.type === "url" && fillNote && <p className="text-[13px] text-muted" aria-live="polite">{fillNote}</p>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2.5">
        <div>
          {editor!.id && (
            <Button
              variant="ghost"
              className="text-st-rejected"
              onClick={() => {
                if (!armed) return setArmed(true);
                remove(kind, editor!.id!);
                closeEditor();
              }}
            >
              {armed ? "Click again to delete" : "Delete"}
            </Button>
          )}
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={closeEditor}>Cancel</Button>
          <Button type="submit">Save {def.label}</Button>
        </div>
      </div>
    </form>
  );
}
