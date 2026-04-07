export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, reason: "Missing Resend API key." };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const response = await resend.emails.send({
    from: "CloserFlow AI <noreply@closerflow.local>",
    to,
    subject,
    html,
  });

  return { ok: true, response };
}
