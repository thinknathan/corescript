import Game_Character from "./Game_Character.js";

//-----------------------------------------------------------------------------
// Game_Follower
//
// The game object class for a follower. A follower is an allied character,
// other than the front character, displayed in the party.

class Game_Follower extends Game_Character {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(memberIndex) {
		super.initialize();
		this._memberIndex = memberIndex;
		this.setTransparent(self.$dataSystem.optTransparent);
		this.setThrough(true);
	}

	refresh() {
		const characterName = this.isVisible() ? this.actor()
			.characterName() : '';
		const characterIndex = this.isVisible() ? this.actor()
			.characterIndex() : 0;
		this.setImage(characterName, characterIndex);
	}

	actor() {
		return self.$gameParty.battleMembers()[this._memberIndex];
	}

	isVisible() {
		return this.actor() && self.$gamePlayer.followers()
			.isVisible();
	}

	update() {
		super.update();
		this.setMoveSpeed(self.$gamePlayer.realMoveSpeed());
		this.setOpacity(self.$gamePlayer.opacity());
		this.setBlendMode(self.$gamePlayer.blendMode());
		this.setWalkAnime(self.$gamePlayer.hasWalkAnime());
		this.setStepAnime(self.$gamePlayer.hasStepAnime());
		this.setDirectionFix(self.$gamePlayer.isDirectionFixed());
		this.setTransparent(self.$gamePlayer.isTransparent());
	}

	chaseCharacter({
		x,
		y
	}) {
		const sx = this.deltaXFrom(x);
		const sy = this.deltaYFrom(y);
		if (sx !== 0 && sy !== 0) {
			this.moveDiagonally(sx > 0 ? 4 : 6, sy > 0 ? 8 : 2);
		} else if (sx !== 0) {
			this.moveStraight(sx > 0 ? 4 : 6);
		} else if (sy !== 0) {
			this.moveStraight(sy > 0 ? 8 : 2);
		}
		this.setMoveSpeed(self.$gamePlayer.realMoveSpeed());
	}
}

export default Game_Follower;
