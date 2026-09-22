export type WordTrace = { text: string; erased: boolean };

// Unicode-aware subsequence comparison. Every displayed character belongs to a
// real earlier version; the effect never supplies a sentence the visitor didn't write.
export function wordTraces(before: string, current: string): WordTrace[] {
  const from = Array.from(before), to = Array.from(current);
  const lengths = Array.from({ length: from.length + 1 }, () => new Uint16Array(to.length + 1));
  for (let i = from.length - 1; i >= 0; i--) {
    for (let j = to.length - 1; j >= 0; j--) {
      lengths[i][j] = from[i] === to[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  const retained = new Set<number>();
  let i = 0, j = 0;
  while (i < from.length && j < to.length) {
    if (from[i] === to[j]) { retained.add(i); i++; j++; }
    else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++;
    else j++;
  }
  const traces: WordTrace[] = [];
  from.forEach((character, index) => {
    const erased = !retained.has(index);
    const previous = traces.at(-1);
    if (previous?.erased === erased) previous.text += character;
    else traces.push({ text: character, erased });
  });
  return traces;
}

export function rememberWords(versions: string[], text: string): string[] {
  if (versions.at(-1) === text) return versions;
  const next = [...versions, text];
  // One original and the two most recent accepted versions; no persistent storage.
  return next.length <= 3 ? next : [next[0], ...next.slice(-2)];
}
