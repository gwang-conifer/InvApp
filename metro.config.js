// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add CSS support
config.transformer.babelTransformerPath = require.resolve('react-native-css-transformer');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css', 'scss', 'sass'];

module.exports = config;