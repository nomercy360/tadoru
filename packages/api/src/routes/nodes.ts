import { Hono } from "hono";
import { z } from "zod";
import type { AuthEnv } from "../types";
import { enrichWord } from "../services/ai.service";
import { generateCardAudio } from "../services/audio.service";
import {
  createNode,
  findNodeBySurface,
  getNodeWithConnections,
  getUserNodes,
  getUserFrontier,
  promoteFrontierNode,
  createConnectionsFromSuggestions,
} from "../services/graph.service";
import { db } from "../db";
import { nodes } from "../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono<AuthEnv>();

const createNodeSchema = z.object({
  surface: z.string().min(1),
});

// POST /nodes — create a new node from a word/phrase
app.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const parsed = createNodeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const { surface } = parsed.data;

  // Check if already exists
  const existing = await findNodeBySurface(user.id, surface);
  if (existing && existing.addedAt) {
    return c.json({ error: "Node already exists", node: existing }, 409);
  }

  // If it exists as frontier, promote it and enrich
  if (existing && !existing.addedAt) {
    await promoteFrontierNode(existing.id);
    const enriched = await getNodeWithConnections(existing.id);
    return c.json(enriched, 200);
  }

  // AI enrichment
  const enrichment = await enrichWord(surface);

  const node = await createNode({
    userId: user.id,
    type: enrichment.card.nodeType,
    surface,
    reading: enrichment.card.reading,
    meanings: enrichment.card.meanings,
    exampleSentence: enrichment.card.exampleSentence,
    audioWord: null,
    audioSentence: null,
    notes: enrichment.card.notes,
  });

  // Generate audio in background (don't block response)
  generateCardAudio(node.id, surface, enrichment.card.exampleSentence)
    .then(async (audio) => {
      await db.update(nodes).set({
        audioWord: audio.audioWord,
        audioSentence: audio.audioSentence,
      }).where(eq(nodes.id, node.id));
    })
    .catch(console.error);

  // Create connections from AI suggestions
  await createConnectionsFromSuggestions(
    user.id,
    node.id,
    enrichment.connections
  );

  const result = await getNodeWithConnections(node.id);
  return c.json(result, 201);
});

// GET /nodes — list user's active nodes
app.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const userNodes = await getUserNodes(user.id);
  return c.json(userNodes);
});

// GET /nodes/frontier — list frontier (suggested) nodes
app.get("/frontier", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const frontier = await getUserFrontier(user.id);
  return c.json(frontier);
});

// GET /nodes/:id — get a single node with connections
app.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const node = await getNodeWithConnections(c.req.param("id"));
  if (!node || node.userId !== user.id) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(node);
});

// POST /nodes/:id/promote — promote a frontier node
app.post("/:id/promote", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const nodeId = c.req.param("id");
  const node = await getNodeWithConnections(nodeId);
  if (!node || node.userId !== user.id) {
    return c.json({ error: "Not found" }, 404);
  }
  if (node.addedAt) {
    return c.json({ error: "Already active" }, 400);
  }

  await promoteFrontierNode(nodeId);
  const updated = await getNodeWithConnections(nodeId);
  return c.json(updated);
});

export default app;
