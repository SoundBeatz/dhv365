"use client";

import { FormEvent, useState } from "react";
import styles from "./transport-request-form.module.css";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string }
  | { status: "error"; message: string };

export function TransportRequestForm() {
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting" });

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/opdrachten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        reference?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.reference) {
        throw new Error(result.error || "De aanvraag kon niet worden verzonden.");
      }

      form.reset();
      setState({ status: "success", reference: result.reference });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "De aanvraag kon niet worden verzonden.",
      });
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="company">Bedrijfsnaam *</label>
          <input className={styles.input} id="company" name="company" maxLength={120} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Contactpersoon *</label>
          <input className={styles.input} id="name" name="name" maxLength={120} autoComplete="name" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Zakelijk e-mailadres *</label>
          <input className={styles.input} id="email" name="email" type="email" maxLength={254} autoComplete="email" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">Telefoonnummer</label>
          <input className={styles.input} id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category">Zendingscategorie *</label>
          <select className={styles.select} id="category" name="category" defaultValue="" required>
            <option value="" disabled>Kies een categorie</option>
            <option value="critical-documents">Critical Documents</option>
            <option value="time-critical">Time Critical</option>
            <option value="digital-data">Digital & Data</option>
            <option value="high-value">High Value</option>
            <option value="other">Anders</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="urgency">Urgentie *</label>
          <select className={styles.select} id="urgency" name="urgency" defaultValue="standard" required>
            <option value="standard">Standaard</option>
            <option value="urgent">Urgent</option>
            <option value="immediate">Direct beoordelen</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pickupRegion">Ophaalregio *</label>
          <input className={styles.input} id="pickupRegion" name="pickupRegion" maxLength={120} placeholder="Plaats en land" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="deliveryRegion">Afleverregio *</label>
          <input className={styles.input} id="deliveryRegion" name="deliveryRegion" maxLength={120} placeholder="Plaats en land" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="desiredDate">Gewenste datum</label>
          <input className={styles.input} id="desiredDate" name="desiredDate" type="date" />
        </div>
        <div className={styles.fieldFull}>
          <label className={styles.label} htmlFor="summary">Korte opdrachtomschrijving *</label>
          <textarea className={styles.textarea} id="summary" name="summary" minLength={20} maxLength={1200} required />
          <p className={styles.help}>Vermeld alleen algemene informatie. Deel hier geen wachtwoorden, toegangscodes, identiteitsdocumenten of exacte waardegegevens.</p>
        </div>
      </div>

      {state.status === "success" && (
        <div className={styles.success} role="status">
          Aanvraag veilig ontvangen. Uw referentie is <strong>{state.reference}</strong>. De bevestiging wordt per e-mail verzonden.
        </div>
      )}
      {state.status === "error" && (
        <div className={styles.error} role="alert">{state.message}</div>
      )}

      <div className={styles.actions}>
        <button className="button" type="submit" disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Veilig verwerken…" : "Aanvraag indienen"}
        </button>
        <p className={styles.status}>Geen formele opdrachtacceptatie vóór handmatige beoordeling door DHV365.</p>
      </div>
    </form>
  );
}
