import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { AuthEnv } from "./types";
import { auth } from "./auth";
import { sessionMiddleware } from "./middleware/auth";
import nodesRoute from "./routes/nodes";
import reviewsRoute from "./routes/reviews";

const app = new Hono<AuthEnv>();

// ─── Global Middleware ─────────────────────────────────────

app.use(logger());
app.use(secureHeaders());
app.use(cors({
  origin: (process.env.FRONTEND_URL || "http://localhost:5173").split(","),
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// ─── Auth Routes (handled by better-auth) ──────────────────

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// ─── Session Middleware (after auth routes) ─────────────────

app.use("/api/*", sessionMiddleware);

// ─── API Routes ────────────────────────────────────────────

app.route("/api/nodes", nodesRoute);
app.route("/api/reviews", reviewsRoute);

// ─── Health Check ──────────────────────────────────────────

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── 404 ───────────────────────────────────────────────────

app.notFound((c) => c.json({ error: "Not Found" }, 404));

// ─── Error Handler ─────────────────────────────────────────

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// ─── Start Server ──────────────────────────────────────────

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 Tadoru API running on http://localhost:${port}`);
