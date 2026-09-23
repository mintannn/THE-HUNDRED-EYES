import { expect, test } from "./fixtures";
import { buildQuestions } from "../lib/jev-server";
import { DIMENSIONS } from "../lib/experience";
import { parseTweet } from "twitter-text";

test("criteria open inside the glass information panel and match the Jev request", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "この作品について" }).click();
  const about = page.getByRole("dialog", { name: "この作品について" });
  const criteria = about.locator(".judgement-criteria");
  await expect(criteria.locator(".criteria-content")).toBeHidden();
  await criteria.locator(":scope > summary").click();
  await expect(criteria.locator(".reaction-criteria > div")).toHaveCount(6);
  const questions = buildQuestions();
  for (const row of await criteria.locator("[data-criterion]").all()) {
    const id = (await row.getAttribute("data-criterion"))!;
    await expect(row.locator("dd")).toHaveText((questions.d1_reaction.criteria as Record<string, string>)[id]);
  }
  for (const { id, label } of DIMENSIONS) {
    const dimension = criteria.locator(".dimension-criteria").filter({ has: page.locator("summary", { hasText: new RegExp(`^${label}\\s*$`) }) });
    await dimension.locator("summary").click();
    await expect(dimension.locator("ol > li")).toHaveText(questions[`d1_${id}`].criteria as string[]);
  }
  await criteria.getByText("四つの感情", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("judgement-criteria.png"), scale: "css" });
  await expect(about.getByRole("button", { name: "閉じる", exact: true })).toBeInViewport();
  await about.getByRole("button", { name: "閉じる", exact: true }).click();
  await expect(about).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "あなたのひと言" })).toBeEditable();
});

test("X receives the current words, real counts, and the artwork URL in a separate composer", async ({ page, context }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Never contact or publish to X during automated checks.
  await context.route("https://x.com/**", (route) => route.fulfill({
    contentType: "text/html; charset=utf-8", body: '<html><head><meta charset="utf-8"></head><body>投稿前の確認画面</body></html>',
  }));
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  const intent = page.getByRole("link", { name: "この言葉・統計・作品URLをXでポスト（新しいタブ）" });
  await expect(intent).toHaveCount(0);
  const original = "月を見た。\n& + # 100% 🌙 https://example.com/?a=1&b=2";
  await input.fill(original);
  await input.press("Control+Enter");
  await expect(intent).toBeHidden();
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  const url = new URL((await intent.getAttribute("href"))!);
  expect(url.origin).toBe("https://x.com");
  expect(url.pathname).toBe("/intent/tweet");
  const share = url.searchParams.get("text")!;
  expect(share).toContain(`「${original}」`);
  expect(share).toContain("衆目｜100人の直感：");
  expect(share).toMatch(/\nhttps:\/\/eyes\.mintan\.org$/);
  expect(parseTweet(share).valid).toBe(true);
  for (const row of await page.locator(".insight-emotion").all()) {
    const count = await row.getAttribute("data-count");
    if (count !== "0") expect(share).toContain(`${await row.locator(".insight-label").innerText()}${count}`);
  }
  await expect(intent).toHaveAttribute("target", "_blank");
  await expect(intent).toHaveAttribute("rel", "noopener noreferrer");
  const bounds = (await intent.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const opened = context.waitForEvent("page");
  await intent.click();
  const popup = await opened;
  await popup.waitForLoadState();
  await expect(popup.locator("body")).toHaveText("投稿前の確認画面");
  expect(new URL(popup.url()).searchParams.get("text")).toBe(share);
  await popup.close();
  await expect(input).toHaveValue(original);
  await expect(page.locator(".eye-target")).toHaveCount(100);
  await page.getByRole("button", { name: "書き直す" }).click();
  await expect(intent).toBeHidden();
  const revised = "やっぱり、ただ月がきれいだった。";
  await input.fill(revised);
  await input.press("Control+Enter");
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  expect(new URL((await intent.getAttribute("href"))!).searchParams.get("text")).toContain(`「${revised}」`);
  await page.screenshot({ path: testInfo.outputPath("x-post-entry.png"), scale: "css" });
});

test("a long Japanese or emoji post keeps its URL and counts within X's weighted limit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  for (const [index, original] of ["月".repeat(140), "👩‍🎨".repeat(46)].entries()) {
    if (index) await page.getByRole("button", { name: "書き直す" }).click();
    await input.fill(original);
    await input.press("Control+Enter");
    await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
    await expect(page.locator("main")).toHaveClass(/phase-reality/);
    const href = await page.locator(".x-post-link").getAttribute("href");
    const text = new URL(href!).searchParams.get("text")!;
    expect(parseTweet(text).valid).toBe(true);
    expect(parseTweet(text).weightedLength).toBeLessThanOrEqual(280);
    expect(text).toContain("100人の直感：");
    expect(text).toMatch(/\nhttps:\/\/eyes\.mintan\.org$/);
    const sharedWords = text.slice(1, text.indexOf("」"));
    if (sharedWords.endsWith("…")) {
      const retained = sharedWords.slice(0, -1);
      expect(original.startsWith(retained)).toBe(true);
      if (index) expect(retained.replaceAll("👩‍🎨", "")).toBe("");
    }
    await expect(input).toHaveValue(original);
  }
});
