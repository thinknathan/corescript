import * as PIXI from "../libs/pixi.mjs";
//-----------------------------------------------------------------------------
/**
 * The layer which contains game windows.
 *
 * @class WindowLayer
 * @constructor
 */
class WindowLayer extends PIXI.Container {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		PIXI.Container.call(this);
		this._width = 0;
		this._height = 0;

		//temporary fix for memory leak bug
		this.on('removed', this.onRemoveAsAChild);
	}

	onRemoveAsAChild() {
		this.removeChildren();
	}

	/**
	 * The width of the window layer in pixels.
	 *
	 * @property width
	 * @type Number
	 */
	get width() {
		return this._width;
	}

	set width(value) {
		this._width = value;
	}

	/**
	 * The height of the window layer in pixels.
	 *
	 * @property height
	 * @type Number
	 */
	get height() {
		return this._height;
	}

	set height(value) {
		this._height = value;
	}

	/**
	 * Sets the x, y, width, and height all at once.
	 *
	 * @method move
	 * @param {Number} x The x coordinate of the window layer
	 * @param {Number} y The y coordinate of the window layer
	 * @param {Number} width The width of the window layer
	 * @param {Number} height The height of the window layer
	 */
	move(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	/**
	 * Updates the window layer for each frame.
	 *
	 * @method update
	 */
	update() {
		this.children.forEach(child => {
			if (child.update) {
				child.update();
			}
		});
	}
}

WindowLayer.voidFilter = new PIXI.filters.AlphaFilter();

WindowLayer.prototype.render = PIXI.Container.prototype.render;
WindowLayer.prototype.renderCanvas = PIXI.Container.prototype.renderCanvas;

// The important members from Pixi.js

/**
 * The x coordinate of the window layer.
 *
 * @property x
 * @type Number
 */

/**
 * The y coordinate of the window layer.
 *
 * @property y
 * @type Number
 */

/**
 * [read-only] The array of children of the window layer.
 *
 * @property children
 * @type Array
 */

/**
 * [read-only] The object that contains the window layer.
 *
 * @property parent
 * @type Object
 */

/**
 * Adds a child to the container.
 *
 * @method addChild
 * @param {Object} child The child to add
 * @return {Object} The child that was added
 */

/**
 * Adds a child to the container at a specified index.
 *
 * @method addChildAt
 * @param {Object} child The child to add
 * @param {Number} index The index to place the child in
 * @return {Object} The child that was added
 */

/**
 * Removes a child from the container.
 *
 * @method removeChild
 * @param {Object} child The child to remove
 * @return {Object} The child that was removed
 */

/**
 * Removes a child from the specified index position.
 *
 * @method removeChildAt
 * @param {Number} index The index to get the child from
 * @return {Object} The child that was removed
 */

export default WindowLayer;
