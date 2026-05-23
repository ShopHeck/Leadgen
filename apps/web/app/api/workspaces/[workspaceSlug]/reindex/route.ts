import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "../../../../../lib/auth-guards";
import {
  indexLeadsBatch,
  indexMessage,
  indexNote,
  isChromaEnabled,
  type LeadDocument,
  type MessageDocument,
  type NoteDocument,
} from "../../../../../lib/chroma";

/**
 * POST /api/workspaces/[workspaceSlug]/reindex
 *
 * Bulk reindex all leads, messages, and notes for a workspace into ChromaDB.
 * Useful for initial setup or recovery after data changes.
 *
 * This is an admin-only operation (workspace ADMIN role required).
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  try {
    const { workspaceSlug } = await params;
    const { user, workspace, membership } = await requireWorkspaceMember(workspaceSlug);

    if (membership.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    if (!isChromaEnabled()) {
      return NextResponse.json(
        { error: "Chroma is not configured. Set CHROMA_URL and OPENAI_API_KEY." },
        { status: 503 },
      );
    }

    // Fetch all leads with their form data and notes
    const leads = await prisma.lead.findMany({
      where: { workspaceId: workspace.id },
      include: {
        formSubmissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { payloadJson: true },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { body: true },
        },
      },
    });

    // Index leads in batches of 50
    const BATCH_SIZE = 50;
    let leadsIndexed = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      const leadDocs: LeadDocument[] = batch.map((lead) => ({
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        campaign: lead.campaign,
        score: lead.leadScore,
        scoreBand: lead.scoreBand,
        status: lead.status,
        formData: lead.formSubmissions[0]?.payloadJson as Record<string, unknown> | null,
        notes: lead.notes.map((n) => n.body),
      }));

      await indexLeadsBatch(leadDocs);
      leadsIndexed += batch.length;
    }

    // Index messages
    const messages = await prisma.message.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        workspaceId: true,
        leadId: true,
        channel: true,
        direction: true,
        body: true,
        sentAt: true,
      },
    });

    let messagesIndexed = 0;
    for (const msg of messages) {
      const msgDoc: MessageDocument = {
        messageId: msg.id,
        workspaceId: msg.workspaceId,
        leadId: msg.leadId,
        channel: msg.channel,
        direction: msg.direction,
        body: msg.body,
        sentAt: msg.sentAt?.toISOString() || null,
      };
      await indexMessage(msgDoc);
      messagesIndexed++;
    }

    // Index notes
    const notes = await prisma.leadNote.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        workspaceId: true,
        leadId: true,
        body: true,
        createdAt: true,
      },
    });

    let notesIndexed = 0;
    for (const note of notes) {
      const noteDoc: NoteDocument = {
        noteId: note.id,
        workspaceId: note.workspaceId,
        leadId: note.leadId,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
      };
      await indexNote(noteDoc);
      notesIndexed++;
    }

    return NextResponse.json({
      ok: true,
      indexed: {
        leads: leadsIndexed,
        messages: messagesIndexed,
        notes: notesIndexed,
      },
    });
  } catch (error) {
    console.error("[reindex] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reindex failed." },
      { status: 500 },
    );
  }
}
