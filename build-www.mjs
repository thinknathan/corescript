/**
 * Build process for JSfiles targeting the browser.
 */

import * as esbuild from 'esbuild';

if (process.env.NODE_ENV === undefined)
	console.log('[build-www] Warning: NODE_ENV is undefined.');

const DIST_FOLDER = process.env.DIST_FOLDER ?? './www/js';
const NODE_ENV = process.env.NODE_ENV ?? 'production';
const isDev = NODE_ENV === 'development';

// Drop `console` and `debugger` statements from production code.
const drop = isDev ? [] : ['console', 'debugger'];

// Make constants available to your TypeScript.
const define = {
	NODE_ENV: JSON.stringify(NODE_ENV),
};

// Configure settings for esbuild.
const settings = {
	banner: {
		js: `/*!
 * Part of RPG Maker MV CoreScript
 * @link https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
 * @license https://github.com/thinknathan/corescript/blob/master/LICENSE 
 */`,
	},
	bundle: true,
	define: define,
	drop: drop,
	external: ['nw.gui', 'fs', 'path'],
	entryPoints: [
		'./src-www/js/game_storage_worker.js',
		'./src-www/js/main.js',
		'./src-www/js/libs/pixi.js',
		'./src-www/js/libs/comlink.js',
	],
	keepNames: true,
	minify: !isDev,
	outdir: DIST_FOLDER,
	platform: 'browser',
	sourcemap: isDev,
	target: ['es2020'],
};

console.log('[build-www] Building src-www...', {
	NODE_ENV,
});

// Watch for changes in `dev` mode.
if (isDev) {
	const context = await esbuild.context(settings);

	await context.watch();
	console.log('[build-www] Watching for changes...');

	// Launch a dev server.
	const { host, port } = await context.serve({
		servedir: 'www',
	});
	console.log(`[build-www] Launching server at http://localhost:${port}/`);
} else {
	// Just build assets, without dev server.
	await esbuild.build(settings);
}
