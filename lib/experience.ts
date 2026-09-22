import { PERSONAS } from "./personas";

export type ReactionId = "love" | "useful" | "meh" | "annoying" | "gross" | "envy";
export type Atmosphere = "quiet" | "resonance" | "storm";
export type ExperiencePhase = "writing" | "reacting" | "confronting" | "revealing" | "reality" | "revising";
export type Spotlight = "criticism" | "praise";
export type Engine = "mock" | "jev";
export const FINAL_LINE = "その言葉は、誰のために。";
export const DIMENSIONS = [
  { id: "interest", label: "関心" },
  { id: "affection", label: "好意" },
  { id: "discomfort", label: "不快" },
  { id: "expression", label: "表に出したさ" },
] as const;
export type Dimension = typeof DIMENSIONS[number]["id"];
export type Feelings = Record<Dimension, number>;

export const EMOTIONS: { id: ReactionId; label: string; short: string; color: string }[] = [
  { id: "love", label: "いいね", short: "共感", color: "#dd99af" },
  { id: "useful", label: "有益・ブックマーク", short: "有益", color: "#91bfa7" },
  { id: "meh", label: "どうでもいい", short: "無関心", color: "#65737e" },
  { id: "annoying", label: "うざい", short: "反発", color: "#ea8769" },
  { id: "gross", label: "きもい", short: "拒絶", color: "#b398cd" },
  { id: "envy", label: "うらやましい", short: "羨望", color: "#c6b780" },
];

export type Reading = {
  id: string;
  reaction: ReactionId;
  probabilities: Record<ReactionId, number>;
  voice: number;
  reach: number;
  confidence: number;
  feelings: Feelings;
  certainty: Feelings;
  delivery: "silent" | "soft" | "loud" | "sneer" | "praise";
  // A short authored line, shared by the scene and the person's readout.
  thought?: string;
};

export type Observation = {
  text: string;
  readings: Reading[];
  atmosphere: Atmosphere;
  spotlight: Spotlight;
  counts: Record<ReactionId, number>;
  loudCount: number;
  praiseCount: number;
  sneerCount: number;
  intensity: number;
  source: Engine;
};

export type Revision = {
  changes: { id: string; amount: number }[];
  memory: { id: string; text: string } | null;
};

export const EXAMPLES: { label: string; text: string; atmosphere: Atmosphere }[] = [
  { label: "何気ない日常", text: "帰り道、月がきれいだった。それだけで、今日はいい日。", atmosphere: "quiet" },
  { label: "小さなよろこび", text: "ずっと作っていた作品が、やっと完成しました。見てくれた人、ありがとう。", atmosphere: "resonance" },
  { label: "尖ったひと言", text: "努力しない人に限って、世の中が悪いって言うよね。", atmosphere: "storm" },
];

export function seedOf(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0)!, 16777619);
  return h >>> 0;
}

export function randomFrom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

// A person's reach belongs to the authored world, not to model confidence.
export function voiceProfile(id: string) {
  const random = randomFrom(seedOf(`voice:${id}`));
  const publicVoice = ["v2", "v5"].includes(id) || random() > .78;
  return { reach: Math.round(publicVoice ? 9000 + random() * 40000 : 30 + random() * 1600),
    audibility: publicVoice ? .82 + random() * .18 : .12 + random() * .28 };
}

export function makeReading(id: string, reaction: ReactionId, feelings: Feelings,
  probabilities: Reading["probabilities"], confidence: number, certainty: Feelings): Reading {
  const profile = voiceProfile(id);
  const voice = feelings.expression * profile.audibility;
  const negative = reaction === "annoying" || reaction === "gross";
  const persona = PERSONAS.find((p) => p.id === id)!;
  const delivery = voice > .48 ? reaction === "love" ? "praise" : "loud"
    : negative && persona.cluster === "cool" && feelings.expression > .35 ? "sneer"
    : feelings.expression < .1 ? "silent" : "soft";
  return { id, reaction, feelings, probabilities, confidence, certainty, voice, reach: profile.reach, delivery };
}

