import twitterText from "twitter-text";
import { EMOTIONS, type Observation } from "./experience";
import { SITE_URL } from "./site";
const { parseTweet } = twitterText;

export function xPostText(observation: Pick<Observation, "text" | "counts" | "readings">) {
  const counts = EMOTIONS.filter((emotion) => observation.counts[emotion.id] > 0)
    .map((emotion) => `${emotion.short}${observation.counts[emotion.id]}`).join("・");
  const footer = `\n\n衆目｜${observation.readings.length}人の直感：${counts}\n${SITE_URL}`;
  const compose = (words: string) => `「${words}」${footer}`;
  if (parseTweet(compose(observation.text)).weightedLength <= 280) return compose(observation.text);
  // X counts Japanese and emoji differently from ASCII, and URLs as 23.
  // Shorten only this share copy, keeping graphemes (including joined emoji) intact.
  const segments = [...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(observation.text)].map((part) => part.segment);
  let low = 0, high = segments.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (parseTweet(compose(`${segments.slice(0, middle).join("").trimEnd()}…`)).weightedLength <= 280) low = middle;
    else high = middle - 1;
  }
  return compose(`${segments.slice(0, low).join("").trimEnd()}…`);
}

// A Web Intent opens X's own composer; the visitor confirms the final post.
export function xPostIntent(observation: Pick<Observation, "text" | "counts" | "readings">) {
  const intent = new URL("https://x.com/intent/tweet");
  intent.searchParams.set("text", xPostText(observation));
  return intent.toString();
}
