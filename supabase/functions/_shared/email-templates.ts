export type EmailTemplateResult = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function layout(options: {
  title: string;
  preheader: string;
  heading: string;
  bodyHtml: string;
  bodyText: string;
  buttonLabel?: string;
  buttonUrl?: string;
}): EmailTemplateResult {
  const button = options.buttonLabel && options.buttonUrl
    ? `<a href="${escapeHtml(options.buttonUrl)}" style="display:inline-block;background:#d8ff00;color:#090b0c;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:8px;margin-top:20px">${escapeHtml(options.buttonLabel)}</a>`
    : "";

  return {
    subject: options.title,
    text: `${options.heading}\n\n${options.bodyText}${options.buttonUrl ? `\n\n${options.buttonUrl}` : ""}\n\nDHV365 · dhv365.nl`,
    html: `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(options.title)}</title></head>
<body style="margin:0;background:#0b0d0e;font-family:Arial,Helvetica,sans-serif;color:#f5f7f7">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0d0e;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#141719;border:1px solid #2a2f31;border-radius:14px;overflow:hidden">
<tr><td style="padding:28px 32px;border-bottom:1px solid #2a2f31"><div style="font-size:25px;font-weight:900;letter-spacing:-1px">DHV<span style="color:#d8ff00">365</span></div><div style="margin-top:5px;color:#9ca6aa;font-size:12px;text-transform:uppercase;letter-spacing:1.5px">Dedicated High-Value Services</div></td></tr>
<tr><td style="padding:36px 32px"><h1 style="margin:0 0 18px;font-size:27px;line-height:1.2">${escapeHtml(options.heading)}</h1><div style="font-size:16px;line-height:1.65;color:#d9dfe1">${options.bodyHtml}</div>${button}</td></tr>
<tr><td style="padding:22px 32px;background:#101213;border-top:1px solid #2a2f31;color:#8f989c;font-size:12px;line-height:1.6">Deze e-mail is automatisch verzonden door DHV365. Deel nooit wachtwoorden of toegangscodes per e-mail.<br>© ${new Date().getUTCFullYear()} DHV365 · dhv365.nl</td></tr>
</table></td></tr></table></body></html>`,
  };
}

function requiredString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Template payload field '${key}' is required`);
  }
  return value.trim();
}

function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:8px 12px;color:#9ca6aa;vertical-align:top;width:150px">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#f5f7f7">${escapeHtml(value)}</td></tr>`;
}

