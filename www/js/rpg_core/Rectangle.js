import * as PIXI from '../libs/pixi-webworker.mjs';

//-----------------------------------------------------------------------------
/**
 * The rectangle class.
 *
 * @class Rectangle
 * @constructor
 * @param {Number} x The x coordinate for the upper-left corner
 * @param {Number} y The y coordinate for the upper-left corner
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 */
class Rectangle extends PIXI.Rectangle {
	constructor(...args) {
		super(...args);
	}
}

/**
 * @static
 * @property emptyRectangle
 * @type Rectangle
 * @private
 */
Rectangle.emptyRectangle = new Rectangle(0, 0, 0, 0);

/**
 * The x coordinate for the upper-left corner.
 *
 * @property x
 * @type Number
 */

/**
 * The y coordinate for the upper-left corner.
 *
 * @property y
 * @type Number
 */

/**
 * The width of the rectangle.
 *
 * @property width
 * @type Number
 */

/**
 * The height of the rectangle.
 *
 * @property height
 * @type Number
 */

export default Rectangle;
