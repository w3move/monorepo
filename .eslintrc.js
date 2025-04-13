module.exports = {
  root: true, // Indica que es la configuración raíz
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:@typescript-eslint/recommended-requiring-type-checking", "prettier"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.base.json", "./apps/*/tsconfig.json", "./libs/*/tsconfig.json", "./tools/*/tsconfig.json", "./funcs/*/tsconfig.json", "./servs/*/tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ["node_modules/", "dist/", "coverage/", ".changeset/", "*.js", "*.mjs", "*.cjs"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    // Considera desactivar reglas que requieren info de tipos si la performance es un problema
    // Ejemplo: '@typescript-eslint/no-floating-promises': 'off',
  },
};
