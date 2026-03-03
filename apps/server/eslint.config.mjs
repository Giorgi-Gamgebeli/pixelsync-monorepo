import { serverConfig } from "@repo/eslint-config/server";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...serverConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.mjs"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["eslint.config.mjs", "dist/**"],
  },
];
