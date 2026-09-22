import { expect, test } from "./fixtures";

test("the full archive scrolls by wheel or touch and can close at the bottom", async ({ page, isMobile }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "この作品について" }).click();
  const about = page.getByRole("dialog", { name: "この作品について" });
  await expect(about).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(about).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  await page.screenshot({ path: testInfo.outputPath("about-glass.png"), animations: "disabled", scale: "css" });
  await page.getByRole("button", { name: "100人の内側", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "100人の内側", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".observer-entry > summary")).toHaveCount(100);
  const scroll = dialog.locator(".dialog-scroll");
  const box = (await scroll.boundingBox())!;
  const x = box.x + box.width * .55;
  const y = box.y + box.height * .65;
  const dialogBox = (await dialog.boundingBox())!;
  await page.mouse.click(dialogBox.x + 1, dialogBox.y + dialogBox.height / 2);
  await expect(dialog).toBeVisible();
  const cdp = isMobile ? await page.context().newCDPSession(page) : null;
  const gesture = async (distance: number) => {
    if (cdp) {
      await cdp.send("Input.synthesizeScrollGesture", {
        x, y, yDistance: -distance, speed: 2400, gestureSourceType: "touch",
      });
    } else {
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, distance);
    }
  };
  await gesture(500);
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  await gesture(16000);
  await expect(dialog.locator(".observer-entry > summary").last()).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "閉じる", exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("archive-bottom.png"), animations: "disabled", scale: "css" });
  await scroll.focus();
  await page.keyboard.press("Home");
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBe(0);
  await page.keyboard.press("End");
  await expect(dialog.locator(".observer-entry > summary").last()).toBeInViewport();
  await dialog.getByRole("button", { name: "閉じる", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "あなたのひと言" })).toBeEditable();
  await cdp?.detach();
});

test("people open inside the archive without losing the list or its scroll position", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const author = page.getByRole("link", { name: "作者 @uniminyo のXを開く" });
  await expect(author).toHaveAttribute("href", "https://x.com/uniminyo");
  await expect(author).toHaveAttribute("target", "_blank");
  await expect(page.locator(".engine-credit, .art-credit")).toHaveCount(0);
  await page.getByRole("button", { name: "小さなよろこび" }).click();
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  const insights = page.locator(".insight-panel");
  await expect(insights).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(insights).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  await page.getByRole("button", { name: "100人の内側を見る" }).click();
  const dialog = page.getByRole("dialog", { name: "100人の内側", exact: true });
  const entries = dialog.locator(".observer-entry");
  const scroll = dialog.locator(".dialog-scroll");
  await entries.nth(80).locator("summary").scrollIntoViewIfNeeded();
  const position = await scroll.evaluate((element) => element.scrollTop);
  await entries.nth(80).locator("summary").click();
  await expect(entries.nth(80)).toHaveAttribute("open", "");
  await expect(entries.nth(80).locator(".emotion-parameters > div")).toHaveCount(4);
  await expect(entries.nth(80).locator(".observer-details")).toBeVisible();
  const portrait = entries.nth(80).getByRole("img", { name: "観測者 81の目", exact: true });
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute("data-eye-id", (await entries.nth(80).getAttribute("data-eye-id"))!);
  await expect(page.locator("main")).toHaveAttribute("data-eye-portraits", "ready");
  // Verify the shared atlas actually contains distinct, nonempty eye images.
  const atlas = await portrait.evaluate(async (eye) => {
    const image = new Image();
    image.src = getComputedStyle(eye).backgroundImage.slice(5, -2);
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const first = context.getImageData(0, 8 * 84, 128, 84).data;
    const second = context.getImageData(128, 8 * 84, 128, 84).data;
    return {
      visiblePixels: [...first].filter((value, index) => index % 4 === 3 && value > 0).length,
      differences: [...first].filter((value, index) => value !== second[index]).length,
    };
  });
  expect(atlas.visiblePixels).toBeGreaterThan(500);
  expect(atlas.differences).toBeGreaterThan(500);
  expect(await entries.nth(80).locator("blockquote").evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeLessThanOrEqual(14);
  await expect(page.locator(".eye-popover")).toHaveCount(0);
  expect(await scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(position - 80);
  await entries.nth(81).locator("summary").click();
  await expect(entries.nth(81)).toHaveAttribute("open", "");
  await expect(entries.nth(80)).toHaveAttribute("open", "");
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("archive-inline-parameters.png"), scale: "css" });
  await entries.nth(81).locator("summary").click();
  await expect(entries.nth(81)).not.toHaveAttribute("open", "");
  await expect(entries.nth(80)).toHaveAttribute("open", "");
  await scroll.focus();
  await page.keyboard.press("End");
  await expect(entries.last().locator("summary")).toBeInViewport();
  await dialog.getByRole("button", { name: "閉じる", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(insights).toBeVisible();
});
