export async function sendSms(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return { ok: false, reason: "Missing Twilio environment variables." };
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const result = await client.messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    body,
  });

  return { ok: true, sid: result.sid };
}
