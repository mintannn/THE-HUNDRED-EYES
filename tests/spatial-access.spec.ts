import { expect, test } from "./fixtures";

test("the space exposed by a receding post lets the visitor touch an eye", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "小さなよろこび" }).click();
  await page.getByRole("button", { name: "ポストする", exact: true }).click();
  await page.getByRole("button", { name: "ポストアナリティクスを見る", exact: true }).click();
  await expect(page.locator("main")).toHaveClass(/phase-reality/);
  const exposed = await page.locator(".eye-target").evaluateAll((eyes) => {
    const stage = document.querySelector(".central-experience")!.getBoundingClientRect();
    const post = document.querySelector(".x-composer")!.getBoundingClientRect();
    for (const [index, eye] of eyes.entries()) {
      const bounds = eye.getBoundingClientRect();
      const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
      const inStage = x > stage.left && x < stage.right && y > stage.top && y < stage.bottom;
      const inPost = x >= post.left && x <= post.right && y >= post.top && y <= post.bottom;
      if (inStage && !inPost && document.elementFromPoint(x, y)?.closest(".eye-target") === eye) {
        return { x, y, number: index + 1 };
      }
    }
    return null;
  });
  expect(exposed, "The empty stage must allow clicks through to its visible eyes").not.toBeNull();
  if (isMobile) await page.touchscreen.tap(exposed!.x, exposed!.y);
  else await page.mouse.click(exposed!.x, exposed!.y);
  await expect(page.getByRole("dialog", { name: `観測者 ${exposed!.number}の内面`, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "パラメータを閉じる" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
