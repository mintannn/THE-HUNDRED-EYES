"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { observe, type Engine, type Observation } from "./experience";

export function useJudgements() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const cache = useRef(new Map<string, Observation>());
  const capability = useRef<Promise<Engine> | null>(null);
  const pending = useRef<{ text: string; controller: AbortController; result: Promise<Observation> } | null>(null);
  const mounted = useRef(true);

  const identify = useCallback(() => {
    if (!capability.current) {
      capability.current = fetch("/api/observe", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Configuration unavailable");
        const body = await response.json();
        if (body.engine !== "mock" && body.engine !== "jev") throw new Error("Unknown engine");
        if (mounted.current) setEngine(body.engine);
        return body.engine as Engine;
      }).catch((error) => { capability.current = null; throw error; });
    }
    return capability.current;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void identify().catch(() => { /* The next explicit evaluation can retry configuration. */ });
    return () => { mounted.current = false; pending.current?.controller.abort(); };
  }, [identify]);

  const evaluate = useCallback(async (draft: string): Promise<Observation> => {
    const text = draft.trim();
    const known = cache.current.get(text);
    if (known) return known;
    if (pending.current?.text === text) return pending.current.result;
    pending.current?.controller.abort();
    const controller = new AbortController();
    const result = (async () => {
      const source = await identify();
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const observation = source === "mock" ? observe(text) : await fetch("/api/observe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }), signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) throw new Error("Judgement unavailable");
        const value = await response.json() as Observation;
        if (value.source !== "jev" || value.text !== text || value.readings?.length !== 100) throw new Error("Incomplete judgement");
        return value;
      });
      // All versions live only in this mounted session, including the first words.
      // Returning to a previous version restores its exact original judgement.
      cache.current.set(text, observation);
      return observation;
    })();
    pending.current = { text, controller, result };
    try { return await result; }
    finally { if (pending.current?.result === result) pending.current = null; }
  }, [identify]);

  return { engine, evaluate };
}
