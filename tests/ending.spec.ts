import { expect, test } from "./fixtures";

test("reduced motion offers the same ending with real word traces and no extra judgement", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [], errors: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") requests.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  const first = "今日はもう頑張れない。";
  const second = "今日も頑張ります。";
  await input.fill(first);
  await input.press("Control+Enter");
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await page.getByRole("button", { name: "書き直す" }).click();
  await input.fill(second);
  await input.press("Control+Enter");
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  const version = await page.locator("main").getAttribute("data-version");
  await page.getByRole("button", { name: "余韻を見る" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-ending", "coda");
  await expect(page.locator(".remaining-words")).toHaveText(second);
  await expect(page.locator(".word-trace")).toHaveText(first);
  await expect(page.locator(".word-trace del")).toHaveText(["は", "う", "れない"]);
  await expect(page.locator(".authorship-line")).toHaveCSS("opacity", "0.86");
  await page.screenshot({ path: testInfo.outputPath("01-edited-ending.png"), scale: "css" });
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toHaveAttribute("data-ending", "none");
  await expect(page.locator("main")).toHaveAttribute("data-version", version!);
  await expect(input).toHaveValue(second);
  await page.getByRole("button", { name: "この作品について" }).click();
  const about = page.getByRole("dialog", { name: "この作品について" });
  await expect(about).toContainText("Jev未接続");
  await expect(about).toContainText("無関心・称賛・批判の人数は固定しません");
  await expect(about).toContainText("TypeSafe System One");
  await page.screenshot({ path: testInfo.outputPath("02-artist-statement.png"), scale: "css" });
  await page.getByRole("button", { name: "100人の内側", exact: true }).click();
  await expect(page.locator(".observer-entry > summary")).toHaveCount(100);
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-ending", "none");
  await page.getByRole("button", { name: "余韻を見る" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-ending", "coda");
  // The same words survive losing WebGL during the passage.
  await page.locator(".eyes-scene canvas").evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator(".fallback-eye")).toHaveCount(100);
  await expect(page.locator(".remaining-words")).toHaveText(second);
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toHaveAttribute("data-ending", "none");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("the erased-word reflection flows into the edited ending without replacing the room", async ({ page }, testInfo) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  await input.fill("今日はもう頑張れない。");
  await input.press("Control+Enter");
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await page.getByRole("button", { name: "書き直す" }).click();
  await input.fill("今日も頑張ります。");
  await input.press("Control+Enter");
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expect(page.locator(".eye-memory")).toHaveText("今日はもう頑張れない。");
  await expect(page.locator("main")).toHaveAttribute("data-ending", "words", { timeout: 17000 });
  await expect(page.locator(".word-remains")).toHaveCSS("opacity", "1");
  await expect(page.locator(".eye-memory")).toHaveCSS("opacity", "0");
  await expect.poll(() => page.locator(".eye-whisper").evaluateAll((nodes) => nodes.every((node) => Number(getComputedStyle(node).opacity) < .01))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("03-edited-definitions.png"), scale: "css" });
  await expect(page.locator("main")).toHaveAttribute("data-ending", "coda", { timeout: 14000 });
  await expect(page.locator(".authorship-line")).toHaveCSS("opacity", "0.86", { timeout: 7000 });
  await expect(page.locator(".remaining-words")).toHaveText("今日も頑張ります。");
  await expect(page.locator(".word-trace")).toHaveText("今日はもう頑張れない。");
  await page.screenshot({ path: testInfo.outputPath("04-edited-coda.png"), scale: "css" });
  await page.getByRole("button", { name: "書き直す" }).click();
  await expect(input).toBeEditable();
  await expect(input).toHaveValue("今日も頑張ります。");
  await expect(page.locator("main")).toHaveAttribute("data-ending", "none");
});

test("pause and reading a definition inhibit the ending, then a fresh idle passage can start", async ({ page }) => {
  // Fast-forward only the idle clock: actual projection and visual timing are
  // exercised at normal speed by afterglow.spec.ts.
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "何気ない日常" }).click();
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  await page.clock.fastForward(6500);
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await page.clock.fastForward(5000);
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await page.getByRole("button", { name: "動きを止める" }).click();
  await page.clock.fastForward(40000);
  await expect(page.locator("main")).not.toHaveClass(/is-still/);
  await page.getByRole("button", { name: "動きを再開" }).click();
  await page.locator(".population-strip button").first().click();
  await page.clock.fastForward(40000);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-ending", "none");
  await page.getByRole("button", { name: "パラメータを閉じる" }).click();
  await expect(page.locator("main")).not.toHaveClass(/is-still/);
  await page.clock.fastForward(9000);
  await expect(page.locator("main")).toHaveClass(/is-still/);
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).not.toHaveClass(/is-still/);
  await page.clock.fastForward(1000);
  await expect(page.locator("main")).not.toHaveClass(/is-still/);
});

test("long actual words fit the small-screen ending and WebGL fallback", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Small viewport layout");
  await page.setViewportSize({ width: 320, height: 660 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".eyes-scene canvas")).toBeVisible();
  await page.locator(".eyes-scene canvas").evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator(".fallback-eye")).toHaveCount(100);
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  const original = "夜".repeat(140);
  const revised = "言葉".repeat(70);
  await input.fill(original);
  await input.press("Control+Enter");
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await page.getByRole("button", { name: "書き直す" }).click();
  await input.fill(revised);
  await input.press("Control+Enter");
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await page.getByRole("button", { name: "余韻を見る" }).click();
  await expect(page.locator(".remaining-words")).toHaveText(revised);
  await expect(page.locator(".word-trace")).toHaveText(original);
  for (const selector of [".word-remains", ".authorship-line"]) {
    const bounds = (await page.locator(selector).boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.y).toBeGreaterThan(60);
    expect(bounds.y + bounds.height).toBeLessThan(570);
  }
  await page.touchscreen.tap(160, 320);
  await expect(page.locator("main")).toHaveAttribute("data-ending", "none");
});
