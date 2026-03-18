import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// ─── Users (managed by better-auth, but we define the shape) ───

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  plan: text("plan").notNull().default("free"), // 'free' | 'pro'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Nodes (words, grammar, kanji, roots) ───

export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  type: text("type").notNull(), // 'word' | 'grammar' | 'kanji' | 'root'
  surface: text("surface").notNull(), // 示唆
  reading: text("reading").notNull().default(""), // しさ
  meanings: text("meanings", { mode: "json" }).notNull().$type<string[]>().default([]),
  exampleSentence: text("example_sentence"),
  audioWord: text("audio_word"),
  audioSentence: text("audio_sentence"),
  notes: text("notes"),
  source: text("source").notNull().default("user_added"), // 'user_added' | 'frontier'
  addedAt: integer("added_at", { mode: "timestamp" }), // null = frontier
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index("idx_nodes_user_surface").on(table.userId, table.surface),
  index("idx_nodes_user_source").on(table.userId, table.source),
  index("idx_nodes_user_type").on(table.userId, table.type),
]);

// ─── SRS State ───

export const srsState = sqliteTable("srs_state", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nodeId: text("node_id").notNull().unique().references(() => nodes.id, { onDelete: "cascade" }),
  stability: real("stability").notNull().default(0),
  difficulty: real("difficulty").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  state: integer("state").notNull().default(0), // 0=New, 1=Learning, 2=Review, 3=Relearning
  dueAt: integer("due_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastReview: integer("last_review", { mode: "timestamp" }),
});

// ─── Edges (relationships between nodes) ───

export const edges = sqliteTable("edges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  fromId: text("from_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  toId: text("to_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // EdgeType
  weight: real("weight").notNull().default(0.5), // 0.0–1.0
  source: text("source").notNull().default("ai"), // 'ai' | 'user'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("idx_edges_unique").on(table.fromId, table.toId, table.type),
  index("idx_edges_user").on(table.userId),
  index("idx_edges_from").on(table.fromId),
  index("idx_edges_to").on(table.toId),
]);

// ─── Reviews (append-only log) ───

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nodeId: text("node_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id),
  rating: integer("rating").notNull(), // 1=Again 2=Hard 3=Good 4=Easy
  stabilityBefore: real("stability_before").notNull(),
  stabilityAfter: real("stability_after").notNull(),
  intervalDays: integer("interval_days").notNull(),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index("idx_reviews_user_date").on(table.userId, table.reviewedAt),
  index("idx_reviews_node").on(table.nodeId),
]);
