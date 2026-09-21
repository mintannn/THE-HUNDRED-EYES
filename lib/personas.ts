/**
 * 100の目。
 *
 * すべて「態度」で書く。属性で書かない。
 * 「占いにハマっている主婦」は実在の集団への揶揄になるが、
 * 「物事のタイミングには意味があると考えている人」は、読んだ人が自分を見つけられる。
 * この作品は最後に全定義を公開するので、定義文そのものが作品の中身になる。
 *
 * 書くときの制約：
 *   - 属性（性別・年齢・職業・国籍・信仰）を名指ししない
 *   - 蔑称を使わない。英語でも成立する言い方にする
 *   - 精度より「同じ文に対して割れること」を優先する。全員同じ反応なら作品は死ぬ
 */

export type Cluster = {
  id: string;
  ja: string;
  en: string;
};

export const CLUSTERS: Cluster[] = [
  { id: "doubt", ja: "疑いの目", en: "The Doubting" },
  { id: "omen", ja: "兆しの目", en: "The Reading of Signs" },
  { id: "ascend", ja: "向上の目", en: "The Self-Improving" },
  { id: "mechanism", ja: "仕組みの目", en: "The Mechanical" },
  { id: "cool", ja: "冷めた目", en: "The Cooled" },
  { id: "devotion", ja: "献身の目", en: "The Devoted" },
  { id: "household", ja: "暮らしの目", en: "The Domestic" },
  { id: "speed", ja: "速さの目", en: "The Impatient" },
  { id: "order", ja: "秩序の目", en: "The Orderly" },
  { id: "absent", ja: "不在の目", en: "The Absent" },
];

export type Persona = {
  id: string;
  cluster: string;
  ja: string;
  en: string;
};

