"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/portal");
  const safeNext = requestedNext.startsWith("/portal") ? requestedNext : "/portal";
  if (!email || password.length < 8) redirect("/login?error=Controleer+uw+inloggegevens");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=Inloggen+mislukt");
  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?signedout=1");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/forgot-password?error=Vul+een+geldig+e-mailadres+in");

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dhv365.nl";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
  });

  // Always return the same response to prevent account enumeration.
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 14) redirect("/update-password?error=Gebruik+minimaal+14+tekens");
  if (password !== confirmation) redirect("/update-password?error=Wachtwoorden+komen+niet+overeen");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/update-password?error=De+herstelsessie+is+ongeldig+of+verlopen");

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?passwordupdated=1");
}
