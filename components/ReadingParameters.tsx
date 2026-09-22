import type { CSSProperties } from "react";
import { PERSONAS } from "@/lib/personas";
import { DIMENSIONS, EMOTIONS, thoughtFor, type Reading } from "@/lib/experience";

export default function ReadingParameters({ reading, previous, index, portrait = false }: {
  reading?: Reading;
  previous?: Reading;
  index: number;
  portrait?: boolean;
}) {
  const eye = portrait && <span className="observer-eye" role="img" aria-label={`観測者 ${index + 1}の目`}
    data-eye-id={PERSONAS[index].id}
    style={{ "--portrait-x": `${index % 10 / 9 * 100}%`, "--portrait-y": `${Math.floor(index / 10) / 9 * 100}%` } as CSSProperties} />;
  if (!reading) return <div className="popover-instinct">{eye}<div className="popover-unread">まだ、何も。</div></div>;
  const emotion = EMOTIONS.find((item) => item.id === reading.reaction)!;
  return <>
    <div className="popover-instinct">
      {eye}
      <blockquote>{thoughtFor(reading, index)}</blockquote>
      <span>{reading.delivery === "praise" ? "称賛" : reading.delivery === "sneer" ? "冷笑" : emotion.short}</span>
    </div>
    <div className="emotion-parameters">{DIMENSIONS.map(({ id, label }) => (
      <div key={id}><span>{label}</span><span className="parameter-track">
        {previous && Math.abs(previous.feelings[id] - reading.feelings[id]) >= .08 &&
          <i className="previous-reading" style={{ left: `${previous.feelings[id] * 100}%` }}
            title={`前のポスト ${Math.round(previous.feelings[id] * 100)}`} />}
        <span style={{ width: `${reading.feelings[id] * 100}%` }} />
      </span><span>{Math.round(reading.feelings[id] * 100)}<small> / 100</small></span></div>
    ))}</div>
    <div className="popover-voice"><span>声の大きさ</span><span className="voice-meter"><i style={{ width: `${reading.voice * 100}%` }} /></span><b>{Math.round(reading.voice * 100)}</b></div>
  </>;
}
