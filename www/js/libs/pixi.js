import * as PIXIDesktop from 'pixi.mjs';
import * as PIXIWorker from 'pixi-webworker.mjs';

const exportPixi =
	typeof importScripts === 'function' ? PIXIWorker : PIXIDesktop;

export exportPixi;
