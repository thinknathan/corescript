//-----------------------------------------------------------------------------
// Game_Variables
//
// The game object class for variables.

class Game_Variables {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this.clear();
	}

	clear() {
		this._data = [];
	}

	value(variableId) {
		return this._data[variableId] || 0;
	}

	setValue(variableId, value) {
		if (variableId > 0 && variableId < $dataSystem.variables.length) {
			if (typeof value === 'number') {
				value = Math.floor(value);
			}
			this._data[variableId] = value;
			this.onChange();
		}
	}

	onChange() {
		$gameMap.requestRefresh();
	}
}

self.Game_Variables = Game_Variables;
