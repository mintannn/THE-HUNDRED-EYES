import type { Observation, Reading } from "./experience";

// Visibility is an authored amplification rule. It never rewrites a judgement,
// enforces a sentiment majority, or uses confidence as the strength of a voice.
export function foregroundReadings(observation: Observation | null): Reading[] {
  return observation?.readings.filter((reading) => reading.voice > .48)
    .toSorted((a, b) => b.voice - a.voice || a.id.localeCompare(b.id)).slice(0, 4) ?? [];
}

export function sneeringReadings(observation: Observation | null): Reading[] {
  const front = new Set(foregroundReadings(observation).map((reading) => reading.id));
  return observation?.readings.filter((reading) => reading.delivery === "sneer" && !front.has(reading.id))
    .toSorted((a, b) => b.voice - a.voice).slice(0, 2) ?? [];
}

// One spatial sweep, in pixels. Equal radii receive together regardless of ID,
// depth ring, emotion, or whether the same words were posted before.
export function arrivalDelays(points: { x: number; y: number }[], origin: { x: number; y: number }): number[] {
  const distances = points.map((point) => Math.hypot(point.x - origin.x, point.y - origin.y));
  const nearest = Math.min(...distances), span = Math.max(1, Math.max(...distances) - nearest);
  return distances.map((distance) => .12 + (distance - nearest) / span * 1.35);
}
