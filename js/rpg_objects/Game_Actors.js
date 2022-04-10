//-----------------------------------------------------------------------------
// Game_Actors
//
// The wrapper class for an actor array.

class Game_Actors {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this._data = [];
	}

	actor(actorId) {
		if ($dataActors[actorId]) {
			if (!this._data[actorId]) {
				this._data[actorId] = new Game_Actor(actorId);
			}
			return this._data[actorId];
		}
		return null;
	}
}

export default Game_Actors;
