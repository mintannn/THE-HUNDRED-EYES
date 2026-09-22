import { wordTraces } from "@/lib/word-traces";
import type { Ending } from "@/lib/use-stillness";
import { FINAL_LINE } from "@/lib/experience";

export default function WordRemains({ versions, ending }: { versions: string[]; ending: Ending }) {
  const current = versions.at(-1) ?? "";
  const traces = versions.slice(0, -1).filter((text, i, earlier) => text !== current && earlier.indexOf(text) === i);
  return (
    <section className="word-remains" aria-label="言葉の跡" aria-hidden={ending === "none"}>
      <div className="word-strata">
        {traces.map((text, i) => (
          <p className="word-trace" key={`${i}:${text}`} aria-label={`以前の言葉：${text}`}>
            {wordTraces(text, current).map((part, index) => part.erased
              ? <del key={index}>{part.text}</del> : <span key={index}>{part.text}</span>)}
          </p>
        ))}
        <p className="remaining-words" aria-label="今の言葉">{current}</p>
      </div>
      <p className="authorship-line" aria-hidden={ending !== "coda"}>{FINAL_LINE}</p>
    </section>
  );
}
