import Utils from '../rpg_core/Utils.js';
import Graphics from '../rpg_core/Graphics.js';

//-----------------------------------------------------------------------------
/**
 * The static class that handles input data from the mouse and touchscreen.
 *
 * @class TouchInput
 */
class TouchInput {
	constructor() {
		throw new Error('This is a static class');
	}

	/**
	 * Initializes the touch system.
	 *
	 * @static
	 * @method initialize
	 */
	static initialize() {
		this.clear();
		this._setupEventHandlers();
	}

	/**
	 * Clears all the touch data.
	 *
	 * @static
	 * @method clear
	 */
	static clear() {
		this._mousePressed = false;
		this._screenPressed = false;
		this._pressedTime = 0;
		this._events = {};
		this._events.triggered = false;
		this._events.cancelled = false;
		this._events.moved = false;
		this._events.released = false;
		this._events.wheelX = 0;
		this._events.wheelY = 0;
		this._triggered = false;
		this._cancelled = false;
		this._moved = false;
		this._released = false;
		this._wheelX = 0;
		this._wheelY = 0;
		this._x = 0;
		this._y = 0;
		this._date = 0;
	}

	/**
	 * Updates the touch data.
	 *
	 * @static
	 * @method update
	 */
	static update() {
		this._triggered = this._events.triggered;
		this._cancelled = this._events.cancelled;
		this._moved = this._events.moved;
		this._released = this._events.released;
		this._wheelX = this._events.wheelX;
		this._wheelY = this._events.wheelY;
		this._events.triggered = false;
		this._events.cancelled = false;
		this._events.moved = false;
		this._events.released = false;
		this._events.wheelX = 0;
		this._events.wheelY = 0;
		if (this.isPressed()) {
			this._pressedTime++;
		}
	}

	/**
	 * Checks whether the mouse button or touchscreen is currently pressed down.
	 *
	 * @static
	 * @method isPressed
	 * @return {Boolean} True if the mouse button or touchscreen is pressed
	 */
	static isPressed() {
		return this._mousePressed || this._screenPressed;
	}

	/**
	 * Checks whether the left mouse button or touchscreen is just pressed.
	 *
	 * @static
	 * @method isTriggered
	 * @return {Boolean} True if the mouse button or touchscreen is triggered
	 */
	static isTriggered() {
		return this._triggered;
	}

	/**
	 * Checks whether the left mouse button or touchscreen is just pressed
	 * or a pseudo key repeat occurred.
	 *
	 * @static
	 * @method isRepeated
	 * @return {Boolean} True if the mouse button or touchscreen is repeated
	 */
	static isRepeated() {
		return (
			this.isPressed() &&
			(this._triggered ||
				(this._pressedTime >= this.keyRepeatWait &&
					this._pressedTime % this.keyRepeatInterval === 0))
		);
	}

	/**
	 * Checks whether the left mouse button or touchscreen is kept depressed.
	 *
	 * @static
	 * @method isLongPressed
	 * @return {Boolean} True if the left mouse button or touchscreen is long-pressed
	 */
	static isLongPressed() {
		return this.isPressed() && this._pressedTime >= this.keyRepeatWait;
	}

	/**
	 * Checks whether the right mouse button is just pressed.
	 *
	 * @static
	 * @method isCancelled
	 * @return {Boolean} True if the right mouse button is just pressed
	 */
	static isCancelled() {
		return this._cancelled;
	}

	/**
	 * Checks whether the mouse or a finger on the touchscreen is moved.
	 *
	 * @static
	 * @method isMoved
	 * @return {Boolean} True if the mouse or a finger on the touchscreen is moved
	 */
	static isMoved() {
		return this._moved;
	}

	/**
	 * Checks whether the left mouse button or touchscreen is released.
	 *
	 * @static
	 * @method isReleased
	 * @return {Boolean} True if the mouse button or touchscreen is released
	 */
	static isReleased() {
		return this._released;
	}