export function assembleObservation(text: string, readings: Reading[], source: Engine): Observation {
  const counts = Object.fromEntries(EMOTIONS.map((e) => [e.id, readings.filter((r) => r.reaction === e.id).length])) as Observation["counts"];
  const positive = readings.filter((r) => ["love", "useful"].includes(r.reaction) && r.voice > .48).reduce((sum, r) => sum + r.voice, 0);
  const negative = readings.filter((r) => ["annoying", "gross", "envy"].includes(r.reaction) && (r.delivery === "loud" || r.delivery === "sneer")).reduce((sum, r) => sum + r.voice, 0);
  const spotlight = positive > negative ? "praise" : "criticism";
  const atmosphere = negative > 1.4 ? "storm" : positive > .5 ? "resonance" : "quiet";
  return { text: text.trim(), readings, counts, source, atmosphere, spotlight,
    loudCount: readings.filter((r) => r.delivery === "loud" || r.delivery === "praise").length,
    praiseCount: readings.filter((r) => r.delivery === "praise").length,
    sneerCount: readings.filter((r) => r.delivery === "sneer").length,
    intensity: Math.min(.85, Math.max(positive, negative) * .22),
  };
}

/**
 * Local semantic sketch, NOT Jev or a human prediction. Each authored person
 * keeps the same interests and reach. Text hashes never reshuffle the audience.
 * Counts emerge from the readings; there are no population quotas.
 */
export function observe(text: string): Observation {
  const words = text.normalize("NFKC").toLowerCase();
  const vulnerability = /頑張れない|がんばれない|疲れ|つらい|辛い|苦しい|休みたい|寂し|不安|泣|限界/.test(words);
  const resolve = /頑張ります|頑張る|がんばります|がんばる|努力|挑戦|続け|やります/.test(words);
  const joy = /ありがとう|完成|合格|嬉し|うれし|できた|作った|作りました|大好き|最高|幸せ|新作|応援/.test(words);
  const attack = /努力しない|許せない|バカ|嫌い|きもい|自己責任|くだらない|黙れ|無能|悪い|最低/.test(words);
  const practical = /役立|便利|おすすめ|方法|手順|節約|コード|仕組み|使い方|修正/.test(words);
  const daily = /月|帰り道|夕飯|天気|コーヒー|きれい|おつかれ|ご飯|散歩/.test(words);
  const privateLife = /夫|妻|恋人|結婚|家族|子ども/.test(words);
  const heat = joy || vulnerability || resolve || attack || /[!！]/.test(words);
  const readings = PERSONAS.map((p): Reading => {
    const rand = randomFrom(seedOf(`attention:${p.id}`));
    let interest = .03 + rand() * .11;
    let affection = .04 + rand() * .12;
    let discomfort = .02 + rand() * .09;
    let expression = .015 + rand() * .06;
    // Every person can be reached by relevant content. No permanently attentive
    // quarter, fixed indifferent majority, or text-hash audience reshuffling.
    {
      if (vulnerability && (p.cluster === "devotion" || p.cluster === "household")) {
        interest = .72 + rand() * .17; affection = .74 + rand() * .17; expression = .12 + rand() * .09;
      } else if ((joy || daily || privateLife) && ["devotion", "household", "omen"].includes(p.cluster)) {
        interest = .55 + rand() * .3; affection = .65 + rand() * .28;
        expression = p.cluster === "devotion" && joy ? .92 : .2;
      } else if ((resolve || practical) && ["ascend", "mechanism"].includes(p.cluster)) {
        interest = .57 + rand() * .3; affection = .52 + rand() * .25; expression = .26 + rand() * .16;
      }
      if ((vulnerability && ["order", "ascend"].includes(p.cluster)) ||
        (attack && ["order", "doubt", "omen", "devotion"].includes(p.cluster))) {
        interest = .4 + rand() * .36; discomfort = .64 + rand() * .29; expression = .86 + rand() * .12;
      }
      if (heat && p.cluster === "cool") {
        interest = .22 + rand() * .18; discomfort = .52 + rand() * .22; expression = .55 + rand() * .2;
      }
      if (joy && (p.cluster === "doubt" || p.cluster === "order")) {
        interest = .3 + rand() * .2; discomfort = .45 + rand() * .23; expression = .35 + rand() * .3;
      }
      if ((daily || practical || privateLife) && p.cluster === "absent") {
        const relevant = /天気|夕飯|ご飯|節約|使い方|家族/.test(words);
        if (relevant) {
          interest = .3 + rand() * .3; affection = .35 + rand() * .25; expression = .025 + rand() * .09;
        }
      }
    }
    const feelings = { interest: clamp(interest), affection: clamp(affection), discomfort: clamp(discomfort), expression: clamp(expression) };
    const reaction: ReactionId = discomfort > .45 ? (p.cluster === "order" && (vulnerability || privateLife) ? "gross" : "annoying")
      : interest < .3 ? "meh" : practical && p.cluster !== "devotion" ? "useful" : affection > .5 ? "love" : "meh";
    // Synthetic choice confidence is kept separate from the four independent axes.
    const probabilities = Object.fromEntries(EMOTIONS.map((e) => [e.id, reaction === e.id ? .85 : .03])) as Reading["probabilities"];
    return makeReading(p.id, reaction, feelings, probabilities, .85,
      { interest: .8, affection: .8, discomfort: .8, expression: .8 });
  });
  return assembleObservation(text, readings, "mock");
}

