// Database reads/writes for tools, shared by API routes and pages.
import { createClient } from "@/lib/supabase/server";
import { listLatestAssessments } from "@/lib/assessments-db";
import { buildRegister, type RegisterRow } from "@/lib/register";
import { TOOL_COLUMNS, nameKey, rowToTool, type Tool } from "@/lib/tools";

export async function listTools(): Promise<Tool[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tools")
    .select(TOOL_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listTools: ${error.message}`);
  return (data ?? []).map(rowToTool);
}

/** T3: every tool with its current assessment, sorted High → Medium → Low → no level. */
export async function listRegister(): Promise<RegisterRow[]> {
  const [tools, latest] = await Promise.all([listTools(), listLatestAssessments()]); // in parallel
  return buildRegister(tools, latest);
}

export async function getTool(id: string): Promise<Tool | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tools")
    .select(TOOL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error && error.code !== "22P02") throw new Error(`getTool: ${error.message}`); // 22P02 = not a valid id
  return data ? rowToTool(data) : null;
}

/** Find a tool in this org with the same name, ignoring capitals, spaces and punctuation. */
export async function findToolByName(name: string, excludeId?: string): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient();
  let query = supabase.from("tools").select("id, name").eq("name_key", nameKey(name)).limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return data?.[0] ?? null;
}
