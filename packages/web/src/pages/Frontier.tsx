import { useEffect, useState } from "react";
import { api, type Node, type Edge } from "../lib/api";

interface FrontierGroup {
  sourceNode: Node | null;
  items: { node: Node; edge: Edge }[];
}

export function Frontier() {
  const [groups, setGroups] = useState<FrontierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { loadFrontier(); }, []);

  const loadFrontier = async () => {
    try {
      const [frontierNodes, activeNodes] = await Promise.all([api.nodes.frontier(), api.nodes.list()]);
      const groupMap = new Map<string, FrontierGroup>();

      await Promise.all(frontierNodes.map(async (node) => {
        try {
          const detail = await api.nodes.get(node.id);
          if (detail.edges.length > 0) {
            const edge = detail.edges[0];
            const sourceId = edge.fromId === node.id ? edge.toId : edge.fromId;
            const sourceNode = activeNodes.find((n) => n.id === sourceId) ?? null;
            const key = sourceNode?.surface ?? sourceId;
            if (!groupMap.has(key)) groupMap.set(key, { sourceNode, items: [] });
            groupMap.get(key)!.items.push({ node, edge });
          } else {
            if (!groupMap.has("other")) groupMap.set("other", { sourceNode: null, items: [] });
            groupMap.get("other")!.items.push({ node, edge: {} as Edge });
          }
        } catch { /* skip */ }
      }));

      setGroups(Array.from(groupMap.values()));
    } finally { setLoading(false); }
  };

  const handlePromote = async (id: string) => {
    try { await api.nodes.promote(id); setAdded((prev) => new Set([...prev, id])); } catch { /* */ }
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "shares_kanji", label: "Kanji family" },
    { key: "etymology", label: "Etymology" },
    { key: "semantic_similar", label: "Similar meaning" },
    { key: "grammar_uses", label: "Grammar" },
  ];

  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (loading) return <div className="text-center p-10 text-ink-secondary text-sm">Loading...</div>;

  return (
    <div className="max-w-[780px] mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-[28px] font-medium text-ink mb-1.5">Frontier</h1>
        <p className="text-sm text-[#999] leading-relaxed">Words discovered through your connections, not yet added to your graph.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs rounded-full py-1 px-3.5 cursor-pointer border transition-all ${
              filter === f.key
                ? "bg-ink text-white border-ink"
                : "bg-white text-ink-secondary border-border-medium hover:border-border-hover"
            }`}
          >
            {f.key === "all" ? `All (${totalCount})` : f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="text-center p-10 text-ink-secondary text-sm">No frontier nodes yet. Add words to discover connections.</div>
      ) : (
        <div className="flex flex-col gap-px bg-separator rounded-xl overflow-hidden">
          {groups.map((group, gi) => {
            const items = filter === "all" ? group.items : group.items.filter((item) => item.edge.type === filter);
            if (items.length === 0) return null;

            return (
              <div key={gi}>
                {/* Section break */}
                <div className="text-[11px] text-ink-muted tracking-wider py-2.5 px-5 pt-3 bg-paper">
                  via {group.sourceNode?.surface ?? "unknown"}
                </div>

                {items.map(({ node, edge }) => {
                  const isAdded = added.has(node.id);
                  return (
                    <div key={node.id} className="flex items-center gap-4 bg-white py-3.5 px-5 transition-colors hover:bg-paper-hover">
                      {/* Surface + reading */}
                      <div className="min-w-[80px]">
                        <div className="text-[22px] font-normal text-ink leading-tight">{node.surface}</div>
                        <div className="text-xs text-ink-tertiary mt-px">{node.reading}</div>
                      </div>

                      {/* Meaning */}
                      <div className="flex-[1.5] min-w-0">
                        <div className="text-[13px] text-ink-body">{node.meanings[0] ?? ""}</div>
                      </div>

                      {/* Source */}
                      <div className="min-w-[100px]">
                        <div className="text-[11px] text-ink-muted">from</div>
                        <div className="text-[13px] text-ink-secondary">{group.sourceNode?.surface ?? "—"}</div>
                      </div>

                      {/* Edge type + weight bar */}
                      <div className="min-w-[100px]">
                        <div className="text-[11px] text-ink-tertiary">{edge.type?.replace(/_/g, " ") ?? ""}</div>
                        <div className="mt-1 w-12 h-0.5 bg-separator rounded-sm">
                          <div className="h-full rounded-sm bg-accent opacity-45" style={{ width: `${(edge.weight ?? 0.5) * 100}%` }} />
                        </div>
                      </div>

                      {/* Add button */}
                      <button
                        onClick={() => !isAdded && handlePromote(node.id)}
                        disabled={isAdded}
                        className={`text-xs font-medium rounded-md py-1.5 px-3.5 border-none cursor-pointer whitespace-nowrap transition-colors ${
                          isAdded
                            ? "text-grade-good bg-added-bg cursor-default"
                            : "text-accent bg-accent-bg hover:bg-accent-bg-hover"
                        } disabled:cursor-default`}
                      >
                        {isAdded ? "Added" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
