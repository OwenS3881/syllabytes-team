// frontend/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './' },
          extensions: ['.js', '.jsx', '.json', '.png', '.jpg', '.jpeg', '.svg']
        }
      ]
    ]
  };
};