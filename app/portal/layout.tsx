import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  return <div className="portalShell"><aside className="portalSidebar"><Link href="/portal" className="brand">DHV<span>365</span></Link><nav aria-label="Portaalnavigatie"><Link href="/portal">Overzicht</Link><span aria-disabled="true">Opdrachten</span><span aria-disabled="true">Zendingen</span><span aria-disabled="true">Documenten</span><span aria-disabled="true">Organisatie</span></nav><form action={signOut}><button type="submit" className="portalSignout">Veilig uitloggen</button></form></aside><div className="portalMain"><header className="portalTopbar"><span>SECURE SESSION</span><span className="statusPill">Foundation</span></header>{children}</div></div>;
}