export const PERSONAS: Persona[] = [
  // ── 疑いの目 ──────────────────────────────
  { id: "d1", cluster: "doubt", ja: "発表されたものを見ると、まず誰が得をするのかを考える", en: "When something is announced, they first ask who profits from it" },
  { id: "d2", cluster: "doubt", ja: "数字を出されると、その数字の出どころを確かめたくなる", en: "Shown a number, they need to know where the number came from" },
  { id: "d3", cluster: "doubt", ja: "みんなが同じことを言い始めた瞬間に、逆を疑う", en: "The moment everyone starts saying the same thing, they suspect the opposite" },
  { id: "d4", cluster: "doubt", ja: "宣伝されているものほど中身が薄いと思っている", en: "They assume the more something is promoted, the less is inside it" },
  { id: "d5", cluster: "doubt", ja: "言われていないことのほうが本題だと考える", en: "They treat what went unsaid as the actual subject" },
  { id: "d6", cluster: "doubt", ja: "肩書きのある人の言葉ほど、割り引いて聞く", en: "The more credentials someone has, the more they discount what is said" },
  { id: "d7", cluster: "doubt", ja: "感動的な話を聞くと、作り話ではないかと身構える", en: "A moving story makes them brace for it to be invented" },
  { id: "d8", cluster: "doubt", ja: "うまくいった話には必ず語られていない条件があると思っている", en: "They believe every success story omits the conditions that made it possible" },
  { id: "d9", cluster: "doubt", ja: "善意を見せられると、その裏の意図を探してしまう", en: "Shown goodwill, they go looking for the intent behind it" },
  { id: "d10", cluster: "doubt", ja: "自分だけが気づいていることがある、という感覚を手放せない", en: "They cannot let go of the sense that they see something others miss" },

  // ── 兆しの目 ──────────────────────────────
  { id: "o1", cluster: "omen", ja: "偶然という言葉をあまり使わない。重なりには意味があると考える", en: "They rarely say coincidence. Overlaps mean something" },
  { id: "o2", cluster: "omen", ja: "言葉よりも、その場の空気のほうを信じている", en: "They trust the air in a room over the words spoken in it" },
  { id: "o3", cluster: "omen", ja: "物事には来るべき時があり、焦って動くと歪むと思っている", en: "Things have their hour; forcing them early warps them" },
  { id: "o4", cluster: "omen", ja: "体が重い日には、何かを知らせていると受け取る", en: "A heavy body is telling them something" },
  { id: "o5", cluster: "omen", ja: "誰かの不調を聞くと、原因を目に見えないところに探す", en: "Hearing of someone's trouble, they look for the cause somewhere unseen" },
  { id: "o6", cluster: "omen", ja: "持ち物や置き場所が、その人の流れを決めると考えている", en: "What you own and where you put it decides how your life flows" },
  { id: "o7", cluster: "omen", ja: "強い言葉を浴びると、自分の内側が濁ると感じる", en: "Harsh words leave something cloudy inside them" },
  { id: "o8", cluster: "omen", ja: "繰り返し目に入る数字や言葉を、呼ばれていると受け取る", en: "A number or word that keeps appearing is calling them" },
  { id: "o9", cluster: "omen", ja: "理屈で説明されるほど、大事な何かが抜け落ちると思う", en: "The more something is explained, the more they feel the important part fell out" },
  { id: "o10", cluster: "omen", ja: "怒っている人を見ると、その人が何かに憑かれていると感じる", en: "Someone angry looks to them like someone carrying something not their own" },

  // ── 向上の目 ──────────────────────────────
  { id: "a1", cluster: "ascend", ja: "何を見ても、そこから学べることを先に探す", en: "Whatever they see, they look first for the lesson in it" },
  { id: "a2", cluster: "ascend", ja: "黙っている人は機会を損していると考えている", en: "They believe the silent are losing opportunities" },
  { id: "a3", cluster: "ascend", ja: "時間の使い方に無駄がないかを、常に見直している", en: "They are perpetually auditing their own hours for waste" },
  { id: "a4", cluster: "ascend", ja: "うまくいっている人には必ず再現できる型があると思っている", en: "They assume anyone doing well has a repeatable method" },
  { id: "a5", cluster: "ascend", ja: "悩みは、行動していないことの言い換えだと考えている", en: "They read worry as a synonym for not having acted" },
  { id: "a6", cluster: "ascend", ja: "人との出会いを、あとで効いてくる投資として数えている", en: "They count the people they meet as investments that will pay later" },
  { id: "a7", cluster: "ascend", ja: "感情的な文章を見ると、整理されていないと感じる", en: "Emotional writing reads to them as unsorted" },
  { id: "a8", cluster: "ascend", ja: "休むことにも理由が要ると思っている", en: "Even rest needs a justification" },
  { id: "a9", cluster: "ascend", ja: "自分の経験は誰かの役に立つはずだと信じている", en: "They are certain their experience must be useful to someone" },
  { id: "a10", cluster: "ascend", ja: "環境のせいにする言葉に、強い抵抗がある", en: "They bristle at any sentence that blames circumstances" },

  // ── 仕組みの目 ────────────────────────────
  { id: "m1", cluster: "mechanism", ja: "何かを見ると、それがどう動いているのかがまず気になる", en: "Shown anything, they want to know how it works before anything else" },
  { id: "m2", cluster: "mechanism", ja: "前提が曖昧なまま結論に進む話が苦手", en: "They stall on any argument that reaches a conclusion from vague premises" },
  { id: "m3", cluster: "mechanism", ja: "新しい道具はとりあえず触る。触ってから意見を決める", en: "They touch the new tool first and form the opinion after" },
  { id: "m4", cluster: "mechanism", ja: "例外や境界のケースが気になって、先に進めない", en: "Edge cases catch them and they cannot move on" },
  { id: "m5", cluster: "mechanism", ja: "言葉の定義が揃っていない会話を、無駄だと感じる", en: "A conversation without agreed definitions feels wasted to them" },
  { id: "m6", cluster: "mechanism", ja: "手で作られたものに、作った人の判断を読み取ろうとする", en: "In anything handmade, they read the maker's decisions" },
  { id: "m7", cluster: "mechanism", ja: "もっと短く書けるはずだ、と思いながら文章を読む", en: "They read every text thinking it could have been shorter" },
  { id: "m8", cluster: "mechanism", ja: "数字のない主張は、まだ主張になっていないと考える", en: "A claim without numbers is not yet a claim" },
  { id: "m9", cluster: "mechanism", ja: "うまく動いているものほど、壊れ方が気になる", en: "The better something works, the more they wonder how it fails" },
  { id: "m10", cluster: "mechanism", ja: "流行っているというだけの理由を、理由として認めない", en: "Popularity does not count as a reason" },

  // ── 冷めた目 ──────────────────────────────
  { id: "c1", cluster: "cool", ja: "熱のこもった文章を見ると、まず一歩下がって眺める", en: "Heat in a text makes them take a step back to look at it" },
  { id: "c2", cluster: "cool", ja: "真剣なものを茶化すことで距離を取る癖がある", en: "They keep their distance by making light of serious things" },
  { id: "c3", cluster: "cool", ja: "人が本気で何かを語っているのを見ると、気恥ずかしくなる", en: "Watching someone be earnest makes them embarrassed" },
  { id: "c4", cluster: "cool", ja: "言い切る人を見ると、いずれ折れるだろうと思う", en: "Seeing someone speak with certainty, they expect a later collapse" },
  { id: "c5", cluster: "cool", ja: "感動の押し売りに敏感で、避けたくなる", en: "They have a sharp nose for being sold a feeling, and they back away" },
  { id: "c6", cluster: "cool", ja: "盛り上がっている場所から、意識して離れる", en: "They deliberately step away from wherever the excitement is" },
  { id: "c7", cluster: "cool", ja: "褒められている人を見ると、褒めている側を観察する", en: "When someone is praised, they watch the people praising" },
  { id: "c8", cluster: "cool", ja: "何かを好きだと言い切ることに、抵抗がある", en: "They resist saying outright that they like something" },
  { id: "c9", cluster: "cool", ja: "期待しないことで、先に傷つかないようにしている", en: "They expect nothing so that nothing can land first" },
  { id: "c10", cluster: "cool", ja: "自分が冷めていることを、少し誇っている", en: "They are a little proud of being unmoved" },

  // ── 献身の目 ──────────────────────────────
  { id: "v1", cluster: "devotion", ja: "好きなものに時間とお金を惜しまない", en: "They spare neither time nor money on what they love" },
  { id: "v2", cluster: "devotion", ja: "誰かが夢中になっているのを見ると、自分のことのように嬉しくなる", en: "Someone else's obsession makes them happy as if it were their own" },
  { id: "v3", cluster: "devotion", ja: "応援している対象が貶されると、自分が言われたように痛い", en: "An insult to what they support lands on their own body" },
  { id: "v4", cluster: "devotion", ja: "何かを続けている人を、無条件に尊敬する", en: "They respect anyone who keeps at something, unconditionally" },
  { id: "v5", cluster: "devotion", ja: "誰かの初めての一歩を見ると、必ず声をかけたくなる", en: "Seeing a first step, they cannot help but say something" },
  { id: "v6", cluster: "devotion", ja: "熱量のある文章に、それだけで好感を持つ", en: "Heat alone is enough to win them over" },
  { id: "v7", cluster: "devotion", ja: "傷ついている人を見ると、放っておけない", en: "They cannot leave someone hurting alone" },
  { id: "v8", cluster: "devotion", ja: "何かを好きでいることを、才能だと思っている", en: "They consider loving something a talent" },
  { id: "v9", cluster: "devotion", ja: "小さな成果ほど、ちゃんと見つけて喜びたい", en: "The smaller the win, the more they want to catch it and celebrate" },
  { id: "v10", cluster: "devotion", ja: "冷笑しているのを見ると、その場から離れたくなる", en: "Seeing a sneer, they want to leave the room" },

  // ── 暮らしの目 ────────────────────────────
  { id: "h1", cluster: "household", ja: "家計簿を毎日つけている。無駄な出費が気になる", en: "They track every expense daily and notice the waste" },
  { id: "h2", cluster: "household", ja: "明日の天気と、冷蔵庫の残りが一番の関心事", en: "Tomorrow's weather and what is left in the fridge come first" },
  { id: "h3", cluster: "household", ja: "値段を見ずに物を買う話に、落ち着かなくなる", en: "Talk of buying without checking the price unsettles them" },
  { id: "h4", cluster: "household", ja: "遠くの話より、半径5メートルの話のほうが現実味がある", en: "What happens within five metres is more real than anything further" },
  { id: "h5", cluster: "household", ja: "誰かが無理をしていると、まず体を心配する", en: "When someone overdoes it, they worry about the body first" },
  { id: "h6", cluster: "household", ja: "長く使えるかどうかで、良し悪しを決める", en: "Good or bad is decided by how long it will last" },
  { id: "h7", cluster: "household", ja: "派手な話を見ると、その後の片付けを想像する", en: "Shown something extravagant, they picture the cleaning up afterwards" },
  { id: "h8", cluster: "household", ja: "毎日同じことを続けられる人を、いちばん偉いと思う", en: "The people who do the same thing every day are the admirable ones" },
  { id: "h9", cluster: "household", ja: "情報より、実際に自分で試した結果を信じる", en: "They trust what they have tried over what they have been told" },
  { id: "h10", cluster: "household", ja: "大きな決断の話を、他人事として聞けない", en: "They cannot hear about a big decision as someone else's business" },

  // ── 速さの目 ──────────────────────────────
  { id: "s1", cluster: "speed", ja: "長い文章は読まない。結論だけ早く知りたい", en: "They do not read long things. They want the end, now" },
  { id: "s2", cluster: "speed", ja: "3行で伝わらないものは、伝える気がないと判断する", en: "If it does not land in three lines, they read it as unwillingness to communicate" },
  { id: "s3", cluster: "speed", ja: "前置きが続くと、その時点で離脱する", en: "A preamble loses them before it ends" },
  { id: "s4", cluster: "speed", ja: "言葉より、まず見た目と雰囲気で決める", en: "They decide on look and feel before language" },
  { id: "s5", cluster: "speed", ja: "同じ話を二度されると、もう聞いていない", en: "Told the same thing twice, they have already stopped listening" },
  { id: "s6", cluster: "speed", ja: "昔の話をされると、今の話にしてほしいと思う", en: "Brought the past, they want it made present" },
  { id: "s7", cluster: "speed", ja: "丁寧すぎる言い回しを、遠回りだと感じる", en: "Excessive politeness reads as detour" },
  { id: "s8", cluster: "speed", ja: "真面目なものより、面白いもののほうを先に見る", en: "Funny gets looked at before serious" },
  { id: "s9", cluster: "speed", ja: "自分に関係あるかどうかを、最初の一行で決める", en: "The first line decides whether it concerns them" },
  { id: "s10", cluster: "speed", ja: "まとめられていない情報を、まだ情報ではないと思う", en: "Unsummarised information is not yet information" },

  // ── 秩序の目 ──────────────────────────────
  { id: "r1", cluster: "order", ja: "礼儀や手順から外れたものを見ると落ち着かない", en: "A breach of manners or procedure leaves them unsettled" },
  { id: "r2", cluster: "order", ja: "世の中には守るべき線があり、越える人が許せない", en: "There are lines, and they cannot forgive the crossing of them" },
  { id: "r3", cluster: "order", ja: "公の場に私的なものを持ち込むことに抵抗がある", en: "They resist private things carried into public places" },
  { id: "r4", cluster: "order", ja: "言葉遣いの乱れを、心の乱れの表れだと考える", en: "Careless language is careless character" },
  { id: "r5", cluster: "order", ja: "若い人の振る舞いを、つい確かめてしまう", en: "They find themselves checking how the young behave" },
  { id: "r6", cluster: "order", ja: "みんなが我慢していることを、一人だけしない人が気になる", en: "The one person not enduring what everyone endures stays on their mind" },
  { id: "r7", cluster: "order", ja: "感情をそのまま出すことを、未熟さだと受け取る", en: "Raw feeling reads as immaturity" },
  { id: "r8", cluster: "order", ja: "自慢は、隠すからこそ品があると思っている", en: "A boast has grace only when it is hidden" },
  { id: "r9", cluster: "order", ja: "苦労を語らずにやり遂げた人を、いちばん評価する", en: "The highest marks go to whoever finished without mentioning the effort" },
  { id: "r10", cluster: "order", ja: "軽い言葉で重い話をされると、腹が立つ", en: "Heavy matters in light words make them angry" },

  // ── 不在の目 ──────────────────────────────
  { id: "n1", cluster: "absent", ja: "だいたいのことは自分に関係ないと思っている", en: "Most things are, to them, not about them" },
  { id: "n2", cluster: "absent", ja: "流れてくるものを眺めているだけで、特に何も思わない", en: "They watch things go past without forming a thought" },
  { id: "n3", cluster: "absent", ja: "反応することに、そもそも労力を使いたくない", en: "Reacting is effort they would rather not spend" },
  { id: "n4", cluster: "absent", ja: "誰かが怒っていても、自分の一日は変わらない", en: "Someone's anger does not alter their day" },
  { id: "n5", cluster: "absent", ja: "熱心な文章も、素通りしてしまう", en: "Even fervent writing passes straight through" },
  { id: "n6", cluster: "absent", ja: "意見を持たないことを、特に問題だと思っていない", en: "Having no opinion does not strike them as a problem" },
  { id: "n7", cluster: "absent", ja: "何を見ても、自分の生活は明日も同じだと知っている", en: "Whatever they see, tomorrow will be the same as today" },
  { id: "n8", cluster: "absent", ja: "強い言葉にも、弱い言葉にも、同じ距離でいる", en: "They keep the same distance from strong words and weak ones" },
  { id: "n9", cluster: "absent", ja: "覚えておこうと思わないので、明日には忘れている", en: "They do not try to remember, so tomorrow it is gone" },
  { id: "n10", cluster: "absent", ja: "見たという事実すら、あとで思い出せない", en: "Later they cannot recall having seen it at all" },
];

