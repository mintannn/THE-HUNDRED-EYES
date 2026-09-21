/**
 * 巣のレイアウトと物理。
 *
 * 100個の目を配置し、同じ反応をした目同士を糸で結ぶ。
 * 投稿を変えると反応が変わり、糸が張り替わって巣の形そのものが組み替わる。
 *
 * 全員が「どうでもいい」に倒れた投稿では、灰色の大きな塊がひとつできる。
 * 割れる投稿では、巣が色ごとに裂ける。形が結果を語る。
 */

import type { Persona } from "./personas";

export type Node = {
  id: string;
  cluster: string;
  /** 現在位置 */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 定位置。ここへ弱く引き戻すことで、揺らしても巣が崩壊しない */
  hx: number;
  hy: number;
  /** つかまれている間は物理を無視して指に追従する */
  held: boolean;
  /** 見た目のゆらぎを個体ごとにずらす種 */
  seed: number;
  /** 巣の格子上の位置。骨格を張るのに使う */
  spoke: number;
  ring: number;
  /** 中心（言葉）の方向。目はここを向く */
  toCenter: number;
  /** まぶたの開き具合の個体差。全部同じ形だと版画になる */
  openness: number;

  /** 最新の判定 */
  reaction: string | null;
  confidence: number;
  probabilities: Record<string, number>;
  /** 判定が切り替わった時刻。瞬きの演出に使う */
  changedAt: number;
};

export type Edge = {
  a: number;
  b: number;
  /** 共有している反応。骨格の糸は null で、色を持たない */
  reaction: string | null;
  /** 自然長 */
  rest: number;
};

/**
 * 定位置を決める。
 * 均等な円だと機械的に見えるので、クラスタごとに扇を割り当てたうえで
 * 半径と角度に散らばりを入れる。黄金角で回すと規則性が目に見えにくい。
 */
/**
 * 規則正しい格子に並べる。標本シートや監視モニタの並び。
 *
 * 散らすと有機的になり、蜘蛛の巣に見える。無機質にしたいので格子に戻す。
 * ゆらぎは位置ではなく「まぶたの開き」と「向き」にだけ与える。
 * 同じ器具が100個並んでいて、中身だけが違う、という見え方にする。
 */
export function layout(personas: Persona[], w: number, h: number): Node[] {
  const cols = Math.max(6, Math.round(Math.sqrt(personas.length * (w / h))));
  const rows = Math.ceil(personas.length / cols);
  const padX = w * 0.055;
  const padY = h * 0.09;
  const stepX = (w - padX * 2) / Math.max(1, cols - 1);
  const stepY = (h - padY * 2) / Math.max(1, rows - 1);

  return personas.map((p, i) => {
    const gx = i % cols;
    const gy = Math.floor(i / cols);
    const rnd = (k: number) => (((Math.sin((i + 1) * k) * 43758.5453) % 1) + 1) % 1;

    const x = padX + gx * stepX;
    const y = padY + gy * stepY;

    return {
      id: p.id, cluster: p.cluster,
      x, y, vx: 0, vy: 0, hx: x, hy: y,
      held: false, seed: rnd(31.7),
      spoke: gx, ring: gy,
      toCenter: 0,
      openness: 0.72 + rnd(4.7) * 0.34,
      reaction: null, confidence: 0, probabilities: {}, changedAt: 0,
    };
  });
}

/**
 * 格子の隣を結ぶ。
 * これは描画しない。引っ張ったときに波が伝わるためだけの拘束として置く。
 * 糸を見せると有機的になるが、無いと格子がバラバラに動いて紙に見えない。
 */
export function structuralEdges(nodes: Node[], cols?: number): Edge[] {
  const c = cols ?? Math.max(...nodes.map((n) => n.spoke)) + 1;
  const at = (gx: number, gy: number) =>
    nodes.findIndex((n) => n.spoke === gx && n.ring === gy);
  const out: Edge[] = [];
  const push = (a: number, b: number) => {
    if (a < 0 || b < 0) return;
    out.push({ a, b, reaction: null, rest: Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) });
  };
  for (const n of nodes) {
    push(at(n.spoke, n.ring), at(n.spoke + 1, n.ring));
    push(at(n.spoke, n.ring), at(n.spoke, n.ring + 1));
  }
  return out;
}

