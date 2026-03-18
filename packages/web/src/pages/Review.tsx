import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { api, type DueCard, type NodeWithConnections } from "../lib/api";
import { Ruby } from "../components/Ruby";

const GRADES = [
  { value: 1, label: "Again", key: "1", cls: "text-grade-again", hover: "hover:border-grade-again/30", interval: "<10m" },
  { value: 2, label: "Hard", key: "2", cls: "text-grade-hard", hover: "hover:border-grade-hard/30", interval: "1d" },
  { value: 3, label: "Good", key: "3", cls: "text-grade-good", hover: "hover:border-grade-good/30", interval: "4d" },
  { value: 4, label: "Easy", key: "4", cls: "text-grade-easy", hover: "hover:border-grade-easy/30", interval: "7d" },
];

export function Review() {
  const [cards, setCards] = useState<DueCard[]>([]);
  const [connections, setConnections] = useState<NodeWithConnections[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    api.reviews.due(50).then(setCards).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cards[current]) return;
    const nodeId = cards[current].node.id;
    api.nodes.get(nodeId).then((n) => {
      if (n.edges.length === 0) { setConnections([]); return; }
      const otherIds = n.edges.map((e) => e.fromId === nodeId ? e.toId : e.fromId).slice(0, 4);
      Promise.all(otherIds.map((id) => api.nodes.get(id).catch(() => null)))
        .then((results) => setConnections(results.filter((r): r is NodeWithConnections => r !== null)));
    }).catch(() => setConnections([]));
  }, [cards, current]);

  const handleRate = useCallback(async (rating: number) => {
    if (submitting || !cards[current]) return;
    setSubmitting(true);
    try {
      await api.reviews.submit(cards[current].node.id, rating);
      setReviewed((r) => r + 1);
      setCurrent((c) => c + 1);
      setRevealed(false);
      setConnections([]);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, cards, current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!revealed) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); setRevealed(true); }
        return;
      }
      const grade = GRADES.find((g) => g.key === e.key);
      if (grade) { e.preventDefault(); handleRate(grade.value); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [revealed, handleRate]);

  if (loading) return <div className="text-center p-10 text-ink-secondary text-sm">Loading reviews...</div>;

  if (cards.length === 0) {
    return (
      <div className="text-center pt-20">
        <h1 className="text-2xl font-normal mb-2">No cards due</h1>
        <p className="text-ink-secondary text-sm">You're all caught up. <Link to="/add" className="text-accent">Add more words</Link> or come back later.</p>
      </div>
    );
  }

  if (current >= cards.length) {
    return (
      <div className="text-center pt-20">
        <h1 className="text-2xl font-normal mb-2">Session complete</h1>
        <p className="text-ink-secondary text-sm">Reviewed {reviewed} {reviewed === 1 ? "card" : "cards"}.</p>
        <Link to="/" className="inline-flex mt-4 py-2.5 px-5 bg-ink text-white rounded-lg text-sm font-medium no-underline hover:opacity-85">Back to Dashboard</Link>
      </div>
    );
  }

  const card = cards[current];
  const progress = cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0;
  const audioBase = import.meta.env.VITE_API_URL || "http://localhost:3001";

  return (
    <div className="flex flex-col items-center pt-10 px-6 pb-8">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-9 w-full max-w-[560px]">
        <div className="flex-1 h-0.5 bg-separator rounded-sm">
          <div className="h-full bg-accent rounded-sm opacity-50 progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-ink-tertiary whitespace-nowrap">{current + 1} / {cards.length} · {reviewed} reviewed</span>
      </div>

      {/* Card */}
      <div
        className={`w-full max-w-[560px] bg-white border border-border rounded-2xl py-12 px-10 mb-6 min-h-[320px] flex flex-col items-center justify-center transition-[border-color] ${revealed ? "" : "cursor-pointer hover:border-border-hover"}`}
        onClick={() => !revealed && setRevealed(true)}
      >
        <span className="text-[13px] text-ink-tertiary mb-5 tracking-wide">what does this mean?</span>
        <div className="text-[52px] font-normal text-ink leading-tight text-center">{card.node.surface}</div>
        <div className="mt-2">
          <span className="text-[11px] font-medium tracking-wider text-accent bg-accent-bg py-0.5 px-2 rounded uppercase">{card.node.type}</span>
        </div>

        <div className="w-10 h-px bg-border-medium my-6 card-divider" style={{ opacity: revealed ? 1 : 0 }} />

        {revealed && (
          <div className="w-full text-center">
            <div className="text-base text-ink-secondary mb-3.5">{card.node.reading}</div>
            <div className="flex gap-2 justify-center flex-wrap mb-4">
              {card.node.meanings.map((m, i) => (
                <span key={i} className="text-[13px] text-ink bg-paper rounded-md py-1 px-3">{m}</span>
              ))}
            </div>
            {card.node.exampleSentence && (
              <p className="text-[15px] text-ink-body leading-relaxed mb-3.5"><Ruby text={card.node.exampleSentence} /></p>
            )}
            <div className="flex gap-2 justify-center">
              {card.node.audioSentence && (
                <button onClick={(e) => { e.stopPropagation(); new Audio(`${audioBase}${card.node.audioSentence}`).play(); }} className="flex items-center gap-1.5 text-xs text-[#666] bg-white border border-border-medium rounded-full py-1 px-3 cursor-pointer hover:border-border-hover">
                  <span className="w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center shrink-0 play-icon" />sentence
                </button>
              )}
              {card.node.audioWord && (
                <button onClick={(e) => { e.stopPropagation(); new Audio(`${audioBase}${card.node.audioWord}`).play(); }} className="flex items-center gap-1.5 text-xs text-[#666] bg-white border border-border-medium rounded-full py-1 px-3 cursor-pointer hover:border-border-hover">
                  <span className="w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center shrink-0 play-icon" />word
                </button>
              )}
            </div>
          </div>
        )}

        {!revealed && <p className="text-xs text-ink-muted mt-3">tap to reveal</p>}
      </div>

      {/* Connected words strip */}
      {revealed && connections.length > 0 && (
        <div className="w-full max-w-[560px] mb-6">
          <div className="text-[11px] text-ink-muted tracking-wider mb-2">CONNECTED WORDS</div>
          <div className="flex gap-2 flex-wrap">
            {connections.map((n) => (
              <Link to={`/nodes/${n.id}`} key={n.id} className="bg-white border border-border rounded-lg py-2 px-3 text-[13px] text-[#444] no-underline flex flex-col gap-0.5 transition-[border-color] hover:border-border-hover">
                <span className="text-base text-ink">{n.surface}</span>
                <span className="text-[11px] text-ink-muted">{n.type}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Grade buttons */}
      {revealed && (
        <div className="flex gap-2.5 w-full max-w-[560px]">
          {GRADES.map((g) => (
            <button
              key={g.value}
              onClick={() => handleRate(g.value)}
              disabled={submitting}
              className={`flex-1 py-3.5 px-2 rounded-[10px] bg-white border border-border-medium cursor-pointer text-center flex flex-col items-center gap-0.5 transition-[background,border-color] hover:bg-paper-warm ${g.hover} disabled:opacity-40`}
            >
              <span className="text-[11px] text-ink-muted">{g.key}</span>
              <span className={`text-sm font-medium ${g.cls}`}>{g.label}</span>
              <span className="text-[11px] text-ink-tertiary">{g.interval}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
