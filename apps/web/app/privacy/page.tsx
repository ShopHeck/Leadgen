import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — CloserFlow AI",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-ink">
        &larr; Back to home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: May 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
        <section>
          <h2 className="text-lg font-semibold text-ink">1. Information We Collect</h2>
          <p>We collect information you provide when creating an account (name, email, password), workspace data, lead information submitted through forms, and usage analytics to improve our service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">2. How We Use Your Information</h2>
          <p>We use your information to provide the CloserFlow AI platform services including lead capture, scoring, messaging, booking, and analytics. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">3. Data Storage &amp; Security</h2>
          <p>Data is stored in encrypted PostgreSQL databases hosted in the United States. We use industry-standard encryption for data in transit (TLS) and at rest. Access is restricted to authorized personnel only.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">4. Third-Party Services</h2>
          <p>We integrate with Twilio (SMS), Resend (email), Stripe (payments), Calendly (bookings), and OpenAI (AI scoring). Each provider has their own privacy policy governing data they process on our behalf.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">5. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. Workspace admins can export or delete lead data from within the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">6. SMS/TCPA Compliance</h2>
          <p>By using CloserFlow AI to send SMS messages, you represent that you have obtained proper consent from recipients in accordance with the Telephone Consumer Protection Act (TCPA) and applicable regulations.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">7. Contact</h2>
          <p>For privacy inquiries, contact us at <a href="mailto:privacy@closer-flow.com" className="text-pine underline underline-offset-4">privacy@closer-flow.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
