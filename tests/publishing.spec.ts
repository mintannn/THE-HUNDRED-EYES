import { expect, test } from "./fixtures";
import { buildQuestions } from "../lib/jev-server";
import { DIMENSIONS } from "../lib/experience";

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

test("X receives only the current posted words in a separate composer", async ({ page, context }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Never contact or publish to X during automated checks.
  await context.route("https://x.com/**", (route) => route.fulfill({
    contentType: "text/html; charset=utf-8", body: '<html><head><meta charset="utf-8"></head><body>投稿前の確認画面</body></html>',
  }));
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  const intent = page.getByRole("link", { name: "この言葉をXでポスト（新しいタブ）" });
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
  expect([...url.searchParams.entries()]).toEqual([["text", original]]);
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
  expect(new URL(popup.url()).searchParams.get("text")).toBe(original);
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
  expect(new URL((await intent.getAttribute("href"))!).searchParams.get("text")).toBe(revised);
  await page.screenshot({ path: testInfo.outputPath("x-post-entry.png"), scale: "css" });
});
