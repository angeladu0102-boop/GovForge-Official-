// Config for the two-organization isolation check only (npm run check:orgs).
// Hits the real Supabase project with two test accounts; kept out of `npm test` on purpose.
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { include: ["scripts/two-org-check.ts"], testTimeout: 15_000 },
});
