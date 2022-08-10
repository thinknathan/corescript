import Window_Base from "./Window_Base.js";
import Graphics from "../rpg_core/Graphics.js";
import Input from "../rpg_core/Input.js";
import TouchInput from "../rpg_core/TouchInput.js";

//-----------------------------------------------------------------------------
// Window_ScrollText
//
// The window for displaying scrolling text. No frame is displayed, but it
// is handled as a window for convenience.

class Window_ScrollText extends Window_Base {
  constructor(...args) {
    super(...args);
    this.initialize(...args);
  }

  initialize() {
    const width = Graphics.boxWidth;
    const height = Graphics.boxHeight;
    super.initialize(0, 0, width, height);
    this.opacity = 0;
    this.hide();
    this._text = "";
    this._allTextHeight = 0;
  }

  update() {
    super.update();
    if (self.$gameMessage.scrollMode()) {
      if (this._text) {
        this.updateMessage();
      }
      if (!this._text && self.$gameMessage.hasText()) {
        this.startMessage();
      }
    }
  }

  startMessage() {
    this._text = self.$gameMessage.allText();
    this.refresh();
    this.show();
  }

  refresh() {
    const textState = {
      index: 0,
    };
    textState.text = this.convertEscapeCharacters(this._text);
    this.resetFontSettings();
    this._allTextHeight = this.calcTextHeight(textState, true);
    this.createContents();
    this.origin.y = -this.height;
    this.drawTextEx(this._text, this.textPadding(), 1);
  }

  contentsHeight() {
    return Math.max(this._allTextHeight, 1);
  }

  updateMessage() {
    this.origin.y += this.scrollSpeed();
    if (this.origin.y >= this.contents.height) {
      this.terminateMessage();
    }
  }

  scrollSpeed() {
    let speed = self.$gameMessage.scrollSpeed() / 2;
    if (this.isFastForward()) {
      speed *= this.fastForwardRate();
    }
    return speed;
  }

  isFastForward() {
    if (self.$gameMessage.scrollNoFast()) {
      return false;
    } else {
      return (
        Input.isPressed("ok") ||
        Input.isPressed("shift") ||
        TouchInput.isPressed()
      );
    }
  }

  fastForwardRate() {
    return 3;
  }

  terminateMessage() {
    this._text = null;
    self.$gameMessage.clear();
    this.hide();
  }
}

export default Window_ScrollText;