/**
 * 同じ反応をした目同士を結ぶ。
 *
 * 全部を総当たりで結ぶと、94人が同じ反応をした投稿で 4,000本を超えて
 * 面になってしまう。近い相手だけに絞ることで、糸の束として見え続ける。
 */
export function buildEdges(nodes: Node[], k = 2, maxDist = 220): Edge[] {
  const byReaction = new Map<string, number[]>();
  nodes.forEach((n, i) => {
    if (!n.reaction) return;
    const arr = byReaction.get(n.reaction) ?? [];
    arr.push(i);
    byReaction.set(n.reaction, arr);
  });

  const seen = new Set<string>();
  const edges: Edge[] = [];

  for (const [reaction, idx] of byReaction) {
    for (const i of idx) {
      const near = idx
        .filter((j) => j !== i)
        .map((j) => ({ j, d: dist(nodes[i], nodes[j]) }))
        .filter(({ d }) => d < maxDist) // 画面を横断する長い弦を作らない
        .sort((a, b) => a.d - b.d)
        .slice(0, k);
      for (const { j, d } of near) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ a: i, b: j, reaction, rest: d });
      }
    }
  }
  return edges;
}

const dist = (a: Node, b: Node) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * 1フレーム進める。
 *
 * 糸のバネ（つながりを伝える）と、定位置へのバネ（形を保つ）の2本立て。
 * つかんだ点の動きが糸を伝って波になり、離すと減衰して戻る。
 */
export function step(nodes: Node[], edges: Edge[], dt: number, t: number) {
  const THREAD = 0.034; // ゆるい糸。低いほどたわんで、波がゆっくり伝わる
  const HOME = 0.012; // 定位置へ戻る力。弱くしないとうねりが死ぬ
  const DAMP = 0.955;

  for (const e of edges) {
    const a = nodes[e.a];
    const b = nodes[e.b];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const f = ((d - e.rest) / d) * THREAD;
    const fx = dx * f;
    const fy = dy * f;
    if (!a.held) { a.vx += fx; a.vy += fy; }
    if (!b.held) { b.vx -= fx; b.vy -= fy; }
  }

  for (const n of nodes) {
    if (n.held) { n.vx = 0; n.vy = 0; continue; }
    n.vx += (n.hx - n.x) * HOME;
    n.vy += (n.hy - n.y) * HOME;
    // ごくわずかな漂い。止まって見えると標本になってしまう
    n.vx += Math.sin(t * 0.0007 + n.seed * 31) * 0.014;
    n.vy += Math.cos(t * 0.0006 + n.seed * 17) * 0.014;
    n.vx *= DAMP;
    n.vy *= DAMP;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
  }
}

export function nearest(nodes: Node[], x: number, y: number, max = 44) {
  let best = -1;
  let bd = max * max;
  nodes.forEach((n, i) => {
    const d = (n.x - x) ** 2 + (n.y - y) ** 2;
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

/** 確率を混ぜて1色にする。1位だけで塗ると、無関心が多い投稿が灰色一色になる */
export function blend(
  probabilities: Record<string, number>,
  colorOf: (ja: string) => string,
): [number, number, number] {
  let r = 0, g = 0, b = 0, sum = 0;
  for (const [ja, p] of Object.entries(probabilities)) {
    const [cr, cg, cb] = hexToRgb(colorOf(ja));
    // 素直に平均すると全部が灰色に寄るので、優勢な色を少し立てる
    const w = Math.pow(p, 2.1);
    r += cr * w; g += cg * w; b += cb * w; sum += w;
  }
  if (!sum) return [150, 150, 150];
  return [r / sum, g / sum, b / sum];
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
