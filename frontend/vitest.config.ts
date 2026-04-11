import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          // Regular unit tests in Node.js environment
          test: {
            name: "unit",
            globals: true,
            environment: "node",
            include: ["src/**/*.{test,spec}.?(c|m)[jt]s"],
            exclude: [
              ...configDefaults.exclude,
              "**/*.browser.{test,spec}.*",
              "**/e2e-tests/**",
              "**/playwright.configuration.ts",
            ],
          },
        },
        {
          // Browser tests for React components
          test: {
            name: "browser",
            globals: true,
            include: ["src/**/*.browser.{test,spec}.?(c|m)[jt]s?(x)"],
            exclude: [
              ...configDefaults.exclude,
              "**/e2e-tests/**",
              "**/playwright.configuration.ts",
            ],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  })
);
