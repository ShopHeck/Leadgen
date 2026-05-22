import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../../../../../auth";

const revenueSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero."),
  status: z.enum(["PENDING", "CONFIRMED", "REFUNDED"]).optional(),
});

/**
 * GET /api/workspaces/[slug]/leads/[leadId]/revenue
 * List revenue events for a lead.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string; leadId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceSlug, leadId } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
    },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: membership.workspaceId },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const events = await prisma.revenueEvent.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ events });
}

/**
 * POST /api/workspaces/[slug]/leads/[leadId]/revenue
 * Record a revenue event for a lead (e.g., deal closed).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string; leadId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceSlug, leadId } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
    },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: membership.workspaceId },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { amount, status } = revenueSchema.parse(body);

    const event = await prisma.revenueEvent.create({
      data: {
        leadId,
        amount,
        status: status || "CONFIRMED",
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 },
    );
  }
}
