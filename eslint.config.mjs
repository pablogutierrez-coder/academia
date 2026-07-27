import js from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores:["**/node_modules/**","**/.next/**","**/dist/**","packages/database/prisma/migrations/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files:["**/*.ts","**/*.tsx"],rules:{"@typescript-eslint/no-explicit-any":"error"} }
);
