import Sprite from "../rpg_core/Sprite.js";

//-----------------------------------------------------------------------------
// Sprite_Base
//
// The sprite class with a feature which displays animations.

class Sprite_Base extends Sprite {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
		this._animationSprites = [];
		this._effectTarget = this;
		this._hiding = false;
	}

	update() {
		super.update();
		this.updateVisibility();
		this.updateAnimationSprites();
	}

	hide() {
		this._hiding = true;
		this.updateVisibility();
	}

	show() {
		this._hiding = false;
		this.updateVisibility();
	}

	updateVisibility() {
		this.visible = !this._hiding;
	}

	updateAnimationSprites() {
		if (this._animationSprites.length > 0) {
			const sprites = this._animationSprites.clone();
			this._animationSprites = [];

			for (const sprite of sprites) {
				if (sprite.isPlaying()) {
					this._animationSprites.push(sprite);
				} else {
					sprite.remove();
				}
			}
		}
	}

	startAnimation(animation, mirror, delay) {
		const sprite = new Sprite_Animation();
		sprite.setup(this._effectTarget, animation, mirror, delay);
		this.parent.addChild(sprite);
		this._animationSprites.push(sprite);
	}

	isAnimationPlaying() {
		return this._animationSprites.length > 0;
	}
}

export default Sprite_Base;
