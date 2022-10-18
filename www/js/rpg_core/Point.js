import * as PIXI from '../libs/pixi-webworker.mjs';

//-----------------------------------------------------------------------------
/**
 * The point class.
 *
 * @class Point
 * @constructor
 * @param {Number} x The x coordinate
 * @param {Number} y The y coordinate
 */
class Point extends PIXI.Point {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		// PIXI.Point.call(this, x, y);
	}

	/**
	 * The x coordinate.
	 *
	 * @property x
	 * @type Number
	 */

	/**
	 * The y coordinate.
	 *
	 * @property y
	 * @type Number
	 */
}

export default Point;
