import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", "node_modules/", "docker/"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["tests/sdk/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/src/server/*", "**/src/server/**"],
              message:
                "SDK tests must not import server internals. Use MockLLM from src/index.ts.",
            },
            {
              group: ["**/src/driver/*", "**/src/driver/**"],
              message:
                "SDK tests must not import driver internals. Use MockLLM from src/index.ts.",
            },
            {
              group: ["**/src/stubs/*", "**/src/stubs/**"],
              message:
                "SDK tests must not import stub internals. Use mock.given / mock.expect.",
            },
          ],
        },
      ],
    },
  },
);
