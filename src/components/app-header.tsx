import Link from "next/link";
import { Suspense } from "react";
import { getCurrentMember } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export function AppHeader() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl text-ink">GovForge</Link>
        <Suspense fallback={<span className="h-4 w-32 animate-pulse rounded bg-ink/10" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function UserMenu() {
  const member = await getCurrentMember();

  return (
    <div className="flex items-center gap-4 text-sm">
      {member ? (
        <span className="text-ink/70">
          Signed in as <span className="font-medium text-ink">{member.displayName}</span>
        </span>
      ) : (
        // Signed in but not in an organization: explain instead of redirecting
        // (redirecting caused a loop with proxy.ts in T0).
        <span className="text-risk-high">Your account isn&apos;t linked to an organization yet.</span>
      )}
      <form action={signOut}>
        <button type="submit" className="btn-ghost">Sign out</button>
      </form>
    </div>
  );
}
