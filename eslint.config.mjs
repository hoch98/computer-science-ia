import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Add this block at the end to disable the loud rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // 1. Completely ignores unused variables/imports (fixes your _error and Activity issues)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // 2. Completely ignores missing React Hook dependencies (fixes your useEffect warning)
      "react-hooks/exhaustive-deps": "off",

      // 3. Keeps your 'any' override from earlier disabled if you still want that
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

export default eslintConfig;
