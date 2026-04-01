const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block expo-sqlite web worker — not needed for native, causes WASM resolve error
config.resolver.blockList = [
  new RegExp(path.join('expo-sqlite', 'web', 'worker\\.ts').replace(/\\/g, '\\\\')),
  /wa-sqlite/,
];

module.exports = config;
