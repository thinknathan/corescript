//-----------------------------------------------------------------------------
// Game_Switches
//
// The game object class for switches.

class Game_Switches {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this.clear();
	}

	clear() {
		this._data = [];
	}

	value(switchId) {
		return !!this._data[switchId];
	}

	setValue(switchId, value) {
		if (switchId > 0 && switchId < $dataSystem.switches.length) {
			this._data[switchId] = value;
			this.onChange();
		}
	}

	onChange() {
		$gameMap.requestRefresh();
	}
}

self.Game_Switches = Game_Switches;
