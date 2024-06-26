import Utils from '../rpg_core/Utils.js';
import ResourceHandler from '../rpg_core/ResourceHandler.js';

//-----------------------------------------------------------------------------
/**
 * The static class that handles input data from the keyboard and gamepads.
 *
 * @class Input
 */
class Input {
	constructor() {
		throw new Error('This is a static class');
	}

	/**
	 * Initializes the input system.
	 *
	 * @static
	 * @method initialize
	 */
	static initialize() {
		this.clear();
		this._wrapNwjsAlert();
		this._setupEventHandlers();
	}

	/**
	 * Clears all the input data.
	 *
	 * @static
	 * @method clear
	 */
	static clear() {
		this._currentState = {};
		this._previousState = {};
		this._gamepadStates = [];
		this._latestButton = null;
		this._pressedTime = 0;
		this._dir4 = 0;
		this._dir8 = 0;
		this._preferredAxis = '';
		this._date = 0;
	}

	/**
	 * Updates the input data.
	 *
	 * @static
	 * @method update
	 */
	static update() {
		this._pollGamepads();
		if (this._currentState[this._latestButton]) {
			this._pressedTime++;
		} else {
			this._latestButton = null;
		}
		for (let name in this._currentState) {
			if (this._currentState[name] && !this._previousState[name]) {
				this._latestButton = name;
				this._pressedTime = 0;
				this._date = Date.now();
			}
			this._previousState[name] = this._currentState[name];
		}
		this._updateDirection();
	}

	/**
	 * Checks whether a key is currently pressed down.
	 *
	 * @static
	 * @method isPressed
	 * @param {String} keyName The mapped name of the key
	 * @return {Boolean} True if the key is pressed
	 */
	static isPressed(keyName) {
		if (this._isEscapeCompatible(keyName) && this.isPressed('escape')) {
			return true;
		} else {
			return !!this._currentState[keyName];
		}
	}

	/**
	 * Checks whether a key is just pressed.
	 *
	 * @static
	 * @method isTriggered
	 * @param {String} keyName The mapped name of the key
	 * @return {Boolean} True if the key is triggered
	 */
	static isTriggered(keyName) {
		if (this._isEscapeCompatible(keyName) && this.isTriggered('escape')) {
			return true;
		} else {
			return this._latestButton === keyName && this._pressedTime === 0;
		}
	}

	/**
	 * Checks whether a key is just pressed or a key repeat occurred.
	 *
	 * @static
	 * @method isRepeated
	 * @param {String} keyName The mapped name of the key
	 * @return {Boolean} True if the key is repeated
	 */
	static isRepeated(keyName) {
		if (this._isEscapeCompatible(keyName) && this.isRepeated('escape')) {
			return true;
		} else {
			return (
				this._latestButton === keyName &&
				(this._pressedTime === 0 ||
					(this._pressedTime >= this.keyRepeatWait &&
						this._pressedTime % this.keyRepeatInterval === 0))
			);
		}
	}

	/**
	 * Checks whether a key is kept depressed.
	 *
	 * @static
	 * @method isLongPressed
	 * @param {String} keyName The mapped name of the key
	 * @return {Boolean} True if the key is long-pressed
	 */
	static isLongPressed(keyName) {
		if (this._isEscapeCompatible(keyName) && this.isLongPressed('escape')) {
			return true;
		} else {
			return (
				this._latestButton === keyName &&
				this._pressedTime >= this.keyRepeatWait
			);
		}
	}

	/**
	 * @static
	 * @method _setupEventHandlers
	 * @private
	 */
	static _setupEventHandlers() {
		document.addEventListener('keydown', this._onKeyDown.bind(this));
		document.addEventListener('keyup', this._onKeyUp.bind(this));
		window.addEventListener('blur', this._onLostFocus.bind(this));
	}

	/**
	 * @static
	 * @method _onKeyDown
	 * @param {KeyboardEvent} event
	 * @private
	 */
	static _onKeyDown(event) {
		if (this._shouldPreventDefault(event.keyCode)) {
			event.preventDefault();
		}
		if (event.keyCode === 144) {
			// Numlock
			this.clear();
		}
		const buttonName = this.keyMapper[event.keyCode];
		if (ResourceHandler.exists() && buttonName === 'ok') {
			ResourceHandler.retry();
		} else if (buttonName) {
			this._currentState[buttonName] = true;
		}
	}

