"use client";

import { useCallback, useEffect, useRef } from "react";
import { PERSONAS, REACTIONS, REACTION_BY_JA } from "@/lib/personas";
import {
  blend, buildEdges, hexToRgb, layout, nearest, step, structuralEdges,
  type Edge, type Node,
} from "@/lib/web";

export type Verdict = {
  id: string;
  reaction: string;
  confidence: number;
  probabilities: Record<string, number>;
};

const colorOf = (ja: string) => REACTION_BY_JA[ja]?.color ?? "#9aa0a6";

/** 目が反応した瞬間に飛ぶしるし。いいね／リポストのつもり */
type Flourish = { x: number; y: number; kind: "like" | "repost" | "reject"; born: number };

export default function Web({
  verdicts,
  onPick,
}: {
  /** 判定が届くたびに差分で流し込む。届いた目だけが瞬いて色を変える */
  verdicts: Verdict[];
  onPick?: (personaId: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);   // 色つきの糸（反応で張り替わる）
  const frameRef = useRef<Edge[]>([]);  // 骨格の糸（常に張られている）
  const heldRef = useRef<number>(-1);
  const pointerRef = useRef({ x: 0, y: 0, down: false });
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const flourishRef = useRef<Flourish[]>([]);
  const pickedRef = useRef<string | null>(null);

  /* ---- 判定の取り込み ---- */
  useEffect(() => {
    if (!verdicts.length || !nodesRef.current.length) return;
    const now = performance.now();
    let changed = false;
    for (const v of verdicts) {
      const n = nodesRef.current.find((x) => x.id === v.id);
      if (!n) continue;
      if (n.reaction !== v.reaction) {
        n.changedAt = now;
        changed = true;
        // 好意的な反応にはいいね、有益にはリポスト、拒絶には×が飛ぶ
        const kind =
          v.reaction === "好き！" ? "like"
          : v.reaction === "これは有益！" ? "repost"
          : v.reaction === "きもい" || v.reaction === "うざ" ? "reject"
          : null;
        if (kind) flourishRef.current.push({ x: n.x, y: n.y, kind, born: now });
      }
      n.reaction = v.reaction;
      n.confidence = v.confidence;
      n.probabilities = v.probabilities;
    }
    // 反応が変わったら糸を張り替える。巣の形そのものが結果になる
    if (changed) edgesRef.current = buildEdges(nodesRef.current);
  }, [verdicts]);

  /* ---- 初期化とリサイズ ---- */
  const resize = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = rect.width * dpr;
    cv.height = rect.height * dpr;
    sizeRef.current = { w: rect.width, h: rect.height, dpr };

    const fresh = layout(PERSONAS, rect.width, rect.height);
    if (nodesRef.current.length === fresh.length) {
      // 既存の判定は保ったまま、定位置だけ更新する
      nodesRef.current.forEach((n, i) => {
        n.hx = fresh[i].hx; n.hy = fresh[i].hy;
        n.x = fresh[i].hx; n.y = fresh[i].hy;
      });
    } else {
      nodesRef.current = fresh;
    }
    frameRef.current = structuralEdges(nodesRef.current);
    edgesRef.current = buildEdges(nodesRef.current);
  }, []);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [resize]);

  /* ---- 描画ループ ---- */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const draw = (t: number) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) { raf = requestAnimationFrame(draw); return; }
      const { w, h, dpr } = sizeRef.current;
      const dt = Math.min((t - last) / 16.67, 2.2);
      last = t;

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const cx = w / 2;
      const cy = h / 2 - 10;

      // つかんでいる点を指に追従させる。ここが波の発生源になる
      if (heldRef.current >= 0) {
        const n = nodes[heldRef.current];
        if (n) { n.x = pointerRef.current.x; n.y = pointerRef.current.y; }
      }
      step(nodes, [...frameRef.current, ...edges], dt, t);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      /* 糸は描かない。引っ張ったときに波を伝えるための拘束として持つだけ。
         見せると有機的になり、狙っている無機質さから離れる。 */

      /* --- 目 --- */
      for (const n of nodes) {
        drawEye(ctx, n, t, cx, cy, n.id === pickedRef.current);
      }

      /* --- いいね／リポスト --- */
      flourishRef.current = flourishRef.current.filter((f) => t - f.born < 1400);
      for (const f of flourishRef.current) {
        const age = (t - f.born) / 1400;
        const rise = age * 34;
        const a = age < 0.2 ? age / 0.2 : 1 - (age - 0.2) / 0.8;
        drawFlourish(ctx, f.kind, f.x + Math.sin(age * 6) * 3, f.y - 14 - rise, a * 0.9, 1 + age * 0.4);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---- ドラッグ ---- */
  const pos = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent) => {
    const { x, y } = pos(e);
    pointerRef.current = { x, y, down: true };
    const i = nearest(nodesRef.current, x, y);
    heldRef.current = i;
    if (i >= 0) {
      nodesRef.current[i].held = true;
      pickedRef.current = nodesRef.current[i].id;
      onPick?.(nodesRef.current[i].id);
      canvasRef.current?.setPointerCapture(e.pointerId);
    } else {
      pickedRef.current = null;
      onPick?.(null);
    }
  };

  const onMove = (e: React.PointerEvent) => {
    const { x, y } = pos(e);
    pointerRef.current.x = x;
    pointerRef.current.y = y;
  };

  const onUp = (e: React.PointerEvent) => {
    const i = heldRef.current;
    if (i >= 0 && nodesRef.current[i]) {
      nodesRef.current[i].held = false;
      // 離した瞬間に勢いを渡すと、手を離したあともうねりが続く
      nodesRef.current[i].vx *= 0.5;
      nodesRef.current[i].vy *= 0.5;
    }
    heldRef.current = -1;
    pointerRef.current.down = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="h-full w-full touch-none select-none"
      style={{ cursor: "grab" }}
    />
  );
}

