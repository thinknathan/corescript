import commonjs from 'rollup-plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import urlResolve from 'rollup-plugin-url-resolve';

const coreBanner = `/*!!
  * main.js - corescript v1.6.1 (community-1.4)
  * (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA
  * Contributions by the RPG Maker MV CoreScript team
  * https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
  *
  * Licensed under the MIT License.
  * https://github.com/thinknathan/corescript/blob/master/LICENSE
  */`;
const corePlugins = [
	urlResolve(),
	terser({
		ecma: 2018,
		compress: {
			drop_console: true,
			keep_infinity: true,
			passes: 2,
		},
		output: {
			wrap_iife: true,
			comments: /^!!/,
		},
	}),
];

const pixiBanner = `/*!!
 * pixi.js-legacy - v6.4.2
 * Includes AlphaFilter, ColorMatrixFilter, PixelateFilter, CRTFilter
 *
 * pixi.js-legacy is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */`;
const pixiPlugins = [
	nodePolyfills(),
	nodeResolve({
		browser: true,
		preferBuiltins: true,
	}),
	commonjs(),
	terser({
		ecma: 2018,
		compress: {
			drop_console: true,
			keep_infinity: true,
			passes: 2,
		},
		output: {
			wrap_iife: true,
			comments: /^!!/,
		},
	}),
];

const workerBanner = `/*!!
 * idb-keyval 6.2.0 | Copyright 2016, Jake Archibald
 * https://github.com/jakearchibald/idb-keyval/blob/main/LICENCE
 * fflate@0.7.3 | https://github.com/101arrowz/fflate/blob/master/LICENSE
 */`;
const workerPlugins = [
	nodeResolve({
		browser: true,
		preferBuiltins: true,
	}),
	terser({
		ecma: 2018,
		compress: {
			drop_console: true,
			keep_infinity: true,
			passes: 2,
		},
		output: {
			wrap_iife: true,
			comments: /^!!/,
		},
	}),
];

const formatType = 'iife';

export default [
	{
		input: 'www/js/main.js',
		output: [
			{
				format: formatType,
				file: 'dist/main.js',
				banner: coreBanner,
			},
		],
		plugins: corePlugins,
	},
	{
		input: 'www/js/libs/pixi.js',
		output: [
			{
				format: formatType,
				file: 'dist/libs/pixi.js',
				name: 'PIXI',
				banner: pixiBanner,
			},
		],
		plugins: pixiPlugins,
	},
	{
		input: 'www/js/libs/worker.js',
		output: [
			{
				format: formatType,
				name: 'worker',
				file: 'dist/libs/worker.js',
				banner: workerBanner,
			},
		],
		plugins: workerPlugins,
	},
];
