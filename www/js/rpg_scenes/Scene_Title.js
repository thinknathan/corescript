import Scene_Base from './Scene_Base.js';
import SceneManager from '../rpg_managers/SceneManager.js';
import Sprite from '../rpg_core/Sprite.js';
import { DataManager } from '../rpg_managers/DataManager.js';
import ImageManager from '../rpg_managers/ImageManager.js';
import AudioManager from '../rpg_managers/AudioManager.js';
import Bitmap from '../rpg_core/Bitmap.js';
import Graphics from '../rpg_core/Graphics.js';
import Scene_Map from '../rpg_scenes/Scene_Map.js';
import Scene_Options from '../rpg_scenes/Scene_Options.js';
import Scene_Load from '../rpg_scenes/Scene_Load.js';
import Window_TitleCommand from '../rpg_windows/Window_TitleCommand.js';

//-----------------------------------------------------------------------------
// Scene_Title
//
// The scene class of the title screen.

class Scene_Title extends Scene_Base {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	create() {
		super.create();
		this.createBackground();
		this.createForeground();
		this.createWindowLayer();
		this.createCommandWindow();
	}

	start() {
		super.start();
		SceneManager.clearStack();
		this.centerSprite(this._backSprite1);
		this.centerSprite(this._backSprite2);
		this.playTitleMusic();
		this.startFadeIn(this.fadeSpeed(), false);
	}

	update() {
		if (!this.isBusy()) {
			this._commandWindow.open();
		}
		super.update();
	}

	isBusy() {
		return (
			this._commandWindow.isClosing() || Scene_Base.prototype.isBusy.call(this)
		);
	}

	terminate() {
		super.terminate();
		SceneManager.snapForBackground();
	}

	createBackground() {
		this._backSprite1 = new Sprite(
			ImageManager.loadTitle1(self.$dataSystem.title1Name)
		);
		this._backSprite2 = new Sprite(
			ImageManager.loadTitle2(self.$dataSystem.title2Name)
		);
		this.addChild(this._backSprite1);
		this.addChild(this._backSprite2);
	}

	createForeground() {
		this._gameTitleSprite = new Sprite(
			new Bitmap(Graphics.width, Graphics.height)
		);
		this.addChild(this._gameTitleSprite);
		if (self.$dataSystem.optDrawTitle) {
			this.drawGameTitle();
		}
	}

	drawGameTitle() {
		const x = 20;
		const y = Graphics.height / 4;
		const maxWidth = Graphics.width - x * 2;
		const text = self.$dataSystem.gameTitle;
		this._gameTitleSprite.bitmap.outlineColor = 'black';
		this._gameTitleSprite.bitmap.outlineWidth = 8;
		this._gameTitleSprite.bitmap.fontSize = 72;
		this._gameTitleSprite.bitmap.drawText(text, x, y, maxWidth, 48, 'center');
	}

	centerSprite(sprite) {
		sprite.x = Graphics.width / 2;
		sprite.y = Graphics.height / 2;
		sprite.anchor.x = 0.5;
		sprite.anchor.y = 0.5;
	}

	createCommandWindow() {
		this._commandWindow = new Window_TitleCommand();
		this._commandWindow.setHandler('newGame', this.commandNewGame.bind(this));
		this._commandWindow.setHandler('continue', this.commandContinue.bind(this));
		this._commandWindow.setHandler('options', this.commandOptions.bind(this));
		this.addWindow(this._commandWindow);
	}

	commandNewGame() {
		DataManager.setupNewGame();
		this._commandWindow.close();
		this.fadeOutAll();
		SceneManager.goto(Scene_Map);
	}

	commandContinue() {
		this._commandWindow.close();
		SceneManager.push(Scene_Load);
	}

	commandOptions() {
		this._commandWindow.close();
		SceneManager.push(Scene_Options);
	}

	playTitleMusic() {
		AudioManager.playBgm(self.$dataSystem.titleBgm);
		AudioManager.stopBgs();
		AudioManager.stopMe();
	}
}

export default Scene_Title;
