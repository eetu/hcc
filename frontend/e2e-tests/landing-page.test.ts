import { expect, test } from "playwright/test";

test("Landing page renders", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  const fullScreenButton = page.getByRole("button", { name: "fullscreen" });
  expect(fullScreenButton).toBeVisible();
});
