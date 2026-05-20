import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { auth } from "../../../../../auth";

const API_KEY_PREFIX = "cf_live_";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceSlug } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
      role: "ADMIN",
    },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: membership.workspaceId },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceSlug } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
      role: "ADMIN",
    },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim() || "Default API Key";

  // Generate the key
  const rawBytes = randomBytes(32);
  const rawKey = API_KEY_PREFIX + rawBytes.toString("base64url");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 12) + "...";

  const apiKey = await prisma.apiKey.create({
    data: {
      workspaceId: membership.workspaceId,
      name,
      keyHash,
      prefix,
    },
  });

  return NextResponse.json(
    {
      id: apiKey.id,
      name: apiKey.name,
      rawKey, // Only shown once
      prefix: apiKey.prefix,
      createdAt: apiKey.createdAt,
      message: "Store this key securely. It will not be shown again.",
    },
    { status: 201 },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceSlug } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
      role: "ADMIN",
    },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json()) as { keyId?: string };
  if (!body.keyId) {
    return NextResponse.json({ error: "keyId is required." }, { status: 400 });
  }

  await prisma.apiKey.updateMany({
    where: {
      id: body.keyId,
      workspaceId: membership.workspaceId,
    },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
