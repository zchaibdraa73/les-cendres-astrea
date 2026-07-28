import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: [
      "data.js",
      "engine.js",
      "state-system.js",
      "map-system.js",
      "balance-system.js",
      "validation-system.js",
    ],
    languageOptions: {
      sourceType: "script",
    },
  },
  {
    files: ["game.js"],
    languageOptions: {
      globals: {
        BALANCE_SYSTEM: "readonly",
        GAME_DATA: "readonly",
        GAME_RULES: "readonly",
        MAP_SYSTEM: "readonly",
        SAVE_SYSTEM: "readonly",
        VALIDATION_SYSTEM: "readonly",
      },
    },
  },
];