/* ============ 手描きのストローク ============ */

/** 個体ごとに固定の擬似乱数。毎フレーム振り直すと線がちらつく */
function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * 鉛筆で引いたような線。
 * 同じ曲線を少しずつずらして数回重ね、両端を細くする。
 * 一本の滑らかなベジェだと製図になり、絵にならない。
 */
function roughCurve(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  width: number,
  color: string,
  rand: () => number,
  passes = 3,
) {
  for (let p = 0; p < passes; p++) {
    const jx = (rand() - 0.5) * width * 1.5;
    const jy = (rand() - 0.5) * width * 1.5;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + jx, pts[0][1] + jy);
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const wob = width * 0.55;
      ctx.quadraticCurveTo(
        x0 + jx + (rand() - 0.5) * wob,
        y0 + jy + (rand() - 0.5) * wob,
        (x0 + x1) / 2 + jx,
        (y0 + y1) / 2 + jy,
      );
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0] + jx, last[1] + jy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (0.55 + rand() * 0.6);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

/**
 * 目。ペン画の写実に寄せる。
 *
 *   まぶたの折り目 → 下まぶた → 白目 → 虹彩の放射線 → 輪郭環 → 瞳孔
 *   → ハイライト → 上まぶたの影のハッチング → 上まぶたの太線 → まつ毛
 *
 * 虹彩の放射線が写実の要で、これが無いとただの楕円になる。
 * 線は全部インク（黒）で通し、色は虹彩の塗りにだけ乗せる。
 * そうすると、色が濃い目ほど無機質なまま不気味になる。
 */
