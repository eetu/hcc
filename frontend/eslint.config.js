import eslintReactConfig from "eslint-config/react";

export default [
  ...eslintReactConfig,
  {
    files: ["src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
