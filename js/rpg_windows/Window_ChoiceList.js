import Window_Command from "./Window_Command.js";
import Graphics from "../rpg_core/Graphics.js";
import Input from "../rpg_core/Input.js";

//-----------------------------------------------------------------------------
// Window_ChoiceList
//
// The window used for the event command [Show Choices].

class Window_ChoiceList extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(messageWindow) {
		this._messageWindow = messageWindow;
		super.initialize(0, 0);
		this.openness = 0;
		this.deactivate();
		this._background = 0;
	}

	start() {
		this.updatePlacement();
		this.updateBackground();
		this.refresh();
		this.selectDefault();
		this.open();
		this.activate();
	}

	selectDefault() {
		this.select(self.$gameMessage.choiceDefaultType());
	}

	updatePlacement() {
		const positionType = self.$gameMessage.choicePositionType();
		const messageY = this._messageWindow.y;
		this.width = this.windowWidth();
		this.height = this.windowHeight();
		switch (positionType) {
		case 0:
			this.x = 0;
			break;
		case 1:
			this.x = (Graphics.boxWidth - this.width) / 2;
			break;
		case 2:
			this.x = Graphics.boxWidth - this.width;
			break;
		}
		if (messageY >= Graphics.boxHeight / 2) {
			this.y = messageY - this.height;
		} else {
			this.y = messageY + this._messageWindow.height;
		}
	}

	updateBackground() {
		this._background = self.$gameMessage.choiceBackground();
		this.setBackgroundType(this._background);
	}

	windowWidth() {
		const width = this.maxChoiceWidth() + this.padding * 2;
		return Math.min(width, Graphics.boxWidth);
	}

	numVisibleRows() {
		const messageY = this._messageWindow.y;
		const messageHeight = this._messageWindow.height;
		const centerY = Graphics.boxHeight / 2;
		const choices = self.$gameMessage.choices();
		let numLines = choices.length;
		let maxLines = 8;
		if (messageY < centerY && messageY + messageHeight > centerY) {
			maxLines = 4;
		}
		if (numLines > maxLines) {
			numLines = maxLines;
		}
		return numLines;
	}

	maxChoiceWidth() {
		let maxWidth = 96;
		const choices = self.$gameMessage.choices();
		for (let i = 0; i < choices.length; i++) {
			const choiceWidth = this.textWidthEx(choices[i]) + this.textPadding() * 2;
			if (maxWidth < choiceWidth) {
				maxWidth = choiceWidth;
			}
		}
		return maxWidth;
	}

	textWidthEx(text) {
		return this.drawTextEx(text, 0, this.contents.height);
	}

	contentsHeight() {
		return this.maxItems() * this.itemHeight();
	}

	makeCommandList() {
		const choices = self.$gameMessage.choices();
		for (let i = 0; i < choices.length; i++) {
			this.addCommand(choices[i], 'choice');
		}
	}

	drawItem(index) {
		const rect = this.itemRectForText(index);
		this.drawTextEx(this.commandName(index), rect.x, rect.y);
	}

	isCancelEnabled() {
		return self.$gameMessage.choiceCancelType() !== -1;
	}

	isOkTriggered() {
		return Input.isTriggered('ok');
	}

	callOkHandler() {
		self.$gameMessage.onChoice(this.index());
		this._messageWindow.terminateMessage();
		this.close();
	}

	callCancelHandler() {
		self.$gameMessage.onChoice(self.$gameMessage.choiceCancelType());
		this._messageWindow.terminateMessage();
		this.close();
	}
}

export default Window_ChoiceList;