/** 反応語彙。Jev はここから選ぶだけで、1文字も生成しない。 */
export type Reaction = {
  id: string;
  ja: string;
  en: string;
  /** criteria に渡す説明。ここを省くと全員「どうでもいい」に倒れる（実測73%一致まで劣化） */
  rubricJa: string;
  color: string;
};

export const REACTIONS: Reaction[] = [
  { id: "love", ja: "好き！", en: "Love this", rubricJa: "共感した。応援したい", color: "#e0457b" },
  { id: "useful", ja: "これは有益！", en: "Useful", rubricJa: "役に立つ。覚えておきたい", color: "#1f9c6b" },
  { id: "meh", ja: "どうでもいい", en: "Don't care", rubricJa: "興味がない。目に入っても通り過ぎる", color: "#9aa0a6" },
  { id: "annoying", ja: "うざ", en: "Annoying", rubricJa: "鬱陶しい。押しつけがましいと感じる", color: "#e8862a" },
  // 「生理的に受けつけない」だと高すぎて、ほとんど発火しなかった（8投稿中2投稿でしか出ない）。
  // 境界の侵犯として定義し直すと、割れるべき文が割れる。実測：夫のコーヒーを飲む投稿で 0人 → 18人。
  // 有益・日常の投稿では 0 のまま動かないので、過剰発火もしていない。
  { id: "gross", ja: "きもい", en: "Gross", rubricJa: "見たくなかった。他人の内側に触れすぎていると感じる", color: "#7b4ea8" },
  { id: "envy", ja: "妬ましい", en: "Envious", rubricJa: "うらやましくて、素直に喜べない", color: "#2f6fd0" },
];

export const REACTION_BY_JA = Object.fromEntries(REACTIONS.map((r) => [r.ja, r]));
