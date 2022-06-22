import * as PIXI from "../libs/pixi.js";

class UpperCanvasShim extends PIXI.Container {
    constructor(...args) {
		super(...args);
		this._opacity = 1;
		this._zIndex = 3;
		this.style = {};
		Object.defineProperty(this.style, 'opacity', {
			get() {
				return this._opacity;
			},
			set(value) {
				this._opacity = value;
			},
			configurable: true
		});
		Object.defineProperty(this.style, 'zIndex', {
			get() {
				return this._zIndex;
			},
			set(value) {
				this._zIndex = value;
			},
			configurable: true
		});
		// Object.defineProperty(this.style, 'opacity', {
		// 	get() {
		// 		return this.alpha;
		// 	},
		// 	set(value) {
		// 		this.alpha = value;
		// 	},
		// 	configurable: true
		// });
	}

	getContext(type) {
		console.error('Attempted getContext request on UpperCanvasShim. This is not a canvas DOM element.');
		return {
			clearRect: () => {},
			save: () => {},
			drawImage: () => {},
			restore: () => {},
		};
	}
}

export default UpperCanvasShim;
