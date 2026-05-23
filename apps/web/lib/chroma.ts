/**
 * ChromaDB client for CloserFlow AI.
 *
 * Provides vector embeddings for semantic lead search, similar-lead
 * discovery, and RAG (retrieval-augmented generation) for AI features.
 *
 * Architecture:
 * - Uses OpenAI text-embedding-3-small for embedding generation
 * - ChromaDB stores and retrieves vectors with metadata filtering
 * - Each workspace has its own logical partition via metadata filtering
 *
 * Setup:
 * 1. Run Chroma server: docker run -p 8000:8000 chromadb/chroma
 *    Or use Chroma Cloud: https://www.trychroma.com/
 * 2. Set CHROMA_URL in .env (default: http://localhost:8000)
 * 3. Set CHROMA_API_KEY if using Chroma Cloud
 * 4. Ensure OPENAI_API_KEY is set for embedding generation
 */

import { ChromaClient } from "chromadb";
import OpenAI from "openai";

// ─── Clients ──────────────────────────────────────────────────────────────────

let _chromaClient: ChromaClient | null = null;
let _openaiClient: OpenAI | null = null;

function getChromaClient(): ChromaClient | null {
  const url = process.env.CHROMA_URL || "http://localhost:8000";

  if (_chromaClient) return _chromaClient;

  const config: Record<string, string> = { path: url };

  if (process.env.CHROMA_API_KEY) {
    config.auth = process.env.CHROMA_API_KEY;
  }

  _chromaClient = new ChromaClient(config);
  return _chromaClient;
}

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (_openaiClient) return _openaiClient;
  _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openaiClient;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEADS_COLLECTION = "closerflow_leads";
const MESSAGES_COLLECTION = "closerflow_messages";
const NOTES_COLLECTION = "closerflow_notes";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

// ─── Embedding Generation ─────────────────────────────────────────────────────

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAIClient();
  if (!openai) throw new Error("OpenAI API key not configured for embeddings.");

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data.map((item) => item.embedding);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

// ─── Collection Management ────────────────────────────────────────────────────

async function getOrCreateCollection(name: string) {
  const client = getChromaClient();
  if (!client) throw new Error("ChromaDB not configured. Set CHROMA_URL in .env");

  return client.getOrCreateCollection({
    name,
    metadata: { "hnsw:space": "cosine" },
  });
}

// ─── Lead Indexing ────────────────────────────────────────────────────────────

export type LeadDocument = {
  leadId: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  campaign: string | null;
  score: number;
  scoreBand: string;
  status: string;
  formData: Record<string, unknown> | null;
  notes: string[];
};

/**
 * Build a text document from lead data for embedding.
 * Combines structured fields into a natural language representation.
 */
