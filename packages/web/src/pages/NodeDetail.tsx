import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { api, type NodeWithConnections, type Node } from "../lib/api";
import { Ruby } from "../components/Ruby";

export function NodeDetail() {
  const { id } = useParams<{ id: string }>();
  const [node, setNode] = useState<NodeWithConnections | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<Map<string, Node>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.nodes.get(id).then(async (n) => {
      setNode(n);
      const otherIds = n.edges.map((e) => (e.fromId === id ? e.toId : e.fromId));
      const unique = [...new Set(otherIds)];
      const fetched = new Map<string, Node>();
      await Promise.all(
        unique.map((nid) => api.nodes.get(nid).then((d) => fetched.set(nid, d)).catch(() => {}))
      );
      setConnectedNodes(fetched);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center p-10 text-ink-secondary text-sm">Loading...</div>;
  if (!node) return <div className="text-center p-10 text-grade-again text-sm">Node not found</div>;

  const audioBase = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const dueLabel = node.srsState
    ? new Date(node.srsState.dueAt) <= new Date() ? "now" : new Date(node.srsState.dueAt).toLocaleDateString()
    : "—";

  return (
    <div className="max-w-[680px] mx-auto py-12 px-6">
      {/* Hero */}
      <div className="mb-6">
        <div className="text-5xl font-normal text-ink leading-tight tracking-tight">{node.surface}</div>
        <div className="flex items-center gap-2.5 mt-2">
          <span className="text-[15px] text-ink-secondary">{node.reading}</span>
          <span className="text-[11px] font-medium tracking-wider text-accent bg-accent-bg py-0.5 px-2 rounded uppercase">{node.type}</span>
        </div>
      </div>

      {/* Meanings */}
      <div className="flex gap-2 flex-wrap mb-6">
        {node.meanings.map((m, i) => (
          <span key={i} className="text-sm text-ink bg-white border border-border-medium rounded-md py-1 px-3">{m}</span>
        ))}
      </div>

      {/* SRS Strip */}
      {node.srsState && (
        <div className="flex gap-4 py-3 border-y border-border mb-7">
          {[
            { val: node.srsState.reps, label: "reviews" },
            { val: node.srsState.lapses, label: "lapses" },
            { val: node.srsState.stability.toFixed(1), label: "stability" },
            { val: dueLabel, label: "due" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-sm font-medium text-ink">{s.val}</div>
              <div className="text-[11px] text-ink-tertiary mt-px">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Example */}
      {node.exampleSentence && (
        <div className="mb-7">
          <div className="text-[11px] font-medium tracking-wider text-ink-tertiary uppercase mb-2.5">Example</div>
          <p className="text-lg text-ink leading-relaxed mb-2.5"><Ruby text={node.exampleSentence} /></p>
          <div className="flex gap-2">
            {node.audioSentence && (
              <button onClick={() => new Audio(`${audioBase}${node.audioSentence}`).play()} className="flex items-center gap-1.5 text-xs text-[#666] bg-white border border-border-medium rounded-full py-1 px-3 cursor-pointer hover:border-border-hover">
                <span className="w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center shrink-0 play-icon" />sentence
              </button>
            )}
            {node.audioWord && (
              <button onClick={() => new Audio(`${audioBase}${node.audioWord}`).play()} className="flex items-center gap-1.5 text-xs text-[#666] bg-white border border-border-medium rounded-full py-1 px-3 cursor-pointer hover:border-border-hover">
                <span className="w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center shrink-0 play-icon" />word
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {node.notes && (
        <div className="mb-8">
          <div className="text-[11px] font-medium tracking-wider text-ink-tertiary uppercase mb-2.5">Notes</div>
          <p className="text-sm text-ink-body leading-relaxed">{node.notes}</p>
        </div>
      )}

      {/* Connections */}
      {node.edges.length > 0 && (
        <div>
          <div className="flex items-baseline gap-2 mb-3.5">
            <div className="text-[11px] font-medium tracking-wider text-ink-tertiary uppercase">Connections</div>
            <span className="text-xs text-ink-tertiary">{node.edges.length}</span>
          </div>
          <div className="flex flex-col gap-px bg-separator rounded-[10px] overflow-hidden">
            {node.edges.map((edge) => {
              const otherId = edge.fromId === node.id ? edge.toId : edge.fromId;
              const other = connectedNodes.get(otherId);
              return (
                <Link to={`/nodes/${otherId}`} key={edge.id} className="flex items-center bg-white py-3 px-4 no-underline text-inherit transition-colors hover:bg-paper-warm cursor-pointer">
                  <span className="text-lg text-ink min-w-[80px]">{other?.surface ?? "..."}</span>
                  <span className="text-xs text-ink-tertiary min-w-[60px]">{other?.reading ?? ""}</span>
                  <span className="text-[13px] text-ink-body flex-1">{other?.meanings?.[0] ?? ""}</span>
                  <span className="text-[11px] text-ink-tertiary ml-auto text-right flex items-center gap-2">
                    {edge.type.replace(/_/g, " ")}
                    <span className="inline-block w-9 h-[3px] bg-separator rounded-sm relative">
                      <span className="absolute left-0 top-0 h-full rounded-sm bg-accent opacity-50" style={{ width: `${edge.weight * 100}%` }} />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
