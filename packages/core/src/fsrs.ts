import {
  fsrs,
  createEmptyCard,
  type Card,
  type RecordLogItem,
  type RecordLog,
  type Grade,
  Rating,
  State,
} from "ts-fsrs";

export { Rating, State };
export type { Card, Grade, RecordLogItem };

// Default FSRS instance — 90% target retention
const f = fsrs({ request_retention: 0.9 });

/**
 * Create a new empty FSRS card (for when a node is first added to the graph).
 */
export function createNewCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

/**
 * Get all 4 possible scheduling outcomes for a card.
 * Returns a record keyed by Grade (Again, Hard, Good, Easy — no Manual).
 */
export function getSchedulingOptions(
  card: Card,
  now: Date = new Date()
): RecordLog {
  return f.repeat(card, now);
}

/**
 * Schedule a single review with a known grade.
 * Returns the updated card and review log.
 */
export function scheduleReview(
  card: Card,
  grade: Grade,
  now: Date = new Date()
): RecordLogItem {
  return f.next(card, now, grade);
}

/**
 * Convert our DB srs_state row into a ts-fsrs Card object.
 */
export function srsStateToCard(srs: {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: number;
  dueAt: Date;
  lastReview: Date | null;
}): Card {
  return {
    due: srs.dueAt,
    stability: srs.stability,
    difficulty: srs.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: srs.reps,
    lapses: srs.lapses,
    state: srs.state as State,
    last_review: srs.lastReview ?? undefined,
  };
}

/**
 * Convert a ts-fsrs Card back to DB-friendly fields.
 */
export function cardToSrsFields(card: Card) {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    dueAt: card.due,
    lastReview: card.last_review ?? null,
  };
}