export function renderTemplate(templateKey: string, payload: Record<string, unknown>): EmailTemplateResult {
  switch (templateKey) {
    case "system.test":
      return layout({
        title: "DHV365 mailsysteem werkt",
        preheader: "De DHV365 e-mailinfrastructuur is actief.",
        heading: "Verbinding geslaagd",
        bodyHtml: "<p style=\"margin:0\">Deze test bevestigt dat de beveiligde DHV365 e-mailqueue en Resend-koppeling correct functioneren.</p>",
        bodyText: "Deze test bevestigt dat de beveiligde DHV365 e-mailqueue en Resend-koppeling correct functioneren.",
      });

    case "account.welcome": {
      const name = requiredString(payload, "name");
      const loginUrl = requiredString(payload, "loginUrl");
      return layout({
        title: "Welkom bij DHV365",
        preheader: "Uw beveiligde DHV365-account is gereed.",
        heading: `Welkom, ${name}`,
        bodyHtml: "<p style=\"margin:0\">Uw DHV365-account is aangemaakt. Via het beveiligde klantportaal beheert u aanvragen, documenten en de voortgang van opdrachten.</p>",
        bodyText: `Hallo ${name}, uw DHV365-account is aangemaakt. Via het beveiligde klantportaal beheert u aanvragen, documenten en de voortgang van opdrachten.`,
        buttonLabel: "Open klantportaal",
        buttonUrl: loginUrl,
      });
    }

    case "account.password_changed": {
      const name = requiredString(payload, "name");
      return layout({
        title: "Uw DHV365-wachtwoord is gewijzigd",
        preheader: "Beveiligingsmelding van DHV365.",
        heading: "Wachtwoord succesvol gewijzigd",
        bodyHtml: `<p style="margin:0">Hallo ${escapeHtml(name)}, uw wachtwoord is gewijzigd. Was u dit niet? Neem dan direct contact op met DHV365 Account Service.</p>`,
        bodyText: `Hallo ${name}, uw wachtwoord is gewijzigd. Was u dit niet? Neem dan direct contact op met DHV365 Account Service.`,
      });
    }

    case "account.login_alert": {
      const name = requiredString(payload, "name");
      const details = requiredString(payload, "details");
      return layout({
        title: "Nieuwe login op uw DHV365-account",
        preheader: "Er is ingelogd op uw DHV365-account.",
        heading: "Nieuwe login gedetecteerd",
        bodyHtml: `<p style="margin:0">Hallo ${escapeHtml(name)}, er is een nieuwe login geregistreerd.</p><p>${escapeHtml(details)}</p><p style="margin:0">Herkent u deze login niet? Wijzig dan onmiddellijk uw wachtwoord.</p>`,
        bodyText: `Hallo ${name}, er is een nieuwe login geregistreerd. ${details}. Herkent u deze login niet? Wijzig dan onmiddellijk uw wachtwoord.`,
      });
    }

    case "contact.received": {
      const name = requiredString(payload, "name");
      const reference = requiredString(payload, "reference");
      return layout({
        title: `Aanvraag ontvangen · ${reference}`,
        preheader: "DHV365 neemt uw aanvraag in behandeling.",
        heading: "Uw aanvraag is veilig ontvangen",
        bodyHtml: `<p style="margin:0">Hallo ${escapeHtml(name)}, uw aanvraag is geregistreerd onder referentie <strong>${escapeHtml(reference)}</strong>.</p><p>Een medewerker beoordeelt de haalbaarheid, risico's en benodigde beveiligingsmaatregelen. Deze ontvangstbevestiging is nog geen formele opdrachtacceptatie.</p>`,
        bodyText: `Hallo ${name}, uw aanvraag is geregistreerd onder referentie ${reference}. Een medewerker beoordeelt de haalbaarheid, risico's en benodigde beveiligingsmaatregelen. Deze ontvangstbevestiging is nog geen formele opdrachtacceptatie.`,
      });
    }

    case "contact.admin": {
      const reference = requiredString(payload, "reference");
      const company = requiredString(payload, "company");
      const name = requiredString(payload, "name");
      const email = requiredString(payload, "email");
      const phone = requiredString(payload, "phone");
      const category = requiredString(payload, "category");
      const pickupRegion = requiredString(payload, "pickupRegion");
      const deliveryRegion = requiredString(payload, "deliveryRegion");
      const desiredDate = requiredString(payload, "desiredDate");
      const urgency = requiredString(payload, "urgency");
      const summary = requiredString(payload, "summary");
      const rows = [
        detailRow("Referentie", reference),
        detailRow("Bedrijf", company),
        detailRow("Contactpersoon", name),
        detailRow("E-mail", email),
        detailRow("Telefoon", phone),
        detailRow("Categorie", category),
        detailRow("Ophaalregio", pickupRegion),
        detailRow("Afleverregio", deliveryRegion),
        detailRow("Gewenste datum", desiredDate),
        detailRow("Urgentie", urgency),
      ].join("");
      return layout({
        title: `Nieuwe DHV365-aanvraag · ${reference}`,
        preheader: `${company} heeft een nieuwe transportaanvraag ingediend.`,
        heading: "Nieuwe opdrachtvoorbeoordeling",
        bodyHtml: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #2a2f31;border-radius:8px">${rows}</table><h2 style="font-size:18px;margin:24px 0 8px">Omschrijving</h2><p style="white-space:pre-wrap;margin:0">${escapeHtml(summary)}</p>`,
        bodyText: `Nieuwe aanvraag ${reference}\nBedrijf: ${company}\nContactpersoon: ${name}\nE-mail: ${email}\nTelefoon: ${phone}\nCategorie: ${category}\nRoute: ${pickupRegion} naar ${deliveryRegion}\nGewenste datum: ${desiredDate}\nUrgentie: ${urgency}\n\nOmschrijving:\n${summary}`,
      });
    }

    default:
      throw new Error(`Unsupported email template: ${templateKey}`);
  }
}
