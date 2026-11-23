// Config for the AI eval only (npm run eval). Makes real, paid Claude API calls.
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { include: ["scripts/eval-assessment.ts"] },
});
