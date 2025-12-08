import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

export default [
  // Global ignores
  {
    ignores: ["**/*.d.ts", "out/**", "dist/**", "node_modules/**"],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript files configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.mocha,
        // DOM types for xmldom library
        Document: "readonly",
        Element: "readonly",
        // Node.js types
        NodeJS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      // TypeScript ESLint recommended rules (manually specified)
      ...tseslint.configs.recommended.rules,

      // Custom rules
      "@typescript-eslint/naming-convention": "warn",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
        },
      ],
      "@typescript-eslint/semi": "warn",
      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn",
      "no-unused-expressions": "warn",

      // Prettier rules
      "prettier/prettier": [
        "warn",
        {
          endOfLine: "auto",
          printWidth: 80,
        },
      ],
    },
  },

  // JavaScript files configuration
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      semi: "warn",
      "prettier/prettier": "warn",
      "no-undef": "off",
    },
  },

  // Prettier config to disable conflicting rules
  prettierConfig,
];
