import Scene_MenuBase from './Scene_MenuBase.js';
import Graphics from '../rpg_core/Graphics.js';
import SoundManager from '../rpg_managers/SoundManager.js';
import Window_EquipStatus from '../rpg_windows/Window_EquipStatus.js';
import Window_EquipCommand from '../rpg_windows/Window_EquipCommand.js';
import Window_EquipSlot from '../rpg_windows/Window_EquipSlot.js';
import Window_EquipItem from '../rpg_windows/Window_EquipItem.js';

//-----------------------------------------------------------------------------
// Scene_Equip
//
// The scene class of the equipment screen.

class Scene_Equip extends Scene_MenuBase {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	create() {
		super.create();
		this.createHelpWindow();
		this.createStatusWindow();
		this.createCommandWindow();
		this.createSlotWindow();
		this.createItemWindow();
		this.refreshActor();
	}

	createStatusWindow() {
		this._statusWindow = new Window_EquipStatus(0, this._helpWindow.height);
		this.addWindow(this._statusWindow);
	}

	createCommandWindow() {
		const wx = this._statusWindow.width;
		const wy = this._helpWindow.height;
		const ww = Graphics.boxWidth - this._statusWindow.width;
		this._commandWindow = new Window_EquipCommand(wx, wy, ww);
		this._commandWindow.setHelpWindow(this._helpWindow);
		this._commandWindow.setHandler('equip', this.commandEquip.bind(this));
		this._commandWindow.setHandler('optimize', this.commandOptimize.bind(this));
		this._commandWindow.setHandler('clear', this.commandClear.bind(this));
		this._commandWindow.setHandler('cancel', this.popScene.bind(this));
		this._commandWindow.setHandler('pagedown', this.nextActor.bind(this));
		this._commandWindow.setHandler('pageup', this.previousActor.bind(this));
		this.addWindow(this._commandWindow);
	}

	createSlotWindow() {
		const wx = this._statusWindow.width;
		const wy = this._commandWindow.y + this._commandWindow.height;
		const ww = Graphics.boxWidth - this._statusWindow.width;
		const wh = this._statusWindow.height - this._commandWindow.height;
		this._slotWindow = new Window_EquipSlot(wx, wy, ww, wh);
		this._slotWindow.setHelpWindow(this._helpWindow);
		this._slotWindow.setStatusWindow(this._statusWindow);
		this._slotWindow.setHandler('ok', this.onSlotOk.bind(this));
		this._slotWindow.setHandler('cancel', this.onSlotCancel.bind(this));
		this.addWindow(this._slotWindow);
	}

	createItemWindow() {
		const wx = 0;
		const wy = this._statusWindow.y + this._statusWindow.height;
		const ww = Graphics.boxWidth;
		const wh = Graphics.boxHeight - wy;
		this._itemWindow = new Window_EquipItem(wx, wy, ww, wh);
		this._itemWindow.setHelpWindow(this._helpWindow);
		this._itemWindow.setStatusWindow(this._statusWindow);
		this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
		this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
		this._slotWindow.setItemWindow(this._itemWindow);
		this.addWindow(this._itemWindow);
	}

	refreshActor() {
		const actor = this.actor();
		this._statusWindow.setActor(actor);
		this._slotWindow.setActor(actor);
		this._itemWindow.setActor(actor);
	}

	commandEquip() {
		this._slotWindow.activate();
		this._slotWindow.select(0);
	}

	commandOptimize() {
		SoundManager.playEquip();
		this.actor().optimizeEquipments();
		this._statusWindow.refresh();
		this._slotWindow.refresh();
		this._commandWindow.activate();
	}

	commandClear() {
		SoundManager.playEquip();
		this.actor().clearEquipments();
		this._statusWindow.refresh();
		this._slotWindow.refresh();
		this._commandWindow.activate();
	}

	onSlotOk() {
		this._itemWindow.activate();
		this._itemWindow.select(0);
	}

	onSlotCancel() {
		this._slotWindow.deselect();
		this._commandWindow.activate();
	}

	onItemOk() {
		SoundManager.playEquip();
		this.actor().changeEquip(this._slotWindow.index(), this._itemWindow.item());
		this._slotWindow.activate();
		this._slotWindow.refresh();
		this._itemWindow.deselect();
		this._itemWindow.refresh();
		this._statusWindow.refresh();
	}

	onItemCancel() {
		this._slotWindow.activate();
		this._itemWindow.deselect();
	}

	onActorChange() {
		this.refreshActor();
		this._commandWindow.activate();
	}
}

export default Scene_Equip;
