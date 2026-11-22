import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LocalDate } from "@/components/local-date";
import { getCurrentMember } from "@/lib/auth";
import { listTools } from "@/lib/tools-db";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-moss">AI tool register</p>
            <h1 className="mt-2 font-display text-4xl text-ink">Your register</h1>
          </div>
          <Link href="/tools/new" className="btn-primary">Add tool</Link>
        </div>
        <Suspense fallback={<div className="mt-10 h-40 animate-pulse rounded-sm bg-ink/5" />}>
          <Register />
        </Suspense>
      </main>
    </div>
  );
}

async function Register() {
  const member = await getCurrentMember();
  if (!member) return null;
  const tools = await listTools();

  if (tools.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4 border border-dashed border-ink/20 px-6 py-16 text-center">
        <p className="font-display text-2xl text-ink">No AI tools yet</p>
        <p className="max-w-sm text-sm text-ink/60">Start with the one your team uses most. It takes about a minute.</p>
        <Link href="/tools/new" className="btn-primary mt-2">Add your first tool</Link>
      </div>
    );
  }

  return (
    <div className="mt-10 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/15 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
          <tr>
            <th className="py-3 pr-4 font-normal">Tool</th>
            <th className="py-3 pr-4 font-normal">Team</th>
            <th className="py-3 pr-4 font-normal">Owner</th>
            <th className="py-3 pr-4 font-normal">Added</th>
            <th className="py-3 font-normal">Last updated</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((t) => (
            <tr key={t.id} className="row-link border-b border-ink/8">
              <td className="py-4 pr-4">
                <Link href={`/tools/${t.id}`} className="font-medium text-ink">{t.name}</Link>
                {t.vendor && <span className="ml-2 text-ink/50">{t.vendor}</span>}
              </td>
              <td className="py-4 pr-4 text-ink/70">{t.team ?? "—"}</td>
              <td className="py-4 pr-4 text-ink/70">{t.ownerName}</td>
              <td className="py-4 pr-4 font-mono text-xs text-ink/60"><LocalDate iso={t.createdAt} /></td>
              <td className="py-4 font-mono text-xs text-ink/60"><LocalDate iso={t.updatedAt} withTime /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
