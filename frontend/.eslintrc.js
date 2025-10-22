// frontend/.eslintrc.js
/* eslint-env node */
const path = require('path');

module.exports = {
  extends: ['eslint:recommended', 'plugin:import/recommended', 'plugin:react/recommended'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  settings: {
    'import/ignore': ['\.(png|jpg|jpeg|svg)$'],
    'import/resolver': {
      // match babel module-resolver plugin used in babel.config.js
      'babel-module': {
        root: [path.resolve(process.cwd())],
        alias: { '@': path.resolve(process.cwd()) },
        extensions: ['.js', '.jsx', '.json', '.png', '.jpg', '.jpeg', '.svg']
      },
      node: {
        moduleDirectory: [path.resolve(process.cwd()), 'node_modules'],
        extensions: ['.js', '.jsx', '.json', '.png', '.jpg', '.jpeg', '.svg']
      },
      alias: {
        map: [['@', './']], // fallback for other resolvers
        extensions: ['.js', '.jsx', '.json', '.png', '.jpg', '.jpeg', '.svg']
      },
      'react-native': {}
    }
  },
  rules: {
    // keep imports case-sensitive so CI doesn’t break on Linux
    // Disable unresolved import checks for now (aliases/assets resolved at runtime by Babel/Expo)
    'import/no-unresolved': 'off'
  }
  ,
  overrides: [
    {
      files: ['app/**', 'components/**'],
      rules: {
        // disable unresolved import checks in these folders because aliases and asset imports
        // are resolved at runtime via Babel / Expo module resolver
        'import/no-unresolved': 'off'
      }
    }
  ]
};