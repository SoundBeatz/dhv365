import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Wachtwoord herstellen",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="authSingle">
      <ForgotPasswordForm />
    </main>
  );
}
