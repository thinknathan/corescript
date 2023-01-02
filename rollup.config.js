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
	nodeResolve({
		browser: true,
		preferBuiltins: true,
	}),
	urlResolve(),
	terser({
		ecma: 2018,
		compress: {
			drop_console: false,
			keep_infinity: true,
			passes: 2,
		},
		output: {
			wrap_iife: true,
			comments: /^!!/,
		},
	}),
];

const comlinkBanner = `/*!!
   * Copyright 2019 Google Inc. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *     http://www.apache.org/licenses/LICENSE-2.0
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */`;
const comlinkPlugins = [
	nodeResolve({
		browser: true,
		preferBuiltins: true,
	}),
	terser({
		ecma: 2018,
		compress: {
			drop_console: false,
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
			drop_console: false,
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
 * game_storage_worker.js - corescript v1.6.1 (community-1.4)
 * (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA
 * Contributions by the RPG Maker MV CoreScript team
 * https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
 *
 * idb-keyval 6.2.0 | Copyright 2016, Jake Archibald
 * https://github.com/jakearchibald/idb-keyval/blob/main/LICENCE
 *
 * fflate@0.7.4 | https://github.com/101arrowz/fflate/blob/master/LICENSE
 *
 * Comlink v4.3.1 | Copyright 2019 Google Inc.
 * https://github.com/GoogleChromeLabs/comlink/blob/main/LICENSE
 */`;
const workerPlugins = [
	nodeResolve({
		browser: true,
		preferBuiltins: true,
	}),
	terser({
		ecma: 2018,
		compress: {
			drop_console: false,
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
				file: 'www/js/main.min.js',
				banner: coreBanner,
			},
		],
		plugins: corePlugins,
	},
	{
		input: 'www/js/libs/comlink.js',
		output: [
			{
				format: formatType,
				file: 'www/js/libs/comlink.min.js',
				banner: comlinkBanner,
				name: 'Comlink',
			},
		],
		plugins: comlinkPlugins,
	},
	{
		input: 'www/js/libs/pixi.js',
		output: [
			{
				format: formatType,
				file: 'www/js/libs/pixi.min.js',
				name: 'PIXI',
				banner: pixiBanner,
			},
		],
		plugins: pixiPlugins,
	},
	{
		input: 'www/js/game_storage_worker.js',
		output: [
			{
				format: formatType,
				file: 'www/js/game_storage_worker.min.js',
				banner: workerBanner,
			},
		],
		plugins: workerPlugins,
	},
];
