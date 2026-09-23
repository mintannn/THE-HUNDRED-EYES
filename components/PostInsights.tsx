import type { CSSProperties } from "react";
import Icon from "./Icon";
import { EMOTIONS, type Observation } from "@/lib/experience";
import { PERSONAS } from "@/lib/personas";
import { xPostIntent } from "@/lib/x-intent";

type Props = {
  observation: Observation;
  previous: Observation | null;
  cycle: number;
  visible: boolean;
  onClose: () => void;
  onArchive: () => void;
  onSelect: (id: string) => void;
};

export default function PostInsights({ observation, previous, cycle, visible, onClose, onArchive, onSelect }: Props) {
  const people = observation.readings.toSorted((a, b) =>
    EMOTIONS.findIndex((emotion) => emotion.id === a.reaction) - EMOTIONS.findIndex((emotion) => emotion.id === b.reaction));
  const total = people.length;
  return (
    <section id="post-insights" className={`census insight-panel ${visible ? "is-revealed" : ""}`}
      inert={!visible} aria-hidden={!visible} aria-label="ポストアナリティクス">
      <header className="insight-heading">
        <span><Icon name="views" size={14} />ポストアナリティクス</span>
        <span className="insight-edition">{String(cycle).padStart(2, "0")}</span>
        <button className="insight-close" onClick={onClose} aria-label="アナリティクスを閉じる"><Icon name="close" size={15} /></button>
      </header>
      <div className="insight-summary">
        <div className="census-readout"><span>インプレッション</span><b className="reality-number">{total}</b></div>
      </div>
      <div className={`insight-distribution ${previous ? "has-comparison" : ""}`} aria-label="100人の直感の内訳">
        {EMOTIONS.map((emotion) => {
          const count = observation.counts[emotion.id];
          const delta = previous ? count - previous.counts[emotion.id] : null;
          return <div className="insight-emotion" key={emotion.id} data-reaction={emotion.id} data-count={count}
            style={{ "--reaction": emotion.color, "--share": count / total } as CSSProperties}>
            <span className="insight-value">{count}<span className="insight-unit">人</span></span>
            {delta !== null && <span className="insight-delta"
              aria-label={`${emotion.short}、前のポストから${delta === 0 ? "変化なし" : `${Math.abs(delta)}人${delta > 0 ? "増加" : "減少"}`}`}>
              <span>前回比</span><b>{delta === 0 ? "±0" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`}<span>人</span></b>
            </span>}
            <span className="insight-bar" aria-hidden="true"><i /></span>
            <span className="insight-label">{emotion.short}</span>
          </div>;
        })}
      </div>
      <div className="population-strip" aria-label={`${total}人の反応`}>
        {people.map((person) => <button key={person.id} data-eye-id={person.id}
          style={{ backgroundColor: EMOTIONS.find((emotion) => emotion.id === person.reaction)!.color }}
          onClick={() => onSelect(person.id)}
          aria-label={`観測者 ${PERSONAS.findIndex((p) => p.id === person.id) + 1}、${EMOTIONS.find((emotion) => emotion.id === person.reaction)!.label}`} />)}
      </div>
      <div className="insight-footnote">
        <a className="x-post-link" href={xPostIntent(observation)} target="_blank" rel="noopener noreferrer"
          title="投稿文・直感の内訳・作品URLを添えて開きます"
          aria-label="この言葉・統計・作品URLをXでポスト（新しいタブ）">Xでポスト <Icon name="arrow" size={12} /></a>
        <button onClick={onArchive} aria-label="100人の内側を見る">100人の内側 <Icon name="arrow" size={12} /></button>
      </div>
    </section>
  );
}
