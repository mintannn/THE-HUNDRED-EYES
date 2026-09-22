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
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => () => { void audio.current?.context.close(); }, []);
  useEffect(() => {
    if (!audio.current) return;
    const { context, output, floor, choir, voices, bell } = audio.current;
    const now = context.currentTime;
    const open = phase === "revealing" || phase === "reality" || phase === "revising";
    const surrounded = spotlight !== null && !open;
    output.gain.setTargetAtTime(enabled && !paused ? 1 : 0, now, .3);
    const settling = phase === "confronting";
    floor.gain.setTargetAtTime(still ? 0 : open ? .001 : nearThreshold ? .002 : settling ? .004 : surrounded ? .009 : .006, now, still ? 3 : open ? .6 : 1.7);
    choir.gain.setTargetAtTime(surrounded ? nearThreshold ? .0008 : settling ? .0025 : .0045 : 0, now, open ? .65 : 1.5);
    const harmony = spotlight === "praise" ? [110, 165, 220] : [110, 116.54, 155.56];
    voices.forEach((voice, i) => voice.frequency.setTargetAtTime(harmony[i], now, 1.2));
    if (!enabled || paused || phase !== "reality") {
      bell.gain.cancelScheduledValues(now);
      bell.gain.setTargetAtTime(0, now, .12);
    } else if (lastBell.current !== sequence) {
      lastBell.current = sequence;
      // A single, quiet overtone follows the retreat of the crowd.
      bell.gain.cancelScheduledValues(now);
      bell.gain.setValueAtTime(0, now);
      bell.gain.linearRampToValueAtTime(.006, now + .16);
      bell.gain.exponentialRampToValueAtTime(.0001, now + 2.7);
      bell.gain.setTargetAtTime(0, now + 2.7, .2);
    }
  }, [enabled, phase, spotlight, sequence, paused, still, nearThreshold]);
  const toggle = async () => {
    try {
      if (!audio.current) {
        const context = new AudioContext();
        const output = context.createGain();
        output.gain.value = 0;
        output.connect(context.destination);
        const floor = context.createGain();
        const choir = context.createGain();
        const bell = context.createGain();
        for (const bus of [floor, choir, bell]) { bus.gain.value = 0; bus.connect(output); }
        [55, 55.18, 82.4].forEach((hz) => {
          const oscillator = context.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = hz;
          oscillator.connect(floor);
          oscillator.start();
        });
        const voices = [110, 165, 220].map((hz, i) => {
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
      setEnabled((value) => !value);
    } catch {
      setFailed(true);
    }
  };
  return (
    <button className="utility-button sound-button" onClick={toggle} aria-label={failed ? "この端末では音声を利用できません" : `環境音を${enabled ? "オフ" : "オン"}にする`} aria-pressed={enabled} disabled={failed}>
      <Icon name={enabled ? "sound" : "mute"} size={15} />
      <span>SOUND {enabled ? "ON" : "OFF"}</span>
    </button>
  );
}
