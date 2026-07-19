type TemplateOptions = {
  title: string;
  preheader: string;
  heading: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  footerNote?: string;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;",
  })[character] ?? character);

export function renderEmail(options: TemplateOptions) {
  const button = options.buttonLabel && options.buttonUrl
    ? `<a href="${escapeHtml(options.buttonUrl)}" style="display:inline-block;background:#d8ff00;color:#090b0c;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:8px;margin-top:20px">${escapeHtml(options.buttonLabel)}</a>`
    : "";

  return `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(options.title)}</title></head>
<body style="margin:0;background:#0b0d0e;font-family:Arial,Helvetica,sans-serif;color:#f5f7f7">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0d0e;padding:28px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#141719;border:1px solid #2a2f31;border-radius:14px;overflow:hidden">
<tr><td style="padding:28px 32px;border-bottom:1px solid #2a2f31"><div style="font-size:25px;font-weight:900;letter-spacing:-1px">DHV<span style="color:#d8ff00">365</span></div><div style="margin-top:5px;color:#9ca6aa;font-size:12px;text-transform:uppercase;letter-spacing:1.5px">Dedicated High-Value Services</div></td></tr>
<tr><td style="padding:36px 32px"><h1 style="margin:0 0 18px;font-size:27px;line-height:1.2">${escapeHtml(options.heading)}</h1><div style="font-size:16px;line-height:1.65;color:#d9dfe1">${options.body}</div>${button}</td></tr>
<tr><td style="padding:22px 32px;background:#101213;border-top:1px solid #2a2f31;color:#8f989c;font-size:12px;line-height:1.6">${escapeHtml(options.footerNote ?? "Deze e-mail is automatisch verzonden door DHV365. Reageer niet met vertrouwelijke informatie.")}<br>© ${new Date().getFullYear()} DHV365 · dhv365.nl</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const emailTemplates = {
  test(recipient: string) {
    return {
      subject: "DHV365 mailsysteem werkt",
      html: renderEmail({
        title: "DHV365 mailsysteem werkt",
        preheader: "De Resend-koppeling van DHV365 is actief.",
        heading: "Verbinding geslaagd",
        body: `<p style="margin:0">Deze test bevestigt dat DHV365 e-mail kan verzenden naar <strong>${escapeHtml(recipient)}</strong> via het geverifieerde domein.</p>`,
      }),
    };
  },
  welcome(name: string, loginUrl: string) {
    return {
      subject: "Welkom bij DHV365",
      html: renderEmail({ title: "Welkom bij DHV365", preheader: "Uw beveiligde DHV365-account is gereed.", heading: `Welkom, ${name}`, body: "<p style=\"margin:0\">Uw DHV365-account is aangemaakt. Via het beveiligde klantportaal beheert u aanvragen, documenten en de voortgang van opdrachten.</p>", buttonLabel: "Open klantportaal", buttonUrl: loginUrl }),
    };
  },
  passwordChanged(name: string) {
    return {
      subject: "Uw DHV365-wachtwoord is gewijzigd",
      html: renderEmail({ title: "Wachtwoord gewijzigd", preheader: "Beveiligingsmelding van DHV365.", heading: "Wachtwoord succesvol gewijzigd", body: `<p style="margin:0">Hallo ${escapeHtml(name)}, uw wachtwoord is zojuist gewijzigd. Was u dit niet? Neem dan direct contact op met DHV365 Account Service.</p>` }),
    };
  },
  loginAlert(name: string, details: string) {
    return {
      subject: "Nieuwe login op uw DHV365-account",
      html: renderEmail({ title: "Nieuwe login", preheader: "Er is ingelogd op uw DHV365-account.", heading: "Nieuwe login gedetecteerd", body: `<p style="margin:0">Hallo ${escapeHtml(name)}, er is een nieuwe login geregistreerd.</p><p>${escapeHtml(details)}</p><p style="margin:0">Herkent u deze login niet? Wijzig dan onmiddellijk uw wachtwoord.</p>` }),
    };
  },
  contactReceived(name: string) {
    return {
      subject: "Wij hebben uw bericht ontvangen",
      html: renderEmail({ title: "Bericht ontvangen", preheader: "DHV365 neemt uw aanvraag in behandeling.", heading: "Dank voor uw bericht", body: `<p style="margin:0">Hallo ${escapeHtml(name)}, uw bericht is veilig ontvangen. Een medewerker van DHV365 beoordeelt de aanvraag en neemt contact met u op.</p>` }),
    };
  },
};
