import * as PIXI from "../libs/pixi.js";

//-----------------------------------------------------------------------------
/**
 * The color matrix filter for WebGL.
 *
 * @class ToneFilter
 * @extends PIXI.Filter
 * @constructor
 */
class ToneFilter extends PIXI.filters.ColorMatrixFilter {
	constructor() {
		super();
	}

	/**
	 * Changes the hue.
	 *
	 * @method adjustHue
	 * @param {Number} value The hue value in the range (-360, 360)
	 */
	adjustHue(value) {
		this.hue(value, true);
	}

	/**
	 * Changes the saturation.
	 *
	 * @method adjustSaturation
	 * @param {Number} value The saturation value in the range (-255, 255)
	 */
	adjustSaturation(value) {
		value = (value || 0)
			.clamp(-255, 255) / 255;
		this.saturate(value, true);
	}

	/**
	 * Changes the tone.
	 *
	 * @method adjustTone
	 * @param {Number} r The red strength in the range (-255, 255)
	 * @param {Number} g The green strength in the range (-255, 255)
	 * @param {Number} b The blue strength in the range (-255, 255)
	 */
	adjustTone(r, g, b) {
		r = (r || 0)
			.clamp(-255, 255) / 255;
		g = (g || 0)
			.clamp(-255, 255) / 255;
		b = (b || 0)
			.clamp(-255, 255) / 255;

		if (r !== 0 || g !== 0 || b !== 0) {
			const matrix = [
                1, 0, 0, r, 0,
                0, 1, 0, g, 0,
                0, 0, 1, b, 0,
                0, 0, 0, 1, 0
            ];

			this._loadMatrix(matrix, true);
		}
	}
}

export default ToneFilter;
