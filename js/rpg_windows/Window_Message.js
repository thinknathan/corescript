import Window_Base from "./Window_Base.js";
import Graphics from "../rpg_core/Graphics.js";
import Utils from "../rpg_core/Utils.js";
import Input from "../rpg_core/Input.js";
import TouchInput from "../rpg_core/TouchInput.js";
import ImageManager from "../rpg_managers/ImageManager.js";
import Window_Gold from "../rpg_windows/Window_Gold.js";
import Window_ChoiceList from "../rpg_windows/Window_ChoiceList.js";
import Window_NumberInput from "../rpg_windows/Window_NumberInput.js";
import Window_EventItem from "../rpg_windows/Window_EventItem.js";

//-----------------------------------------------------------------------------
// Window_Message
//
// The window for displaying text messages.

class Window_Message extends Window_Base {
  constructor(...args) {
    super(...args);
    this.initialize(...args);
  }

  initialize() {
    const width = this.windowWidth();
    const height = this.windowHeight();
    const x = (Graphics.boxWidth - width) / 2;
    super.initialize(x, 0, width, height);
    this.openness = 0;
    this.initMembers();
    this.createSubWindows();
    this.updatePlacement();
  }

  initMembers() {
    this._imageReservationId = Utils.generateRuntimeId();
    this._background = 0;
    this._positionType = 2;
    this._waitCount = 0;
    this._faceBitmap = null;
    this._textState = null;
    this.clearFlags();
  }

  subWindows() {
    return [
      this._goldWindow,
      this._choiceWindow,
      this._numberWindow,
      this._itemWindow,
    ];
  }

  createSubWindows() {
    this._goldWindow = new Window_Gold(0, 0);
    this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
    this._goldWindow.openness = 0;
    this._choiceWindow = new Window_ChoiceList(this);
    this._numberWindow = new Window_NumberInput(this);
    this._itemWindow = new Window_EventItem(this);
  }

  windowWidth() {
    return Graphics.boxWidth;
  }

  windowHeight() {
    return this.fittingHeight(this.numVisibleRows());
  }

  clearFlags() {
    this._showFast = false;
    this._lineShowFast = false;
    this._pauseSkip = false;
    this._textSpeed = 0;
    this._textSpeedCount = 0;
  }

  numVisibleRows() {
    return 4;
  }

  update() {
    this.checkToNotClose();
    super.update();
    while (!this.isOpening() && !this.isClosing()) {
      if (this.updateWait()) {
        return;
      } else if (this.updateLoading()) {
        return;
      } else if (this.updateInput()) {
        return;
      } else if (this.updateMessage()) {
        return;
      } else if (this.canStart()) {
        this.startMessage();
      } else {
        this.startInput();
        return;
      }
    }
  }

  checkToNotClose() {
    if (this.isClosing() && this.isOpen()) {
      if (this.doesContinue()) {
        this.open();
      }
    }
  }

  canStart() {
    return self.$gameMessage.hasText() && !self.$gameMessage.scrollMode();
  }

  startMessage() {
    this._textState = {};
    this._textState.index = 0;
    this._textState.text = this.convertEscapeCharacters(
      self.$gameMessage.allText()
    );
    this.newPage(this._textState);
    this.updatePlacement();
    this.updateBackground();
    this.open();
  }

  updatePlacement() {
    this._positionType = self.$gameMessage.positionType();
    this.y = (this._positionType * (Graphics.boxHeight - this.height)) / 2;
    this._goldWindow.y =
      this.y > 0 ? 0 : Graphics.boxHeight - this._goldWindow.height;
  }

  updateBackground() {
    this._background = self.$gameMessage.background();
    this.setBackgroundType(this._background);
  }

  terminateMessage() {
    this.close();
    this._goldWindow.close();
    self.$gameMessage.clear();
  }

  updateWait() {
    if (this._waitCount > 0) {
      this._waitCount--;
      return true;
    } else {
      return false;
    }
  }

