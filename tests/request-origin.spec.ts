import { expect, test } from "@playwright/test";
import { acceptsOrigin } from "../lib/request-origin";

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop", "HTTP origins are independent of viewport"));

test("the browser's public host is accepted even when Next uses an internal listening address", () => {
  expect(acceptsOrigin(new Request("http://0.0.0.0:3001/api/observe", {
    headers: { host: "localhost:3001", origin: "http://localhost:3001" },
  }))).toBe(true);
  expect(acceptsOrigin(new Request("https://internal:3001/api/observe", {
    headers: { host: "eyes.example", origin: "https://eyes.example" },
  }))).toBe(true);
});

test("cross-site, different-port, opaque, and malformed origins stay rejected", () => {
  for (const origin of ["https://elsewhere.example", "https://eyes.example.evil.test", "https://eyes.example:4000", "null", "invalid"]) {
    expect(acceptsOrigin(new Request("https://internal:3001/api/observe", {
      headers: { host: "eyes.example", origin },
    }))).toBe(false);
  }
  expect(acceptsOrigin(new Request("https://eyes.example/api/observe", { headers: { origin: "https://eyes.example" } }))).toBe(true);
});