	/**
	 * @static
	 * @method _setupEventHandlers
	 * @private
	 */
	static _setupEventHandlers() {
		const isSupportPassive = Utils.isSupportPassiveEvent();
		document.addEventListener('mousedown', this._onMouseDown.bind(this));
		document.addEventListener('mousemove', this._onMouseMove.bind(this));
		document.addEventListener('mouseup', this._onMouseUp.bind(this));
		document.addEventListener(
			'wheel',
			this._onWheel.bind(this),
			isSupportPassive
				? {
						passive: false,
				  }
				: false
		);
		document.addEventListener(
			'touchstart',
			this._onTouchStart.bind(this),
			isSupportPassive
				? {
						passive: false,
				  }
				: false
		);
		document.addEventListener(
			'touchmove',
			this._onTouchMove.bind(this),
			isSupportPassive
				? {
						passive: false,
				  }
				: false
		);
		document.addEventListener('touchend', this._onTouchEnd.bind(this));
		document.addEventListener('touchcancel', this._onTouchCancel.bind(this));
		document.addEventListener('pointerdown', this._onPointerDown.bind(this));
		window.addEventListener('blur', this._onLostFocus.bind(this));
	}

	/**
	 * @static
	 * @method _onMouseDown
	 * @param {MouseEvent} event
	 * @private
	 */
	static _onMouseDown(event) {
		if (event.button === 0) {
			this._onLeftButtonDown(event);
		} else if (event.button === 1) {
			this._onMiddleButtonDown(event);
		} else if (event.button === 2) {
			this._onRightButtonDown(event);
		}
	}

	/**
	 * @static
	 * @method _onLeftButtonDown
	 * @param {MouseEvent} event
	 * @private
	 */
	static _onLeftButtonDown({ pageX, pageY }) {
		const x = Graphics.pageToCanvasX(pageX);
		const y = Graphics.pageToCanvasY(pageY);
		if (Graphics.isInsideCanvas(x, y)) {
			this._mousePressed = true;
			this._pressedTime = 0;
			this._onTrigger(x, y);
		}
	}

	/**
	 * @static
	 * @method _onRightButtonDown
	 * @param {MouseEvent} event
	 * @private
	 */
	static _onRightButtonDown({ pageX, pageY }) {
		const x = Graphics.pageToCanvasX(pageX);
		const y = Graphics.pageToCanvasY(pageY);
		if (Graphics.isInsideCanvas(x, y)) {
			this._onCancel(x, y);
		}
	}

	/**
	 * @static
	 * @method _onMouseMove
	 * @param {MouseEvent} event
	 * @private
	 */
	static _onMouseMove({ pageX, pageY }) {
		if (this._mousePressed) {
			const x = Graphics.pageToCanvasX(pageX);
			const y = Graphics.pageToCanvasY(pageY);
			this._onMove(x, y);
		}
	}

	/**
	 * @static
	 * @method _onMouseUp
	 * @param {MouseEvent} event
	 * @private
	 */
	static _onMouseUp({ button, pageX, pageY }) {
		if (button === 0) {
			const x = Graphics.pageToCanvasX(pageX);
			const y = Graphics.pageToCanvasY(pageY);
			this._mousePressed = false;
			this._onRelease(x, y);
		}
	}

	/**
	 * @static
	 * @method _onWheel
	 * @param {WheelEvent} event
	 * @private
	 */
	static _onWheel(event) {
		this._events.wheelX += event.deltaX;
		this._events.wheelY += event.deltaY;
		// event.preventDefault();
		console.log('event.preventDefault not called on worker');
	}

	/**
	 * @static
	 * @method _onTouchStart
	 * @param {TouchEvent} event
	 * @private
	 */
	static _onTouchStart(event) {
		for (const touch of event.changedTouches) {
			const x = Graphics.pageToCanvasX(touch.pageX);
			const y = Graphics.pageToCanvasY(touch.pageY);
			if (Graphics.isInsideCanvas(x, y)) {
				this._screenPressed = true;
				this._pressedTime = 0;
				if (event.touches.length >= 2) {
					this._onCancel(x, y);
				} else {
					this._onTrigger(x, y);
				}
				// event.preventDefault();
				console.log('event.preventDefault not called on worker');
			}
		}

		if (window.cordova || window.navigator.standalone) {
			// event.preventDefault();
			console.log('event.preventDefault not called on worker');
		}
	}

	/**
	 * @static
	 * @method _onTouchMove
	 * @param {TouchEvent} event
	 * @private
	 */
	static _onTouchMove({ changedTouches }) {
		for (const touch of changedTouches) {
			const x = Graphics.pageToCanvasX(touch.pageX);
			const y = Graphics.pageToCanvasY(touch.pageY);
			this._onMove(x, y);
		}
	}

