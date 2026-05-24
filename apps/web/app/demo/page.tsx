import Link from "next/link";

export const metadata = {
  title: "CloserFlow AI — Product Demo & Setup Guide",
  description: "Complete walkthrough showing how to set up CloserFlow AI for your business, from account creation to closed deals.",
};

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
      {n}
    </div>
  );
}

function SectionDivider() {
  return <div className="my-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />;
}

export default function ProductDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        {/* Hero */}
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Product Demo</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight lg:text-5xl">
            CloserFlow AI — Complete Setup &amp; Workflow Guide
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            A step-by-step walkthrough showing how to set up CloserFlow for your business,
            capture leads, automate follow-ups, manage your pipeline, and close more deals.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Start Free
            </Link>
            <a
              href="#requirements"
              className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              View Requirements
            </a>
          </div>
        </header>


        <SectionDivider />

        {/* Table of Contents */}
        <nav className="rounded-[28px] border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">What This Demo Covers</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              { href: "#requirements", label: "1. Requirements & Prerequisites" },
              { href: "#account-setup", label: "2. Account Creation & Workspace Setup" },
              { href: "#lead-capture", label: "3. Lead Capture Configuration" },
              { href: "#crm-pipeline", label: "4. CRM Pipeline Management" },
              { href: "#automations", label: "5. Automation Workflows" },
              { href: "#messaging", label: "6. SMS & Email Messaging" },
              { href: "#bookings", label: "7. Booking & Calendly Integration" },
              { href: "#ai-scoring", label: "8. AI Lead Scoring" },
              { href: "#analytics", label: "9. Analytics & Attribution" },
              { href: "#billing", label: "10. Billing & Plans" },
              { href: "#full-workflow", label: "11. Full Workflow Demonstration" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>


        <SectionDivider />

        {/* Section 1: Requirements */}
        <section id="requirements" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={1} />
            <div>
              <h2 className="text-2xl font-bold">Requirements &amp; Prerequisites</h2>
              <p className="mt-2 text-sm text-slate-400">What you need before getting started</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-emerald-300">Required Third-Party Accounts</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div><strong className="text-white">Twilio</strong> — SMS messaging. You need an Account SID, Auth Token, and a phone number. <span className="text-slate-500">Free trial available with $15 credit.</span></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div><strong className="text-white">Resend</strong> — Email delivery. You need an API key and a verified sender domain. <span className="text-slate-500">Free tier: 100 emails/day.</span></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div><strong className="text-white">OpenAI</strong> — AI lead scoring &amp; instant follow-up generation. API key required. <span className="text-slate-500">Uses GPT-4o-mini ($0.15/1M input tokens).</span></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div><strong className="text-white">Stripe</strong> — Subscription billing (if you want paid plans). Secret key + webhook secret + price IDs for each plan tier.</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-amber-300">Optional Services</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <div><strong className="text-white">Calendly</strong> — Booking automation. Requires a webhook signing key from the Calendly developer portal.</div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <div><strong className="text-white">Upstash Redis + QStash</strong> — Production rate limiting and automation retry scheduling. <span className="text-slate-500">Free tier: 10K requests/day + 500 messages/day.</span></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <div><strong className="text-white">PostHog</strong> — Product analytics tracking (lead events, conversions, user behavior).</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-blue-300">Infrastructure</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                  <div><strong className="text-white">Vercel</strong> — Hosting, serverless functions, and cron jobs.</div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                  <div><strong className="text-white">Neon PostgreSQL</strong> — Serverless database with connection pooling.</div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 2: Account Setup */}
        <section id="account-setup" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={2} />
            <div>
              <h2 className="text-2xl font-bold">Account Creation &amp; Workspace Setup</h2>
              <p className="mt-2 text-sm text-slate-400">Get your team up and running in under 2 minutes</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Step-by-Step</h3>
              <ol className="mt-4 space-y-4 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="shrink-0 font-mono text-indigo-400">01.</span>
                  <div><strong className="text-white">Sign up</strong> — Navigate to <code className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-200">/signup</code> and create an account with your email and password (min 8 characters).</div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-mono text-indigo-400">02.</span>
                  <div><strong className="text-white">Create a workspace</strong> — After login, you&apos;ll land on the workspace selector. Enter a name for your workspace (e.g., &quot;My Agency&quot; or &quot;Solar Leads&quot;). A URL slug is auto-generated.</div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-mono text-indigo-400">03.</span>
                  <div><strong className="text-white">Pipeline auto-created</strong> — Your workspace instantly gets a default &quot;Lifecycle&quot; CRM pipeline with 9 stages: New → Attempting Contact → Qualified → Booked → Confirmed → Showed → Won → Lost → Nurture.</div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-mono text-indigo-400">04.</span>
                  <div><strong className="text-white">You&apos;re the admin</strong> — As the workspace creator, you have full ADMIN access. You can invite team members who get MEMBER access (view-only for sensitive areas like Settings, Billing, and Automations).</div>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
              <p className="text-sm font-medium text-indigo-300">Agency Mode (Optional)</p>
              <p className="mt-2 text-sm text-slate-300">
                If you manage multiple clients, create an <strong>Organization</strong> from the Agency panel. This lets you create unlimited sub-workspaces under one umbrella, each with isolated leads, pipelines, and billing. Perfect for marketing agencies managing multiple client accounts.
              </p>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 3: Lead Capture */}
        <section id="lead-capture" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={3} />
            <div>
              <h2 className="text-2xl font-bold">Lead Capture Configuration</h2>
              <p className="mt-2 text-sm text-slate-400">Three ways to funnel leads into your workspace</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-emerald-300">Method 1: Embed Form on Your Website</h3>
              <p className="mt-2 text-sm text-slate-300">
                Go to <strong>Settings → Embed Form</strong> in your workspace. Choose from 3 embed styles:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• <strong className="text-slate-200">HTML Form</strong> — Simple form that posts directly. Best for static sites.</li>
                <li>• <strong className="text-slate-200">Popup Modal</strong> — Button trigger with overlay form. Great for CTAs.</li>
                <li>• <strong className="text-slate-200">JavaScript (AJAX)</strong> — No page redirect, shows success inline. Best UX.</li>
              </ul>
              <p className="mt-4 text-sm text-slate-400">
                All embed types automatically capture UTM parameters from the page URL, so your attribution data flows in automatically.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-emerald-300">Method 2: Direct API Integration</h3>
              <p className="mt-2 text-sm text-slate-300">
                Post leads programmatically from any source — your own backend, Zapier, Make.com, or custom integrations:
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">{`POST /api/public/form-submit
Content-Type: application/json

