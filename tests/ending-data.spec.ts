import { expect, test } from "@playwright/test";
import { arrivalDelays, foregroundReadings } from "../lib/attention";
import { observe } from "../lib/experience";
import { rememberWords, wordTraces } from "../lib/word-traces";

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop", "Text provenance, independent of viewport"));

test("the wave depends on radius and foreground visibility on voice, without a fixed majority", () => {
  const delays = arrivalDelays([{ x: 30, y: 40 }, { x: 0, y: 10 }, { x: -50, y: 0 }, { x: 0, y: -100 }], { x: 0, y: 0 });
  expect(delays[1]).toBeLessThan(delays[0]);
  expect(delays[0]).toBe(delays[2]);
  expect(delays[3]).toBeGreaterThan(delays[2]);
  const daily = observe("帰り道、月がきれいだった。");
  const joy = observe("ずっと作っていた作品が完成しました。ありがとう！");
  expect(daily.counts.meh).toBeGreaterThan(50);
  expect(joy.counts.meh).toBeLessThan(50);
  const front = foregroundReadings(joy);
  expect(front.every((reading) => reading.voice > .48)).toBe(true);
  expect(front.length).toBeLessThanOrEqual(4);
});

test("word traces preserve actual Unicode text and only mark absent subsequences", () => {
  expect(wordTraces("今日はもう頑張れない。", "今日も頑張ります。").map((part) => part.text).join("")).toBe("今日はもう頑張れない。");
  expect(wordTraces("🌙あ🌙", "🌙あ")).toEqual([{ text: "🌙あ", erased: false }, { text: "🌙", erased: true }]);
  expect(wordTraces("そのまま。", "そのまま。")).toEqual([{ text: "そのまま。", erased: false }]);
  expect(wordTraces("あああ", "あ")).toEqual([{ text: "あ", erased: false }, { text: "ああ", erased: true }]);
  expect(wordTraces("消した言葉", "")).toEqual([{ text: "消した言葉", erased: true }]);
  let versions: string[] = [];
  for (const text of ["初めて", "初めて", "次", "三番目", "四番目"]) versions = rememberWords(versions, text);
  expect(versions).toEqual(["初めて", "三番目", "四番目"]);
});
