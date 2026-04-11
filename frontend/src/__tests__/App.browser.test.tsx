import { render } from "vitest-browser-react";

import App from "../App.tsx";

describe("App", () => {
  test("renders hello world", async () => {
    const screen = await render(<App />);

    await expect.element(screen.getByText("Hello World!")).toBeVisible();
  });
});
