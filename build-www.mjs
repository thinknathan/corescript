/**
 * Build process for JSfiles targeting the browser.
 */

import * as esbuild from 'esbuild';

if (process.env.NODE_ENV === undefined)
	console.log('[build-www] Warning: NODE_ENV is undefined.');

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
	bundle: true,
	define: define,
	drop: drop,
	external: ['nw.gui'],
	entryPoints: [
		'./src-www/js/Data_Thread.js',
		'./src-www/js/Main_Thread.js',
		'./src-www/js/Render_Thread.js',
	],
	minify: !isDev,
	outdir: './www/js',
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