{
  "workspaceSlug": "your-workspace",
  "name": "Sarah Johnson",
  "email": "sarah@example.com",
  "phone": "+15551234567",
  "utm": {
    "source": "facebook",
    "medium": "paid-social",
    "campaign": "summer-promo"
  },
  "answers": {
    "budget": "$5,000-$10,000",
    "urgency": "this month",
    "decisionMaker": "yes"
  }
}`}</pre>
              <p className="mt-3 text-xs text-slate-500">
                Response includes: leadId, scoring result, and AI follow-up status (if enabled).
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-emerald-300">Method 3: Calendly Webhook</h3>
              <p className="mt-2 text-sm text-slate-300">
                Connect your Calendly scheduling link so that every booking automatically creates or updates a lead in your workspace. The webhook URL is in <strong>Settings → Calendly Webhook</strong>.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                When someone books: lead is matched by email → appointment created → lead auto-advances to &quot;Booked&quot; stage in CRM.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <p className="text-sm font-medium text-amber-300">What Happens When a Lead Arrives</p>
              <ol className="mt-3 space-y-1 text-sm text-slate-300">
                <li>1. Lead is created (or merged if email/phone already exists)</li>
                <li>2. Placed in &quot;New&quot; stage of your CRM pipeline</li>
                <li>3. Automatically scored using the 5-factor scoring model</li>
                <li>4. If AI follow-up is enabled → personalized SMS/email sent within seconds</li>
                <li>5. Automation events fire (triggering any matching workflows)</li>
              </ol>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 4: CRM Pipeline */}
        <section id="crm-pipeline" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={4} />
            <div>
              <h2 className="text-2xl font-bold">CRM Pipeline Management</h2>
              <p className="mt-2 text-sm text-slate-400">Visual Kanban board for your sales process</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Default Pipeline Stages</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {["New", "Attempting Contact", "Qualified", "Booked", "Confirmed", "Showed", "Won", "Lost", "Nurture"].map((stage) => (
                  <span key={stage} className="rounded-full border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200">
                    {stage}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-400">
                Leads flow left to right through these stages. Every move is persisted immediately and recorded in the lead&apos;s stage history for full audit trail.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">How It Works</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Drag &amp; drop</strong> leads between columns to update their stage</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Auto-advancement</strong> — bookings move leads to &quot;Booked&quot;, completed appointments move to &quot;Showed&quot;</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Click any lead</strong> to open their full profile: send messages, book appointments, add notes, view AI scoring, log revenue</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Stage history</strong> — every change is logged with timestamp, previous stage, and who made the change</div>
                </li>
              </ul>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 5: Automations */}
        <section id="automations" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={5} />
            <div>
              <h2 className="text-2xl font-bold">Automation Workflows</h2>
              <p className="mt-2 text-sm text-slate-400">Event-driven actions that run on autopilot</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Trigger → Condition → Action</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-indigo-400">Triggers</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    <li>• lead.created</li>
                    <li>• lead.scored</li>
                    <li>• booking.created</li>
                    <li>• message.sent</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-amber-400">Conditions</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    <li>• Minimum score</li>
                    <li>• Score band (HOT/WARM)</li>
                    <li>• Source (facebook, google)</li>
                    <li>• Channel (SMS/EMAIL)</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-emerald-400">Actions</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    <li>• Send SMS</li>
                    <li>• Send Email</li>
                    <li>• Add Note</li>
                    <li>• Move Pipeline Stage</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Example: Hot Lead Instant Follow-Up</h3>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">{`Automation: "Hot Lead SMS Follow-Up"
