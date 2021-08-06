//-----------------------------------------------------------------------------
// Window_NameEdit
//
// The window for editing an actor's name on the name input screen.

function Window_NameEdit() {
	this.initialize.apply(this, arguments);
}

Window_NameEdit.prototype = Object.create(Window_Base.prototype);
Window_NameEdit.prototype.constructor = Window_NameEdit;

Window_NameEdit.prototype.initialize = function (actor, maxLength) {
	const width = this.windowWidth();
	const height = this.windowHeight();
	const x = (Graphics.boxWidth - width) / 2;
	const y = (Graphics.boxHeight - (height + this.fittingHeight(9) + 8)) / 2;
	Window_Base.prototype.initialize.call(this, x, y, width, height);
	this._actor = actor;
	this._name = actor.name()
		.slice(0, this._maxLength);
	this._index = this._name.length;
	this._maxLength = maxLength;
	this._defaultName = this._name;
	this.deactivate();
	this.refresh();
	ImageManager.reserveFace(actor.faceName());
};

Window_NameEdit.prototype.windowWidth = function () {
	return 480;
};

Window_NameEdit.prototype.windowHeight = function () {
	return this.fittingHeight(4);
};

Window_NameEdit.prototype.name = function () {
	return this._name;
};

Window_NameEdit.prototype.restoreDefault = function () {
	this._name = this._defaultName;
	this._index = this._name.length;
	this.refresh();
	return this._name.length > 0;
};

Window_NameEdit.prototype.add = function (ch) {
	if (this._index < this._maxLength) {
		this._name += ch;
		this._index++;
		this.refresh();
		return true;
	} else {
		return false;
	}
};

Window_NameEdit.prototype.back = function () {
	if (this._index > 0) {
		this._index--;
		this._name = this._name.slice(0, this._index);
		this.refresh();
		return true;
	} else {
		return false;
	}
};

Window_NameEdit.prototype.faceWidth = function () {
	return 144;
};

Window_NameEdit.prototype.charWidth = function () {
	const text = $gameSystem.isJapanese() ? '\uff21' : 'A';
	return this.textWidth(text);
};

Window_NameEdit.prototype.left = function () {
	const nameCenter = (this.contentsWidth() + this.faceWidth()) / 2;
	const nameWidth = (this._maxLength + 1) * this.charWidth();
	return Math.min(nameCenter - nameWidth / 2, this.contentsWidth() - nameWidth);
};

Window_NameEdit.prototype.itemRect = function (index) {
	return {
		x: this.left() + index * this.charWidth(),
		y: 54,
		width: this.charWidth(),
		height: this.lineHeight()
	};
};

Window_NameEdit.prototype.underlineRect = function (index) {
	const rect = this.itemRect(index);
	rect.x++;
	rect.y += rect.height - 4;
	rect.width -= 2;
	rect.height = 2;
	return rect;
};

Window_NameEdit.prototype.underlineColor = function () {
	return this.normalColor();
};

Window_NameEdit.prototype.drawUnderline = function (index) {
	const rect = this.underlineRect(index);
	const color = this.underlineColor();
	this.contents.paintOpacity = 48;
	this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
	this.contents.paintOpacity = 255;
};

Window_NameEdit.prototype.drawChar = function (index) {
	const rect = this.itemRect(index);
	this.resetTextColor();
	this.drawText(this._name[index] || '', rect.x, rect.y);
};

Window_NameEdit.prototype.refresh = function () {
	this.contents.clear();
	this.drawActorFace(this._actor, 0, 0);
	for (let i = 0; i < this._maxLength; i++) {
		this.drawUnderline(i);
	}
	for (let j = 0; j < this._name.length; j++) {
		this.drawChar(j);
	}
	const rect = this.itemRect(this._index);
	this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
};
