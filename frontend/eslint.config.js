// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ["dist/*"],
        languageOptions: {
            globals: {
                test: "readonly",
                expect: "readonly",
                describe: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "react/react-in-jsx-scope": "off",
        },
    },
]);
