"use server";
// Server actions: functions that run on the server when a form is submitted.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Log the real reason on the server (visible in the Terminal running npm run dev),
    // but show users one generic message.
    console.error("[signIn] Supabase error:", error.status, error.code, error.message);
    // Same message for wrong email or wrong password, so attackers can't
    // learn which emails have accounts.
    return { error: "Email or password is incorrect", email };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
