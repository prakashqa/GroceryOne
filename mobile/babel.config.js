module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@core': './src/core',
            '@data': './src/data',
            '@domain': './src/domain',
            '@presentation': './src/presentation',
            '@store': './src/store',
            '@i18n': './src/i18n',
            '@tenant': './src/tenant',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
