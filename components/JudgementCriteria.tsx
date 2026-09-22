import { DIMENSIONS, EMOTIONS, type Engine } from "@/lib/experience";
import { MOMENTS, SCORE_RUBRICS } from "@/lib/judgement-criteria";
import { REACTIONS } from "@/lib/personas";
import Icon from "./Icon";

export default function JudgementCriteria({ engine }: { engine: Engine | null }) {
  return <details className="judgement-criteria">
    <summary>判定基準 <Icon name="chevron" size={12} /></summary>
    <div className="criteria-content">
      <p>百人それぞれのものの見方と、その時の状況から。同じ投稿を、互いの答えを見ずに判定します。</p>
      {engine !== "jev" && <p className="criteria-note">以下はJevに渡す基準です。仮判定版では、端末内の簡易ルールを使います。</p>}
      <h3>直感</h3>
      <dl className="reaction-criteria">{REACTIONS.map((reaction) => <div key={reaction.id} data-criterion={reaction.id}>
        <dt>{EMOTIONS.find((emotion) => emotion.id === reaction.id)!.short}</dt>
        <dd>{reaction.rubricJa}</dd>
      </div>)}</dl>
      <h3>四つの感情</h3>
      <p>それぞれを独立して判定します。0〜3の四段階の期待値を、0〜100に換算しています。</p>
      {DIMENSIONS.map(({ id, label }) => <details className="dimension-criteria" key={id}>
        <summary>{label} <Icon name="chevron" size={12} /></summary>
        <ol start={0}>{SCORE_RUBRICS[id].map((rubric, level) => <li key={level}>{rubric}</li>)}</ol>
      </details>)}
      <details className="dimension-criteria criteria-context">
        <summary>その時の状況 <Icon name="chevron" size={12} /></summary>
        <p>各人に一つを設定し、書き直しても変えません。</p>
        <ul>{MOMENTS.map((moment) => <li key={moment}>{moment}</li>)}</ul>
      </details>
      <h3>声と沈黙</h3>
      <p>声の大きさは「表に出したさ」と、その人の声の届きやすさから決まります。強い声は最大四人、冷笑は最大二人。目立つ人数と、感じた人数は別のものです。</p>
      <p>人物像・声の届きやすさ・短い台詞は作者の設定です。無関心・称賛・批判の人数は固定しません。百人の人物像は「100人の内側」で読めます。</p>
    </div>
  </details>;
}
