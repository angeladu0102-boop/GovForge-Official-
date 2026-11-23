"use client";
// The risk assessment panel on a tool's page (tech spec §3.10). States:
// Not assessed · Running · Complete · Insufficient info · Out of date banner · Error with Try again.
// Flow on Assess: lock the button → POST /api/tools/{id}/assess → read the status code
// (201 result, 502 AI down, 504 too slow, 401 signed out) → show the matching state.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LocalDate } from "@/components/local-date";
import { effectiveLevel, type Assessment } from "@/lib/assessment";
import { RISK_LEVELS, rank, type RiskLevel } from "@/lib/risk-rules";

const BROWSER_TIMEOUT_MS = 60_000; // acceptance criterion: over 60 s → stop and show "Try again"
const NOTICE_MS = 5_000; // "Override saved" message hides itself after 5 s
const FLASH_MS = 1_600; // override box highlight fades after this

type Props = { toolId: string; initial: Assessment | null; outOfDate: boolean };

export function AssessmentPanel({ toolId, initial, outOfDate: initialOutOfDate }: Props) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(initial);
  const [outOfDate, setOutOfDate] = useState(initialOutOfDate);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false); // a ref updates instantly, so a fast double-click can't start two runs
  const [notice, setNotice] = useState<Assessment["override"]>(null); // "Override saved" message
  const [flash, setFlash] = useState(false); // brief highlight on the override box

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t); // a newer save restarts the 5 s
  }, [notice]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), FLASH_MS);
    return () => clearTimeout(t);
  }, [flash]);

  function handleOverridden(updated: Assessment) {
    setAssessment(updated);
    setNotice(updated.override);
    setFlash(true);
  }

  async function runAssessment() {
    if (lock.current) return; // double-click while running does nothing extra
    lock.current = true;
    setRunning(true);
    setError(null);
    setNotice(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BROWSER_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/tools/${toolId}/assess`, { method: "POST", signal: controller.signal });
      const json = await res.json().catch(() => ({}));
      if (res.status === 201) {
        setAssessment(json.assessment);
        setOutOfDate(false);
      } else if (res.status === 401) {
        router.push("/login");
      } else {
        setError(json.error ?? "Assessment unavailable, your tool is saved, try again.");
      }
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "AbortError"
          ? "The assessment took too long. Your tool is saved; try again."
          : "Couldn't reach the server. Your tool is saved; try again.",
      );
    } finally {
      clearTimeout(timer);
      lock.current = false;
      setRunning(false);
    }
  }

  const assessButton = (label: string) => (
    <button type="button" onClick={runAssessment} disabled={running} className="btn-primary inline-flex items-center gap-2">
      {running && <span className="spinner" aria-hidden />}
      {running ? "Assessing…" : label}
    </button>
  );

  return (
    <section aria-labelledby="assessment-heading" className="mt-8 border border-ink/15 bg-white/40 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="assessment-heading" className="font-display text-2xl text-ink">Risk assessment</h2>
        {assessment && !running && assessButton("Re-assess")}
      </div>

      {/* Always rendered, so screen readers announce the message when it appears. */}
      <div role="status" aria-live="polite">
        {notice && (
          <p className="mt-4 border-l-2 border-moss bg-moss/8 px-3 py-2 text-sm font-medium text-moss">
            Override saved — {notice.level}, by {notice.byName}, <LocalDate iso={notice.at} withTime />
          </p>
        )}
      </div>

      {running && (
        <p className="mt-3 text-sm text-ink/60" role="status">Assessing… Usually under 30 seconds.</p>
      )}

      {error && !running && (
        <div role="alert" className="mt-4 border-l-2 border-risk-high bg-risk-high/8 px-3 py-2 text-sm text-risk-high">
          {error}{" "}
          <button type="button" onClick={runAssessment} className="font-medium underline underline-offset-2">Try again</button>
        </div>
      )}

      {!assessment && !running && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink/50">Not assessed</span>
          {assessButton("Assess")}
        </div>
      )}

      {assessment && outOfDate && (
        <div className="mt-4 border-l-2 border-risk-medium bg-risk-medium/10 px-3 py-2 text-sm text-ink">
          <strong>Out of date, re-assess.</strong> Inputs changed since this assessment.
        </div>
      )}

      {assessment?.status === "insufficient_info" && <InsufficientInfo assessment={assessment} />}
      {assessment?.status === "complete" && (
        <CompleteResult assessment={assessment} onOverridden={handleOverridden} flash={flash} />
      )}
    </section>
  );
}

function InsufficientInfo({ assessment }: { assessment: Assessment }) {
  return (
    <div className="mt-4">
      <p className="font-medium text-ink">Not enough information to assess this tool.</p>
      <p className="mt-1 text-sm text-ink/70">Add the following to the tool&apos;s details, save, then assess again:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
        {assessment.missingInfo.map((m) => <li key={m}>{m}</li>)}
      </ul>
      <a href="#edit" className="mt-3 inline-block text-sm text-moss underline underline-offset-2">Edit details</a>
      <p className="mt-3 font-mono text-xs text-ink/50">Checked <LocalDate iso={assessment.createdAt} withTime /></p>
    </div>
  );
}

function CompleteResult({ assessment: a, onOverridden, flash }: {
  assessment: Assessment; onOverridden: (a: Assessment) => void; flash: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const shown = effectiveLevel(a)!;
  const floorRaised = a.floorLevel && a.aiLevel && rank(a.floorLevel) > rank(a.aiLevel);

  return (
    <div className="mt-4">
      <p className="inline-block border border-brass/40 bg-brass/10 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-brass">
        AI draft, review before relying on it
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <LevelBadge level={shown} />
        {a.override && <span className="text-sm text-ink/60">Reviewer override (AI/rules said {a.riskLevel})</span>}
      </div>

      {floorRaised && (
        <p className="mt-3 text-sm text-ink/80">
          Raised to {a.floorLevel}: tool {lowerFirst(a.floorReason ?? "")} (GovForge minimum rule). The AI said {a.aiLevel}.
        </p>
      )}

      {a.override && (
        <div
          className={`mt-4 border-l-2 border-moss px-3 py-2 text-sm text-ink transition-[background-color,box-shadow] duration-700 motion-reduce:transition-none ${
            flash ? "bg-moss/20 ring-2 ring-moss/50" : "bg-moss/8 ring-0 ring-transparent"
          }`}
        >
          <div className="grid gap-1 sm:grid-cols-2">
            <div>AI/rules level: <strong>{a.riskLevel}</strong></div>
            <div>Reviewer level: <strong>{a.override.level}</strong></div>
          </div>
          <p className="mt-1">Reason: {a.override.reason}</p>
          <p className="mt-1 font-mono text-xs text-ink/60">
            By {a.override.byName} · <LocalDate iso={a.override.at} withTime />
          </p>
        </div>
      )}

      <h3 className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-ink/60">Why</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
        {a.reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>

      <h3 className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-ink/60">Recommended controls</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
        {a.controls.map((c) => <li key={c}>{c}</li>)}
      </ul>

      <details className="mt-5 text-sm text-ink/70">
        <summary className="cursor-pointer">
          Assessed <LocalDate iso={a.createdAt} withTime /> by {a.createdByName} · inputs used
        </summary>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-ink/50">Name</dt><dd>{a.inputsSnapshot.name}</dd>
          <dt className="text-ink/50">Vendor</dt><dd>{a.inputsSnapshot.vendor || "—"}</dd>
          <dt className="text-ink/50">Purpose</dt><dd>{a.inputsSnapshot.purpose}</dd>
          <dt className="text-ink/50">Data types</dt><dd>{a.inputsSnapshot.dataTypes.join(", ")}</dd>
          <dt className="text-ink/50">Model</dt><dd className="font-mono text-xs">{a.model} · prompt {a.promptVersion}</dd>
        </dl>
      </details>

      {editing ? (
        <OverrideForm assessment={a} onDone={(updated) => { onOverridden(updated); setEditing(false); }} onCancel={() => setEditing(false)} />
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="mt-5 text-sm text-moss underline underline-offset-2">
          {a.override ? "Change override" : "Override"}
        </button>
      )}
    </div>
  );
}

function OverrideForm({ assessment, onDone, onCancel }: {
  assessment: Assessment; onDone: (a: Assessment) => void; onCancel: () => void;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<RiskLevel | null>(assessment.override?.level ?? null);
  const [reason, setReason] = useState(assessment.override?.reason ?? "");
  const [errors, setErrors] = useState<{ level?: string; reason?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  const reasonLength = reason.trim().length;
  const reasonOk = reasonLength >= 10;
  const canSave = level !== null && reasonOk && !saving;
  // Save is disabled until both are done, so say what's missing as soon as the reason is ready.
  const levelError = errors.level ?? (!level && reasonOk ? "Choose Low, Medium or High" : undefined);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const local: typeof errors = {};
    if (!level) local.level = "Choose Low, Medium or High";
    if (reason.trim().length < 10) local.reason = "Give a reason of at least 10 characters";
    if (local.level || local.reason) return setErrors(local);

    setSaving(true);
    setErrors({});
    try {
      const res = await fetch(`/api/assessments/${assessment.id}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 200) return onDone(json.assessment);
      if (res.status === 401) return router.push("/login");
      if (res.status === 400 && json.fieldErrors) setErrors(json.fieldErrors);
      else setErrors({ form: json.error ?? "Couldn't save the override. Try again." });
    } catch {
      setErrors({ form: "Couldn't reach the server. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="mt-5 flex flex-col gap-4 border-t border-ink/10 pt-5">
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-[0.14em] text-ink/60">Reviewer&apos;s risk level</legend>
        <div className="mt-2 flex gap-2" aria-describedby={levelError ? "override-level-error" : undefined}>
          {RISK_LEVELS.map((l) => (
            <label key={l} className={`chip ${level === l ? "chip-on" : ""} ${levelError ? "border-risk-high" : ""}`}>
              <input type="radio" name="level" className="sr-only" checked={level === l} onChange={() => { setLevel(l); setErrors((x) => ({ ...x, level: undefined })); }} />
              {l}
            </label>
          ))}
        </div>
        <div aria-live="polite">
          {levelError && (
            <p id="override-level-error" className="mt-2 flex items-center gap-2 border-l-2 border-risk-high bg-risk-high/8 px-3 py-1.5 text-sm font-medium text-risk-high">
              <span aria-hidden className="font-mono">!</span> {levelError}
            </p>
          )}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink/60">Reason <span className="text-risk-high">*</span></span>
        <textarea className="field min-h-20 resize-y" value={reason} onChange={(e) => { setReason(e.target.value); setErrors((x) => ({ ...x, reason: undefined })); }} />
        {errors.reason ? <span className="text-sm text-risk-high">{errors.reason}</span> : <span className="text-xs text-ink/50">{reasonOk ? "Shown next to the AI\u2019s level." : `At least 10 characters (${10 - reasonLength} more). Shown next to the AI\u2019s level.`}</span>}
      </label>
      {errors.form && <p role="alert" className="text-sm text-risk-high">{errors.form}</p>}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSave}
          aria-describedby={!canSave && !saving ? "override-save-hint" : undefined}
          className={`btn-primary inline-flex items-center gap-2 ${saving ? "" : "disabled:cursor-not-allowed"}`}
        >
          {saving && <span className="spinner" aria-hidden />}
          {saving ? "Saving…" : "Save override"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:text-ink">Cancel</button>
        {!canSave && !saving && (
          <span id="override-save-hint" className="text-xs text-ink/50">Choose a level and a reason of 10+ characters to save.</span>
        )}
      </div>
    </form>
  );
}

const BADGE: Record<RiskLevel, string> = {
  High: "border-risk-high bg-risk-high/10 text-risk-high",
  Medium: "border-risk-medium bg-risk-medium/10 text-risk-medium",
  Low: "border-risk-low bg-risk-low/10 text-risk-low",
};

function LevelBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`border px-3 py-1 font-mono text-sm uppercase tracking-[0.14em] ${BADGE[level]}`}>
      {level} risk
    </span>
  );
}

function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}
