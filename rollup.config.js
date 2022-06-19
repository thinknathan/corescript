import { terser } from 'rollup-plugin-terser';

const pluginList = [
  terser({
    ecma: 2018,
    compress: {
      drop_console: true,
      passes: 2,
    },
  })
];
const formatType = 'iife';
const banner = `/*!
 * main.js - corescript v1.6.1 (community-1.4)
 * (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA
 * Contributions by the RPG Maker MV CoreScript team
 * https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
 *
 * Licensed under the MIT License.
 * https://github.com/thinknathan/corescript/blob/master/LICENSE
 */`;

export default [
  {
    input: 'www/js/main.js',
    output: [{
      format: formatType,
      file: 'dist/main.min.js',
      banner: banner,
    }],
    plugins: pluginList,
  },
  {
    input: 'www/js/main.js',
    output: [{
      format: formatType,
      file: 'dist/main.js',
      banner: banner,
    }],
  },
];
