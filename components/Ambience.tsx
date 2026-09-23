"use client";

import { useEffect, useRef, useState } from "react";
import type { ExperiencePhase, Spotlight } from "@/lib/experience";
import Icon from "./Icon";

type Sound = {
  context: AudioContext;
  output: GainNode;
  floor: GainNode;
  choir: GainNode;
  voices: OscillatorNode[];
  bell: GainNode;
};

export default function Ambience({ spotlight, phase, sequence, paused, still, nearThreshold }: {
  spotlight: Spotlight | null; phase: ExperiencePhase; sequence: number; paused: boolean; still: boolean; nearThreshold: boolean;
}) {
  const audio = useRef<Sound | null>(null);
  const lastBell = useRef(-1);
  const previouslyEnabled = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => () => { void audio.current?.context.close(); }, []);
  useEffect(() => {
    if (!audio.current) return;
    const { context, output, floor, choir, voices, bell } = audio.current;
    const now = context.currentTime;
    const justEnabled = enabled && !previouslyEnabled.current;
    previouslyEnabled.current = enabled;
    const open = phase === "revealing" || phase === "reality" || phase === "revising";
    const surrounded = spotlight !== null && !open;
    output.gain.setTargetAtTime(enabled && !paused ? 1 : 0, now, .3);
    const settling = phase === "confronting";
    floor.gain.setTargetAtTime(still ? 0 : open ? .008 : nearThreshold ? .012 : settling ? .024 : surrounded ? .036 : .028, now, still ? 3 : justEnabled ? .2 : open ? .6 : 1.7);
    choir.gain.setTargetAtTime(surrounded ? nearThreshold ? .004 : settling ? .01 : .016 : 0, now, open ? .65 : 1.5);
    const harmony = spotlight === "praise" ? [220, 330, 440] : [220, 233.08, 311.12];
    voices.forEach((voice, i) => voice.frequency.setTargetAtTime(harmony[i], now, 1.2));
    if (!enabled || paused) {
      bell.gain.cancelScheduledValues(now);
      bell.gain.setTargetAtTime(0, now, .12);
    } else if (justEnabled || (phase === "reality" && lastBell.current !== sequence)) {
      if (phase === "reality") lastBell.current = sequence;
      // A short overtone confirms sound-on; a longer one follows the retreat.
      bell.gain.cancelScheduledValues(now);
      bell.gain.setValueAtTime(0, now);
      const duration = justEnabled ? .9 : 2.7;
      bell.gain.linearRampToValueAtTime(justEnabled ? .018 : .032, now + .16);
      bell.gain.exponentialRampToValueAtTime(.0001, now + duration);
      bell.gain.setTargetAtTime(0, now + duration, .2);
    } else if (phase !== "reality") {
      bell.gain.cancelScheduledValues(now);
      bell.gain.setTargetAtTime(0, now, .12);
    }
  }, [enabled, phase, spotlight, sequence, paused, still, nearThreshold]);
  const toggle = async () => {
    if (starting) return;
    setStarting(true);
    setFailed(false);
    try {
      if (!audio.current) {
        const AudioContextClass = window.AudioContext ??
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) throw new Error("Audio unavailable");
        const context = new AudioContextClass();
        const output = context.createGain();
        output.gain.value = 0;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -16;
        limiter.knee.value = 12;
        limiter.ratio.value = 4;
        output.connect(limiter).connect(context.destination);
        const floor = context.createGain();
        const choir = context.createGain();
        const bell = context.createGain();
        for (const bus of [floor, choir, bell]) { bus.gain.value = 0; bus.connect(output); }
        // Keep the floor audible on phone speakers, with a quiet midrange body.
        [110, 110.18, 164.8].forEach((hz) => {
          const oscillator = context.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = hz;
          oscillator.connect(floor);
          oscillator.start();
        });
        [220, 329.6].forEach((hz) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "triangle";
          oscillator.frequency.value = hz;
          gain.gain.value = .18;
          oscillator.connect(gain).connect(floor);
          oscillator.start();
        });
        const voices = [220, 330, 440].map((hz, i) => {
          const voice = context.createOscillator();
          const pan = context.createStereoPanner();
          voice.frequency.value = hz;
          voice.type = "sine";
          pan.pan.value = (i - 1) * .6;
          voice.connect(pan).connect(choir);
          voice.start();
          return voice;
        });
        const overtone = context.createOscillator();
        overtone.frequency.value = 432;
        overtone.connect(bell);
        overtone.start();
        audio.current = { context, output, floor, choir, voices, bell };
      }
      await audio.current.context.resume();
      if (audio.current.context.state !== "running") throw new Error("Audio has not started");
      setEnabled((value) => !value);
    } catch {
      setFailed(true);
      setEnabled(false);
    } finally {
      setStarting(false);
    }
  };
  return (
    <button className="utility-button sound-button" onClick={toggle}
      title={failed ? "音声を開始できませんでした。もう一度押して再試行します。" : `環境音 ${enabled ? "ON" : "OFF"}`}
      aria-label={failed ? "環境音を再試行" : `環境音を${enabled ? "オフ" : "オン"}にする`}
      aria-pressed={enabled} aria-busy={starting} disabled={starting}>
      <Icon name={enabled ? "sound" : "mute"} size={15} />
      <span>音 {failed ? "再試行" : starting ? "…" : enabled ? "ON" : "OFF"}</span>
    </button>
  );
}
