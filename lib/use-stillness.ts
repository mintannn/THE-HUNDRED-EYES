"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Ending = "none" | "words" | "coda";
type Passage = "awake" | "resting" | Exclude<Ending, "none">;

// Timers belong to this visit to the quiet room, never to a previous post/dialog.
// Input cancels the passage without consuming the event or changing a judgement.
export function useStillness(eligible: boolean, sequence: number) {
  const key = `${sequence}:${eligible}`;
  const [moment, setMoment] = useState<{ key: string; passage: Passage }>({ key, passage: "awake" });
  const enter = useRef<() => void>(() => {});
  if (moment.key !== key) setMoment({ key, passage: "awake" });
  const passage = eligible && moment.key === key ? moment.passage : "awake";

  useEffect(() => {
    if (!eligible) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const clear = () => { timers.forEach(clearTimeout); timers.clear(); };
    const at = (delay: number, action: () => void) => {
      const timer = setTimeout(() => { timers.delete(timer); action(); }, delay);
      timers.add(timer);
    };
    const show = (next: Passage) => setMoment((previous) =>
      previous.key === key && previous.passage === next ? previous : { key, passage: next });
    const begin = () => {
      clear();
      if (document.hidden) return;
      // The explicit "余韻" control also offers a still composition without motion.
      if (motion.matches) { show("coda"); return; }
      show("resting");
      at(4500, () => show("words"));
      at(10000, () => show("coda"));
    };
    const schedule = () => {
      if (!motion.matches && !document.hidden) at(8500, begin);
    };
    const wake = () => {
      clear();
      show("awake");
      schedule();
    };
    const leave = () => { clear(); show("awake"); };
    const events = ["pointermove", "pointerdown", "keydown", "focusin", "wheel"] as const;
    events.forEach((event) => window.addEventListener(event, wake, { passive: true }));
    window.addEventListener("blur", leave);
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", wake);
    motion.addEventListener("change", wake);
    enter.current = begin;
    schedule();
    return () => {
      clear();
      enter.current = () => {};
      events.forEach((event) => window.removeEventListener(event, wake));
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", wake);
      document.removeEventListener("visibilitychange", wake);
      motion.removeEventListener("change", wake);
    };
  }, [eligible, key]);

  const linger = useCallback(() => enter.current(), []);
  const ending: Ending = passage === "awake" || passage === "resting" ? "none" : passage;
  return { still: passage !== "awake", ending, linger };
}
