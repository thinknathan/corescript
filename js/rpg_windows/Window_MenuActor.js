import Window_MenuStatus from "./Window_MenuStatus.js";
import DataManager from "../rpg_managers/DataManager.js";
import Game_Action from "../rpg_objects/Game_Action.js";

//-----------------------------------------------------------------------------
// Window_MenuActor
//
// The window for selecting a target actor on the item and skill screens.

class Window_MenuActor extends Window_MenuStatus {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize(0, 0);
		this.hide();
	}

	processOk() {
		if (!this.cursorAll()) {
			self.$gameParty.setTargetActor(self.$gameParty.members()[this.index()]);
		}
		this.callOkHandler();
	}

	selectLast() {
		this.select(self.$gameParty.targetActor()
			.index() || 0);
	}

	selectForItem(item) {
		const actor = self.$gameParty.menuActor();
		const action = new Game_Action(actor);
		action.setItemObject(item);
		this.setCursorFixed(false);
		this.setCursorAll(false);
		if (action.isForUser()) {
			if (DataManager.isSkill(item)) {
				this.setCursorFixed(true);
				this.select(actor.index());
			} else {
				this.selectLast();
			}
		} else if (action.isForAll()) {
			this.setCursorAll(true);
			this.select(0);
		} else {
			this.selectLast();
		}
	}
}

export default Window_MenuActor;
