import { useState } from "react";
import { useNavigate } from "react-router";
import { api, type NodeWithConnections, type Node } from "../lib/api";
import { Ruby } from "../components/Ruby";

export function AddWord() {
  const [surface, setSurface] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NodeWithConnections | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<Map<string, Node>>(new Map());
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surface.trim()) return;
    setLoading(true);
    setError(null);
    setConnectedNodes(new Map());
    try {
      const node = await api.nodes.create(surface.trim());
      setResult(node);
      setSurface("");

      // Fetch connected node details
      if (node.edges.length > 0) {
        const otherIds = node.edges.map((e) => (e.toId === node.id ? e.fromId : e.toId));
        const unique = [...new Set(otherIds)];
        const fetched = new Map<string, Node>();
        await Promise.all(
          unique.map((nid) =>
            api.nodes.get(nid).then((d) => fetched.set(nid, d)).catch(() => {})
          )
        );
        setConnectedNodes(fetched);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create node");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[680px] mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-[28px] font-medium text-ink mb-1.5">Add Word</h1>
        <p className="text-sm text-[#999] leading-relaxed">Enter a Japanese word, grammar pattern, or kanji. AI fills in everything else.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2.5 mb-8">
        <input
          type="text"
          value={surface}
          onChange={(e) => setSurface(e.target.value)}
          placeholder="微妙, にもかかわらず, 示..."
          disabled={loading}
          autoFocus
          className="flex-1 text-lg py-3 px-4 border border-border-medium rounded-lg bg-paper text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || !surface.trim()}
          className="py-3 px-6 bg-ink text-white border-none rounded-lg text-sm font-medium cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Add"}
        </button>
      </form>

      {error && <p className="text-grade-again text-[13px] text-center">{error}</p>}

      {result && (
        <div className="bg-white border border-border rounded-2xl py-10 px-8">
          {/* Hero */}
          <div className="mb-6">
            <div className="text-5xl font-normal text-ink leading-tight tracking-tight">{result.surface}</div>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-[15px] text-ink-secondary">{result.reading}</span>
              <span className="text-[11px] font-medium tracking-wider text-accent bg-accent-bg py-0.5 px-2 rounded uppercase">{result.type}</span>
            </div>
          </div>

          {/* Meanings */}
          <div className="flex gap-2 flex-wrap mb-6">
            {result.meanings.map((m, i) => (
              <span key={i} className="text-sm text-ink bg-white border border-border-medium rounded-md py-1 px-3">{m}</span>
            ))}
          </div>

          {/* Example */}
          {result.exampleSentence && (
            <div className="mb-7">
              <div className="text-[11px] font-medium tracking-wider text-ink-tertiary uppercase mb-2.5">Example</div>
              <p className="text-lg text-ink leading-relaxed"><Ruby text={result.exampleSentence} /></p>
            </div>
          )}

          {/* Notes */}
          {result.notes && (
            <div className="mb-8">
              <div className="text-[11px] font-medium tracking-wider text-ink-tertiary uppercase mb-2.5">Notes</div>
              <p className="text-sm text-ink-body leading-relaxed">{result.notes}</p>
            </div>
          )}

          {/* Connections */}
          {result.edges.length > 0 && (
            <div>
              <div className="flex items-baseline gap-2 mb-3.5">
                <div className="text-[11px] font-medium tracking-wider text-ink-tertiary uppercase">Connections</div>
                <span className="text-xs text-ink-tertiary">{result.edges.length}</span>
              </div>
              <div className="flex flex-col gap-px bg-separator rounded-[10px] overflow-hidden">
                {result.edges.map((edge) => {
                  const otherId = edge.toId === result.id ? edge.fromId : edge.toId;
                  const other = connectedNodes.get(otherId);
                  return (
                    <div
                      key={edge.id}
                      className="flex items-center bg-white py-3 px-4 cursor-pointer transition-colors hover:bg-paper-warm"
                      onClick={() => navigate(`/nodes/${otherId}`)}
                    >
                      <span className="text-lg text-ink min-w-[80px]">{other?.surface ?? "..."}</span>
                      <span className="text-xs text-ink-tertiary min-w-[60px]">{other?.reading ?? ""}</span>
                      <span className="text-[13px] text-ink-body flex-1">{other?.meanings?.[0] ?? ""}</span>
                      <span className="text-[11px] text-ink-tertiary ml-auto flex items-center gap-2">
                        {edge.type.replace(/_/g, " ")}
                        <span className="inline-block w-9 h-[3px] bg-separator rounded-sm relative">
                          <span className="absolute left-0 top-0 h-full rounded-sm bg-accent opacity-50" style={{ width: `${edge.weight * 100}%` }} />
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
