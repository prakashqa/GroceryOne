const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root and shared packages
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(projectRoot);

// Monorepo support - watch folders
config.watchFolders = [
  workspaceRoot,
  path.resolve(workspaceRoot, 'packages', 'shared'),
  path.resolve(workspaceRoot, 'packages', 'store'),
];

// Ensure Metro resolves node_modules from both mobile and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Explicitly resolve the shared package and expo-asset for monorepo compatibility
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@groceryone/shared': path.resolve(workspaceRoot, 'packages', 'shared'),
  '@groceryone/store': path.resolve(workspaceRoot, 'packages', 'store'),
  'expo-asset': path.resolve(projectRoot, 'node_modules', 'expo-asset'),
  // Force react-native-svg to use the mobile workspace version (fixes fabric compatibility)
  'react-native-svg': path.resolve(projectRoot, 'node_modules', 'react-native-svg'),
  // Shim react-native-ping (peer dep of thermal printer lib, only needed for NetPrinter which we don't use)
  'react-native-ping': path.resolve(projectRoot, 'shims', 'react-native-ping.js'),
};

// Web platform: redirect react-native-linear-gradient → shim that re-exports expo-linear-gradient
// react-native-linear-gradient uses requireNativeComponent which crashes on web.
// The shim provides both default and named exports to match the original API.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-linear-gradient') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, 'shims', 'react-native-linear-gradient.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Performance optimizations
config.transformer = {
  ...config.transformer,
  // Enable minification in production
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  // Increase worker count for faster bundling
  maxWorkers: require('os').cpus().length - 1,
};

// Caching optimizations
config.cacheStores = [
  ...config.cacheStores || [],
];

module.exports = config;
