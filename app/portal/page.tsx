import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer, Header } from "@/components/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Klantportaal",
  robots: { index: false, follow: false },
};

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/inloggen");

  const displayName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : user.email;

  return <><Header/><main><section className="pageHero"><div className="wrap"><span className="eyebrow">Secure customer portal</span><h1>Welkom in uw DHV365-portaal.</h1><p className="lead">Ingelogd als {displayName}. De accountlaag is actief; opdrachtbeheer, documenten en tracking worden hier modulair toegevoegd.</p></div></section><article className="wrap content"><div className="notice"><strong>Account beveiligd</strong><p>Uw sessie wordt via Supabase Auth beheerd en automatisch vernieuwd. Deel nooit wachtwoorden of herstelcodes.</p></div><h2>Portaalmodules</h2><ul><li>Opdrachten en statusoverzicht</li><li>Veilige documentuitwisseling</li><li>Chain-of-custody en afleverbevestiging</li><li>Facturen, offertes en accountinstellingen</li></ul><form action="/auth/signout" method="post"><button className="button ghost" type="submit">Veilig uitloggen</button></form></article></main><Footer/></>;
}
