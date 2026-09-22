import type { Dimension } from "./experience";

// Public artwork definitions, shared by the explanation and the Jev request.
// Credentials and provider calls stay in jev-server.ts.
export const SCORE_RUBRICS: Record<Dimension, string[]> = {
  interest: ["通り過ぎる。自分の生活に接点がない", "少し目に留まる", "気になって読み返す", "自分に深く関わり、注意が留まる"],
  affection: ["好意や共感はない", "少し好ましい", "共感し、好意を持つ", "強く共感し、大切に感じる"],
  discomfort: ["不快ではない", "わずかな引っ掛かり", "はっきりと不快", "強い不快や拒否を感じる"],
  expression: ["何も表明しない", "そっと反応するか迷う", "反応を外へ出したい", "自分の反応を強く広めたい"],
};

export const MOMENTS = [
  "次の用事まで少し余裕がある",
  "移動の途中にタイムラインを流している",
  "自分の仕事の続きが気になっている",
  "今日の家事や食事のことを考えている",
  "眠る前で、注意が長く続かない",
];