export function compareReadings(before: Observation, after: Observation, original: Observation): Revision {
  const previous = new Map(before.readings.map((r) => [r.id, r]));
  const changes = after.readings.flatMap((reading) => {
    const prior = previous.get(reading.id)!;
    // A changed class with low model certainty alone must not become a dramatic event.
    const amount = Math.max(...DIMENSIONS.map(({ id }) =>
      Math.abs(reading.feelings[id] - prior.feelings[id]) * Math.min(reading.certainty[id], prior.certainty[id])));
    return amount >= .09 || (reading.reaction !== prior.reaction && Math.min(reading.confidence, prior.confidence) >= .55)
      ? [{ id: reading.id, amount: Math.max(.12, amount) }] : [];
  });
  const memories = original.readings.flatMap((first) => {
    const now = after.readings.find((r) => r.id === first.id)!;
    const loss = first.feelings.interest - now.feelings.interest;
    return first.reaction === "love" && first.delivery === "soft" && first.feelings.affection >= .55
      && first.confidence >= .55 && loss >= .2 && Math.min(first.certainty.interest, now.certainty.interest) >= .5
      ? [{ id: first.id, loss }] : [];
  });
  return { changes, memory: after.text !== original.text && memories[0] ? { id: memories[0].id, text: original.text } : null };
}

export const THOUGHTS: Record<ReactionId, string[]> = {
  love: ["いいね。", "好き。", "わかる。"],
  useful: ["保存。", "使えそう。", "あとで読む。"],
  meh: ["……", "関係ない。", "ふーん。"],
  annoying: ["うざ。", "は？", "黙って。"],
  gross: ["きも。", "無理。", "引く。"],
  envy: ["ずるい。", "いいな。", "悔しい。"],
};

export function thoughtFor(reading: Reading, index: number) {
  return reading.thought ?? (reading.delivery === "praise" ? ["すごくいい！", "大好き！", "一生ついて行きます！"][index % 3]
    : reading.delivery === "sneer"
    ? ["笑。", "必死だね。", "で？"][index % 3]
    : THOUGHTS[reading.reaction][index % 3]);
}
