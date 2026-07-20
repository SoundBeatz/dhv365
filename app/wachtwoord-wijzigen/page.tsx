import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer, Header } from "@/components/site";
import { PasswordUpdateForm } from "@/components/password-update-form";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/auth-form.module.css";

export const metadata: Metadata = {
  title: "Wachtwoord wijzigen",
  robots: { index: false, follow: false },
};

export default async function PasswordUpdatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/inloggen");

  return <><Header/><main><div className="wrap"><section className={styles.shell}><PasswordUpdateForm /></section></div></main><Footer/></>;
}
