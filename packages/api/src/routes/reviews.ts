import { Hono } from "hono";
import { z } from "zod";
import type { AuthEnv } from "../types";
import type { Grade } from "@tadoru/core";
import { getDueCards, processReview, getReviewStats } from "../services/srs.service";

const app = new Hono<AuthEnv>();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(4), // 1=Again 2=Hard 3=Good 4=Easy
});

// GET /reviews/due — get cards due for review
app.get("/due", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const limit = Number(c.req.query("limit")) || 20;
  const dueCards = await getDueCards(user.id, limit);
  return c.json(dueCards);
});

// POST /reviews/:nodeId — submit a review
app.post("/:nodeId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const result = await processReview(
    c.req.param("nodeId"),
    user.id,
    parsed.data.rating as Grade
  );

  return c.json(result);
});

// GET /reviews/stats — get review statistics
app.get("/stats", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const stats = await getReviewStats(user.id);
  return c.json(stats);
});

export default app;
