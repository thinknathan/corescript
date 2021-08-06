//-----------------------------------------------------------------------------
// Window_ChoiceList
//
// The window used for the event command [Show Choices].

function Window_ChoiceList() {
	this.initialize.apply(this, arguments);
}

Window_ChoiceList.prototype = Object.create(Window_Command.prototype);
Window_ChoiceList.prototype.constructor = Window_ChoiceList;

Window_ChoiceList.prototype.initialize = function (messageWindow) {
	this._messageWindow = messageWindow;
	Window_Command.prototype.initialize.call(this, 0, 0);
	this.openness = 0;
	this.deactivate();
	this._background = 0;
};

Window_ChoiceList.prototype.start = function () {
	this.updatePlacement();
	this.updateBackground();
	this.refresh();
	this.selectDefault();
	this.open();
	this.activate();
};

Window_ChoiceList.prototype.selectDefault = function () {
	this.select($gameMessage.choiceDefaultType());
};

Window_ChoiceList.prototype.updatePlacement = function () {
	let positionType = $gameMessage.choicePositionType();
	let messageY = this._messageWindow.y;
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
};

Window_ChoiceList.prototype.updateBackground = function () {
	this._background = $gameMessage.choiceBackground();
	this.setBackgroundType(this._background);
};

Window_ChoiceList.prototype.windowWidth = function () {
	let width = this.maxChoiceWidth() + this.padding * 2;
	return Math.min(width, Graphics.boxWidth);
};

Window_ChoiceList.prototype.numVisibleRows = function () {
	let messageY = this._messageWindow.y;
	let messageHeight = this._messageWindow.height;
	let centerY = Graphics.boxHeight / 2;
	let choices = $gameMessage.choices();
	let numLines = choices.length;
	let maxLines = 8;
	if (messageY < centerY && messageY + messageHeight > centerY) {
		maxLines = 4;
	}
	if (numLines > maxLines) {
		numLines = maxLines;
	}
	return numLines;
};

Window_ChoiceList.prototype.maxChoiceWidth = function () {
	let maxWidth = 96;
	let choices = $gameMessage.choices();
	for (let i = 0; i < choices.length; i++) {
		let choiceWidth = this.textWidthEx(choices[i]) + this.textPadding() * 2;
		if (maxWidth < choiceWidth) {
			maxWidth = choiceWidth;
		}
	}
	return maxWidth;
};

Window_ChoiceList.prototype.textWidthEx = function (text) {
	return this.drawTextEx(text, 0, this.contents.height);
};

Window_ChoiceList.prototype.contentsHeight = function () {
	return this.maxItems() * this.itemHeight();
};

Window_ChoiceList.prototype.makeCommandList = function () {
	let choices = $gameMessage.choices();
	for (let i = 0; i < choices.length; i++) {
		this.addCommand(choices[i], 'choice');
	}
};

Window_ChoiceList.prototype.drawItem = function (index) {
	let rect = this.itemRectForText(index);
	this.drawTextEx(this.commandName(index), rect.x, rect.y);
};

Window_ChoiceList.prototype.isCancelEnabled = function () {
	return $gameMessage.choiceCancelType() !== -1;
};

Window_ChoiceList.prototype.isOkTriggered = function () {
	return Input.isTriggered('ok');
};

Window_ChoiceList.prototype.callOkHandler = function () {
	$gameMessage.onChoice(this.index());
	this._messageWindow.terminateMessage();
	this.close();
};

Window_ChoiceList.prototype.callCancelHandler = function () {
	$gameMessage.onChoice($gameMessage.choiceCancelType());
	this._messageWindow.terminateMessage();
	this.close();
};
