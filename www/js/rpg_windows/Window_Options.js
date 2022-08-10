import Window_Command from './Window_Command.js';
import Graphics from '../rpg_core/Graphics.js';
import TextManager from '../rpg_managers/TextManager.js';
import SoundManager from '../rpg_managers/SoundManager.js';
import ConfigManager from '../rpg_managers/ConfigManager.js';

//-----------------------------------------------------------------------------
// Window_Options
//
// The window for changing various settings on the options screen.

class Window_Options extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize(0, 0);
		this.updatePlacement();
	}

	windowWidth() {
		return 400;
	}

	windowHeight() {
		return this.fittingHeight(Math.min(this.numVisibleRows(), 12));
	}

	updatePlacement() {
		this.x = (Graphics.boxWidth - this.width) / 2;
		this.y = (Graphics.boxHeight - this.height) / 2;
	}

	makeCommandList() {
		this.addGeneralOptions();
		this.addVolumeOptions();
	}

	addGeneralOptions() {
		this.addCommand(TextManager.alwaysDash, 'alwaysDash');
		this.addCommand(TextManager.commandRemember, 'commandRemember');
	}

	addVolumeOptions() {
		this.addCommand(TextManager.bgmVolume, 'bgmVolume');
		this.addCommand(TextManager.bgsVolume, 'bgsVolume');
		this.addCommand(TextManager.meVolume, 'meVolume');
		this.addCommand(TextManager.seVolume, 'seVolume');
	}

	drawItem(index) {
		const rect = this.itemRectForText(index);
		const statusWidth = this.statusWidth();
		const titleWidth = rect.width - statusWidth;
		this.resetTextColor();
		this.changePaintOpacity(this.isCommandEnabled(index));
		this.drawText(this.commandName(index), rect.x, rect.y, titleWidth, 'left');
		this.drawText(
			this.statusText(index),
			rect.x + titleWidth,
			rect.y,
			statusWidth,
			'right'
		);
	}

	statusWidth() {
		return 120;
	}

	statusText(index) {
		const symbol = this.commandSymbol(index);
		const value = this.getConfigValue(symbol);
		if (this.isVolumeSymbol(symbol)) {
			return this.volumeStatusText(value);
		} else {
			return this.booleanStatusText(value);
		}
	}

	isVolumeSymbol(symbol) {
		return symbol.contains('Volume');
	}

	booleanStatusText(value) {
		return value ? 'ON' : 'OFF';
	}

	volumeStatusText(value) {
		return `${value}%`;
	}

	processOk() {
		const index = this.index();
		const symbol = this.commandSymbol(index);
		let value = this.getConfigValue(symbol);
		if (this.isVolumeSymbol(symbol)) {
			value += this.volumeOffset();
			if (value > 100) {
				value = 0;
			}
			value = value.clamp(0, 100);
			this.changeValue(symbol, value);
		} else {
			this.changeValue(symbol, !value);
		}
	}

	cursorRight(wrap) {
		const index = this.index();
		const symbol = this.commandSymbol(index);
		let value = this.getConfigValue(symbol);
		if (this.isVolumeSymbol(symbol)) {
			value += this.volumeOffset();
			value = value.clamp(0, 100);
			this.changeValue(symbol, value);
		} else {
			this.changeValue(symbol, true);
		}
	}

	cursorLeft(wrap) {
		const index = this.index();
		const symbol = this.commandSymbol(index);
		let value = this.getConfigValue(symbol);
		if (this.isVolumeSymbol(symbol)) {
			value -= this.volumeOffset();
			value = value.clamp(0, 100);
			this.changeValue(symbol, value);
		} else {
			this.changeValue(symbol, false);
		}
	}

	volumeOffset() {
		return 20;
	}

	changeValue(symbol, value) {
		const lastValue = this.getConfigValue(symbol);
		if (lastValue !== value) {
			this.setConfigValue(symbol, value);
			this.redrawItem(this.findSymbol(symbol));
			SoundManager.playCursor();
		}
	}

	getConfigValue(symbol) {
		return ConfigManager[symbol];
	}

	setConfigValue(symbol, volume) {
		ConfigManager[symbol] = volume;
	}
}

export default Window_Options;
