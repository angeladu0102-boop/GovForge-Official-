import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · GovForge" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper md:flex">
        <div className="ledger-lines absolute inset-0 opacity-[0.07]" aria-hidden />
        <p className="relative font-mono text-xs uppercase tracking-[0.2em] text-paper/60">GovForge</p>
        <div className="relative max-w-md">
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight">
            Know every AI tool your people use, and what it&nbsp;risks.
          </h1>
          <p className="mt-6 text-paper/70">
            One register. A consistent first-pass risk assessment in minutes. Reviewed by a human, every time.
          </p>
        </div>
        <p className="relative font-mono text-xs text-paper/40">v0.1 · build to learn</p>
      </section>

      <section className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-moss md:hidden">GovForge</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Sign in</h2>
          <p className="mt-2 text-sm text-ink/60">Accounts are created by your administrator.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
