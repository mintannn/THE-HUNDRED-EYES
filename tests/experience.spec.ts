import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function expectCensus(page: Page) {
  const indifferent = await page.locator('.eye-target[data-reaction="meh"]').count();
  await expect(page.locator(".reality-number")).toHaveText("100");
  await expect(page.locator('.insight-emotion[data-reaction="meh"]')).toHaveAttribute("data-count", String(indifferent));
  await expect(page.locator(".population-strip button")).toHaveCount(100);
  return indifferent;
}

test("one room opens from selected voices to all hundred people", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("衆目");
  await expect(page.locator(".intro")).toBeEmpty();
  await expect(page.locator(".eyes-scene canvas")).toBeVisible();
  await expect(page.locator(".eye-target")).toHaveCount(100);
  await expect(page.getByRole("button", { name: "ポストする", exact: true })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("01-waiting.png"), animations: "disabled", scale: "css" });
  const before = (await page.locator(".x-composer").boundingBox())!;
  await page.getByRole("button", { name: "尖ったひと言" }).click();
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  const words = await input.inputValue();
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  await expect(input).toHaveAttribute("readonly", "");
  await expect(input).toHaveValue(words);
  const reveal = page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true });
  await expect(reveal).toBeVisible();
  await expect(page.locator(".census")).toBeHidden();
  await expect(page.locator(".census")).toHaveAttribute("inert", "");
  expect(await page.locator(".eye-target.delivery-loud").count()).toBeGreaterThan(0);
  const identities = await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => `${eye.getAttribute("data-eye-id")}:${eye.getAttribute("data-reaction")}`));
  const critic = page.locator(".eye-target[data-foreground].delivery-loud").first();
  const loudWidth = await critic.evaluate((eye) => parseFloat(eye.style.width));
  const distant = (await page.locator(".x-composer").boundingBox())!;
  expect(distant.width).toBeLessThan(before.width * .88);
  expect(distant.x + distant.width / 2).toBeCloseTo(before.x + before.width / 2, 0);
  await page.screenshot({ path: testInfo.outputPath("02-storm.png"), animations: "disabled", scale: "css" });
  await reveal.focus();
  await expect(page.locator("main")).toHaveClass(/is-near-threshold/);
  await expect(critic.locator(".eye-whisper")).toHaveCSS("opacity", "0.32");
  await reveal.click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expectCensus(page);
  expect(await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => `${eye.getAttribute("data-eye-id")}:${eye.getAttribute("data-reaction")}`))).toEqual(identities);
  await expect.poll(() => critic.evaluate((eye) => parseFloat(eye.style.width))).toBeLessThan(loudWidth);
  expect((await page.locator(".x-composer").boundingBox())!.width).toBeLessThan(before.width * .8);
  await page.screenshot({ path: testInfo.outputPath("03-reality.png"), animations: "disabled", scale: "css" });
  await page.locator(".population-strip button").first().click();
  const mind = page.getByRole("dialog");
  await expect(mind).toHaveAttribute("aria-modal", "false");
  await expect(page.locator(".emotion-parameters > div")).toHaveCount(4);
  await expect(page.locator(".emotion-parameters")).toContainText("表に出したさ");
  const bounds = (await mind.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const eyeBefore = await critic.evaluate((eye) => eye.style.transform);
  await expect.poll(() => critic.evaluate((eye) => eye.style.transform)).not.toBe(eyeBefore);
  await page.screenshot({ path: testInfo.outputPath("04-mind.png"), animations: "disabled", scale: "css" });
  await page.getByRole("button", { name: "パラメータを閉じる" }).click();
  await expect(mind).toHaveCount(0);
  await page.getByRole("button", { name: "100人の内側を見る" }).click();
  await expect(page.locator(".observer-entry > summary")).toHaveCount(100);
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(errors).toEqual([]);
});

test("quiet and admiring first posts can reach different distributions", async ({ page }, testInfo) => {
  const counts: number[] = [];
  for (const example of ["何気ない日常", "小さなよろこび"]) {
    await page.goto("/");
    await page.getByRole("button", { name: example }).click();
    await page.getByRole("button", { name: "ポストする", exact: true }).click();
    const reveal = page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true });
    await expect(reveal).toBeVisible();
    await expect(page.locator(".census")).toBeHidden();
    if (example === "小さなよろこび") {
      await expect(page.locator("main")).toHaveClass(/spotlight-praise/);
      expect(await page.locator(".eye-target.delivery-praise").count()).toBeGreaterThan(0);
      await page.getByRole("button", { name: "環境音をオンにする" }).click();
      await page.screenshot({ path: testInfo.outputPath("06-praise.png"), animations: "disabled", scale: "css" });
    }
    await reveal.click();
    await expect(page.locator("main")).toHaveClass(/phase-reality/);
    counts.push(await expectCensus(page));
    if (example === "小さなよろこび") await page.screenshot({ path: testInfo.outputPath("08-praise-reality.png"), animations: "disabled", scale: "css" });
  }
  expect(counts[0]).not.toBe(counts[1]);
});

test("input boundaries, nonmodal focus, and reduced motion survive rewriting", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  await input.fill("  ");
  await expect(page.getByRole("button", { name: "ポストする", exact: true })).toBeDisabled();
  await input.fill("🌙".repeat(150));
  await expect(input).toHaveValue("🌙".repeat(140));
  await page.getByRole("button", { name: "小さなよろこび" }).click();
  await input.press("Control+Enter");
  const reveal = page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true });
  await expect(reveal).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator(".census")).toBeHidden();
  await reveal.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expectCensus(page);
  await expect(page.locator(".x-composer")).toHaveCSS("transform", "none");
  const trigger = page.locator(".population-strip button").first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "パラメータを閉じる" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "動きを止める" }).click();
  await page.getByRole("button", { name: "書き直す" }).click();
  await expect(input).toBeEditable();
  await input.fill("");
  await expect(page.getByRole("button", { name: "ポストする", exact: true })).toBeDisabled();
  await input.fill("今日も、おつかれさま。");
  await input.press("Control+Enter");
  await reveal.click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expect(reveal).toHaveCount(0);
  await expect(page.getByRole("region", { name: "投稿と観測", exact: true })).toBeFocused();
  await expectCensus(page);
});

test("spatial controls, sound, and graceful WebGL fallback", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".eye-target").first()).toHaveCSS("transform", /matrix/);
  const eye = page.getByRole("button", { name: "観測者 001の内面を見る", exact: true });
  await eye.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "観測者 002の内面を見る", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "観測者 2の内面" })).toBeVisible();
  await page.getByRole("button", { name: "パラメータを閉じる" }).click();
  await page.getByRole("button", { name: "環境音をオンにする" }).click();
  await expect(page.getByRole("button", { name: "環境音をオフにする" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "環境音をオフにする" }).click();
  const viewport = page.viewportSize()!;
  const before = await eye.evaluate((element) => element.style.transform);
  await page.mouse.move(10, viewport.height * .48);
  await page.mouse.down();
  await page.mouse.move(70, viewport.height * .48 + 30, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => eye.evaluate((element) => element.style.transform)).not.toBe(before);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".eyes-scene canvas").evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator(".fallback-eye")).toHaveCount(100);
  await page.getByRole("button", { name: "何気ない日常" }).click();
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expectCensus(page);
  await page.locator(".population-strip button").first().click();
  await expect(page.locator(".emotion-parameters > div")).toHaveCount(4);
});
