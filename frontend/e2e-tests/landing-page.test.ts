import { expect, test } from "playwright/test";

test("hello world", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  const hello = page.getByText("Hello World!");
  expect(hello).toBeVisible();
});
