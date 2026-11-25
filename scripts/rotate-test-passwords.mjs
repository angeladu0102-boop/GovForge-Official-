// Rotates the passwords of the two test accounts. Run: node scripts/rotate-test-passwords.mjs
// Contains no secrets: reads them from .env.local, writes new passwords only there, never prints them.
// Temporarily needs SUPABASE_SERVICE_ROLE_KEY in .env.local (remove it afterwards).
// If interrupted, run it again: the pending password is kept in .env.local as TEST_x_NEW_PASSWORD.
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = fileURLToPath(new URL("..", import.meta.url));
const FILE = `${root}.env.local`;

// Only these fixed messages are ever printed; raw errors could contain private values.
class Stop extends Error {}
const stop = (message) => {
  throw new Stop(message);
};

const readEnv = () => parseEnv(readFileSync(FILE, "utf8"));

// Set (or, with null, remove) one line. Writes a temp file then renames it, so a crash can't truncate the file.
function setLine(name, value) {
  const text = readFileSync(FILE, "utf8");
  const pattern = new RegExp(`^${name}=`);
  const lines = text.split("\n");
  const found = lines.filter((line) => pattern.test(line)).length;
  if (found > 1) stop(`${name} appears more than once in .env.local`);
  let next;
  if (value === null) next = lines.filter((line) => !pattern.test(line)).join("\n");
  else if (found) next = lines.map((line) => (pattern.test(line) ? `${name}=${value}` : line)).join("\n");
  else next = `${text}${text.endsWith("\n") ? "" : "\n"}${name}=${value}\n`;
  writeFileSync(`${FILE}.tmp`, next, { mode: 0o600 });
  renameSync(`${FILE}.tmp`, FILE);
}

function newPassword() {
  for (;;) {
    const p = randomBytes(24).toString("base64url"); // 32 characters, 192 random bits
    if (/[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[-_]/.test(p)) return p;
  }
}

async function main() {
  for (const path of [".env.local", ".env.local.tmp"]) {
    try {
      execFileSync("git", ["check-ignore", "-q", path], { cwd: root });
    } catch {
      stop(`${path} is not ignored by Git`);
    }
  }
  const env = readEnv();
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
    "TEST_A_EMAIL", "TEST_A_PASSWORD", "TEST_B_EMAIL", "TEST_B_PASSWORD"];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) stop(`Missing in .env.local: ${missing.join(", ")}`);

  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, options);

  // Returns the session, or null only when Supabase explicitly says the credentials are wrong.
  async function signIn(label, password) {
    const db = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
    const { data, error } = await db.auth.signInWithPassword({ email: env[`TEST_${label}_EMAIL`], password });
    if (error?.code === "invalid_credentials") return null;
    if (error || !data.session) stop(`${label}: sign-in check failed (network, rate limit or settings)`);
    return data.session;
  }

  // Find and check both accounts before changing either one.
  const accounts = [];
  for (const label of ["A", "B"]) {
    const old = env[`TEST_${label}_PASSWORD`];
    const pending = env[`TEST_${label}_NEW_PASSWORD`];
    const oldSession = await signIn(label, old);
    // Resumed run: Supabase already has the pending password, so only the .env.local cleanup is left.
    const resumed = !oldSession && pending ? await signIn(label, pending) : null;
    const session = oldSession ?? resumed;
    if (!session) stop(`${label}: current password in .env.local does not work; nothing changed for this run`);
    const { data, error } = await admin.auth.admin.getUserById(session.user.id);
    if (error || data.user?.id !== session.user.id) stop("Service role key was rejected; nothing changed for this run");
    accounts.push({ label, old, pending, session, done: Boolean(resumed) });
  }
  if (accounts[0].session.user.id === accounts[1].session.user.id) stop("A and B are the same account");

  for (const { label, old, pending, session, done } of accounts) {
    const next = pending || newPassword();
    setLine(`TEST_${label}_NEW_PASSWORD`, next); // saved before Supabase changes, so it can't be lost
    // Sign out every session first: a password change can end the session this token belongs to.
    const { error: signOutError } = await admin.auth.admin.signOut(session.access_token, "global");
    if (signOutError) stop(`${label}: could not sign out sessions (${signOutError.code ?? signOutError.status}); run again`);
    if (!done) {
      const { error } = await admin.auth.admin.updateUserById(session.user.id, { password: next });
      if (error) stop(`${label}: Supabase refused the update (${error.code ?? error.status}); run again to retry`);
    }
    const fresh = await signIn(label, next);
    if (fresh?.user.id !== session.user.id) stop(`${label}: new password did not verify; run again`);
    if (old !== next && (await signIn(label, old))) stop(`${label}: old password still works`);
    setLine(`TEST_${label}_PASSWORD`, next);
    setLine(`TEST_${label}_NEW_PASSWORD`, null);
    console.log(`${label}: updated, sessions signed out, new works, old rejected`);
  }
}

main().catch((error) => {
  console.error(error instanceof Stop ? `STOPPED: ${error.message}` : "STOPPED: unexpected error (details hidden)");
  process.exitCode = 1;
});
