import { NextRequest, NextResponse } from "next/server";
import { processInboundSms } from "../../../../../lib/ai-conversations";

function xmlResponse(message?: string) {
  const body = message ? `<Response><Message>${message.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</Message></Response>` : "<Response></Response>";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const workspaceSlug = request.nextUrl.searchParams.get("workspaceSlug");

    if (!workspaceSlug) {
      return NextResponse.json({ error: "workspaceSlug query parameter is required." }, { status: 400 });
    }

    const raw = await request.text();
    const form = new URLSearchParams(raw);
    const from = String(form.get("From") || "").trim();
    const to = String(form.get("To") || "").trim();
    const body = String(form.get("Body") || "").trim();

    if (!from || !body) {
      return NextResponse.json({ error: "Missing inbound SMS fields." }, { status: 400 });
    }

    const result = await processInboundSms({
      workspaceSlug,
      from,
      to,
      body,
    });

    return xmlResponse(result.replied ? result.reply : undefined);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 },
    );
  }
}
