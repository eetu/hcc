import eslintReactConfig from "eslint-config/react";

export default [
  ...eslintReactConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "react/no-unknown-property": ["error", { ignore: ["css"] }],
      "react/prop-types": "off",
    },
  },
];
