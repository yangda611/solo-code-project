const path = require('path');

process.chdir(__dirname);

const vitePackagePath = require.resolve('vite/package.json');
const viteDir = path.dirname(vitePackagePath);
const viteBinPath = path.join(viteDir, 'bin', 'vite.js');

require(viteBinPath);
