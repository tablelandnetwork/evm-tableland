module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ["prettier", "@typescript-eslint"],
  extends: ["standard", "plugin:node/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    semi: [2, "never"],
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
  },
}
