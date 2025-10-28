// eslint.config.mjs
import js from "@eslint/js";

export default [
    // Base recommended JS rules
    js.configs.recommended,

    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                process: "readonly",
                console: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                module: "readonly",
                require: "readonly",
            },
        },
        rules: {
            // Custom rules for Node/Express
            "no-console": "off",
            semi: ["error", "always"],
            "no-unused-vars": ["warn"],
            "no-var": "error",
            "prefer-const": "error",
            "no-undef": "off",
        },
    },
];