Trigger:    lead.scored
Conditions: scoreBand = HOT, source = facebook
Action:     send_sms

Message template:
"Hi {{leadName}}! Thanks for reaching out. Based on what 
you shared, we'd be a great fit. Can we schedule a quick 
call today? Reply with a time that works."`}</pre>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Retry Logic &amp; Reliability</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>• Failed actions automatically retry with exponential backoff (5min, 10min, 15min...)</li>
                <li>• Up to 5 retry attempts per automation run</li>
                <li>• QStash handles precise retry scheduling (or daily cron as fallback)</li>
                <li>• Full run history with status: Pending → Running → Succeeded/Failed</li>
              </ul>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 6: Messaging */}
        <section id="messaging" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={6} />
            <div>
              <h2 className="text-2xl font-bold">SMS &amp; Email Messaging</h2>
              <p className="mt-2 text-sm text-slate-400">Reach leads through their preferred channel</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Channels</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-sm font-medium text-white">SMS via Twilio</p>
                  <p className="mt-2 text-xs text-slate-400">Send text messages to any phone number. Lead must have a phone on file. Delivery status tracked in real-time.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-sm font-medium text-white">Email via Resend</p>
                  <p className="mt-2 text-xs text-slate-400">Send emails with subject + body. Lead must have an email on file. Supports plain text with your custom sender domain.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Daily Messaging Limits (by Plan)</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="pb-3 pr-6 font-medium">Plan</th>
                      <th className="pb-3 pr-6 font-medium">SMS / day</th>
                      <th className="pb-3 font-medium">Email / day</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    <tr className="border-b border-white/5"><td className="py-2.5 pr-6">Free</td><td className="py-2.5 pr-6">50</td><td className="py-2.5">100</td></tr>
                    <tr className="border-b border-white/5"><td className="py-2.5 pr-6">Starter ($297/mo)</td><td className="py-2.5 pr-6">200</td><td className="py-2.5">500</td></tr>
                    <tr className="border-b border-white/5"><td className="py-2.5 pr-6">Growth ($497/mo)</td><td className="py-2.5 pr-6">500</td><td className="py-2.5">2,000</td></tr>
                    <tr><td className="py-2.5 pr-6">Scale ($997/mo)</td><td className="py-2.5 pr-6">1,000</td><td className="py-2.5">5,000</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
              <p className="text-sm font-medium text-indigo-300">AI Instant Follow-Up</p>
              <p className="mt-2 text-sm text-slate-300">
                When enabled, every new lead receives a personalized first-touch message within seconds. OpenAI generates the message based on the lead&apos;s form answers, score band, and source. SMS is preferred (fastest speed-to-lead), with email as fallback. If OpenAI is unavailable, score-band-specific templates are used instead.
              </p>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 7: Bookings */}
        <section id="bookings" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={7} />
            <div>
              <h2 className="text-2xl font-bold">Booking &amp; Calendly Integration</h2>
              <p className="mt-2 text-sm text-slate-400">Appointment scheduling that moves your pipeline forward</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Two Ways to Create Bookings</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div className="flex gap-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded bg-emerald-500/20 text-center text-xs leading-5 text-emerald-300">A</span>
                  <div><strong className="text-white">Calendly Webhook (Automatic)</strong> — Connect your Calendly link. When someone books, the appointment is auto-created, matched to the lead by email, and the lead moves to &quot;Booked&quot; stage.</div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded bg-emerald-500/20 text-center text-xs leading-5 text-emerald-300">B</span>
                  <div><strong className="text-white">Manual Booking (from Lead Profile)</strong> — Open any lead&apos;s detail page and use the booking form to schedule. Perfect for phone-booked or walk-in appointments.</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Calendly Setup</h3>
              <ol className="mt-4 space-y-2 text-sm text-slate-300">
                <li>1. Go to <strong>Settings</strong> in your workspace</li>
                <li>2. Copy the Calendly Webhook URL shown</li>
                <li>3. In Calendly Developer Portal → Webhook Subscriptions, paste the URL</li>
                <li>4. Subscribe to <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">invitee.created</code> and <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">invitee.canceled</code> events</li>
                <li>5. Copy your signing key to your environment variables</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Auto Pipeline Advancement</h3>
              <p className="mt-2 text-sm text-slate-300">
                When a booking is created, the lead automatically advances:
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">Scheduled → Booked</span>
                <span className="text-slate-600">|</span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">Confirmed → Confirmed</span>
                <span className="text-slate-600">|</span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">Completed → Showed</span>
              </div>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 8: AI Scoring */}
        <section id="ai-scoring" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={8} />
            <div>
              <h2 className="text-2xl font-bold">AI Lead Scoring</h2>
              <p className="mt-2 text-sm text-slate-400">Prioritize who to call first with data-driven scoring</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">5-Factor Scoring Model (0-100 points)</h3>
              <div className="mt-4 space-y-3">
                {[
                  { factor: "Budget", max: 25, desc: "Signals like \"$5K-10K\", \"premium\", or \"enterprise\" from form answers" },
                  { factor: "Urgency", max: 20, desc: "\"Today\", \"ASAP\", \"this week\" = high urgency; \"next quarter\" = low" },
                  { factor: "Decision-Maker", max: 20, desc: "\"Owner\", \"CEO\", \"founder\" = decision maker; \"assistant\" = influencer" },
                  { factor: "Location", max: 10, desc: "\"Local\", \"same city\", \"within service area\" = location fit" },
                  { factor: "Engagement", max: 20, desc: "Phone + email captured, repeat submissions, notes, multi-field forms" },
                ].map((item) => (
                  <div key={item.factor} className="flex items-start gap-4 rounded-xl border border-white/5 bg-slate-900/30 p-3">
                    <div className="shrink-0 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-300">{item.max}pts</div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.factor}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Score Bands</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
                  <p className="text-2xl font-bold text-rose-300">HOT</p>
                  <p className="mt-1 text-xs text-slate-400">Score 80-100</p>
                  <p className="mt-2 text-xs text-slate-300">Call immediately</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-300">WARM</p>
                  <p className="mt-1 text-xs text-slate-400">Score 60-79</p>
                  <p className="mt-2 text-xs text-slate-300">Follow up within hours</p>
                </div>
                <div className="rounded-xl border border-slate-500/20 bg-slate-500/5 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-300">NURTURE</p>
                  <p className="mt-1 text-xs text-slate-400">Score 0-59</p>
                  <p className="mt-2 text-xs text-slate-300">Automated nurture sequence</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
              <p className="text-sm font-medium text-indigo-300">AI-Enhanced Insights (OpenAI)</p>
              <p className="mt-2 text-sm text-slate-300">
                When you click &quot;Get AI Score&quot; on a lead profile, GPT-4o-mini analyzes all available data and returns:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-400">
                <li>• Summary bullets explaining the score</li>
                <li>• Identified pain point</li>
                <li>• Close likelihood (high/medium/low)</li>
                <li>• Recommended next action</li>
              </ul>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 9: Analytics */}
        <section id="analytics" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={9} />
            <div>
              <h2 className="text-2xl font-bold">Analytics &amp; Attribution</h2>
              <p className="mt-2 text-sm text-slate-400">Know exactly which channels drive revenue</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Dashboard Metrics</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {[
                  "Total Leads", "Booking Rate", "Show Rate", "Close Rate",
                  "Total Revenue", "Revenue / Lead", "Avg Lead Score", "Speed to Contact",
                ].map((metric) => (
                  <div key={metric} className="rounded-lg border border-white/10 bg-slate-900/50 p-3 text-center">
                    <p className="text-xs text-slate-400">{metric}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold">Attribution Reports</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Source Attribution</strong> — See which traffic sources (Facebook, Google, referral, etc.) bring the most leads, bookings, won deals, and revenue.</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Pipeline Funnel</strong> — Visualize how leads progress through each stage with drop-off rates.</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Top Campaigns</strong> — Rank your campaigns by lead volume, bookings, and revenue generated.</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-400">→</span>
                  <div><strong className="text-white">Lead Volume Chart</strong> — Daily lead ingestion trend for the selected date range.</div>
                </li>
              </ul>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 10: Billing */}
        <section id="billing" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={10} />
            <div>
              <h2 className="text-2xl font-bold">Billing &amp; Plans</h2>
              <p className="mt-2 text-sm text-slate-400">Upgrade when you&apos;re ready to scale</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Starter", price: "$297/mo", features: ["1 workspace", "200 SMS/day", "500 emails/day", "Unlimited leads", "AI follow-up"] },
                  { name: "Growth", price: "$497/mo", features: ["3 workspaces", "500 SMS/day", "2,000 emails/day", "Unlimited leads", "AI follow-up"], recommended: true },
                  { name: "Scale", price: "$997/mo", features: ["50 workspaces", "1,000 SMS/day", "5,000 emails/day", "Unlimited leads", "White-label agency mode"] },
                ].map((plan) => (
                  <div key={plan.name} className={`rounded-xl border p-5 ${plan.recommended ? "border-indigo-500/30 bg-indigo-500/5" : "border-white/10 bg-slate-900/50"}`}>
                    {plan.recommended && <p className="mb-2 text-xs font-semibold text-indigo-400">RECOMMENDED</p>}
                    <p className="text-lg font-bold">{plan.name}</p>
                    <p className="mt-1 text-2xl font-bold">{plan.price}</p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <span className="text-emerald-400">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              <p>Billing is powered by Stripe. Subscribe from the <strong className="text-white">Billing</strong> page in your workspace. Manage your payment method, view invoices, or cancel anytime through the Stripe Customer Portal.</p>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* Section 11: Full Workflow Demo */}
        <section id="full-workflow" className="scroll-mt-8">
          <div className="flex items-start gap-4">
            <StepNumber n={11} />
            <div>
              <h2 className="text-2xl font-bold">Full Workflow Demonstration</h2>
              <p className="mt-2 text-sm text-slate-400">Start to finish — from ad click to closed deal</p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 p-8">
            <h3 className="text-lg font-bold text-emerald-100">Scenario: Solar Panel Lead from Facebook Ad</h3>
            <p className="mt-2 text-sm text-slate-300">
              Let&apos;s walk through a complete lead lifecycle from the moment they click your Facebook ad to the moment you close the deal.
            </p>

            <div className="mt-8 space-y-6">
              {/* Flow Step 1 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">1</div>
                <div>
                  <p className="font-semibold text-white">Lead Clicks Facebook Ad → Lands on Your Page</p>
                  <p className="mt-1 text-sm text-slate-300">
                    URL: <code className="text-xs text-slate-400">yoursite.com/solar?utm_source=facebook&amp;utm_medium=paid-social&amp;utm_campaign=summer-solar</code>
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Your embedded CloserFlow form auto-captures UTM params.</p>
                </div>
              </div>

              {/* Flow Step 2 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">2</div>
                <div>
                  <p className="font-semibold text-white">Lead Fills Out Form</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Submits: name, email, phone, budget (&quot;$5K-$10K&quot;), urgency (&quot;this month&quot;), decision maker (&quot;yes, I&apos;m the homeowner&quot;).
                  </p>
                </div>
              </div>

              {/* Flow Step 3 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</div>
                <div>
                  <p className="font-semibold text-white">CloserFlow Processes the Lead (within 2 seconds)</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-400">
                    <li>✓ Lead created in workspace, placed in &quot;New&quot; stage</li>
                    <li>✓ Scored: Budget 25 + Urgency 14 + Decision-Maker 20 + Engagement 16 = <strong className="text-emerald-300">Score 75 (WARM)</strong></li>
                    <li>✓ Automation fires: &quot;lead.created&quot; event emitted</li>
                    <li>✓ AI Follow-Up: GPT generates personalized SMS → sent via Twilio</li>
                  </ul>
                </div>
              </div>

              {/* Flow Step 4 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">4</div>
                <div>
                  <p className="font-semibold text-white">Lead Receives SMS Within 5 Seconds</p>
                  <div className="mt-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
                    <p className="text-sm italic text-slate-300">&quot;Hey Sarah! Thanks for your interest in solar. Based on your budget and timeline, we can definitely help. Want to schedule a quick 15-min call today to go over your options? Reply with a time!&quot;</p>
                  </div>
                </div>
              </div>

              {/* Flow Step 5 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">5</div>
                <div>
                  <p className="font-semibold text-white">You See the Lead in CRM → Move to &quot;Attempting Contact&quot;</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Open CRM board, drag the lead card from &quot;New&quot; → &quot;Attempting Contact&quot;. Add a note: &quot;Replied to SMS, scheduling call.&quot;
                  </p>
                </div>
              </div>

              {/* Flow Step 6 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">6</div>
                <div>
                  <p className="font-semibold text-white">Lead Books via Calendly</p>
                  <p className="mt-1 text-sm text-slate-300">
                    You send your Calendly link. Lead books a 30-min consultation. Webhook fires → appointment auto-created → lead moves to &quot;Booked&quot; stage.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Automation triggers: booking.created → sends confirmation email via Resend.</p>
                </div>
              </div>

              {/* Flow Step 7 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">7</div>
                <div>
                  <p className="font-semibold text-white">Consultation Call → Lead Shows Up</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Update appointment status to &quot;Completed&quot;. Lead auto-advances to &quot;Showed&quot;. AI score refreshes to 85 (HOT) based on engagement signals.
                  </p>
                </div>
              </div>

              {/* Flow Step 8 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">8</div>
                <div>
                  <p className="font-semibold text-white">Deal Closed → Log Revenue</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Drag lead to &quot;Won&quot;. Open lead profile → Revenue section → log $8,500 deal as &quot;Confirmed&quot;.
                  </p>
                </div>
              </div>

              {/* Flow Step 9 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">9</div>
                <div>
                  <p className="font-semibold text-white">Check Analytics</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Open Analytics dashboard. You now see: Facebook → 1 lead → 1 booking → 1 won → $8,500 revenue → 100% conversion rate. Speed-to-contact: 5 seconds.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-600/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">End Result</p>
              <p className="mt-1 text-sm text-slate-300">
                Lead went from ad click → AI follow-up in 5 seconds → booked call → showed → $8,500 closed deal. 
                Full attribution tracking shows Facebook paid-social summer-solar campaign drove this revenue. 
                The entire flow was automated except for the consultation call itself.
              </p>
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* CTA Footer */}
        <section className="text-center">
          <h2 className="text-3xl font-bold">Ready to Close More Deals?</h2>
          <p className="mt-4 text-slate-400">
            Set up your workspace in under 2 minutes. Start capturing and converting leads today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Create Your Account
            </Link>
            <Link
              href="/signin"
              className="inline-flex rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </section>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-xs text-slate-500">
          <p>CloserFlow AI — Lead Generation &amp; Sales Automation Platform</p>
        </div>
      </div>
    </div>
  );
}
