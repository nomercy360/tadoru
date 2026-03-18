// ─── Node Types ───────────────────────────────────────────

export type NodeType = "word" | "grammar" | "kanji" | "root";

export type NodeSource = "user_added" | "frontier";

export interface TadoruNode {
  id: string;
  userId: string;
  type: NodeType;
  surface: string; // 示唆, にもかかわらず, 示
  reading: string; // しさ
  meanings: string[]; // ["suggestion", "намёк"]
  exampleSentence: string | null;
  audioWord: string | null; // file path / S3 key
  audioSentence: string | null;
  notes: string | null;
  source: NodeSource;
  addedAt: Date | null; // null = frontier node
  createdAt: Date;
}

// ─── Edge Types ───────────────────────────────────────────

export type EdgeType =
  | "shares_kanji" // 示唆 ↔ 示す (via 示)
  | "derived_from" // にもかかわらず → 構わず
  | "etymology" // 構わず → 構う
  | "grammar_uses" // 示唆 → 〜を示唆する
  | "co_occurs" // frequently appear together
  | "semantic_similar" // near-synonyms
  | "antonym"
  | "user_linked"; // manually created by user

export type EdgeSource = "ai" | "user";

export interface TadoruEdge {
  id: string;
  userId: string;
  fromId: string;
  toId: string;
  type: EdgeType;
  weight: number; // 0.0–1.0 connection strength
  source: EdgeSource;
  createdAt: Date;
}

// ─── SRS State ────────────────────────────────────────────

export interface SrsState {
  id: string;
  nodeId: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: number; // ts-fsrs State enum: 0=New, 1=Learning, 2=Review, 3=Relearning
  dueAt: Date;
  lastReview: Date | null;
}

// ─── Review Log ───────────────────────────────────────────

export interface ReviewRecord {
  id: string;
  nodeId: string;
  userId: string;
  rating: number; // 1=Again 2=Hard 3=Good 4=Easy
  stabilityBefore: number;
  stabilityAfter: number;
  intervalDays: number;
  reviewedAt: Date;
}

// ─── AI Pipeline Types ────────────────────────────────────

export interface CardEnrichment {
  reading: string;
  meanings: string[];
  exampleSentence: string;
  notes: string | null;
  nodeType: NodeType;
}

export interface SuggestedEdge {
  surface: string;
  reading: string;
  meanings: string[];
  edgeType: EdgeType;
  weight: number;
}

export interface EnrichmentResult {
  card: CardEnrichment;
  connections: SuggestedEdge[];
}
