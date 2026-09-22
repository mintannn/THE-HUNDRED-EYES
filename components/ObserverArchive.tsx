import type { CSSProperties } from "react";
import { CLUSTERS, PERSONAS } from "@/lib/personas";
import { EMOTIONS, type Observation } from "@/lib/experience";
import Icon from "./Icon";
import ReadingParameters from "./ReadingParameters";

// Native, independent disclosures keep the list, open people, and scroll
// position in place. Reading a second person never dismisses the archive.
export default function ObserverArchive({ observation, previous }: {
  observation: Observation | null;
  previous: Observation | null;
}) {
  return <>
    <h2 className="haunted-type" data-echo="100人の内側">100人の内側</h2>
    {CLUSTERS.map((cluster) => <section className="archive-cluster" key={cluster.id}>
      <h3>{cluster.ja}</h3>
      {PERSONAS.filter((person) => person.cluster === cluster.id).map((person) => {
        const index = PERSONAS.indexOf(person);
        const reading = observation?.readings[index];
        const emotion = EMOTIONS.find((item) => item.id === reading?.reaction);
        return <details key={person.id} className="observer-entry" data-eye-id={person.id}
          style={{ "--reaction": emotion?.color ?? "#acbca5" } as CSSProperties}>
          <summary aria-label={`観測者 ${index + 1}、${person.ja}`}>
            <span>{String(index + 1).padStart(3, "0")}</span><p>{person.ja}</p>
            {emotion && <i style={{ background: emotion.color }} />}
            <Icon name="chevron" size={13} />
          </summary>
          <div className="observer-details" role="group" aria-label={`観測者 ${index + 1}のパラメータ`}>
            <ReadingParameters reading={reading} previous={previous?.readings[index]} index={index} portrait />
          </div>
        </details>;
      })}
    </section>)}
  </>;
}
