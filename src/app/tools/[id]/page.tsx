import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { AssessmentPanel } from "@/components/assessment-panel";
import { LocalDate } from "@/components/local-date";
import { ToolForm } from "@/components/tool-form";
import { isOutOfDate } from "@/lib/assessment";
import { getCurrentAssessment } from "@/lib/assessments-db";
import { getCurrentMember } from "@/lib/auth";
import { getTool } from "@/lib/tools-db";
import type { ToolInput } from "@/lib/tools";

export default function ToolPage(props: PageProps<"/tools/[id]">) {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-moss">← Register</Link>
        <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-sm bg-ink/5" />}>
          <ToolDetail {...props} />
        </Suspense>
      </main>
    </div>
  );
}

async function ToolDetail({ params, searchParams }: PageProps<"/tools/[id]">) {
  const member = await getCurrentMember();
  if (!member) return null;
  const { id } = await params;
  const { saved } = await searchParams;
  const tool = await getTool(id);
  if (!tool) notFound(); // also covers another organization's tool
  const assessment = await getCurrentAssessment(tool.id);
  const outOfDate = assessment ? isOutOfDate(tool, assessment.inputsSnapshot) : false; // [D2]

  const initial: ToolInput = {
    name: tool.name,
    vendor: tool.vendor ?? "",
    purpose: tool.purpose,
    team: tool.team ?? "",
    dataTypes: tool.dataTypes as ToolInput["dataTypes"],
  };

  return (
    <>
      <h1 className="mt-3 font-display text-4xl text-ink">{tool.name}</h1>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-ink/60">
        <div>Owner <span className="text-ink">{tool.ownerName}</span></div>
        <div>Added <span className="text-ink"><LocalDate iso={tool.createdAt} /></span></div>
        <div>Last updated <span className="text-ink"><LocalDate iso={tool.updatedAt} withTime /></span></div>
      </dl>
      {saved && <p className="mt-6 border-l-2 border-moss bg-moss/8 px-3 py-2 text-sm text-moss">Changes saved.</p>}
      <AssessmentPanel key={assessment?.id ?? "none"} toolId={tool.id} initial={assessment} outOfDate={outOfDate} />
      <h2 id="edit" className="mt-12 scroll-mt-6 font-display text-2xl text-ink">Edit details</h2>
      <div className="mt-6"><ToolForm mode="edit" initial={initial} toolId={tool.id} /></div>
    </>
  );
}
