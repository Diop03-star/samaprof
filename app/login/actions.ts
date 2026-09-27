"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function signIn(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return "Email and password are required.";

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return "Invalid email or password.";

  redirect("/dashboard");
}

export async function signUp(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    return "Email is required and password must be at least 8 characters.";
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return error.message;

  redirect("/login");
}