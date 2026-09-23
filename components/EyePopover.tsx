"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { CLUSTERS, PERSONAS } from "@/lib/personas";
import { EMOTIONS, type Reading } from "@/lib/experience";
import Icon from "./Icon";
import ReadingParameters from "./ReadingParameters";

export default function EyePopover({ id, reading, previous, onClose }: { id: string; reading?: Reading; previous?: Reading; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const dismiss = useRef(onClose);
  const index = PERSONAS.findIndex((p) => p.id === id);
  const persona = PERSONAS[index];
  const cluster = CLUSTERS.find((c) => c.id === persona.cluster);
  const emotion = reading && EMOTIONS.find((e) => e.id === reading.reaction);
  const color = emotion?.color ?? "#acbca5";

  useEffect(() => { dismiss.current = onClose; }, [onClose]);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) return;
    const target = document.querySelector<HTMLElement>(`.eye-target[data-eye-id="${id}"]`);
    const trigger = document.activeElement as HTMLElement | null;
    const fromKeyboard = trigger?.matches(":focus-visible") ?? false;
    const position = () => {
      const rect = target?.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      const eyeX = rect ? rect.left + rect.width / 2 : viewportWidth / 2;
      const eyeY = rect ? rect.top + rect.height / 2 : viewportHeight / 2;
      const roomOnRight = viewportWidth - eyeX > w + 40;
      const composer = document.querySelector(".x-composer")?.getBoundingClientRect();
      const hasGutters = composer && composer.left > w + 28 && viewportWidth - composer.right > w + 28;
      const beside = hasGutters
        ? eyeX < viewportWidth / 2 ? Math.min(eyeX - w - 24, composer.left - w - 24) : Math.max(eyeX + 24, composer.right + 24)
        : roomOnRight ? eyeX + 40 : eyeX - w - 40;
      const x = Math.max(14, Math.min(viewportWidth - w - 14, beside));
      const topInset = Math.min(80, Math.max(12, (viewportHeight - h) / 2));
      const y = Math.max(topInset, Math.min(viewportHeight - h - 14, eyeY - h * .36));
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.setProperty("--anchor-x", `${Math.max(10, Math.min(w - 10, eyeX - x))}px`);
    };
    position();
    // Pin the readout where it appears so its close button remains easy to hit.
    // The selected eye and the rest of the scene continue to drift behind it.
    const size = new ResizeObserver(position);
    size.observe(element);
    window.addEventListener("resize", position);
    window.visualViewport?.addEventListener("resize", position);
    if (fromKeyboard) close.current?.focus({ preventScroll: true });
    return () => {
      size.disconnect();
      window.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("resize", position);
      if (element.contains(document.activeElement) && trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [id]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (!(e.target instanceof Element)) return;
      if (panel.current?.contains(e.target) || e.target.closest("[data-eye-id]")) return;
      dismiss.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); dismiss.current(); }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section
      ref={panel} role="dialog" aria-modal="false"
      aria-label={`観測者 ${index + 1}の内面`}
      className={`eye-popover delivery-${reading?.delivery ?? "waiting"}`}
      style={{ "--reaction": color } as CSSProperties}
    >
      <button ref={close} className="popover-close" onClick={onClose} aria-label="パラメータを閉じる"><Icon name="close" size={16} /></button>
      <div className="popover-heading"><span className="persona-index">{String(index + 1).padStart(3, "0")}</span><span>{cluster?.ja}</span><i aria-hidden="true" /></div>
      <p className="popover-attitude">{persona.ja}</p>
      <ReadingParameters reading={reading} previous={previous} index={index} />
    </section>
  );
}
