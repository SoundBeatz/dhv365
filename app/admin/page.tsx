import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/admin/login");
  }

  return (
    <main className="accessPage">
      <section className="accessCard">
        <Link href="/" className="brand" aria-label="Terug naar DHV365">
          DHV<span>365</span>
        </Link>
        <span className="eyebrow">Administrator control center</span>
        <h1>Beheeromgeving.</h1>
        <p>
          De beveiligde beheerderssessie is actief. Klantbeheer, rollen, opdrachten en
          auditfuncties worden hier modulair beschikbaar gemaakt.
        </p>
        <div className="notice">
          Beheermodules blijven afgeschermd totdat de definitieve rol- en permissiecontroles zijn
          geactiveerd.
        </div>
        <div className="accessActions">
          <Link className="button" href="/portal">
            Klantbeheer openen →
          </Link>
          <form action={signOut}>
            <button className="button ghost" type="submit">
              Veilig uitloggen
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
