import { expect, test } from "./fixtures";
import { FINAL_LINE } from "../lib/experience";

test("stillness leaves the post in space and any input restores the room", async ({ page, isMobile }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.locator(".eyes-scene canvas")).toBeVisible();
  await page.getByRole("button", { name: "小さなよろこび" }).click();
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  const words = await input.inputValue();
  const initialBounds = await page.locator(".x-composer").boundingBox();
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  // Sample the actual opening motion, before the choice to reveal appears.
  await page.waitForTimeout(1300);
  const earlyBounds = (await page.locator(".x-composer").boundingBox())!;
  expect(earlyBounds.width).toBeLessThan(initialBounds!.width);
  await page.screenshot({ path: testInfo.outputPath("01-exposure.png"), scale: "css" });
  const threshold = page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true });
  const expectClearThreshold = async () => {
    const button = (await threshold.boundingBox())!;
    for (const voice of await page.locator(".eye-target[data-foreground] .voice-main").all()) {
      const bounds = (await voice.boundingBox())!;
      const overlapX = Math.max(0, Math.min(button.x + button.width, bounds.x + bounds.width) - Math.max(button.x, bounds.x));
      const overlapY = Math.max(0, Math.min(button.y + button.height, bounds.y + bounds.height) - Math.max(button.y, bounds.y));
      expect(overlapX * overlapY, "The threshold must not cover a person's visible words").toBe(0);
    }
  };
  await expect(threshold).toBeVisible();
  const distantBounds = (await page.locator(".x-composer").boundingBox())!;
  expect(distantBounds.width).toBeLessThan(earlyBounds.width - 10);
  const thresholdBounds = (await threshold.boundingBox())!;
  expect(thresholdBounds.height).toBeGreaterThanOrEqual(48);
  await expect(page.locator(".census")).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("01b-threshold.png"), animations: "disabled", scale: "css" });
  await expectClearThreshold();
  await threshold.click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  const indifferent = await page.locator('.eye-target[data-reaction="meh"]').count();
  await expect(page.locator(".reality-number")).toHaveText("100");
  await expect(page.locator('.insight-emotion[data-reaction="meh"]')).toHaveAttribute("data-count", String(indifferent));
  const identities = await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => `${eye.getAttribute("data-eye-id")}:${eye.getAttribute("data-reaction")}`));
  await page.locator(".eyes-scene canvas").evaluate((canvas) => canvas.setAttribute("data-original-room", "true"));
  await expect(page.locator("main")).toHaveClass(/is-still/, { timeout: 12000 });
  await expect(page.locator(".composer-surface")).toHaveCSS("opacity", "0.035", { timeout: 7000 });
  await expect.poll(() => page.locator(".census").evaluate((node) => Number(getComputedStyle(node).opacity))).toBeLessThan(.2);
  await expect(input).toHaveValue(words);
  await expect(input).toHaveCSS("opacity", "1");
  await expect(page.locator(".eye-target")).toHaveCount(100);
  const restingBounds = await page.locator(".x-composer").boundingBox();
  expect(restingBounds!.width).toBeLessThan(initialBounds!.width * .8);
  expect(restingBounds!.x + restingBounds!.width / 2).toBeCloseTo(initialBounds!.x + initialBounds!.width / 2, 0);
  await page.screenshot({ path: testInfo.outputPath("02-afterglow.png"), scale: "css" });
  await expect(page.locator("main")).toHaveAttribute("data-ending", "words");
  await expect(page.locator(".word-remains")).toHaveCSS("opacity", "1");
  await expect(page.locator(".remaining-words")).toHaveText(words);
  await expect(page.locator(".word-trace")).toHaveCount(0);
  await expect(page.locator(".eye-definition")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("03-words.png"), scale: "css" });
  await expect(page.locator("main")).toHaveAttribute("data-ending", "coda");
  await expect(page.locator(".authorship-line")).toHaveCSS("opacity", "0.86", { timeout: 7000 });
  await expect(page.locator(".authorship-line")).toHaveText(FINAL_LINE);
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expect(page.locator(".intro")).toBeEmpty();
  await page.screenshot({ path: testInfo.outputPath("04-coda.png"), scale: "css" });
  if (isMobile) {
    const viewport = page.viewportSize()!;
    await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
  } else {
    await page.keyboard.press("Tab");
  }
  await expect(page.locator("main")).not.toHaveClass(/is-still/);
  await expect(page.locator("main")).toHaveAttribute("data-ending", "none");
  await expect(page.locator(".word-remains")).toHaveCSS("opacity", "0");
  await expect(page.locator(".composer-surface")).toHaveCSS("opacity", "1");
  await expect(page.locator(".census")).toHaveCSS("opacity", "1");
  await expect(page.locator(".eyes-scene canvas")).toHaveAttribute("data-original-room", "true");
  expect(await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => `${eye.getAttribute("data-eye-id")}:${eye.getAttribute("data-reaction")}`))).toEqual(identities);
  await page.locator(".population-strip button").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("main")).not.toHaveClass(/is-still/);
  await page.getByRole("button", { name: "パラメータを閉じる" }).click();
  await page.getByRole("button", { name: "書き直す" }).click();
  await expect(input).toBeEditable();
  await expect(input).toHaveValue(words);
  await expect(page.locator("main")).not.toHaveClass(/is-still/);
  await expect.poll(async () => (await page.locator(".x-composer").boundingBox())!.width).toBeCloseTo(initialBounds!.width, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(errors).toEqual([]);
});
