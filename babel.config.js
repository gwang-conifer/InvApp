module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      'react-native-classname-to-style',
      ['react-native-platform-specific-extensions', { extensions: ['css', 'scss', 'sass'] }],
    ],
  };
};