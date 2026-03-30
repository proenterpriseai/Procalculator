import html from "eslint-plugin-html";

export default [
  {
    files: ["api/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-redeclare": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "warn",
      "no-constant-condition": "warn",
      "no-debugger": "error",
      "no-undef": "off",
      "no-unused-vars": "off",
    }
  },
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "_*.js", "tests/**", "api/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        // Browser globals
        window: "readonly", document: "readonly", navigator: "readonly",
        localStorage: "readonly", sessionStorage: "readonly", console: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly",
        clearInterval: "readonly", fetch: "readonly", alert: "readonly",
        confirm: "readonly", location: "readonly", history: "readonly",
        screen: "readonly", URL: "readonly", URLSearchParams: "readonly",
        AbortController: "readonly", TextEncoder: "readonly", TextDecoder: "readonly",
        Map: "readonly", Set: "readonly", Promise: "readonly",
        // Chart.js
        Chart: "readonly",
        // Google Analytics
        gtag: "readonly", dataLayer: "readonly",
        // Node.js (for api/*.js)
        module: "readonly", require: "readonly", exports: "readonly",
        process: "readonly", __dirname: "readonly",
      }
    },
    rules: {
      "no-redeclare": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "warn",
      "no-constant-condition": "warn",
      "no-debugger": "error",
      "no-undef": "off",
      "no-unused-vars": "off",
    }
  },
  {
    files: ["**/*.html"],
    plugins: { html },
    settings: {
      "html/indent": "+2",
      "html/report-bad-indent": "off",
    },
    rules: {
      // var 재선언은 기존 코드 패턴 (for 루프 var m 등) — warn으로 허용
      "no-redeclare": "warn",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "warn",
      "no-constant-condition": "warn",
      "no-debugger": "error",
      "no-undef": "off",
      "no-unused-vars": "off",
    }
  }
];