	/**
	 * @static
	 * @method _onKeyUp
	 * @param {KeyboardEvent} event
	 * @private
	 */
	static _onKeyUp({ keyCode }) {
		const buttonName = this.keyMapper[keyCode];
		if (buttonName) {
			this._currentState[buttonName] = false;
		}
		if (keyCode === 0) {
			// For QtWebEngine on OS X
			this.clear();
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
	 * @method _pollGamepads
	 * @private
	 */
	static _pollGamepads() {
		if (navigator.getGamepads) {
			const gamepads = navigator.getGamepads();
			if (gamepads) {
				for (const gamepad of gamepads) {
					if (gamepad && gamepad.connected) {
						this._updateGamepadState(gamepad);
					}
				}
			}
		}
	}

	/**
	 * @static
	 * @method _updateGamepadState
	 * @param {Gamepad} gamepad
	 * @param {Number} index
	 * @private
	 */
	static _updateGamepadState(gamepad) {
		const lastState = this._gamepadStates[gamepad.index] || [];
		const newState = [];
		const buttons = gamepad.buttons;
		const axes = gamepad.axes;
		const threshold = 0.5;
		newState[12] = false;
		newState[13] = false;
		newState[14] = false;
		newState[15] = false;
		for (let i = 0; i < buttons.length; i++) {
			newState[i] = buttons[i].pressed;
		}
		if (axes[1] < -threshold) {
			newState[12] = true; // up
		} else if (axes[1] > threshold) {
			newState[13] = true; // down
		}
		if (axes[0] < -threshold) {
			newState[14] = true; // left
		} else if (axes[0] > threshold) {
			newState[15] = true; // right
		}
		for (let j = 0; j < newState.length; j++) {
			if (newState[j] !== lastState[j]) {
				const buttonName = this.gamepadMapper[j];
				if (buttonName) {
					this._currentState[buttonName] = newState[j];
				}
			}
		}
		this._gamepadStates[gamepad.index] = newState;
	}

	/**
	 * @static
	 * @method _updateDirection
	 * @private
	 */
	static _updateDirection() {
		let x = this._signX();
		let y = this._signY();

		this._dir8 = this._makeNumpadDirection(x, y);

		if (x !== 0 && y !== 0) {
			if (this._preferredAxis === 'x') {
				y = 0;
			} else {
				x = 0;
			}
		} else if (x !== 0) {
			this._preferredAxis = 'y';
		} else if (y !== 0) {
			this._preferredAxis = 'x';
		}

		this._dir4 = this._makeNumpadDirection(x, y);
	}

	/**
	 * @static
	 * @method _signX
	 * @private
	 */
	static _signX() {
		let x = 0;

		if (this.isPressed('left')) {
			x--;
		}
		if (this.isPressed('right')) {
			x++;
		}
		return x;
	}

	/**
	 * @static
	 * @method _signY
	 * @private
	 */
	static _signY() {
		let y = 0;

		if (this.isPressed('up')) {
			y--;
		}
		if (this.isPressed('down')) {
			y++;
		}
		return y;
	}

	/**
	 * @static
	 * @method _wrapNwjsAlert
	 * @private
	 */
	static _wrapNwjsAlert() {
		if (Utils.isNwjs()) {
			const _alert = window.alert;
			window.alert = function (...args) {
				const gui = require('nw.gui');
				const win = gui.Window.get();
				_alert.apply(this, args);
				win.focus();
				Input.clear();
			};
		}
	}

	/**
	 * @static
	 * @method _shouldPreventDefault
	 * @param {Number} keyCode
	 * @private
	 */
	static _shouldPreventDefault(keyCode) {
		switch (keyCode) {
			case 8: // backspace
			case 33: // pageup
			case 34: // pagedown
			case 37: // left arrow
			case 38: // up arrow
			case 39: // right arrow
			case 40: // down arrow
				return true;
		}
		return false;
	}

	/**
	 * @static
	 * @method _makeNumpadDirection
	 * @param {Number} x
	 * @param {Number} y
	 * @return {Number}
	 * @private
	 */
	static _makeNumpadDirection(x, y) {
		if (x !== 0 || y !== 0) {
			return 5 - y * 3 + x;
		}
		return 0;
	}

	/**
	 * @static
	 * @method _isEscapeCompatible
	 * @param {String} keyName
	 * @return {Boolean}
	 * @private
	 */
	static _isEscapeCompatible(keyName) {
		return keyName === 'cancel' || keyName === 'menu';
	}
}

/**
 * The wait time of the key repeat in frames.
 *
 * @static
 * @property keyRepeatWait
 * @type Number
 */
Input.keyRepeatWait = 24;

/**
 * The interval of the key repeat in frames.
 *
 * @static
 * @property keyRepeatInterval
 * @type Number
 */
Input.keyRepeatInterval = 6;

/**
 * A hash table to convert from a virtual key code to a mapped key name.
 *
 * @static
 * @property keyMapper
 * @type Object
 */
Input.keyMapper = {
	9: 'tab', // tab
	13: 'ok', // enter
	16: 'shift', // shift
	17: 'control', // control
	18: 'control', // alt
	27: 'escape', // escape
	32: 'ok', // space
	33: 'pageup', // pageup
	34: 'pagedown', // pagedown
	37: 'left', // left arrow
	38: 'up', // up arrow
	39: 'right', // right arrow
	40: 'down', // down arrow
	45: 'escape', // insert
	81: 'pageup', // Q
	87: 'pagedown', // W
	88: 'escape', // X
	90: 'ok', // Z
	96: 'escape', // numpad 0
	98: 'down', // numpad 2
	100: 'left', // numpad 4
	102: 'right', // numpad 6
	104: 'up', // numpad 8
	120: 'debug', // F9
};

/**
 * A hash table to convert from a gamepad button to a mapped key name.
 *
 * @static
 * @property gamepadMapper
 * @type Object
 */
Input.gamepadMapper = {
	0: 'ok', // A
	1: 'cancel', // B
	2: 'shift', // X
	3: 'menu', // Y
	4: 'pageup', // LB
	5: 'pagedown', // RB
	12: 'up', // D-pad up
	13: 'down', // D-pad down
	14: 'left', // D-pad left
	15: 'right', // D-pad right
};

/**
 * [read-only] The four direction value as a number of the numpad, or 0 for neutral.
 *
 * @static
 * @property dir4
 * @type Number
 */
Object.defineProperty(Input, 'dir4', {
	get() {
		return this._dir4;
	},
	configurable: true,
});

/**
 * [read-only] The eight direction value as a number of the numpad, or 0 for neutral.
 *
 * @static
 * @property dir8
 * @type Number
 */
Object.defineProperty(Input, 'dir8', {
	get() {
		return this._dir8;
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
Object.defineProperty(Input, 'date', {
	get() {
		return this._date;
	},
	configurable: true,
});

export default Input;
