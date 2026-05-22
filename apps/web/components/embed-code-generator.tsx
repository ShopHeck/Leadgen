"use client";

import { useState } from "react";

type EmbedStyle = "inline" | "popup" | "script";

export function EmbedCodeGenerator({
  workspaceSlug,
  appUrl,
}: {
  workspaceSlug: string;
  appUrl: string;
}) {
  const [style, setStyle] = useState<EmbedStyle>("inline");
  const [copied, setCopied] = useState(false);

  const endpointUrl = `${appUrl}/api/public/form-submit`;

  const codes: Record<EmbedStyle, string> = {
    inline: `<!-- CloserFlow Lead Capture Form -->
<form id="cf-lead-form" action="${endpointUrl}" method="POST">
  <input type="hidden" name="workspaceSlug" value="${workspaceSlug}" />
  <input type="text" name="name" placeholder="Full name" required />
  <input type="email" name="email" placeholder="Email address" />
  <input type="tel" name="phone" placeholder="Phone number" />
  <input type="hidden" name="utmSource" value="" />
  <input type="hidden" name="utmMedium" value="" />
  <input type="hidden" name="utmCampaign" value="" />
  <button type="submit">Get Started</button>
</form>
<script>
  // Auto-populate UTM fields from URL params
  (function() {
    var params = new URLSearchParams(window.location.search);
    var form = document.getElementById('cf-lead-form');
    if (!form) return;
    ['utmSource','utmMedium','utmCampaign'].forEach(function(field) {
      var key = field.replace('utm','utm_').toLowerCase();
      var input = form.querySelector('[name="' + field + '"]');
      if (input && params.get(key)) input.value = params.get(key);
    });
  })();
</script>`,

    popup: `<!-- CloserFlow Popup Trigger -->
<button onclick="document.getElementById('cf-modal').style.display='flex'">
  Get a Free Quote
</button>
<div id="cf-modal" style="display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)">
  <div style="background:white;border-radius:16px;padding:32px;max-width:480px;width:90%;position:relative">
    <button onclick="document.getElementById('cf-modal').style.display='none'" style="position:absolute;top:12px;right:16px;font-size:20px;background:none;border:none;cursor:pointer">&times;</button>
    <h3 style="margin:0 0 16px">Get Started</h3>
    <form action="${endpointUrl}" method="POST">
      <input type="hidden" name="workspaceSlug" value="${workspaceSlug}" />
      <input type="text" name="name" placeholder="Full name" required style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px" />
      <input type="email" name="email" placeholder="Email" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px" />
      <input type="tel" name="phone" placeholder="Phone" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px" />
      <button type="submit" style="width:100%;padding:12px;background:#1D4D3F;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">Submit</button>
    </form>
  </div>
</div>`,

    script: `<!-- CloserFlow JavaScript Embed (AJAX, no page redirect) -->
<div id="cf-form-container"></div>
<script>
(function() {
  var container = document.getElementById('cf-form-container');
  if (!container) return;

  container.innerHTML = \`
    <form id="cf-ajax-form" style="max-width:480px">
      <input type="text" name="name" placeholder="Full name" required style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px" />
      <input type="email" name="email" placeholder="Email" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px" />
      <input type="tel" name="phone" placeholder="Phone" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px" />
      <button type="submit" style="width:100%;padding:12px;background:#1D4D3F;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">Get Started</button>
      <p id="cf-msg" style="margin-top:8px;font-size:14px"></p>
    </form>
  \`;

  document.getElementById('cf-ajax-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('button');
    var msg = document.getElementById('cf-msg');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    var params = new URLSearchParams(window.location.search);
    var payload = {
      workspaceSlug: '${workspaceSlug}',
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      pageUrl: window.location.href,
      utm: {
        source: params.get('utm_source') || '',
        medium: params.get('utm_medium') || '',
        campaign: params.get('utm_campaign') || ''
      }
    };

    fetch('${endpointUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        msg.style.color = '#059669';
        msg.textContent = 'Thanks! We will be in touch shortly.';
        form.reset();
      } else {
        msg.style.color = '#dc2626';
        msg.textContent = data.error || 'Something went wrong.';
      }
    })
    .catch(function() {
      msg.style.color = '#dc2626';
      msg.textContent = 'Network error. Please try again.';
    })
    .finally(function() {
      btn.disabled = false;
      btn.textContent = 'Get Started';
    });
  });
})();
</script>`,
  };

  function handleCopy() {
    navigator.clipboard.writeText(codes[style]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Lead capture</p>
      <h3 className="mt-2 text-xl font-semibold">Embed Form on Your Website</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">
        Copy one of these code snippets and paste it into your website HTML. Leads will flow directly into this workspace with full UTM attribution.
      </p>

      {/* Style selector */}
      <div className="mt-5 flex gap-2">
        {([
          { value: "inline", label: "HTML Form" },
          { value: "popup", label: "Popup Modal" },
          { value: "script", label: "JavaScript (AJAX)" },
        ] as const).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStyle(opt.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              style === opt.value
                ? "bg-white text-slate-950"
                : "border border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="relative mt-5">
        <pre className="max-h-[400px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">
          {codes[style]}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-300">How it works:</p>
        <ul className="mt-2 space-y-1 text-xs leading-5">
          <li>Form posts to <code className="text-slate-200">{endpointUrl}</code></li>
          <li>Lead is created, scored, and optionally receives an AI follow-up within seconds</li>
          <li>UTM parameters from the page URL are automatically captured</li>
          <li>Works on any website — WordPress, Webflow, Squarespace, plain HTML</li>
        </ul>
      </div>
    </div>
  );
}
