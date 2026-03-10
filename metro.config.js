const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// admin/ 폴더를 Metro 번들링에서 제외
config.resolver.blockList = [
  /admin\/.*/,
];

module.exports = config;
