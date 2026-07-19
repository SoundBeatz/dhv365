import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Operations Portal", robots: { index: false, follow: false } };
export default async function PortalPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { data: profile } = userId ? await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle() : { data: null };
  return <main className="portalContent"><span className="eyebrow">Operational control</span><h1>Goedendag{profile?.display_name ? `, ${profile.display_name}` : ""}.</h1><p className="lead">De beveiligde SaaS-fundering is actief. Operationele modules worden gecontroleerd vrijgegeven na toepassing van de database-migraties.</p><div className="portalCards"><article><span>OPEN</span><strong>—</strong><p>Actieve opdrachten</p></article><article><span>TRANSIT</span><strong>—</strong><p>Zendingen onderweg</p></article><article><span>REVIEW</span><strong>—</strong><p>Acceptatie vereist</p></article></div><section className="portalNotice"><h2>Foundation status</h2><p>Authenticatie, tenant-isolatie en de operationele database zijn voorbereid. Er worden nog geen echte opdrachten of documenten verwerkt totdat alle RLS-controles en beheerrollen zijn geverifieerd.</p></section></main>;
}
