// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "plugin:import/recommended",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "airbnb-typescript/base",
  ],
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "no-console": "off",
    "prefer-destructuring": "off"
  },
  ignorePatterns: ["dist", ".eslintrc.js"],
};
