"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Icon from "@/components/Icon";
import Ambience from "@/components/Ambience";
import Modal from "@/components/Modal";
import EyePopover from "@/components/EyePopover";
import WordRemains from "@/components/WordRemains";
import PostInsights from "@/components/PostInsights";
import ObserverArchive from "@/components/ObserverArchive";
import JudgementCriteria from "@/components/JudgementCriteria";
import { PERSONAS } from "@/lib/personas";
import { EXAMPLES, FINAL_LINE, compareReadings, type ExperiencePhase, type Observation, type Revision } from "@/lib/experience";
import { useStillness } from "@/lib/use-stillness";
import { useJudgements } from "@/lib/use-judgements";
import { rememberWords } from "@/lib/word-traces";

const EyesScene = dynamic(() => import("@/components/EyesScene"), { ssr: false });
const COMPOSE_TOOLS = ["image", "gif", "poll", "smile", "calendar", "location"];

export default function Page() {
  const [text, setText] = useState("");
  const [observation, setObservation] = useState<Observation | null>(null);
  const [sequence, setSequence] = useState(0);
  const [phase, setPhase] = useState<ExperiencePhase>("writing");
  const [selected, setSelected] = useState<string | null>(null);
  const [about, setAbout] = useState(false);
  const [archive, setArchive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [thresholdAttention, setThresholdAttention] = useState(false);
  const [original, setOriginal] = useState<Observation | null>(null);
  const [previous, setPrevious] = useState<Observation | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [versions, setVersions] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [issue, setIssue] = useState("");
  const currentObservation = useRef<Observation | null>(null);
  const firstObservation = useRef<Observation | null>(null);
  const { engine, evaluate } = useJudgements();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const stage = useRef<HTMLElement>(null);
  const count = Array.from(text).length;
  const selectedIndex = PERSONAS.findIndex((p) => p.id === selected);
  const revealed = phase === "reality";
  const revising = phase === "revising";
  const widening = phase === "revealing" || revealed || revising;
  const writing = phase === "writing" || revising;
  const showCensus = insightsOpen && (phase === "revealing" || revealed);
  const nearThreshold = phase === "confronting" && thresholdAttention;
  const { still, ending, linger } = useStillness(revealed && !paused && !selected && !about && !archive, sequence);

  useEffect(() => {
    if (about || archive) return;
    // "Stop motion" freezes the atmosphere, not the visitor's ability to proceed.
    const reduced = paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = phase === "reacting" ? (reduced ? 700 : 5200) : phase === "revealing" ? (reduced ? 250 : 3000) : null;
    if (delay === null) return;
    const timer = setTimeout(() => setPhase(phase === "reacting" ? "confronting" : "reality"), delay);
    return () => clearTimeout(timer);
  }, [phase, paused, about, archive]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const applyObservation = useCallback((next: Observation) => {
    const previous = currentObservation.current;
    if (!firstObservation.current) {
      firstObservation.current = next;
      setOriginal(next);
    } else if (previous) {
      setRevision(compareReadings(previous, next, firstObservation.current));
    }
    currentObservation.current = next;
    setObservation(next);
    setVersions((previousWords) => rememberWords(previousWords, next.text));
  }, []);

  const post = async () => {
    if (!text.trim() || count > 140 || !writing || posting || composing) return;
    setPosting(true);
    setIssue("");
    try {
      const next = await evaluate(text);
      setPrevious(currentObservation.current);
      applyObservation(next);
      setSelected(null);
      setInsightsOpen(false);
      setThresholdAttention(false);
      setPhase("reacting");
      setSequence((n) => n + 1);
      textarea.current?.blur();
      stage.current?.focus({ preventScroll: true });
    } catch {
      setIssue("届かなかった。もう一度。");
    } finally {
      setPosting(false);
    }
  };
  const reset = () => {
    setSelected(null);
    setInsightsOpen(false);
    setThresholdAttention(false);
    setIssue("");
    setPhase(currentObservation.current ? "revising" : "writing");
    requestAnimationFrame(() => textarea.current?.focus());
  };
  const reveal = () => {
    if (phase !== "confronting") return;
    setSelected(null);
    setInsightsOpen(true);
    setThresholdAttention(false);
    setPhase("revealing");
    stage.current?.focus({ preventScroll: true });
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setFullscreen((v) => !v);
    } catch { setFullscreen((v) => !v); }
  };

  return (
    <main data-engine={engine ?? "loading"} data-version={sequence} data-ending={ending} className={`experience phase-${phase} atmosphere-${observation?.atmosphere ?? "waiting"} spotlight-${observation?.spotlight ?? "waiting"} ${observation ? "has-post" : ""} ${widening ? "is-widening" : ""} ${fullscreen ? "is-immersive" : ""} ${paused ? "is-paused" : ""} ${still ? "is-still" : ""} ${nearThreshold ? "is-near-threshold" : ""} ${revision ? "has-revision" : ""} ${posting ? "is-listening" : ""}`}>
      <div className="cosmic-glow" aria-hidden="true" />
      <div className="event-glow" key={`glow-${sequence}`} aria-hidden="true" />
      <EyesScene observation={observation} original={original} revision={revision} sequence={sequence} phase={phase} selected={selected} paused={paused || about || archive} still={still} ending={ending} nearThreshold={nearThreshold} onSelect={setSelected} />
      <div className="pressure-haze" aria-hidden="true" />
      <div className="release-veil" key={`release-${sequence}`} aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="exhibition-header">
        <div className="brand"><div className="brand-symbol"><Icon name="eye" size={29} /></div><h1 className="brand-title haunted-type" data-echo="衆目">衆目<span>THE HUNDRED EYES</span></h1></div>
        <nav className="header-actions" aria-label="作品の操作">
          <Ambience spotlight={observation?.spotlight ?? null} phase={phase} sequence={sequence} paused={paused || about || archive} still={still} nearThreshold={nearThreshold} />
          <button className="about-button" onClick={() => { setSelected(null); setAbout(true); }} aria-label="この作品について"><Icon name="info" size={17} /></button>
        </nav>
      </header>

      <aside className="observer-readout" aria-label="観測者数"><span className="micro-label"><span className="status-dot" /> EYES</span><div className="observer-count">100<span>/ 100</span></div><div className="readout-rule"><span /><span /><span /></div></aside>

      <section ref={stage} tabIndex={-1} className="central-experience" aria-label="投稿と観測">
        <div className="intro" aria-hidden="true" />
        <form className={`composer x-composer ${writing ? "is-draft" : "is-posted"}`} aria-busy={posting} onSubmit={(e) => { e.preventDefault(); void post(); }}>
          <span className="composer-surface" aria-hidden="true" />
          <div className="tweet-avatar" aria-hidden="true"><Icon name="profile" size={29} /></div>
          <div className="tweet-body">
            <div className="tweet-identity"><strong>あなた</strong><span>@you</span><span className="audience-pill">全員 <Icon name="down" size={10} /></span></div>
            <label className="sr-only" htmlFor="tweet">あなたのひと言</label>
            <textarea
              id="tweet" ref={textarea} value={text} readOnly={!writing || posting}
              onChange={(e) => setText(Array.from(e.target.value).slice(0, 140).join(""))}
              onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); post(); } }}
              placeholder="いまどうしてる？" rows={3} spellCheck={false}
            />
            <div className="reply-permission"><Icon name="globe" size={13} /><span>全員が返信できます</span>{!writing && <span className="post-seen"><Icon name="eye" size={12} />100</span>}</div>
          </div>
          <div className="composer-bottom">
            {writing && <div className="tweet-tools" aria-hidden="true">{COMPOSE_TOOLS.map((name) => <span key={name}><Icon name={name} size={17} /></span>)}</div>}
            <span className="character-count" aria-label={`${count}文字`}><span className="character-ring" style={{ "--progress": `${count / 140 * 360}deg` } as CSSProperties} />{writing && <span className="character-value">{count}<span> / 140</span></span>}</span>
            <button type="button" className={`post-button ${writing ? "" : "rewrite-button"}`} onClick={writing ? post : reset} disabled={writing ? !text.trim() || posting || composing : phase === "reacting" || phase === "revealing"} aria-label={writing ? "ポストする" : "書き直す"}>{posting ? "…" : writing ? "ポスト" : "書き直す"}</button>
          </div>
        </form>
        <div className="story-beat">
          <div className="examples" inert={!writing || posting} aria-hidden={!writing}>{EXAMPLES.map((example, i) => <button key={example.label} aria-label={example.label} onClick={() => { reset(); setText(example.text); }}><span className={`example-dot example-${i}`} />{["日常", "よろこび", "挑発"][i]}</button>)}</div>
          {revising && original && text.trim() !== original.text && <button className="original-words" disabled={posting} onClick={() => { setText(original.text); textarea.current?.focus(); }}>最初の言葉</button>}
          {issue && <p className="delivery-issue" role="alert">{issue}</p>}
          {(phase === "confronting" || phase === "revealing") && <div className="reveal-threshold">
            <button className="reveal-button insight-trigger" onClick={reveal} aria-label="ポストアナリティクスを見る" aria-controls="post-insights"
              disabled={phase !== "confronting"} aria-hidden={phase !== "confronting"} tabIndex={phase === "confronting" ? 0 : -1}
              onPointerEnter={(e) => { if (e.pointerType !== "touch") setThresholdAttention(true); }}
              onPointerLeave={() => setThresholdAttention(false)}
              onPointerDown={() => setThresholdAttention(true)}
              onFocus={() => setThresholdAttention(true)}
              onBlur={() => setThresholdAttention(false)}
            ><span className="insight-trigger-label"><Icon name="views" size={15} />ポストアナリティクス<Icon name="chevron" size={12} /></span>
              <span className="insight-trigger-count"><b>{observation?.readings.length}</b><span>インプレッション</span></span>
            </button>
          </div>}
        </div>
      </section>
      <WordRemains versions={versions} ending={ending} />
      <p className="sr-only" role="status">{ending === "coda" ? FINAL_LINE : posting ? "投稿の判定を待っています。" : phase === "confronting" ? "投稿が届きました。ポストアナリティクスで100人の全体を見られます。" : revealed ? `同じ100人。${observation?.counts.meh}人は無関心。共感した人は${observation?.counts.love}人、有益だと思った人は${observation?.counts.useful}人。` : ""}</p>

      <footer className="exhibition-footer">
        {observation && <PostInsights observation={observation} previous={previous} cycle={sequence} visible={showCensus}
          onClose={() => setInsightsOpen(false)} onArchive={() => { setSelected(null); setArchive(true); }} onSelect={setSelected} />}
        <div className="footer-baseline"><a className="artist-credit" href="https://x.com/uniminyo" target="_blank" rel="noopener noreferrer" aria-label="作者 @uniminyo のXを開く">@uniminyo</a><div className="space-tools">
          {revealed && !insightsOpen && <button className="utility-button" onClick={() => setInsightsOpen(true)} aria-label="ポストアナリティクスを見る"><Icon name="views" size={15} /></button>}
          {revealed && !paused && <button className="linger-button" onClick={linger} aria-label="余韻を見る">余韻</button>}<button className="utility-button" onClick={() => setPaused((v) => !v)} aria-pressed={paused} aria-label={paused ? "動きを再開" : "動きを止める"}><span className="pause-glyph">{paused ? "▷" : "Ⅱ"}</span></button><span className="tool-divider" /><button className="utility-button" onClick={toggleFullscreen} aria-label={fullscreen ? "没入表示を終了" : "没入表示"}><Icon name="expand" size={13} /></button></div></div>
      </footer>

      {selected && <EyePopover key={selected} id={selected} reading={observation?.readings[selectedIndex]} previous={previous?.readings[selectedIndex]} onClose={() => setSelected(null)} />}

      {about && <Modal title="この作品について" className="about-dialog" onClose={() => setAbout(false)}>
        <div className="about-eye"><Icon name="eye" size={43} /></div>
        <h2 className="haunted-type" data-echo="衆目">衆目</h2>
        <p className="artwork-title">THE HUNDRED EYES <span>2026</span></p>
        <div className="artist-statement">
          <p>ひとつの投稿、百の受け取り方。</p>
          <p>{engine === "jev" ? "Jevが同じ投稿を、百の視点から並列に判定します。関心、好意、不快、表に出したさ。その独立した値が、視線と光、声と沈黙になります。" : "Jevが同じ投稿を百の視点から並列に判定する構想です。関心、好意、不快、表に出したさを、視線と光、声と沈黙へ変換します。現在は端末内の仮判定で体験できます。"}</p>
          <p>目立つ声を見たあとで、全体を見る。<br />言葉を書き直し、同じ百人へ届け直す。<br />変わった反応と、自分の言葉の跡が残ります。</p>
        </div>
        <div className="artwork-medium">Jev / TypeSafe System One<br />{engine === "jev" ? "を用いたインタラクティブ・メディアアート" : "への接続を想定したインタラクティブ・メディアアート"}</div>
        <div className="about-disclosure">
          <p>人物定義、短い心の声、声の届きやすさは作者の設定です。無関心・称賛・批判の人数は固定しません。分析表示は架空の100人の判定を集計したものです。</p>
          <p>瞬きの波は、判定が揃ってから始まる演出です。波の順番や時間は、Jevの処理順・処理速度の実測ではありません。</p>
          <p>{engine === null ? "接続を確認しています。" : engine === "jev" ? "Jev接続中。ポストした文章をTypeSafeへ送信します。" : "仮判定版 · Jev未接続。入力はこの端末内だけで扱います。"}</p>
        </div>
        <JudgementCriteria engine={engine} />
        <button className="text-link" onClick={() => { setAbout(false); setArchive(true); }}>100人の内側 <Icon name="arrow" size={16} /></button>
      </Modal>}

      {archive && <Modal title="100人の内側" className="archive-dialog" onClose={() => setArchive(false)}>
        <ObserverArchive observation={observation} previous={previous} />
      </Modal>}
    </main>
  );
}
