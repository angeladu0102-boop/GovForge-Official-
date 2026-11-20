// Shared rules for a tool: used by both the form (browser) and the API (server),
// so the two can never disagree about what "valid" means.
import { z } from "zod";

export const DATA_TYPES = [
  "Public information only",
  "Internal business information",
  "Client confidential information",
  "Customer personal data",
  "Employee personal data",
  "Financial data",
  "Health data",
  "Source code",
] as const;

export const toolInputSchema = z.object({
  name: z.string().trim().min(1, "Tool name is required").max(120, "Keep the name under 120 characters"),
  vendor: z.string().trim().max(120, "Keep the vendor under 120 characters").optional().default(""),
  purpose: z.string().trim().min(1, "Purpose is required").max(1000, "Keep the purpose under 1,000 characters"),
  team: z.string().trim().max(120, "Keep the team under 120 characters").optional().default(""),
  dataTypes: z
    .array(z.enum(DATA_TYPES))
    .min(1, "Choose at least one data type"),
});

export type ToolInput = z.infer<typeof toolInputSchema>;
export type FieldErrors = Partial<Record<keyof ToolInput, string>>;

/** Turn zod's error into one message per field, for showing under each input. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof ToolInput;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** The shape the API sends back for one tool. */
export type Tool = {
  id: string;
  name: string;
  vendor: string | null;
  purpose: string;
  team: string | null;
  dataTypes: string[];
  ownerName: string;
  createdAt: string;
  updatedAt: string;
};

type ToolRow = {
  id: string;
  name: string;
  vendor: string | null;
  purpose: string;
  team: string | null;
  data_types: string[];
  created_at: string;
  updated_at: string;
  owner: { display_name: string } | { display_name: string }[] | null;
};

export const TOOL_COLUMNS =
  "id, name, vendor, purpose, team, data_types, created_at, updated_at, owner:members!tools_owner_id_fkey(display_name)";

/** Database rows use snake_case; the app uses camelCase. Convert in one place. */
export function rowToTool(row: ToolRow): Tool {
  const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
  return {
    id: row.id,
    name: row.name,
    vendor: row.vendor,
    purpose: row.purpose,
    team: row.team,
    dataTypes: row.data_types,
    ownerName: owner?.display_name ?? "Unknown",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
