/* eslint-disable */
export * from '@pixi/constants';
export * from '@pixi/math';
export * from '@pixi/runner';
export * from '@pixi/settings';
export * from '@pixi/ticker';
import * as utils from '@pixi/utils';
export { utils };
export * from '@pixi/display';
export * from '@pixi/core';
import '@pixi/canvas-display';
export * from '@pixi/extract';
export * from '@pixi/mesh';
export * from '@pixi/sprite';
export * from '@pixi/canvas-renderer';
export * from '@pixi/canvas-extract';
export * from '@pixi/app';
export * from '@pixi/graphics';
export * from '@pixi/mesh-extras';
import '@pixi/mixin-cache-as-bitmap';
export * from '@pixi/sprite-tiling';
export * from '@pixi/canvas-sprite';
export * from '@pixi/text-bitmap';
export * from '@pixi/text';
export * from '@pixi/canvas-graphics';
export * from '@pixi/canvas-mesh';
import '@pixi/canvas-sprite-tiling';

// Renderer plugins
import { Renderer } from '@pixi/core';
import { BatchRenderer } from '@pixi/core';
Renderer.registerPlugin('batch', BatchRenderer);
import { Extract } from '@pixi/extract';
Renderer.registerPlugin('extract', Extract);
import { TilingSpriteRenderer } from '@pixi/sprite-tiling';
Renderer.registerPlugin('tilingSprite', TilingSpriteRenderer);

// CanvasRenderer plugins
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { CanvasExtract } from '@pixi/canvas-extract';
CanvasRenderer.registerPlugin('extract', CanvasExtract);
import { CanvasGraphicsRenderer } from '@pixi/canvas-graphics';
CanvasRenderer.registerPlugin('graphics', CanvasGraphicsRenderer);
import { CanvasMeshRenderer } from '@pixi/canvas-mesh';
CanvasRenderer.registerPlugin('mesh', CanvasMeshRenderer);
import { CanvasSpriteRenderer } from '@pixi/canvas-sprite';
CanvasRenderer.registerPlugin('sprite', CanvasSpriteRenderer);

// Application plugins
import { Application } from '@pixi/app';
import { TickerPlugin } from '@pixi/ticker';
Application.registerPlugin(TickerPlugin);

// Filters
import { AlphaFilter } from '@pixi/filter-alpha';
import { ColorMatrixFilter } from '@pixi/filter-color-matrix';
import { PixelateFilter } from '@pixi/filter-pixelate';
import { CRTFilter } from '@pixi/filter-crt';
export const filters = {
	AlphaFilter,
	ColorMatrixFilter,
	PixelateFilter,
	CRTFilter,
};
/* eslint-enable */
