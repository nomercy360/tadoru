import { eq, and, or, isNull, isNotNull, asc } from "drizzle-orm";
import { db } from "../db";
import { nodes, edges, srsState } from "../db/schema";
import { createNewCard, cardToSrsFields } from "@tadoru/core";
import type { SuggestedEdge } from "@tadoru/core";

/**
 * Find a node by surface text for a given user.
 */
export async function findNodeBySurface(userId: string, surface: string) {
  return db.query.nodes.findFirst({
    where: and(eq(nodes.userId, userId), eq(nodes.surface, surface)),
  });
}

/**
 * Create a new node and its SRS state.
 */
export async function createNode(data: {
  userId: string;
  type: string;
  surface: string;
  reading: string;
  meanings: string[];
  exampleSentence: string | null;
  audioWord: string | null;
  audioSentence: string | null;
  notes: string | null;
  source?: string;
}) {
  const now = new Date();
  const nodeId = crypto.randomUUID();

  const [node] = await db.insert(nodes).values({
    id: nodeId,
    userId: data.userId,
    type: data.type,
    surface: data.surface,
    reading: data.reading,
    meanings: data.meanings,
    exampleSentence: data.exampleSentence,
    audioWord: data.audioWord,
    audioSentence: data.audioSentence,
    notes: data.notes,
    source: data.source || "user_added",
    addedAt: data.source === "frontier" ? null : now,
    createdAt: now,
  }).returning();

  // Create SRS state only for non-frontier nodes
  if (data.source !== "frontier") {
    const card = createNewCard(now);
    const srsFields = cardToSrsFields(card);
    await db.insert(srsState).values({
      id: crypto.randomUUID(),
      nodeId: node.id,
      ...srsFields,
    });
  }

  return node;
}

/**
 * Promote a frontier node to an active node (user decided to add it).
 */
export async function promoteFrontierNode(nodeId: string) {
  const now = new Date();

  await db.update(nodes).set({
    source: "user_added",
    addedAt: now,
  }).where(eq(nodes.id, nodeId));

  const card = createNewCard(now);
  const srsFields = cardToSrsFields(card);
  await db.insert(srsState).values({
    id: crypto.randomUUID(),
    nodeId,
    ...srsFields,
  });
}

/**
 * Create edges from AI-suggested connections, creating frontier nodes as needed.
 */
export async function createConnectionsFromSuggestions(
  userId: string,
  fromNodeId: string,
  suggestions: SuggestedEdge[]
) {
  const createdEdges = [];

  for (const suggestion of suggestions) {
    // Check if target node already exists
    let targetNode = await findNodeBySurface(userId, suggestion.surface);

    if (!targetNode) {
      // Create as frontier node
      targetNode = await createNode({
        userId,
        type: "word", // default, can be refined later
        surface: suggestion.surface,
        reading: suggestion.reading,
        meanings: suggestion.meanings,
        exampleSentence: null,
        audioWord: null,
        audioSentence: null,
        notes: null,
        source: "frontier",
      });
    }

    // Create edge (ignore if duplicate via unique constraint)
    try {
      const [edge] = await db.insert(edges).values({
        id: crypto.randomUUID(),
        userId,
        fromId: fromNodeId,
        toId: targetNode.id,
        type: suggestion.edgeType,
        weight: suggestion.weight,
        source: "ai",
        createdAt: new Date(),
      }).returning();
      createdEdges.push(edge);
    } catch {
      // Duplicate edge — skip silently
    }
  }

  return createdEdges;
}

/**
 * Get all edges for a node (both directions).
 */
export async function getNodeEdges(nodeId: string) {
  return db.select().from(edges).where(
    or(eq(edges.fromId, nodeId), eq(edges.toId, nodeId))
  );
}

/**
 * Get a node with its connections and SRS state.
 */
export async function getNodeWithConnections(nodeId: string) {
  const node = await db.query.nodes.findFirst({
    where: eq(nodes.id, nodeId),
  });
  if (!node) return null;

  const nodeEdges = await getNodeEdges(nodeId);
  const srs = await db.query.srsState.findFirst({
    where: eq(srsState.nodeId, nodeId),
  });

  return { ...node, edges: nodeEdges, srsState: srs };
}

/**
 * Get all active (non-frontier) nodes for a user.
 */
export async function getUserNodes(userId: string) {
  return db.select().from(nodes).where(
    and(eq(nodes.userId, userId), isNotNull(nodes.addedAt))
  );
}

/**
 * Get frontier nodes for a user.
 */
export async function getUserFrontier(userId: string) {
  return db.select().from(nodes).where(
    and(eq(nodes.userId, userId), isNull(nodes.addedAt))
  );
}
