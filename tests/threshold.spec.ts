import { expect, test } from "./fixtures";

test("analytics leave the foreground words and small asides unobstructed", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "尖ったひと言" }).click();
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  const threshold = page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true });
  await expect(threshold).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("criticism-threshold.png"), animations: "disabled", scale: "css" });
  const boxes = await page.evaluate(() => {
    const rect = (element: Element) => element.getBoundingClientRect().toJSON();
    return {
      button: rect(document.querySelector(".reveal-button")!),
      voices: [...document.querySelectorAll(".eye-target:is([data-foreground], [data-sneer]) .voice-main")]
        .map((element) => ({ text: element.textContent, ...rect(element) })),
    };
  });
  for (const voice of boxes.voices) {
    expect(voice.left).toBeGreaterThanOrEqual(10);
    expect(voice.right).toBeLessThanOrEqual(page.viewportSize()!.width - 10);
    const overlapX = Math.max(0, Math.min(boxes.button.right, voice.right) - Math.max(boxes.button.left, voice.left));
    const overlapY = Math.max(0, Math.min(boxes.button.bottom, voice.bottom) - Math.max(boxes.button.top, voice.top));
    expect(overlapX * overlapY, JSON.stringify({ button: boxes.button, voice })).toBe(0);
  }
  await threshold.click();
  await expect(page.locator("main")).toHaveClass(/phase-revealing/);
});
