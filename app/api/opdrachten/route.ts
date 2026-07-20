import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { queueEmail } from "@/lib/email/queue";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CATEGORIES = new Set([
  "critical-documents",
  "time-critical",
  "digital-data",
  "high-value",
  "other",
]);
const ALLOWED_URGENCY = new Set(["standard", "urgent", "immediate"]);

type IntakeBody = {
  company?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  category?: unknown;
  pickupRegion?: unknown;
  deliveryRegion?: unknown;
  desiredDate?: unknown;
  urgency?: unknown;
  summary?: unknown;
  website?: unknown;
};

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function publicOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "dhv365.nl" || host === "www.dhv365.nl" || host === "localhost";
  } catch {
    return false;
  }
}

function referenceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `DHV-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!publicOriginAllowed(request)) {
    return NextResponse.json({ ok: false, error: "Request origin rejected" }, { status: 403 });
  }

  let body: IntakeBody;
  try {
    body = (await request.json()) as IntakeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot for automated submissions.
  if (cleanString(body.website, 200)) {
    return NextResponse.json({ ok: true, reference: "received" });
  }

  const company = cleanString(body.company, 120);
  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 254).toLowerCase();
  const phone = cleanString(body.phone, 40);
  const category = cleanString(body.category, 50);
  const pickupRegion = cleanString(body.pickupRegion, 120);
  const deliveryRegion = cleanString(body.deliveryRegion, 120);
  const desiredDate = cleanString(body.desiredDate, 20);
  const urgency = cleanString(body.urgency, 30);
  const summary = cleanString(body.summary, 1200);

  if (
    !company ||
    !name ||
    !EMAIL_PATTERN.test(email) ||
    !ALLOWED_CATEGORIES.has(category) ||
    !pickupRegion ||
    !deliveryRegion ||
    !ALLOWED_URGENCY.has(urgency) ||
    summary.length < 20
  ) {
    return NextResponse.json(
      { ok: false, error: "Controleer de verplichte velden" },
      { status: 400 },
    );
  }

  const reference = referenceNumber();
  const adminEmail = process.env.EMAIL_ADMIN?.trim() || "account@dhv365.nl";

  try {
    const customerJob = queueEmail({
      to: email,
      recipientName: name,
      templateKey: "contact.received",
      payload: { name, reference },
      priority: urgency === "immediate" ? 10 : urgency === "urgent" ? 25 : 100,
    });

    const adminJob = queueEmail({
      to: adminEmail,
      recipientName: "DHV365 Operations",
      templateKey: "contact.admin",
      payload: {
        reference,
        company,
        name,
        email,
        phone: phone || "Niet opgegeven",
        category,
        pickupRegion,
        deliveryRegion,
        desiredDate: desiredDate || "Nog af te stemmen",
        urgency,
        summary,
      },
      priority: urgency === "immediate" ? 1 : urgency === "urgent" ? 10 : 50,
    });

    await Promise.all([customerJob, adminJob]);
  } catch (error) {
    console.error("DHV365 transport request email enqueue failed", {
      reference,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { ok: false, error: "De aanvraag kon niet veilig worden verwerkt" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, reference }, { status: 201 });
}