	/**
	 * @static
	 * @method _onTouchEnd
	 * @param {TouchEvent} event
	 * @private
	 */
	static _onTouchEnd({ changedTouches }) {
		for (const touch of changedTouches) {
			const x = Graphics.pageToCanvasX(touch.pageX);
			const y = Graphics.pageToCanvasY(touch.pageY);
			this._screenPressed = false;
			this._onRelease(x, y);
		}
	}

	/**
	 * @static
	 * @method _onTouchCancel
	 * @param {TouchEvent} event
	 * @private
	 */
	static _onTouchCancel(event) {
		this._screenPressed = false;
	}

	/**
	 * @static
	 * @method _onPointerDown
	 * @param {PointerEvent} event
	 * @private
	 */
	static _onPointerDown(event) {
		if (event.pointerType === 'touch' && !event.isPrimary) {
			const x = Graphics.pageToCanvasX(event.pageX);
			const y = Graphics.pageToCanvasY(event.pageY);
			if (Graphics.isInsideCanvas(x, y)) {
				// For Microsoft Edge
				this._onCancel(x, y);
				// event.preventDefault();
				console.log('event.preventDefault not called on worker');
			}
		}
	}

	/**
	 * @static
	 * @method _onLostFocus
	 * @private
	 */
	static _onLostFocus() {
		this.clear();
	}

	/**
	 * @static
	 * @method _onTrigger
	 * @param {Number} x
	 * @param {Number} y
	 * @private
	 */
	static _onTrigger(x, y) {
		this._events.triggered = true;
		this._x = x;
		this._y = y;
		this._date = Date.now();
	}

	/**
	 * @static
	 * @method _onCancel
	 * @param {Number} x
	 * @param {Number} y
	 * @private
	 */
	static _onCancel(x, y) {
		this._events.cancelled = true;
		this._x = x;
		this._y = y;
	}

	/**
	 * @static
	 * @method _onMove
	 * @param {Number} x
	 * @param {Number} y
	 * @private
	 */
	static _onMove(x, y) {
		this._events.moved = true;
		this._x = x;
		this._y = y;
	}

	/**
	 * @static
	 * @method _onRelease
	 * @param {Number} x
	 * @param {Number} y
	 * @private
	 */
	static _onRelease(x, y) {
		this._events.released = true;
		this._x = x;
		this._y = y;
	}
}

/**
 * The wait time of the pseudo key repeat in frames.
 *
 * @static
 * @property keyRepeatWait
 * @type Number
 */
TouchInput.keyRepeatWait = 24;

/**
 * The interval of the pseudo key repeat in frames.
 *
 * @static
 * @property keyRepeatInterval
 * @type Number
 */
TouchInput.keyRepeatInterval = 6;

/**
 * [read-only] The horizontal scroll amount.
 *
 * @static
 * @property wheelX
 * @type Number
 */
Object.defineProperty(TouchInput, 'wheelX', {
	get() {
		return this._wheelX;
	},
	configurable: true,
});

/**
 * [read-only] The vertical scroll amount.
 *
 * @static
 * @property wheelY
 * @type Number
 */
Object.defineProperty(TouchInput, 'wheelY', {
	get() {
		return this._wheelY;
	},
	configurable: true,
});

/**
 * [read-only] The x coordinate on the canvas area of the latest touch event.
 *
 * @static
 * @property x
 * @type Number
 */
Object.defineProperty(TouchInput, 'x', {
	get() {
		return this._x;
	},
	configurable: true,
});

/**
 * [read-only] The y coordinate on the canvas area of the latest touch event.
 *
 * @static
 * @property y
 * @type Number
 */
Object.defineProperty(TouchInput, 'y', {
	get() {
		return this._y;
	},
	configurable: true,
});

/**
 * [read-only] The time of the last input in milliseconds.
 *
 * @static
 * @property date
 * @type Number
 */
Object.defineProperty(TouchInput, 'date', {
	get() {
		return this._date;
	},
	configurable: true,
});

/**
 * @static
 * @method _onMiddleButtonDown
 * @param {MouseEvent} event
 * @private
 */
TouchInput._onMiddleButtonDown = (event) => {};

export default TouchInput;
