const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Nodes ────────────────────────────────────────────────

export interface Node {
  id: string;
  userId: string;
  type: string;
  surface: string;
  reading: string;
  meanings: string[];
  exampleSentence: string | null;
  audioWord: string | null;
  audioSentence: string | null;
  notes: string | null;
  source: string;
  addedAt: string | null;
  createdAt: string;
}

export interface Edge {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  weight: number;
  source: string;
}

export interface NodeWithConnections extends Node {
  edges: Edge[];
  srsState: {
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    state: number;
    dueAt: string;
    lastReview: string | null;
  } | null;
}

export interface DueCard {
  node: Node;
  srs: {
    stability: number;
    difficulty: number;
    state: number;
    dueAt: string;
  };
}

export const api = {
  nodes: {
    list: () => request<Node[]>("/api/nodes"),
    get: (id: string) => request<NodeWithConnections>(`/api/nodes/${id}`),
    create: (surface: string) =>
      request<NodeWithConnections>("/api/nodes", {
        method: "POST",
        body: JSON.stringify({ surface }),
      }),
    frontier: () => request<Node[]>("/api/nodes/frontier"),
    promote: (id: string) =>
      request<NodeWithConnections>(`/api/nodes/${id}/promote`, { method: "POST" }),
  },
  reviews: {
    due: (limit = 20) => request<DueCard[]>(`/api/reviews/due?limit=${limit}`),
    submit: (nodeId: string, rating: number) =>
      request<{ dueAt: string; stability: number }>(`/api/reviews/${nodeId}`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      }),
    stats: () => request<{ dueCount: number; totalNodes: number }>("/api/reviews/stats"),
  },
};
