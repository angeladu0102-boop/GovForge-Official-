"use client";
// The add/edit form. Flow on Save:
// 1. Check required fields in the browser (instant feedback, nothing sent).
// 2. Send JSON to the API (POST to add, PATCH to edit).
// 3. Read the status code: 201/200 success, 400 field problems, 409 duplicate, 401 signed out.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { DATA_TYPES, toFieldErrors, toolInputSchema, type FieldErrors, type ToolInput } from "@/lib/tools";

type Props =
  | { mode: "create"; initial?: undefined; toolId?: undefined }
  | { mode: "edit"; initial: ToolInput; toolId: string };

const EMPTY: ToolInput = { name: "", vendor: "", purpose: "", team: "", dataTypes: [] };

export function ToolForm({ mode, initial, toolId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ToolInput>(initial ?? EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // B1: Next.js (cacheComponents) hides pages instead of removing them, so a form keeps
  // what was typed. This cleanup runs when the page is hidden: "Add tool" always reopens blank.
  useLayoutEffect(() => {
    if (mode !== "create") return;
    return () => {
      setValues(EMPTY);
      setErrors({});
      setFormError(null);
      setDuplicateId(null);
      setSaving(false);
    };
  }, [mode]);

  function set<K extends keyof ToolInput>(key: K, value: ToolInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleDataType(type: (typeof DATA_TYPES)[number]) {
    const has = values.dataTypes.includes(type);
    set("dataTypes", has ? values.dataTypes.filter((t) => t !== type) : [...values.dataTypes, type]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return; // ignore double-clicks
    setFormError(null);
    setDuplicateId(null);

    const check = toolInputSchema.safeParse(values);
    if (!check.success) {
      setErrors(toFieldErrors(check.error));
      return; // nothing is sent, nothing is saved
    }

    setSaving(true);
    try {
      const res = await fetch(mode === "create" ? "/api/tools" : `/api/tools/${toolId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check.data),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 201 || res.status === 200) {
        router.push(mode === "create" ? "/?added=1" : `/tools/${toolId}?saved=1`);
        router.refresh();
        return;
      }
      if (res.status === 400 && json.fieldErrors) setErrors(json.fieldErrors);
      else if (res.status === 409) {
        setFormError(json.error ?? "That name is already in the register");
        setDuplicateId(json.existingId ?? null);
      } else if (res.status === 401) router.push("/login");
      else setFormError(json.error ?? "Something went wrong. Your input is kept; try again.");
    } catch {
      setFormError("Couldn't reach the server. Your input is kept; try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      <Field label="Tool name" required error={errors.name}>
        <input className="field" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. ChatGPT Team" />
      </Field>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Vendor" error={errors.vendor}>
          <input className="field" value={values.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="e.g. OpenAI" />
        </Field>
        <Field label="Team" error={errors.team}>
          <input className="field" value={values.team} onChange={(e) => set("team", e.target.value)} placeholder="e.g. Marketing" />
        </Field>
      </div>

      <Field label="Purpose" required error={errors.purpose} hint="What do people use it for? Don't paste client names or sensitive details.">
        <textarea className="field min-h-24 resize-y" value={values.purpose} onChange={(e) => set("purpose", e.target.value)} />
      </Field>

      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-[0.14em] text-ink/60">
          Data that goes into it <span className="text-risk-high">*</span>
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DATA_TYPES.map((type) => {
            const on = values.dataTypes.includes(type);
            return (
              <label key={type} className={`chip ${on ? "chip-on" : ""}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleDataType(type)} />
                <span aria-hidden className="chip-box">{on ? "✓" : ""}</span>
                {type}
              </label>
            );
          })}
        </div>
        {errors.dataTypes && <p className="mt-2 text-sm text-risk-high">{errors.dataTypes}</p>}
      </fieldset>

      {formError && (
        <p role="alert" className="border-l-2 border-risk-high bg-risk-high/8 px-3 py-2 text-sm text-risk-high">
          {formError}
          {duplicateId && (
            <> · <Link href={`/tools/${duplicateId}`} className="underline underline-offset-2">Open it</Link></>
          )}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
          {saving && <span className="spinner" aria-hidden />}
          {saving ? "Saving…" : mode === "create" ? "Save tool" : "Save changes"}
        </button>
        <Link href={mode === "create" ? "/" : `/tools/${toolId}`} className="text-sm text-ink/60 hover:text-ink">Cancel</Link>
      </div>
    </form>
  );
}

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink/60">
        {label} {required && <span className="text-risk-high">*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-ink/50">{hint}</span>}
      {error && <span className="text-sm text-risk-high">{error}</span>}
    </label>
  );
}
