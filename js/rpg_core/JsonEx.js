//-----------------------------------------------------------------------------
/**
 * The static class that handles JSON with object information.
 *
 * @class JsonEx
 */
class JsonEx {
	constructor() {
		throw new Error('This is a static class');
	}

	/**
	 * Converts an object to a JSON string with object information.
	 *
	 * @static
	 * @method stringify
	 * @param {Object} object The object to be converted
	 * @return {String} The JSON string
	 */
	static stringify(object) {
		const circular = [];
		const json = JSON.stringify(this._encode(object, circular, 0));
		return json;
	}

	/**
	 * Parses a JSON string and reconstructs the corresponding object.
	 *
	 * @static
	 * @method parse
	 * @param {String} json The JSON string
	 * @return {Object} The reconstructed object
	 */
	static parse(json) {
		const circular = [];
		const registry = {};
		const contents = this._decode(JSON.parse(json), circular, registry);
		return contents;
	}

	/**
	 * Makes a deep copy of the specified object.
	 *
	 * @static
	 * @method makeDeepCopy
	 * @param {Object} object The object to be copied
	 * @return {Object} The copied object
	 */
	static makeDeepCopy(object) {
		return this.parse(this.stringify(object));
	}

	/**
	 * @static
	 * @method _encode
	 * @param {Object} value
	 * @param {Array} circular
	 * @param {Number} depth
	 * @return {Object}
	 * @private
	 */
	static _encode(value, circular, depth = 0) {
		if (++depth >= this.maxDepth) {
			throw new Error('Object too deep');
		}
		const type = Object.prototype.toString.call(value);
		if (type === '[object Object]' || type === '[object Array]') {
			const constructorName = value.constructor.name;
			if (constructorName !== 'Object' && constructorName !== 'Array') {
				value['@'] = constructorName;
			}
			for (let key in value) {
				value[key] = this._encode(value[key], circular, depth + 1);
			}
		}
		depth--;
		return value;
	}

	/**
	 * @static
	 * @method _decode
	 * @param {Object} value
	 * @param {Array} circular
	 * @param {Object} registry
	 * @return {Object}
	 * @private
	 */
	static _decode(value, circular, registry) {
		const type = Object.prototype.toString.call(value);
		if (type === '[object Object]' || type === '[object Array]') {
			const constructor = window[value['@']];
			if (constructor) {
				Object.setPrototypeOf(value, constructor.prototype);
			}
			for (let key in value) {
				value[key] = this._decode(value[key], circular, registry);
			}
		}
		return value;
	}

	static _generateId() {}

	static _restoreCircularReference(circulars) {}

	static _linkCircularReference(contents, circulars, registry) {}

	static _cleanMetadata(object) {}

	/**
	 * @static
	 * @method _getConstructorName
	 * @param {Object} value
	 * @return {String}
	 * @private
	 */
	static _getConstructorName() {}

	/**
	 * @static
	 * @method _resetPrototype
	 * @param {Object} value
	 * @param {Object} prototype
	 * @return {Object}
	 * @private
	 */
	static _resetPrototype(value, prototype) {}

}

/**
 * The maximum depth of objects.
 *
 * @static
 * @property maxDepth
 * @type Number
 * @default 100
 */
JsonEx.maxDepth = 100;

JsonEx._id = 1;

export default JsonEx;
