import { Suspense } from "react";
import { getCurrentMember } from "@/lib/auth";
import { signOut } from "./login/actions";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="font-display text-xl text-ink">GovForge</p>
          <Suspense fallback={<span className="h-4 w-32 animate-pulse rounded bg-ink/10" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-moss">AI tool register</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Your register</h1>
        <div className="mt-10 rounded-sm border border-dashed border-ink/20 p-10 text-center text-ink/50">
          The register arrives in ticket T1.
        </div>
      </main>
    </div>
  );
}

async function UserMenu() {
  const member = await getCurrentMember();

  // Signed in, but not a member of any organization: explain instead of
  // redirecting (redirecting here caused a loop with proxy.ts).
  if (!member) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="text-risk-high">Your account isn&apos;t linked to an organization yet.</span>
        <form action={signOut}>
          <button type="submit" className="btn-ghost">Sign out</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-ink/70">
        Signed in as <span className="font-medium text-ink">{member.displayName}</span>
      </span>
      <form action={signOut}>
        <button type="submit" className="btn-ghost">Sign out</button>
      </form>
    </div>
  );
}
