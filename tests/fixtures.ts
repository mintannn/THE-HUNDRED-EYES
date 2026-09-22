import { test as base, expect } from "@playwright/test";

// Browser regressions must never spend a configured production Jev credential.
// The explicit transport test installs its own, later route with synthetic results.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.route("**/api/observe", (route) => route.request().method() === "GET"
      ? route.fulfill({ json: { engine: "mock" } }) : route.abort("failed"));
    await runTest(page);
  },
});
export { expect };
