"use client";

import { useEffect, useMemo, useState } from "react";
import Web, { type Verdict } from "@/components/Web";
import Bar from "@/components/Bar";
import { CLUSTERS, PERSONAS, REACTIONS } from "@/lib/personas";

/** 見た目を詰めるあいだの仮データ。文字列から決まるので、打つと反応が変わる */
function mockVerdicts(text: string): Verdict[] {
  if (!text) return [];
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return PERSONAS.map((p, i) => {
    const s = (h ^ (i * 2654435761)) >>> 0;
    const raw = REACTIONS.map((_, k) => ((s >> (k * 3)) & 7) + 1 + (k === 2 ? 4 : 0));
    const tot = raw.reduce((a, b) => a + b, 0);
    const probabilities = Object.fromEntries(REACTIONS.map((r, k) => [r.ja, raw[k] / tot]));
    const top = REACTIONS[raw.indexOf(Math.max(...raw))].ja;
    return { id: p.id, reaction: top, confidence: Math.max(...raw) / tot, probabilities };
  });
}

export default function Page() {
  const [text, setText] = useState("");
  const [live, setLive] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLive(text), 220);
    return () => clearTimeout(t);
  }, [text]);

  const verdicts = useMemo(() => mockVerdicts(live), [live]);
  const byId = useMemo(() => Object.fromEntries(verdicts.map((v) => [v.id, v])), [verdicts]);

  /** 集計は必ずコード側で数える */
  const tally = useMemo(() => {
    const t: Record<string, number> = {};
    for (const v of verdicts) t[v.reaction] = (t[v.reaction] ?? 0) + 1;
    return t;
  }, [verdicts]);

  const persona = picked ? PERSONAS.find((p) => p.id === picked) : null;
  const verdict = picked ? byId[picked] : null;
  const cluster = persona ? CLUSTERS.find((c) => c.id === persona.cluster) : null;
  const idx = persona ? PERSONAS.indexOf(persona) + 1 : 0;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[var(--paper)]">
      <div className="absolute inset-0">
        <Web verdicts={verdicts} onPick={setPicked} />
      </div>

      {/* 表題 */}
      <div className="pointer-events-none absolute top-5 left-6">
        <div className="px text-[10px] text-[var(--ink)]">衆目</div>
        <div className="px mt-1.5 text-[7px] text-[var(--dim)]">THE HUNDRED EYES</div>
      </div>

      {/* 計測値。8bitの読み取り装置 */}
      <div className="pointer-events-none absolute top-5 right-6 w-[236px]">
        <div className="panel p-3">
          <div className="px mb-2 flex justify-between text-[7px] text-[var(--dim)]">
            <span>OBSERVERS</span>
            <span className="text-[var(--ink)]">{verdicts.length || 0}/100</span>
          </div>
          {REACTIONS.map((r) => {
            const n = tally[r.ja] ?? 0;
            return (
              <div key={r.id} className="mb-[5px] flex items-center gap-2">
                <span className="w-[58px] shrink-0 text-[10px] leading-none">{r.ja}</span>
                <div className="flex-1">
                  <Bar value={n / 100} segs={16} color={r.color} dim={!n} />
                </div>
                <span className="px w-[16px] shrink-0 text-right text-[7px] tabular-nums">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 中央：Xの投稿欄 */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 w-full max-w-[470px] -translate-x-1/2 -translate-y-1/2 px-6">
        <div className="panel pointer-events-auto p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 h-9 w-9 shrink-0 border-2 border-[var(--ink)] bg-[var(--paper)]" />
            <div className="min-w-0 flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 140))}
                rows={2}
                placeholder="いまどうしてる？"
                className="w-full resize-none bg-transparent text-[18px] leading-[1.7] text-[var(--ink)] placeholder:text-[var(--dim)] focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between border-t-2 border-[var(--rule)] pt-2.5">
                <div className="px flex gap-2 text-[7px] text-[var(--dim)]">
                  {["IMG", "GIF", "POLL"].map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="px text-[7px] tabular-nums text-[var(--dim)]">
                    {text.length}/140
                  </span>
                  <button
                    disabled
                    className="px border-2 border-[var(--ink)] bg-[var(--ink)] px-3 py-1.5 text-[8px] text-[var(--paper)] disabled:opacity-30"
                  >
                    POST
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 目をクリックしたときの計測結果 */}
      {persona && (
        <div className="panel pop pointer-events-auto absolute bottom-5 left-1/2 w-[440px] -translate-x-1/2 p-4">
          <div className="px mb-2 flex items-center justify-between text-[7px] text-[var(--dim)]">
            <span>
              SUBJECT {String(idx).padStart(3, "0")} · {cluster?.en}
            </span>
            <button onClick={() => setPicked(null)} className="text-[9px] text-[var(--ink)]">
              ×
            </button>
          </div>

          <p className="text-[13px] leading-[1.8]">{persona.ja}</p>
          <p className="mt-1 text-[10px] leading-[1.6] text-[var(--dim)]">{persona.en}</p>

          {verdict ? (
            <div className="mt-3 border-t-2 border-[var(--rule)] pt-3">
              <div className="px mb-2 flex justify-between text-[7px] text-[var(--dim)]">
                <span>READING</span>
                <span className="text-[var(--ink)]">
                  CONF {String(Math.round(verdict.confidence * 100)).padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-[5px]">
                {REACTIONS.map((r) => {
                  const p = verdict.probabilities[r.ja] ?? 0;
                  const top = r.ja === verdict.reaction;
                  return (
                    <div key={r.id} className="flex items-center gap-2">
                      <span
                        className="w-[52px] shrink-0 text-[10px] leading-none"
                        style={{ color: top ? r.color : "var(--dim)" }}
                      >
                        {r.ja}
                      </span>
                      <div className="flex-1">
                        <Bar value={p} segs={10} color={r.color} dim={!top} />
                      </div>
                      <span className="px w-[16px] shrink-0 text-right text-[7px] tabular-nums text-[var(--dim)]">
                        {Math.round(p * 100)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="px mt-3 border-t-2 border-[var(--rule)] pt-3 text-[8px] text-[var(--dim)]">
              NO READING — 中央に書くと計測がはじまります
            </p>
          )}
        </div>
      )}

      {!picked && (
        <div className="px pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[7px] text-[var(--dim)]">
          CLICK AN EYE<span className="blink">_</span>
        </div>
      )}
    </main>
  );
}
