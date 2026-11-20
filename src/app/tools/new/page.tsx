import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ToolForm } from "@/components/tool-form";

export const metadata = { title: "Add a tool · GovForge" };

export default function NewToolPage() {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-moss">← Register</Link>
        <h1 className="mt-3 font-display text-4xl text-ink">Add an AI tool</h1>
        <p className="mt-2 text-sm text-ink/60">Fields marked * are required. Saving never depends on the AI.</p>
        <div className="mt-10"><ToolForm mode="create" /></div>
      </main>
    </div>
  );
}
