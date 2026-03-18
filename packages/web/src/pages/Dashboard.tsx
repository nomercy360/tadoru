import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type Node } from "../lib/api";

export function Dashboard() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [stats, setStats] = useState<{ dueCount: number; totalNodes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.nodes.list(), api.reviews.stats()])
      .then(([n, s]) => { setNodes(n); setStats(s); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center p-10 text-ink-secondary text-sm">Loading...</div>;

  return (
    <div className="max-w-[680px] mx-auto py-12 px-6">
      <div className="flex gap-4 mb-7">
        <div className="flex flex-col">
          <span className="text-[28px] font-normal text-ink">{stats?.totalNodes ?? 0}</span>
          <span className="text-[11px] text-ink-tertiary tracking-wide">words</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[28px] font-normal text-ink">{stats?.dueCount ?? 0}</span>
          <span className="text-[11px] text-ink-tertiary tracking-wide">due</span>
        </div>
      </div>

      {stats && stats.dueCount > 0 && (
        <Link
          to="/review"
          className="inline-flex py-2 px-4.5 mb-8 text-[13px] font-medium bg-accent-bg text-accent rounded-full no-underline hover:bg-accent-bg-hover transition-colors"
        >
          Review {stats.dueCount} {stats.dueCount === 1 ? "card" : "cards"}
        </Link>
      )}

      <div className="text-[11px] font-medium tracking-wider text-ink-tertiary uppercase mb-2.5">Your Words</div>

      {nodes.length === 0 ? (
        <div className="text-center p-10 text-ink-secondary text-sm">
          No words yet. <Link to="/add" className="text-accent">Add your first word</Link> to start building your graph.
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-separator rounded-xl overflow-hidden">
          {nodes.map((node) => (
            <Link
              to={`/nodes/${node.id}`}
              key={node.id}
              className="flex items-center gap-4 bg-white py-3 px-4 no-underline text-inherit transition-colors hover:bg-paper-hover"
            >
              <span className="text-xl font-normal text-ink min-w-[80px]">{node.surface}</span>
              <span className="text-xs text-ink-tertiary min-w-[60px]">{node.reading}</span>
              <span className="text-[13px] text-ink-body flex-1">{node.meanings[0]}</span>
              <span className="text-[11px] text-ink-muted">{node.type}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
