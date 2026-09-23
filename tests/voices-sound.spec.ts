import { expect, test } from "./fixtures";
import { AMPLIFIED_VOICES, assembleObservation, makeReading, type ReactionId } from "../lib/experience";
import { PERSONAS } from "../lib/personas";

test("the same four voices remain audible even when Jev returns no desire to speak", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/observe", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { engine: "jev" } });
    const text = route.request().postDataJSON().text as string;
    const readings = PERSONAS.map((person) => {
      const reaction: ReactionId = text === "書き直した" ? "love"
        : person.id === "v2" ? "love" : person.id === "d7" ? "gross"
        : person.id === "c2" || person.id === "r3" ? "annoying" : "meh";
      const feelings = { interest: .1, affection: reaction === "love" ? .9 : .1, discomfort: .1, expression: 0 };
      return makeReading(person.id, reaction, feelings,
        { love: +(reaction === "love"), useful: 0, meh: +(reaction === "meh"), annoying: +(reaction === "annoying"), gross: +(reaction === "gross"), envy: 0 },
        .9, { interest: .9, affection: .9, discomfort: .9, expression: .9 });
    });
    return route.fulfill({ json: assembleObservation(text, readings, "jev") });
  });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  const front = page.locator(".eye-target[data-foreground]");
  for (const [index, words] of ["おはよう", "書き直した"].entries()) {
    if (index) await page.getByRole("button", { name: "書き直す" }).click();
    await input.fill(words);
    await input.press("Control+Enter");
    await expect(page.locator("main")).toHaveClass(/phase-confronting/);
    expect((await front.evaluateAll((eyes) => eyes.map((eye) => eye.getAttribute("data-eye-id")))).sort())
      .toEqual([...AMPLIFIED_VOICES].sort());
    for (const voice of await front.locator(".eye-whisper").all()) {
      await expect(voice).toBeVisible();
      await expect.poll(() => voice.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.4);
      await expect(voice).toBeInViewport({ ratio: 1 });
      expect((await voice.boundingBox())!.y).toBeGreaterThanOrEqual(78);
    }
    await page.screenshot({ path: testInfo.outputPath(`voices-${index}.png`), scale: "css" });
    await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
    await expect(page.locator("main")).toHaveClass(/phase-reality/);
    await expect(page.locator('.eye-target[aria-hidden="false"]')).toHaveCount(100);
    await expect(page.locator('.insight-emotion[data-reaction="meh"]')).toHaveAttribute("data-count", index ? "0" : "96");
    await expect(page.locator('.insight-emotion[data-reaction="love"]')).toHaveAttribute("data-count", index ? "100" : "1");
  }
  for (const viewport of [{ width: 390, height: 664 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.locator('.population-strip [data-eye-id="c2"]').click();
    const panel = page.locator(".eye-popover");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS("overflow-y", "visible");
    await expect(panel.locator(".emotion-parameters > div")).toHaveCount(4);
    for (const element of [panel.locator(".popover-attitude"), panel.locator(".popover-instinct"), panel.locator(".popover-voice"), panel.locator(".popover-close")]) {
      await expect(element).toBeInViewport({ ratio: 1 });
    }
    expect(await panel.evaluate((element) => { element.scrollTop = 80; return element.scrollTop; })).toBe(0);
    await page.screenshot({ path: testInfo.outputPath(`readout-${viewport.width}x${viewport.height}.png`), scale: "css" });
    await page.getByRole("button", { name: "パラメータを閉じる" }).click();
  }
});

test("sound-on produces an audible-range signal, survives motion pause, and mutes", async ({ page }, testInfo) => {
  // Inspect the real Web Audio output; do not substitute a mock audio engine.
  await page.addInitScript(() => {
    const meters: AnalyserNode[] = [];
    const scope = window as unknown as { audioRms: () => number };
    const original = AudioNode.prototype.connect;
    AudioNode.prototype.connect = new Proxy(original, {
      apply(target, node: AudioNode, args: unknown[]) {
        if (args[0] === node.context.destination) {
          const meter = node.context.createAnalyser();
          meter.fftSize = 2048;
          meters.push(meter);
          Reflect.apply(target, node, [meter]);
          return Reflect.apply(target, meter, args);
        }
        return Reflect.apply(target, node, args);
      },
    });
    scope.audioRms = () => Math.max(0, ...meters.map((meter) => {
      const values = new Float32Array(meter.fftSize);
      meter.getFloatTimeDomainData(values);
      return Math.sqrt(values.reduce((sum, sample) => sum + sample * sample, 0) / values.length);
    }));
  });
  await page.goto("/");
  const rms = () => page.evaluate(() => (window as unknown as { audioRms: () => number }).audioRms());
  expect(await rms()).toBe(0);
  await expect(page.locator(".sound-button > span")).toHaveText("音 OFF");
  await page.getByRole("button", { name: "環境音をオンにする" }).click();
  await expect(page.getByRole("button", { name: "環境音をオフにする" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(rms).toBeGreaterThan(.004);
  await page.getByRole("button", { name: "動きを止める" }).click();
  await expect.poll(rms).toBeGreaterThan(.004);
  await page.screenshot({ path: testInfo.outputPath("sound-on.png"), scale: "css" });
  await page.getByRole("button", { name: "環境音をオフにする" }).click();
  await expect.poll(rms).toBeLessThan(.0005);
  await expect(page.locator(".sound-button > span")).toHaveText("音 OFF");
});
