import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    AutoImport({
      imports: ["vitest"],
      dts: true,
    }),
  ],
});