  updateLoading() {
    if (this._faceBitmap) {
      if (this._faceBitmap.isReady()) {
        this.drawMessageFace();
        this._faceBitmap = null;
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  updateInput() {
    if (this.isAnySubWindowActive()) {
      return true;
    }
    if (this.pause) {
      if (this.isTriggered()) {
        Input.update();
        this.pause = false;
        if (!this._textState) {
          this.terminateMessage();
        }
      }
      return true;
    }
    return false;
  }

  isAnySubWindowActive() {
    return (
      this._choiceWindow.active ||
      this._numberWindow.active ||
      this._itemWindow.active
    );
  }

  updateMessage() {
    if (this._textState) {
      while (!this.isEndOfText(this._textState)) {
        if (this.needsNewPage(this._textState)) {
          this.newPage(this._textState);
        }
        this.updateShowFast();
        if (
          !this._showFast &&
          !this._lineShowFast &&
          this._textSpeedCount < this._textSpeed
        ) {
          this._textSpeedCount++;
          break;
        }
        this._textSpeedCount = 0;
        this.processCharacter(this._textState);
        if (!this._showFast && !this._lineShowFast && this._textSpeed !== -1) {
          break;
        }
        if (this.pause || this._waitCount > 0) {
          break;
        }
      }
      if (this.isEndOfText(this._textState)) {
        this.onEndOfText();
      }
      return true;
    } else {
      return false;
    }
  }

  onEndOfText() {
    if (!this.startInput()) {
      if (!this._pauseSkip) {
        this.startPause();
      } else {
        this.terminateMessage();
      }
    }
    this._textState = null;
  }

  startInput() {
    if (self.$gameMessage.isChoice()) {
      this._choiceWindow.start();
      return true;
    } else if (self.$gameMessage.isNumberInput()) {
      this._numberWindow.start();
      return true;
    } else if (self.$gameMessage.isItemChoice()) {
      this._itemWindow.start();
      return true;
    } else {
      return false;
    }
  }

  isTriggered() {
    return (
      Input.isRepeated("ok") ||
      Input.isRepeated("cancel") ||
      TouchInput.isRepeated()
    );
  }

  doesContinue() {
    return (
      self.$gameMessage.hasText() &&
      !self.$gameMessage.scrollMode() &&
      !this.areSettingsChanged()
    );
  }

  areSettingsChanged() {
    return (
      this._background !== self.$gameMessage.background() ||
      this._positionType !== self.$gameMessage.positionType()
    );
  }

  updateShowFast() {
    if (this.isTriggered()) {
      this._showFast = true;
    }
  }

  newPage(textState) {
    this.contents.clear();
    this.resetFontSettings();
    this.clearFlags();
    this.loadMessageFace();
    textState.x = this.newLineX();
    textState.y = 0;
    textState.left = this.newLineX();
    textState.height = this.calcTextHeight(textState, false);
  }

  loadMessageFace() {
    this._faceBitmap = ImageManager.reserveFace(
      self.$gameMessage.faceName(),
      0,
      this._imageReservationId
    );
  }

  drawMessageFace() {
    this.drawFace(
      self.$gameMessage.faceName(),
      self.$gameMessage.faceIndex(),
      0,
      0
    );
    ImageManager.releaseReservation(this._imageReservationId);
  }

  newLineX() {
    return self.$gameMessage.faceName() === "" ? 0 : 168;
  }

  processNewLine(textState) {
    this._lineShowFast = false;
    super.processNewLine(textState);
    if (this.needsNewPage(textState)) {
      this.startPause();
    }
  }

  processNewPage(textState) {
    super.processNewPage(textState);
    if (textState.text[textState.index] === "\n") {
      textState.index++;
    }
    textState.y = this.contents.height;
    this.startPause();
  }

  isEndOfText({ index, text }) {
    return index >= text.length;
  }

  needsNewPage(textState) {
    return (
      !this.isEndOfText(textState) &&
      textState.y + textState.height > this.contents.height
    );
  }

  processEscapeCharacter(code, textState) {
    switch (code) {
      case "$":
        this._goldWindow.open();
        break;
      case ".":
        this.startWait(15);
        break;
      case "|":
        this.startWait(60);
        break;
      case "!":
        this.startPause();
        break;
      case ">":
        this._lineShowFast = true;
        break;
      case "<":
        this._lineShowFast = false;
        break;
      case "^":
        this._pauseSkip = true;
        break;
      case "S":
        this._textSpeed = this.obtainEscapeParam(textState) - 1;
        break;
      default:
        super.processEscapeCharacter(code, textState);
        break;
    }
  }

  startWait(count) {
    this._waitCount = count;
  }

  startPause() {
    this.startWait(10);
    this.pause = true;
  }
}

export default Window_Message;
