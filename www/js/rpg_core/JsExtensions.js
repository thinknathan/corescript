import {
	requestAnimationFrame,
	cancelAnimationFrame,
} from 'https://cdn.skypack.dev/pin/request-animation-frame-polyfill@v1.1.2-OZhq9z8GPqihwGiXM2I4/mode=imports/optimized/request-animation-frame-polyfill.js';

//-----------------------------------------------------------------------------
/**
 * This is not a class, but contains some methods that will be added to the
 * standard Javascript objects.
 *
 * @class JsExtensions
 */
function JsExtensions() {
	throw new Error('This is not a class');
}

/**
 * Returns a number whose value is limited to the given range.
 *
 * @method Number.prototype.clamp
 * @param {Number} min The lower boundary
 * @param {Number} max The upper boundary
 * @return {Number} A number in the range (min, max)
 */
Number.prototype.clamp = function (min, max) {
	return Math.min(Math.max(this, min), max);
};

/**
 * Returns a modulo value which is always positive.
 *
 * @method Number.prototype.mod
 * @param {Number} n The divisor
 * @return {Number} A modulo value
 */
Number.prototype.mod = function (n) {
	return ((this % n) + n) % n;
};

/**
 * Replaces %1, %2 and so on in the string to the arguments.
 *
 * @method String.prototype.format
 * @param {Any} ...args The objects to format
 * @return {String} A formatted string
 */
String.prototype.format = function () {
	const args = arguments;
	return this.replace(/%([0-9]+)/g, (s, n) => args[Number(n) - 1]);
};

/**
 * Makes a number string with leading zeros.
 *
 * @method String.prototype.padZero
 * @param {Number} length The length of the output string
 * @return {String} A string with leading zeros
 */
String.prototype.padZero = function (length) {
	let s = this;
	while (s.length < length) {
		s = `0${s}`;
	}
	return s;
};

/**
 * Makes a number string with leading zeros.
 *
 * @method Number.prototype.padZero
 * @param {Number} length The length of the output string
 * @return {String} A string with leading zeros
 */
Number.prototype.padZero = function (length) {
	return String(this).padZero(length);
};

Object.defineProperties(Array.prototype, {
	/**
	 * Checks whether the two arrays are same.
	 *
	 * @method Array.prototype.equals
	 * @param {Array} array The array to compare to
	 * @return {Boolean} True if the two arrays are same
	 */
	equals: {
		enumerable: false,
		value(array) {
			if (!array || this.length !== array.length) {
				return false;
			}
			for (let i = 0; i < this.length; i++) {
				if (this[i] instanceof Array && array[i] instanceof Array) {
					if (!this[i].equals(array[i])) {
						return false;
					}
				} else if (this[i] !== array[i]) {
					return false;
				}
			}
			return true;
		},
	},
	/**
	 * Makes a shallow copy of the array.
	 *
	 * @method Array.prototype.clone
	 * @return {Array} A shallow copy of the array
	 */
	clone: {
		enumerable: false,
		value() {
			return this.slice(0);
		},
	},
	/**
	 * Checks whether the array contains a given element.
	 *
	 * @method Array.prototype.contains
	 * @param {Any} element The element to search for
	 * @return {Boolean} True if the array contains a given element
	 */
	contains: {
		enumerable: false,
		value(element) {
			return this.includes(element);
		},
	},
});

/**
 * Checks whether the string contains a given string.
 *
 * @method String.prototype.contains
 * @param {String} string The string to search for
 * @return {Boolean} True if the string contains a given string
 */
String.prototype.contains = function (string) {
	return this.includes(string);
};

/**
 * Generates a random integer in the range (0, max-1).
 *
 * @static
 * @method Math.randomInt
 * @param {Number} max The upper boundary (excluded)
 * @return {Number} A random integer
 */
Math.randomInt = (max) => Math.floor(max * Math.random());

/**
 * requestAnimationFrame polyfill.
 */
if (typeof self.requestAnimationFrame !== 'function') {
	self.requestAnimationFrame = requestAnimationFrame;
}
if (typeof self.cancelAnimationFrame !== 'function') {
	self.cancelAnimationFrame = cancelAnimationFrame;
}
