import * as PIXI from "../libs/pixi.js";
import ContextShim from "./ContextShim.js";

class CanvasShim extends PIXI.Container {
	constructor(...args) {
		super(...args);
		this._opacity = 1;
		this._zIndex = 3;
		this.style = {};
		this.context = new ContextShim();
		Object.defineProperty(this.style, 'opacity', {
			get() {
				return this._opacity;
			},
			set(value) {
				this._opacity = value;
				this.alpha = value;
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
	}

	getContext(type) {
		return this.context;
	}
}

export default CanvasShim;
