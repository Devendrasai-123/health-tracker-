// Metro configuration for lif.os
// - Registers .wasm as an asset so expo-sqlite's WebAssembly worker
//   (node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.wasm) resolves on web.
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