function buildLeadDocument(lead: LeadDocument): string {
  const parts: string[] = [];

  parts.push(`Lead: ${lead.name}`);
  if (lead.email) parts.push(`Email: ${lead.email}`);
  if (lead.phone) parts.push(`Phone: ${lead.phone}`);
  if (lead.source) parts.push(`Source: ${lead.source}`);
  if (lead.campaign) parts.push(`Campaign: ${lead.campaign}`);
  parts.push(`Score: ${lead.score}/100 (${lead.scoreBand})`);
  parts.push(`Status: ${lead.status}`);

  if (lead.formData) {
    const formEntries = Object.entries(lead.formData)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${v}`);
    if (formEntries.length > 0) {
      parts.push(`Form answers: ${formEntries.join(", ")}`);
    }
  }

  if (lead.notes.length > 0) {
    parts.push(`Notes: ${lead.notes.slice(0, 5).join(" | ")}`);
  }

  return parts.join(". ");
}

/**
 * Index a single lead into ChromaDB for semantic search.
 */
export async function indexLead(lead: LeadDocument): Promise<void> {
  const collection = await getOrCreateCollection(LEADS_COLLECTION);
  const document = buildLeadDocument(lead);
  const embedding = await generateEmbedding(document);

  await collection.upsert({
    ids: [lead.leadId],
    embeddings: [embedding],
    documents: [document],
    metadatas: [
      {
        workspace_id: lead.workspaceId,
        name: lead.name,
        email: lead.email || "",
        source: lead.source || "",
        campaign: lead.campaign || "",
        score: lead.score,
        score_band: lead.scoreBand,
        status: lead.status,
      },
    ],
  });
}

/**
 * Index multiple leads in a single batch (more efficient for bulk operations).
 */
export async function indexLeadsBatch(leads: LeadDocument[]): Promise<void> {
  if (leads.length === 0) return;

  const collection = await getOrCreateCollection(LEADS_COLLECTION);
  const documents = leads.map(buildLeadDocument);
  const embeddings = await generateEmbeddings(documents);

  await collection.upsert({
    ids: leads.map((l) => l.leadId),
    embeddings,
    documents,
    metadatas: leads.map((l) => ({
      workspace_id: l.workspaceId,
      name: l.name,
      email: l.email || "",
      source: l.source || "",
      campaign: l.campaign || "",
      score: l.score,
      score_band: l.scoreBand,
      status: l.status,
    })),
  });
}

/**
 * Remove a lead from the vector index.
 */
export async function removeLeadFromIndex(leadId: string): Promise<void> {
  const collection = await getOrCreateCollection(LEADS_COLLECTION);
  await collection.delete({ ids: [leadId] });
}

// ─── Message Indexing ─────────────────────────────────────────────────────────

export type MessageDocument = {
  messageId: string;
  workspaceId: string;
  leadId: string;
  channel: string;
  direction: string;
  body: string;
  sentAt: string | null;
};

/**
 * Index a message for conversation search.
 */
export async function indexMessage(msg: MessageDocument): Promise<void> {
  const collection = await getOrCreateCollection(MESSAGES_COLLECTION);
  const document = `[${msg.channel}/${msg.direction}] ${msg.body}`;
  const embedding = await generateEmbedding(document);

  await collection.upsert({
    ids: [msg.messageId],
    embeddings: [embedding],
    documents: [document],
    metadatas: [
      {
        workspace_id: msg.workspaceId,
        lead_id: msg.leadId,
        channel: msg.channel,
        direction: msg.direction,
        sent_at: msg.sentAt || "",
      },
    ],
  });
}

// ─── Note Indexing ────────────────────────────────────────────────────────────

export type NoteDocument = {
  noteId: string;
  workspaceId: string;
  leadId: string;
  body: string;
  createdAt: string;
};

/**
 * Index a lead note for semantic retrieval.
 */
export async function indexNote(note: NoteDocument): Promise<void> {
  const collection = await getOrCreateCollection(NOTES_COLLECTION);
  const embedding = await generateEmbedding(note.body);

  await collection.upsert({
    ids: [note.noteId],
    embeddings: [embedding],
    documents: [note.body],
    metadatas: [
      {
        workspace_id: note.workspaceId,
        lead_id: note.leadId,
        created_at: note.createdAt,
      },
    ],
  });
}

// ─── Semantic Search ──────────────────────────────────────────────────────────

export type SemanticSearchResult = {
  id: string;
  document: string;
  metadata: Record<string, unknown>;
  distance: number;
};

/**
 * Semantic search across leads within a workspace.
 *
 * Example queries:
 * - "leads who mentioned budget concerns"
 * - "high-value leads from Google Ads"
 * - "anyone interested in premium services"
 */
export async function searchLeads(
  workspaceId: string,
  query: string,
  limit: number = 10,
  filters?: {
    scoreBand?: string;
    status?: string;
    source?: string;
  },
): Promise<SemanticSearchResult[]> {
  const collection = await getOrCreateCollection(LEADS_COLLECTION);
  const queryEmbedding = await generateEmbedding(query);

  const whereFilter: Record<string, unknown> = {
    workspace_id: workspaceId,
  };

  if (filters?.scoreBand) whereFilter.score_band = filters.scoreBand;
  if (filters?.status) whereFilter.status = filters.status;
  if (filters?.source) whereFilter.source = filters.source;

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
    where: whereFilter,
  });

  if (!results.ids[0]) return [];

  return results.ids[0].map((id, idx) => ({
    id,
    document: results.documents?.[0]?.[idx] || "",
    metadata: (results.metadatas?.[0]?.[idx] as Record<string, unknown>) || {},
    distance: results.distances?.[0]?.[idx] || 0,
  }));
}

/**
 * Search messages across a workspace or for a specific lead.
 */
export async function searchMessages(
  workspaceId: string,
  query: string,
  options?: {
    leadId?: string;
    channel?: string;
    limit?: number;
  },
): Promise<SemanticSearchResult[]> {
  const collection = await getOrCreateCollection(MESSAGES_COLLECTION);
  const queryEmbedding = await generateEmbedding(query);

  const whereFilter: Record<string, unknown> = {
    workspace_id: workspaceId,
  };

  if (options?.leadId) whereFilter.lead_id = options.leadId;
  if (options?.channel) whereFilter.channel = options.channel;

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: options?.limit || 10,
    where: whereFilter,
  });

  if (!results.ids[0]) return [];

  return results.ids[0].map((id, idx) => ({
    id,
    document: results.documents?.[0]?.[idx] || "",
    metadata: (results.metadatas?.[0]?.[idx] as Record<string, unknown>) || {},
    distance: results.distances?.[0]?.[idx] || 0,
  }));
}

/**
 * Search notes across a workspace or for a specific lead.
 */
export async function searchNotes(
  workspaceId: string,
  query: string,
  options?: {
    leadId?: string;
    limit?: number;
  },
): Promise<SemanticSearchResult[]> {
  const collection = await getOrCreateCollection(NOTES_COLLECTION);
  const queryEmbedding = await generateEmbedding(query);

  const whereFilter: Record<string, unknown> = {
    workspace_id: workspaceId,
  };

  if (options?.leadId) whereFilter.lead_id = options.leadId;

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: options?.limit || 10,
    where: whereFilter,
  });

  if (!results.ids[0]) return [];

  return results.ids[0].map((id, idx) => ({
    id,
    document: results.documents?.[0]?.[idx] || "",
    metadata: (results.metadatas?.[0]?.[idx] as Record<string, unknown>) || {},
    distance: results.distances?.[0]?.[idx] || 0,
  }));
}

// ─── RAG Context Builder ──────────────────────────────────────────────────────

/**
 * Build a RAG context string for AI features by searching across all
 * collections (leads, messages, notes) for relevant information.
 *
 * Use this to augment AI prompts with relevant workspace context.
 */
export async function buildRAGContext(
  workspaceId: string,
  query: string,
  options?: { maxTokens?: number; leadId?: string },
): Promise<string> {
  const maxChars = (options?.maxTokens || 2000) * 4; // rough token-to-char ratio

  const [leadResults, messageResults, noteResults] = await Promise.all([
    searchLeads(workspaceId, query, 5),
    searchMessages(workspaceId, query, { leadId: options?.leadId, limit: 5 }),
    searchNotes(workspaceId, query, { leadId: options?.leadId, limit: 5 }),
  ]);

  const contextParts: string[] = [];

  if (leadResults.length > 0) {
    contextParts.push("## Relevant Leads");
    for (const result of leadResults) {
      contextParts.push(`- ${result.document}`);
    }
  }

  if (messageResults.length > 0) {
    contextParts.push("\n## Relevant Messages");
    for (const result of messageResults) {
      contextParts.push(`- ${result.document}`);
    }
  }

  if (noteResults.length > 0) {
    contextParts.push("\n## Relevant Notes");
    for (const result of noteResults) {
      contextParts.push(`- ${result.document}`);
    }
  }

  const fullContext = contextParts.join("\n");
  return fullContext.slice(0, maxChars);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Check if Chroma integration is configured and available.
 */
export function isChromaEnabled(): boolean {
  return !!(process.env.CHROMA_URL || process.env.CHROMA_API_KEY) && !!process.env.OPENAI_API_KEY;
}

/**
 * Get collection stats for monitoring.
 */
export async function getCollectionStats() {
  const client = getChromaClient();
  if (!client) return null;

  try {
    const [leads, messages, notes] = await Promise.all([
      getOrCreateCollection(LEADS_COLLECTION),
      getOrCreateCollection(MESSAGES_COLLECTION),
      getOrCreateCollection(NOTES_COLLECTION),
    ]);

    return {
      leads: await leads.count(),
      messages: await messages.count(),
      notes: await notes.count(),
    };
  } catch {
    return null;
  }
}
