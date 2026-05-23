import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@closerflow/db";
import { verifyTaskRequest } from "../../../../lib/gcp-tasks";
import {
  indexLeadsBatch,
  indexMessage,
  indexNote,
  isChromaEnabled,
  type LeadDocument,
  type MessageDocument,
  type NoteDocument,
} from "../../../../lib/chroma";

/**
 * POST /api/tasks/reindex-workspace
 *
 * Background task handler for full workspace reindexing into ChromaDB.
 * Called by GCP Cloud Tasks for bulk operations that would exceed
 * a normal request timeout.
 *
 * Body: { workspaceId: string }
 */
export async function POST(request: NextRequest) {
  if (!verifyTaskRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isChromaEnabled()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Chroma not configured." });
  }

  try {
    const { workspaceId } = (await request.json()) as { workspaceId?: string };

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    // Index leads in batches
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
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
      where: { workspaceId },
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
      where: { workspaceId },
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
      workspaceId,
      indexed: {
        leads: leadsIndexed,
        messages: messagesIndexed,
        notes: notesIndexed,
      },
    });
  } catch (error) {
    console.error("[task/reindex-workspace] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reindex failed." },
      { status: 500 },
    );
  }
}
