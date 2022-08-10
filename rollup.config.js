import { terser } from 'rollup-plugin-terser';
import urlResolve from 'rollup-plugin-url-resolve';

const pluginList = [
	urlResolve(),
	terser({
		ecma: 2018,
		compress: {
			drop_console: true,
			passes: 2,
		},
	}),
];
const formatType = 'iife';

export default [
	{
		input: 'www/js/Data_Thread.js',
		output: [
			{
				format: formatType,
				file: 'dist/Data_Thread.js',
				banner: `/*!
  * Data_Thread.js - corescript v1.6.1 (community-1.4)
  * (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA
  * Contributions by the RPG Maker MV CoreScript team
  * https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
  *
  * Licensed under the MIT License.
  * https://github.com/thinknathan/corescript/blob/master/LICENSE
  */`,
			},
		],
		plugins: pluginList,
	},
	{
		input: 'www/js/Main_Thread.js',
		output: [
			{
				format: formatType,
				file: 'dist/Main_Thread.js',
				banner: `/*!
  * Main_Thread.js - corescript v1.6.1 (community-1.4)
  * (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA
  * Contributions by the RPG Maker MV CoreScript team
  * https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
  *
  * Licensed under the MIT License.
  * https://github.com/thinknathan/corescript/blob/master/LICENSE
  */`,
			},
		],
		plugins: pluginList,
	},
	{
		input: 'www/js/Render_Thread.js',
		output: [
			{
				format: formatType,
				file: 'dist/Render_Thread.js',
				banner: `/*!
  * Render_Thread.js - corescript v1.6.1 (community-1.4)
  * (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA
  * Contributions by the RPG Maker MV CoreScript team
  * https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
  *
  * Licensed under the MIT License.
  * https://github.com/thinknathan/corescript/blob/master/LICENSE
  */`,
			},
		],
		plugins: pluginList,
	},
];
