import { expect, test } from "./fixtures";
import { PERSONAS } from "../lib/personas";
import { assembleObservation, observe, type ReactionId } from "../lib/experience";

test("a radial blink is followed by voices, then analytics reveal the same hundred", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".eyes-scene canvas")).toBeVisible();
  await page.getByRole("button", { name: "尖ったひと言" }).click();
  await page.screenshot({ path: testInfo.outputPath("01-compose.png"), scale: "css" });
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  await expect(page.locator(".eyes-scene")).toHaveAttribute("data-wave-cycle", "1");
  await expect(page.locator(".post-reactions")).toHaveCount(0);
  const originalEyes = await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => {
      const { x, y, width, height } = eye.getBoundingClientRect();
      return { x: x + width / 2, y: y + height / 2, width };
    }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: testInfo.outputPath("02-wave-inner.png"), scale: "css" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: testInfo.outputPath("03-wave-outer.png"), scale: "css" });
  const delays = await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => parseFloat((eye as HTMLElement).style.getPropertyValue("--arrival-at"))));
  expect(new Set(delays).size).toBeGreaterThan(80);
  expect(Math.min(...delays)).toBeCloseTo(.12);
  expect(Math.max(...delays)).toBeCloseTo(1.47);
  await expect(page.locator("main")).toHaveClass(/phase-confronting/);
  const restingEyes = await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => {
      const { x, y, width, height } = eye.getBoundingClientRect();
      return { x: x + width / 2, y: y + height / 2, width };
    }));
  for (const [index, eye] of restingEyes.entries()) {
    const original = originalEyes[index];
    expect(Math.hypot(eye.x - original.x, eye.y - original.y), `observer ${index + 1} stays in place`).toBeLessThan(12);
    expect(eye.width / original.width).toBeLessThan(1.16);
  }
  await expect(page.locator(".census")).toBeHidden();
  const quietId = await page.locator('.eye-target[aria-hidden="true"]').first().getAttribute("data-eye-id");
  const quiet = page.locator(`.eye-target[data-eye-id="${quietId}"]`);
  const faint = Number(await quiet.evaluate((eye) => getComputedStyle(eye).opacity));
  expect(faint).toBeGreaterThan(.14);
  expect(faint).toBeLessThan(.23);
  const readings = await page.locator(".eye-target").evaluateAll((eyes) =>
    eyes.map((eye) => ({ id: eye.getAttribute("data-eye-id"), reaction: eye.getAttribute("data-reaction") })));
  await page.screenshot({ path: testInfo.outputPath("04-voices-and-trigger.png"), scale: "css" });
  await quiet.evaluate((eye) => {
    const values: number[] = [];
    (window as unknown as { presenceSamples: number[] }).presenceSamples = values;
    const until = performance.now() + 3800;
    const sample = () => {
      values.push(Number(getComputedStyle(eye).opacity));
      if (performance.now() < until) requestAnimationFrame(sample);
    };
    sample();
  });
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expect(page.locator('.eye-target[aria-hidden="false"]')).toHaveCount(100);
  await expect(page.locator(".reality-number")).toHaveText("100");
  await expect(page.locator(".post-reactions")).toHaveCount(0);
  const presence = await page.evaluate(() => (window as unknown as { presenceSamples: number[] }).presenceSamples);
  expect(presence.at(-1)).toBeGreaterThan(.8);
  expect(Math.max(...presence.slice(1).map((value, index) => value - presence[index]))).toBeLessThan(.13);
  for (const emotion of await page.locator(".insight-emotion").all()) {
    const reaction = await emotion.getAttribute("data-reaction");
    await expect(emotion).toHaveAttribute("data-count", String(readings.filter((reading) => reading.reaction === reaction).length));
  }
  await page.screenshot({ path: testInfo.outputPath("05-all-hundred.png"), scale: "css" });
  await page.getByRole("button", { name: "アナリティクスを閉じる" }).click();
  await expect(page.locator(".census")).toBeHidden();
  await expect(page.locator('.eye-target[aria-hidden="false"]')).toHaveCount(100);
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator(".census")).toBeVisible();
  expect(errors).toEqual([]);
});

test("reposting changes the loud eyes and statistics without imposing an indifferent majority", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const posts: string[] = [];
  const sample = observe("最初");
  await page.route("**/api/observe", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { engine: "jev" } });
    const text = route.request().postDataJSON().text as string;
    posts.push(text);
    const first = text === "最初";
    const voiced = first ? ["v2", "r3"] : ["d2", "v1"];
    const readings = sample.readings.map((reading, index) => {
      let reaction: ReactionId = first ? index < 90 ? "meh" : "love" : "love";
      if (reading.id === voiced[0]) reaction = "gross";
      if (reading.id === voiced[1]) reaction = "love";
      const voice = voiced.includes(reading.id) ? .9 : .03;
      return { ...reading, reaction, voice, delivery: voice > .48 ? reaction === "love" ? "praise" as const : "loud" as const : "silent" as const };
    });
    return route.fulfill({ json: assembleObservation(text, readings, "jev") });
  });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "あなたのひと言" });
  await input.fill("最初");
  await input.press("Control+Enter");
  await expect(page.locator(".eye-target[data-foreground]")).toHaveCount(2);
  expect(await page.locator(".eye-target[data-foreground]").evaluateAll((eyes) => eyes.map((eye) => eye.getAttribute("data-eye-id")).sort())).toEqual(["r3", "v2"]);
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  const initialMeh = Number(await page.locator('.insight-emotion[data-reaction="meh"]').getAttribute("data-count"));
  await page.locator(".eyes-scene canvas").evaluate((canvas) => canvas.setAttribute("data-same-room", "yes"));
  await page.getByRole("button", { name: "書き直す" }).click();
  await input.fill("書き直した");
  await page.waitForTimeout(1100);
  expect(posts).toEqual(["最初"]);
  await input.press("Control+Enter");
  await expect(page.locator(".eyes-scene")).toHaveAttribute("data-wave-cycle", "2");
  await expect(page.locator(".eyes-scene canvas")).toHaveAttribute("data-same-room", "yes");
  await expect(page.locator(".census")).toBeHidden();
  expect(await page.locator(".eye-target[data-foreground]").evaluateAll((eyes) => eyes.map((eye) => eye.getAttribute("data-eye-id")).sort())).toEqual(["d2", "v1"]);
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  await expect(page.locator('.insight-emotion[data-reaction="meh"]')).toHaveAttribute("data-count", "0");
  await expect(page.locator('.insight-emotion[data-reaction="love"]')).toHaveAttribute("data-count", "99");
  await expect(page.locator('.insight-emotion[data-reaction="meh"] .insight-delta')).toHaveText(`前回比−${initialMeh}人`);
  await expect(page.locator('.insight-emotion[data-reaction="meh"] .insight-delta')).toHaveAttribute("aria-label", `無関心、前のポストから${initialMeh}人減少`);
  const composer = (await page.locator(".x-composer").boundingBox())!;
  const insights = (await page.locator(".insight-heading").boundingBox())!;
  expect(composer.y + composer.height).toBeLessThan(insights.y - 6);
  await page.screenshot({ path: testInfo.outputPath("comparison.png"), scale: "css" });
  expect(await page.locator(".eye-target").evaluateAll((eyes) => eyes.map((eye) => eye.getAttribute("data-eye-id")))).toEqual(PERSONAS.map((person) => person.id));
  expect(posts).toEqual(["最初", "書き直した"]);
});
