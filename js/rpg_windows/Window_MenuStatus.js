//-----------------------------------------------------------------------------
// Window_MenuStatus
//
// The window for displaying party member status on the menu screen.

function Window_MenuStatus() {
	this.initialize.apply(this, arguments);
}

Window_MenuStatus.prototype = Object.create(Window_Selectable.prototype);
Window_MenuStatus.prototype.constructor = Window_MenuStatus;

Window_MenuStatus.prototype.initialize = function (x, y) {
	const width = this.windowWidth();
	const height = this.windowHeight();
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this._formationMode = false;
	this._pendingIndex = -1;
	this.refresh();
};

Window_MenuStatus.prototype.windowWidth = function () {
	return Graphics.boxWidth - 240;
};

Window_MenuStatus.prototype.windowHeight = function () {
	return Graphics.boxHeight;
};

Window_MenuStatus.prototype.maxItems = function () {
	return $gameParty.size();
};

Window_MenuStatus.prototype.itemHeight = function () {
	const clientHeight = this.height - this.padding * 2;
	return Math.floor(clientHeight / this.numVisibleRows());
};

Window_MenuStatus.prototype.numVisibleRows = function () {
	return 4;
};

Window_MenuStatus.prototype.loadImages = function () {
	$gameParty.members()
		.forEach(function (actor) {
			ImageManager.reserveFace(actor.faceName());
		}, this);
};

Window_MenuStatus.prototype.drawItem = function (index) {
	this.drawItemBackground(index);
	this.drawItemImage(index);
	this.drawItemStatus(index);
};

Window_MenuStatus.prototype.drawItemBackground = function (index) {
	if (index === this._pendingIndex) {
		const rect = this.itemRect(index);
		const color = this.pendingColor();
		this.changePaintOpacity(false);
		this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
		this.changePaintOpacity(true);
	}
};

Window_MenuStatus.prototype.drawItemImage = function (index) {
	const actor = $gameParty.members()[index];
	const rect = this.itemRect(index);
	this.changePaintOpacity(actor.isBattleMember());
	this.drawActorFace(actor, rect.x + 1, rect.y + 1, Window_Base._faceWidth, Window_Base._faceHeight);
	this.changePaintOpacity(true);
};

Window_MenuStatus.prototype.drawItemStatus = function (index) {
	const actor = $gameParty.members()[index];
	const rect = this.itemRect(index);
	const x = rect.x + 162;
	const y = rect.y + rect.height / 2 - this.lineHeight() * 1.5;
	const width = rect.width - x - this.textPadding();
	this.drawActorSimpleStatus(actor, x, y, width);
};

Window_MenuStatus.prototype.processOk = function () {
	Window_Selectable.prototype.processOk.call(this);
	$gameParty.setMenuActor($gameParty.members()[this.index()]);
};

Window_MenuStatus.prototype.isCurrentItemEnabled = function () {
	if (this._formationMode) {
		const actor = $gameParty.members()[this.index()];
		return actor && actor.isFormationChangeOk();
	} else {
		return true;
	}
};

Window_MenuStatus.prototype.selectLast = function () {
	this.select($gameParty.menuActor()
		.index() || 0);
};

Window_MenuStatus.prototype.formationMode = function () {
	return this._formationMode;
};

Window_MenuStatus.prototype.setFormationMode = function (formationMode) {
	this._formationMode = formationMode;
};

Window_MenuStatus.prototype.pendingIndex = function () {
	return this._pendingIndex;
};

Window_MenuStatus.prototype.setPendingIndex = function (index) {
	const lastPendingIndex = this._pendingIndex;
	this._pendingIndex = index;
	this.redrawItem(this._pendingIndex);
	this.redrawItem(lastPendingIndex);
};
