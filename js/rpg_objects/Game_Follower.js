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
		this.setTransparent($dataSystem.optTransparent);
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
		return $gameParty.battleMembers()[this._memberIndex];
	}

	isVisible() {
		return this.actor() && $gamePlayer.followers()
			.isVisible();
	}

	update() {
		super.update();
		this.setMoveSpeed($gamePlayer.realMoveSpeed());
		this.setOpacity($gamePlayer.opacity());
		this.setBlendMode($gamePlayer.blendMode());
		this.setWalkAnime($gamePlayer.hasWalkAnime());
		this.setStepAnime($gamePlayer.hasStepAnime());
		this.setDirectionFix($gamePlayer.isDirectionFixed());
		this.setTransparent($gamePlayer.isTransparent());
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
		this.setMoveSpeed($gamePlayer.realMoveSpeed());
	}
}

self.Game_Follower = Game_Follower;
