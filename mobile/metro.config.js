const { getDefaultConfig } = require('expo/metro-config'); const path = require('path');
const c = getDefaultConfig(__dirname); c.watchFolders = [path.resolve(__dirname, '../packages/core')]; module.exports = c;
