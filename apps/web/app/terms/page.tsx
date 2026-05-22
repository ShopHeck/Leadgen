import Link from "next/link";

export const metadata = {
  title: "Terms of Service — CloserFlow AI",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-ink">
        &larr; Back to home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: May 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
        <section>
          <h2 className="text-lg font-semibold text-ink">1. Acceptance of Terms</h2>
          <p>By accessing or using CloserFlow AI, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">2. Service Description</h2>
          <p>CloserFlow AI provides lead capture, AI-powered follow-up, CRM pipeline management, SMS/email automation, booking integration, and analytics tools for service businesses.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">3. Accounts &amp; Workspaces</h2>
          <p>You are responsible for maintaining the security of your account credentials. Each workspace operates independently with its own leads, messages, and billing. You must be at least 18 years old to use the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">4. Billing &amp; Cancellation</h2>
          <p>Paid plans are billed monthly via Stripe. You may cancel at any time from your billing settings. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial months.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">5. Acceptable Use</h2>
          <p>You agree not to use CloserFlow AI for spam, unsolicited messaging, or any activity that violates applicable laws including TCPA, CAN-SPAM, and GDPR. Violation may result in immediate account termination.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">6. Data Ownership</h2>
          <p>You retain ownership of all lead data, messages, and content you create within CloserFlow AI. We do not claim intellectual property rights over your content.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">7. Service Availability</h2>
          <p>We strive for 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance windows will be communicated in advance when possible.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">8. Limitation of Liability</h2>
          <p>CloserFlow AI is provided &ldquo;as is&rdquo; without warranty. Our liability is limited to the amount you paid for the service in the 12 months preceding any claim.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">9. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:legal@closer-flow.com" className="text-pine underline underline-offset-4">legal@closer-flow.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
