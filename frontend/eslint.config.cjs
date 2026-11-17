const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "eslint.config.cjs",
      "playwright-report/**",
      "test-results/**",
      "blob-report/**"
    ]
  },
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-refresh": require("eslint-plugin-react-refresh") },
    rules: {
      "react-refresh/only-export-components": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  }
];
