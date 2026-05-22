import Link from "next/link";
import { MobileNav } from "../components/mobile-nav";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine text-white text-sm font-bold">
            CF
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink">CloserFlow</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-slate-600 transition hover:text-ink">Features</a>
          <a href="#pricing" className="text-sm text-slate-600 transition hover:text-ink">Pricing</a>
          <a href="#how-it-works" className="text-sm text-slate-600 transition hover:text-ink">How it works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-slate-700 transition hover:text-ink sm:block">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-full bg-pine px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#163d32] sm:block"
          >
            Start free trial
          </Link>
          <MobileNav />
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pine/20 bg-pine/5 px-4 py-2 text-sm font-medium text-pine">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            AI that responds to leads in under 60 seconds
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Turn every lead into a{" "}
            <span className="bg-gradient-to-r from-pine to-emerald-600 bg-clip-text text-transparent">
              booked appointment
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            CloserFlow captures leads, qualifies them with AI, sends instant personalized follow-ups, and books appointments — all before your competitors even check their inbox.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-full bg-pine px-8 py-4 text-base font-semibold text-white shadow-lg shadow-pine/25 transition hover:bg-[#163d32] hover:shadow-xl hover:shadow-pine/30 sm:w-auto"
            >
              Start your 14-day free trial
            </Link>
            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-8 py-4 text-base font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white sm:w-auto"
            >
              See how it works
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-500">No credit card required. Cancel anytime.</p>
        </div>

        {/* Social proof bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-slate-200 pt-8">
          <p className="text-sm font-medium text-slate-500">Trusted by service businesses across</p>
          <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-700">
            <span className="rounded-full bg-mist px-4 py-2">Med Spas</span>
            <span className="rounded-full bg-mist px-4 py-2">Solar</span>
            <span className="rounded-full bg-mist px-4 py-2">Roofing</span>
            <span className="rounded-full bg-mist px-4 py-2">Law Firms</span>
            <span className="rounded-full bg-mist px-4 py-2">Agencies</span>
          </div>
        </div>
      </section>

      {/* Speed-to-lead stat */}
      <section className="border-y border-slate-200 bg-white/60 py-16 backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-3 lg:px-8">
          {[
            { stat: "<60s", label: "Average response time", detail: "AI responds before they close the tab" },
            { stat: "3.2x", label: "More bookings", detail: "vs. businesses with manual follow-up" },
            { stat: "78%", label: "Show rate", detail: "Automated reminders keep appointments" },
          ].map((item) => (
            <div key={item.stat} className="text-center">
              <p className="text-4xl font-bold text-pine sm:text-5xl">{item.stat}</p>
              <p className="mt-2 text-base font-semibold text-ink">{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">Everything you need</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            One platform. Every step of the lead lifecycle.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Stop juggling 6 different tools. CloserFlow handles capture to close in one place.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
              title: "AI Instant Follow-Up",
              description: "Personalized SMS or email fires within seconds of form submission. GPT-powered, context-aware, feels human.",
            },
            {
              icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
              title: "Lead Scoring & Qualification",
              description: "Automatically score leads on budget, urgency, authority, and engagement. Know who's hot before you pick up the phone.",
            },
            {
              icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
              title: "CRM Pipeline",
              description: "Visual Kanban board tracks every lead from New to Won. Drag-and-drop with full stage history and audit trail.",
            },
            {
              icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
              title: "SMS & Email Automation",
              description: "Event-triggered sequences that nurture, remind, and re-engage. Template variables personalize every message automatically.",
            },
            {
              icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
              title: "Booking & Calendly Sync",
              description: "Leads book directly. Calendly webhooks auto-create appointments, move pipeline stages, and fire confirmation sequences.",
            },
            {
              icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
              title: "Attribution Dashboard",
              description: "See which sources, campaigns, and channels actually drive revenue. Booking rates, show rates, and ROI per dollar spent.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 transition hover:border-pine/30 hover:shadow-lg hover:shadow-pine/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine/10 text-pine transition group-hover:bg-pine group-hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-slate-200 bg-white/60 py-24 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-pine">Simple setup</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Live in under 10 minutes
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Sign up", desc: "Create your workspace and connect your domain" },
              { step: "2", title: "Add your form", desc: "Embed our capture form or connect your existing one" },
              { step: "3", title: "Configure AI", desc: "Set your follow-up tone, booking link, and scoring rules" },
              { step: "4", title: "Watch leads flow", desc: "AI responds instantly. You close the deals." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pine text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">Simple pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            One price. Everything included.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            No hidden fees. No per-contact charges. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
          {[
            {
              name: "Starter",
              price: "$297",
              description: "For solo operators ready to automate lead follow-up",
              features: [
                "1 workspace",
                "Unlimited leads",
                "AI instant follow-up",
                "Lead scoring",
                "CRM pipeline",
                "200 SMS / 500 emails per day",
                "Calendly integration",
                "Analytics dashboard",
              ],
              cta: "Start free trial",
              highlighted: false,
            },
            {
              name: "Growth",
              price: "$497",
              description: "For growing teams that need more volume and workspaces",
              features: [
                "3 workspaces",
                "Unlimited leads",
                "AI instant follow-up",
                "Lead scoring + AI summaries",
                "CRM pipeline",
                "500 SMS / 2,000 emails per day",
                "Calendly integration",
                "Attribution dashboard",
                "API access",
                "Priority support",
              ],
              cta: "Start free trial",
              highlighted: true,
            },
            {
              name: "Scale",
              price: "$997",
              description: "For agencies managing multiple client accounts",
              features: [
                "50 workspaces (agency mode)",
                "Unlimited leads",
                "AI instant follow-up",
                "Lead scoring + AI summaries",
                "CRM pipeline",
                "1,000 SMS / 5,000 emails per day",
                "White-label branding",
                "Custom domain",
                "Full API + webhooks",
                "Dedicated support",
              ],
              cta: "Start free trial",
              highlighted: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[28px] border p-8 ${
                plan.highlighted
                  ? "border-pine bg-pine/[0.02] shadow-xl shadow-pine/10 ring-1 ring-pine/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-pine px-4 py-1.5 text-xs font-semibold text-white">
                  Most popular
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-ink">{plan.price}</span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-pine text-white shadow-lg shadow-pine/25 hover:bg-[#163d32]"
                    : "border border-slate-200 text-slate-700 hover:border-pine hover:text-pine"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          All plans include a 14-day free trial. Usage-based SMS & AI credits apply after plan limits.
        </p>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-200 bg-gradient-to-b from-mist to-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Your competitors are still checking email.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            The average business takes 47 hours to respond to a lead. CloserFlow responds in under 60 seconds. Which one would you book with?
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-full bg-pine px-8 py-4 text-base font-semibold text-white shadow-lg shadow-pine/25 transition hover:bg-[#163d32] hover:shadow-xl sm:w-auto"
            >
              Start your free trial now
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-pine hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine text-xs font-bold text-white">
              CF
            </div>
            <span className="text-sm font-semibold text-ink">CloserFlow AI</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CloserFlow. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <a href="mailto:hello@closer-flow.com" className="hover:text-ink">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
