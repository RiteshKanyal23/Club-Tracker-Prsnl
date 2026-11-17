const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const reactRefreshPkg = require("eslint-plugin-react-refresh");
const reactRefresh = reactRefreshPkg.default ?? reactRefreshPkg;

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
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  }
];
