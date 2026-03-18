import { eq, and, lte } from "drizzle-orm";
import { db } from "../db";
import { srsState, reviews, edges, nodes } from "../db/schema";
import { srsStateToCard, scheduleReview, cardToSrsFields, Rating, type Grade } from "@tadoru/core";

/**
 * Get cards due for review for a user.
 */
export async function getDueCards(userId: string, limit: number = 20) {
  const now = new Date();

  const dueNodes = await db
    .select({
      node: nodes,
      srs: srsState,
    })
    .from(nodes)
    .innerJoin(srsState, eq(srsState.nodeId, nodes.id))
    .where(
      and(
        eq(nodes.userId, userId),
        lte(srsState.dueAt, now)
      )
    )
    .limit(limit);

  return dueNodes;
}

/**
 * Process a review for a node.
 */
export async function processReview(
  nodeId: string,
  userId: string,
  rating: Grade
) {
  const srs = await db.query.srsState.findFirst({
    where: eq(srsState.nodeId, nodeId),
  });
  if (!srs) throw new Error(`No SRS state for node ${nodeId}`);

  const card = srsStateToCard(srs);
  const stabilityBefore = card.stability;

  const result = scheduleReview(card, rating);
  const updatedFields = cardToSrsFields(result.card);

  // Update SRS state
  await db.update(srsState).set(updatedFields).where(eq(srsState.nodeId, nodeId));

  // Append review log
  await db.insert(reviews).values({
    id: crypto.randomUUID(),
    nodeId,
    userId,
    rating,
    stabilityBefore,
    stabilityAfter: result.card.stability,
    intervalDays: result.log.scheduled_days,
    reviewedAt: new Date(),
  });

  // Graph-aware: if rated Again, slightly penalize connected nodes
  if (rating === Rating.Again) {
    await propagateWeakness(nodeId, userId);
  }

  return {
    dueAt: result.card.due,
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    state: result.card.state,
  };
}

/**
 * When a node is failed (Again), slightly reduce stability on
 * strongly connected nodes — the cluster is weak.
 */
async function propagateWeakness(nodeId: string, userId: string) {
  const connectedEdges = await db
    .select()
    .from(edges)
    .where(
      and(
        eq(edges.userId, userId),
        eq(edges.fromId, nodeId)
      )
    );

  for (const edge of connectedEdges) {
    if (edge.weight < 0.5) continue; // only propagate through strong connections

    const targetSrs = await db.query.srsState.findFirst({
      where: eq(srsState.nodeId, edge.toId),
    });
    if (!targetSrs) continue;

    // Reduce stability by 5-10% based on edge weight
    const penalty = 1 - (edge.weight * 0.1);
    await db.update(srsState).set({
      stability: targetSrs.stability * penalty,
    }).where(eq(srsState.nodeId, edge.toId));
  }
}

/**
 * Get review stats for a user.
 */
export async function getReviewStats(userId: string) {
  const now = new Date();

  const dueCount = await db
    .select()
    .from(srsState)
    .innerJoin(nodes, eq(nodes.id, srsState.nodeId))
    .where(and(eq(nodes.userId, userId), lte(srsState.dueAt, now)));

  const totalNodes = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.userId, userId), eq(nodes.source, "user_added")));

  return {
    dueCount: dueCount.length,
    totalNodes: totalNodes.length,
  };
}
