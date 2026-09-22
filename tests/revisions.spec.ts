import { expect, test } from "./fixtures";
import { assembleObservation, observe } from "../lib/experience";
import type { Page } from "@playwright/test";

const firstWords = "今日はもう頑張れない。";
const nextWords = "今日も頑張ります。";
const openInsights = async (page: Page) => {
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
};
const snapshot = (page: Page) => page.locator(".eye-target").evaluateAll((eyes) => eyes.map((eye) => ({
  id: eye.getAttribute("data-eye-id"), reaction: eye.getAttribute("data-reaction"), feelings: eye.getAttribute("data-feelings"),
})));

test("reposting evaluates the same people, replays the wave, and can restore the original words", async ({ page }, testInfo) => {
  const errors: string[] = [], externalPosts: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (request.method() === "POST") externalPosts.push(request.url()); });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  await input.fill(firstWords);
  await input.press("Control+Enter");
  await openInsights(page);
  const original = await snapshot(page);
  await page.locator(".eyes-scene canvas").evaluate((canvas) => canvas.setAttribute("data-original-room", "true"));
  await page.getByRole("button", { name: "書き直す" }).click();
  await input.fill(nextWords);
  await page.waitForTimeout(1000);
  expect(await snapshot(page)).toEqual(original);
  await expect(page.locator(".census")).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("01-rewriting.png"), scale: "css" });
  await input.press("Control+Enter");
  await expect(page.locator("main")).toHaveClass(/phase-reacting/);
  await expect(page.locator(".eyes-scene")).toHaveAttribute("data-wave-cycle", "2");
  await expect(page.locator(".eyes-scene canvas")).toHaveAttribute("data-original-room", "true");
  await openInsights(page);
  const revised = await snapshot(page);
  expect(revised.map((reading) => reading.id)).toEqual(original.map((reading) => reading.id));
  expect(revised).not.toEqual(original);
  const memory = page.locator(".eye-memory");
  await expect(memory).toHaveText(firstWords);
  const rememberedId = await page.locator(".eye-target[data-remembers]").getAttribute("data-eye-id");
  const before = original.find((reading) => reading.id === rememberedId)!;
  const now = revised.find((reading) => reading.id === rememberedId)!;
  expect(before.reaction).toBe("love");
  expect(JSON.parse(before.feelings!).interest - JSON.parse(now.feelings!).interest).toBeGreaterThan(.2);
  await expect.poll(() => memory.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.45);
  await page.screenshot({ path: testInfo.outputPath("02-remembered-words.png"), scale: "css" });
  await page.getByRole("button", { name: "書き直す" }).click();
  await page.getByRole("button", { name: "最初の言葉", exact: true }).click();
  await expect(input).toHaveValue(firstWords);
  await input.press("Control+Enter");
  await openInsights(page);
  expect(await snapshot(page)).toEqual(original);
  await expect(page.locator(".eye-target[data-remembers]")).toHaveCount(0);
  expect(externalPosts).toEqual([]);
  expect(errors).toEqual([]);
});

test("composition and drafting never commit a judgement before the next post", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  await input.fill("今日は静かです。");
  await input.press("Control+Enter");
  await openInsights(page);
  const original = await snapshot(page);
  await page.getByRole("button", { name: "書き直す" }).click();
  const version = await page.locator("main").getAttribute("data-version");
  await input.dispatchEvent("compositionstart");
  await input.fill(firstWords);
  await expect(page.getByRole("button", { name: "ポストする", exact: true })).toBeDisabled();
  await page.waitForTimeout(1000);
  await expect(page.locator("main")).toHaveAttribute("data-version", version!);
  await input.dispatchEvent("compositionend");
  await page.waitForTimeout(1000);
  expect(await snapshot(page)).toEqual(original);
  await input.fill("今日は静かです。 ");
  await input.press("Control+Enter");
  await openInsights(page);
  expect(await snapshot(page)).toEqual(original);
  await expect(page.locator(".eye-memory")).toHaveCount(0);
  await expect(page.locator(".x-composer")).toHaveCSS("transform", "none");
});

test("a failed live post keeps the last judgement and wave, then cached words can return", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const posted: string[] = [];
  let failing = false;
  await page.route("**/api/observe", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { engine: "jev" } });
    const text = route.request().postDataJSON().text;
    posted.push(text);
    return failing ? route.fulfill({ status: 502, json: { error: "unavailable" } })
      : route.fulfill({ json: { ...observe(text), source: "jev" } });
  });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  await input.fill(firstWords);
  await input.press("Control+Enter");
  await openInsights(page);
  const original = await snapshot(page);
  await page.getByRole("button", { name: "書き直す" }).click();
  failing = true;
  await input.fill(nextWords);
  await input.press("Control+Enter");
  await expect(page.getByRole("alert").filter({ hasText: "届かなかった" })).toBeVisible();
  expect(await snapshot(page)).toEqual(original);
  await expect(page.locator(".eyes-scene")).toHaveAttribute("data-wave-cycle", "1");
  await expect(page.locator("main")).toHaveAttribute("data-engine", "jev");
  failing = false;
  await input.press("Control+Enter");
  await openInsights(page);
  await page.getByRole("button", { name: "書き直す" }).click();
  await page.getByRole("button", { name: "最初の言葉", exact: true }).click();
  await input.press("Control+Enter");
  await openInsights(page);
  expect(await snapshot(page)).toEqual(original);
  expect(posted.filter((text) => text === firstWords)).toHaveLength(1);
});

test("a pending response cannot become an early wave or a duplicate post", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release: (() => Promise<void>) | undefined, requests = 0;
  await page.route("**/api/observe", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { engine: "jev" } });
    requests++;
    const text = route.request().postDataJSON().text;
    release = () => route.fulfill({ json: { ...observe(text), source: "jev" } });
  });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  await input.fill(firstWords);
  await input.press("Control+Enter");
  await expect(page.locator("main")).toHaveClass(/is-listening/);
  await expect(input).toHaveAttribute("readonly", "");
  await expect(page.locator("main")).toHaveAttribute("data-version", "0");
  await expect(page.locator(".eye-target[data-reaction]")).toHaveCount(0);
  await input.press("Control+Enter");
  expect(requests).toBe(1);
  await release!();
  await openInsights(page);
  await expect(page.locator(".eyes-scene")).toHaveAttribute("data-wave-cycle", "1");
  expect(requests).toBe(1);
});

test("a unanimous result remains intact and does not produce a hundred overlapping voices", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/observe", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { engine: "jev" } });
    const text = route.request().postDataJSON().text;
    const base = observe(text);
    return route.fulfill({ json: assembleObservation(text, base.readings.map((reading) => ({
      ...reading, reaction: "love", voice: .95, delivery: "praise",
      feelings: { interest: .9, affection: .95, discomfort: .02, expression: .95 },
    })), "jev") });
  });
  await page.goto("/");
  await page.getByRole("textbox", { name: "あなたのひと言" }).fill("ひとつの言葉");
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  await expect(page.locator(".eye-target[data-foreground]")).toHaveCount(4);
  await openInsights(page);
  await expect(page.locator('.insight-emotion[data-reaction="meh"]')).toHaveAttribute("data-count", "0");
  await expect(page.locator('.insight-emotion[data-reaction="love"]')).toHaveAttribute("data-count", "100");
  await expect(page.locator('.eye-target[data-reaction="love"]')).toHaveCount(100);
});