function drawEye(
  ctx: CanvasRenderingContext2D,
  n: Node,
  t: number,
  cx: number,
  cy: number,
  picked = false,
) {
  const hasVerdict = !!n.reaction;
  const [r, g, b] = hasVerdict ? blend(n.probabilities, colorOf) : [150, 150, 156];
  const conf = hasVerdict ? n.confidence : 0.2;
  const rand = rng(Math.floor(n.seed * 10000) + 1);

  const toC = Math.atan2(cy - n.y, cx - n.x);
  const speed = Math.hypot(n.vx, n.vy);
  const drift = Math.atan2(n.vy, n.vx);
  const gaze = toC + Math.sin(drift - toC) * Math.min(speed * 0.12, 0.4);

  const W = 20;
  const since = t - n.changedAt;
  const blink = n.changedAt && since < 260 ? Math.abs(Math.cos((since / 260) * Math.PI)) : 1;
  const H = W * 0.5 * n.openness * Math.max(0.04, blink);
  const ir = H * 0.92; // 虹彩の半径

  const A = picked ? 1 : 0.5 + conf * 0.45;
  const ink = (a: number) => `rgba(26,24,30,${a * A})`;

  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.rotate(gaze);

  /* 白目の内側。ごくわずかに温かみを残す */
  ctx.beginPath();
  ctx.moveTo(-W, 0);
  ctx.quadraticCurveTo(-W * 0.2, -H * 2.05, W, 0);
  ctx.quadraticCurveTo(0, H * 1.7, -W, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(253,252,250,0.96)";
  ctx.fill();

  ctx.save();
  ctx.clip();

  /* 虹彩 */
  const px = -W * 0.08;
  ctx.beginPath();
  ctx.arc(px, 0, ir, 0, Math.PI * 2);
  ctx.fillStyle = hasVerdict
    ? `rgba(${r},${g},${b},${0.2 + conf * 0.42})`
    : "rgba(190,190,196,0.2)";
  ctx.fill();

  /* 放射線。写実の要 */
  ctx.lineWidth = 0.45;
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + n.seed;
    const inner = ir * (0.34 + rand() * 0.1);
    const outer = ir * (0.78 + rand() * 0.22);
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(px + Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.strokeStyle = ink(0.16 + rand() * 0.3);
    ctx.stroke();
  }

  /* 虹彩の輪郭環 */
  ctx.beginPath();
  ctx.arc(px, 0, ir, 0, Math.PI * 2);
  ctx.strokeStyle = ink(0.62);
  ctx.lineWidth = 1.1;
  ctx.stroke();

  /* 瞳孔 */
  ctx.beginPath();
  ctx.arc(px, 0, ir * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = ink(0.92);
  ctx.fill();

  /* ハイライト。瞳孔にかかる位置に置くと生きて見える */
  ctx.beginPath();
  ctx.ellipse(px - ir * 0.22, -ir * 0.3, ir * 0.19, ir * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();

  /* 上まぶたが落とす影。短い平行線のハッチング */
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 16; i++) {
    const x = -W + (i / 16) * W * 2;
    const top = -H * 2.0 * Math.sin(Math.PI * ((x + W) / (W * 2)));
    ctx.beginPath();
    ctx.moveTo(x, top * 0.98);
    ctx.lineTo(x + H * 0.28, top * 0.52);
    ctx.strokeStyle = ink(0.13 + rand() * 0.14);
    ctx.stroke();
  }
  ctx.restore();

  /* 下まぶた */
  roughCurve(ctx, [
    [-W, 0], [-W * 0.4, H * 1.35], [W * 0.35, H * 1.1], [W, 0],
  ], 1.1, ink(0.5), rand, 2);

  /* 上まぶた。いちばん太い */
  roughCurve(ctx, [
    [-W, 0], [-W * 0.45, -H * 1.9], [W * 0.3, -H * 1.75], [W, 0],
  ], 2.1, ink(0.85), rand, 3);

  /* まぶたの折り目。上まぶたの少し上を並走する */
  roughCurve(ctx, [
    [-W * 0.88, -H * 0.5], [-W * 0.4, -H * 2.55], [W * 0.35, -H * 2.3], [W * 0.95, -H * 0.5],
  ], 1.0, ink(0.4), rand, 2);

  /* 目頭。小さな切れ込み */
  roughCurve(ctx, [
    [-W, 0], [-W * 1.14, H * 0.24], [-W * 0.95, H * 0.42],
  ], 0.9, ink(0.45), rand, 2);

  /* まつ毛。上まぶたに沿って細かく生やす */
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 13; i++) {
    const tt = 0.12 + (i / 13) * 0.82;
    const x = -W + tt * W * 2;
    const y = -H * 1.9 * Math.sin(Math.PI * tt);
    const len = H * (0.6 + rand() * 0.5);
    const out = -0.9 - tt * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.3, y + len * out * 0.6, x + len * 0.85, y + len * out);
    ctx.strokeStyle = ink(0.4 + rand() * 0.35);
    ctx.stroke();
  }

  ctx.restore();
}

/** いいね・リポスト・拒絶のしるし。線画で通す */
function drawFlourish(
  ctx: CanvasRenderingContext2D,
  kind: "like" | "repost" | "reject",
  x: number,
  y: number,
  alpha: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "like") {
    ctx.strokeStyle = `rgba(224,69,123,${alpha})`;
    ctx.fillStyle = `rgba(224,69,123,${alpha * 0.85})`;
    ctx.beginPath();
    ctx.moveTo(0, 4.5);
    ctx.bezierCurveTo(-6, -0.5, -4.5, -6, 0, -3);
    ctx.bezierCurveTo(4.5, -6, 6, -0.5, 0, 4.5);
    ctx.fill();
  } else if (kind === "repost") {
    ctx.strokeStyle = `rgba(31,156,107,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(-5, -1.5); ctx.lineTo(-5, 2); ctx.lineTo(3, 2);
    ctx.moveTo(1, 4.5); ctx.lineTo(3.5, 2); ctx.lineTo(1, -0.5);
    ctx.moveTo(5, 1.5); ctx.lineTo(5, -2); ctx.lineTo(-3, -2);
    ctx.moveTo(-1, -4.5); ctx.lineTo(-3.5, -2); ctx.lineTo(-1, 0.5);
    ctx.stroke();
  } else {
    ctx.strokeStyle = `rgba(120,115,130,${alpha * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(-3.5, -3.5); ctx.lineTo(3.5, 3.5);
    ctx.moveTo(3.5, -3.5); ctx.lineTo(-3.5, 3.5);
    ctx.stroke();
  }
  ctx.restore();
}

export { REACTIONS };
