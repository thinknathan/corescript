import Window_Selectable from "./Window_Selectable.js";

//-----------------------------------------------------------------------------
// Window_NameInput
//
// The window for selecting text characters on the name input screen.

class Window_NameInput extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(editWindow) {
		const x = editWindow.x;
		const y = editWindow.y + editWindow.height + 8;
		const width = editWindow.width;
		const height = this.windowHeight();
		super.initialize(x, y, width, height);
		this._editWindow = editWindow;
		this._page = 0;
		this._index = 0;
		this.refresh();
		this.updateCursor();
		this.activate();
	}

	windowHeight() {
		return this.fittingHeight(9);
	}

	table() {
		if ($gameSystem.isJapanese()) {
			return [Window_NameInput.JAPAN1,
                    Window_NameInput.JAPAN2,
                    Window_NameInput.JAPAN3];
		} else if ($gameSystem.isRussian()) {
			return [Window_NameInput.RUSSIA];
		} else {
			return [Window_NameInput.LATIN1,
                    Window_NameInput.LATIN2];
		}
	}

	maxCols() {
		return 10;
	}

	maxItems() {
		return 90;
	}

	character() {
		return this._index < 88 ? this.table()[this._page][this._index] : '';
	}

	isPageChange() {
		return this._index === 88;
	}

	isOk() {
		return this._index === 89;
	}

	itemRect(index) {
		return {
			x: index % 10 * 42 + Math.floor(index % 10 / 5) * 24,
			y: Math.floor(index / 10) * this.lineHeight(),
			width: 42,
			height: this.lineHeight()
		};
	}

	refresh() {
		const table = this.table();
		this.contents.clear();
		this.resetTextColor();
		for (let i = 0; i < 90; i++) {
			const rect = this.itemRect(i);
			rect.x += 3;
			rect.width -= 6;
			this.drawText(table[this._page][i], rect.x, rect.y, rect.width, 'center');
		}
	}

	updateCursor() {
		const rect = this.itemRect(this._index);
		this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
	}

	isCursorMovable() {
		return this.active;
	}

	cursorDown(wrap) {
		if (this._index < 80 || wrap) {
			this._index = (this._index + 10) % 90;
		}
	}

	cursorUp(wrap) {
		if (this._index >= 10 || wrap) {
			this._index = (this._index + 80) % 90;
		}
	}

	cursorRight(wrap) {
		if (this._index % 10 < 9) {
			this._index++;
		} else if (wrap) {
			this._index -= 9;
		}
	}

	cursorLeft(wrap) {
		if (this._index % 10 > 0) {
			this._index--;
		} else if (wrap) {
			this._index += 9;
		}
	}

	cursorPagedown() {
		this._page = (this._page + 1) % this.table()
			.length;
		this.refresh();
	}

	cursorPageup() {
		this._page = (this._page + this.table()
				.length - 1) % this.table()
			.length;
		this.refresh();
	}

	processCursorMove() {
		const lastPage = this._page;
		super.processCursorMove();
		this.updateCursor();
		if (this._page !== lastPage) {
			SoundManager.playCursor();
		}
	}

	processHandling() {
		if (this.isOpen() && this.active) {
			if (Input.isTriggered('shift')) {
				this.processJump();
			}
			if (Input.isRepeated('cancel')) {
				this.processBack();
			}
			if (Input.isRepeated('ok')) {
				this.processOk();
			}
		}
	}

	isCancelEnabled() {
		return true;
	}

	processCancel() {
		this.processBack();
	}

	processJump() {
		if (this._index !== 89) {
			this._index = 89;
			SoundManager.playCursor();
		}
	}

	processBack() {
		if (this._editWindow.back()) {
			SoundManager.playCancel();
		}
	}

	processOk() {
		if (this.character()) {
			this.onNameAdd();
		} else if (this.isPageChange()) {
			SoundManager.playOk();
			this.cursorPagedown();
		} else if (this.isOk()) {
			this.onNameOk();
		}
	}

	onNameAdd() {
		if (this._editWindow.add(this.character())) {
			SoundManager.playOk();
		} else {
			SoundManager.playBuzzer();
		}
	}

	onNameOk() {
		if (this._editWindow.name() === '') {
			if (this._editWindow.restoreDefault()) {
				SoundManager.playOk();
			} else {
				SoundManager.playBuzzer();
			}
		} else {
			SoundManager.playOk();
			this.callOkHandler();
		}
	}
}

Window_NameInput.LATIN1 = ['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e',
          'F', 'G', 'H', 'I', 'J', 'f', 'g', 'h', 'i', 'j',
          'K', 'L', 'M', 'N', 'O', 'k', 'l', 'm', 'n', 'o',
          'P', 'Q', 'R', 'S', 'T', 'p', 'q', 'r', 's', 't',
          'U', 'V', 'W', 'X', 'Y', 'u', 'v', 'w', 'x', 'y',
          'Z', '[', ']', '^', '_', 'z', '{', '}', '|', '~',
          '0', '1', '2', '3', '4', '!', '#', '$', '%', '&',
          '5', '6', '7', '8', '9', '(', ')', '*', '+', '-',
          '/', '=', '@', '<', '>', ':', ';', ' ', 'Page', 'OK'];
Window_NameInput.LATIN2 = ['Á', 'É', 'Í', 'Ó', 'Ú', 'á', 'é', 'í', 'ó', 'ú',
          'À', 'È', 'Ì', 'Ò', 'Ù', 'à', 'è', 'ì', 'ò', 'ù',
          'Â', 'Ê', 'Î', 'Ô', 'Û', 'â', 'ê', 'î', 'ô', 'û',
          'Ä', 'Ë', 'Ï', 'Ö', 'Ü', 'ä', 'ë', 'ï', 'ö', 'ü',
          'Ā', 'Ē', 'Ī', 'Ō', 'Ū', 'ā', 'ē', 'ī', 'ō', 'ū',
          'Ã', 'Å', 'Æ', 'Ç', 'Ð', 'ã', 'å', 'æ', 'ç', 'ð',
          'Ñ', 'Õ', 'Ø', 'Š', 'Ŵ', 'ñ', 'õ', 'ø', 'š', 'ŵ',
          'Ý', 'Ŷ', 'Ÿ', 'Ž', 'Þ', 'ý', 'ÿ', 'ŷ', 'ž', 'þ',
          'Ĳ', 'Œ', 'ĳ', 'œ', 'ß', '«', '»', ' ', 'Page', 'OK'];
Window_NameInput.RUSSIA = ['А', 'Б', 'В', 'Г', 'Д', 'а', 'б', 'в', 'г', 'д',
          'Е', 'Ё', 'Ж', 'З', 'И', 'е', 'ё', 'ж', 'з', 'и',
          'Й', 'К', 'Л', 'М', 'Н', 'й', 'к', 'л', 'м', 'н',
          'О', 'П', 'Р', 'С', 'Т', 'о', 'п', 'р', 'с', 'т',
          'У', 'Ф', 'Х', 'Ц', 'Ч', 'у', 'ф', 'х', 'ц', 'ч',
          'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'ш', 'щ', 'ъ', 'ы', 'ь',
          'Э', 'Ю', 'Я', '^', '_', 'э', 'ю', 'я', '%', '&',
          '0', '1', '2', '3', '4', '(', ')', '*', '+', '-',
          '5', '6', '7', '8', '9', ':', ';', ' ', '', 'OK'];
Window_NameInput.JAPAN1 = ['あ', 'い', 'う', 'え', 'お', 'が', 'ぎ', 'ぐ', 'げ', 'ご',
          'か', 'き', 'く', 'け', 'こ', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
          'さ', 'し', 'す', 'せ', 'そ', 'だ', 'ぢ', 'づ', 'で', 'ど',
          'た', 'ち', 'つ', 'て', 'と', 'ば', 'び', 'ぶ', 'べ', 'ぼ',
          'な', 'に', 'ぬ', 'ね', 'の', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
          'は', 'ひ', 'ふ', 'へ', 'ほ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ',
          'ま', 'み', 'む', 'め', 'も', 'っ', 'ゃ', 'ゅ', 'ょ', 'ゎ',
          'や', 'ゆ', 'よ', 'わ', 'ん', 'ー', '～', '・', '＝', '☆',
          'ら', 'り', 'る', 'れ', 'ろ', 'ゔ', 'を', '　', 'カナ', '決定'];
Window_NameInput.JAPAN2 = ['ア', 'イ', 'ウ', 'エ', 'オ', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ',
          'カ', 'キ', 'ク', 'ケ', 'コ', 'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ',
          'サ', 'シ', 'ス', 'セ', 'ソ', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド',
          'タ', 'チ', 'ツ', 'テ', 'ト', 'バ', 'ビ', 'ブ', 'ベ', 'ボ',
          'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'パ', 'ピ', 'プ', 'ペ', 'ポ',
          'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ',
          'マ', 'ミ', 'ム', 'メ', 'モ', 'ッ', 'ャ', 'ュ', 'ョ', 'ヮ',
          'ヤ', 'ユ', 'ヨ', 'ワ', 'ン', 'ー', '～', '・', '＝', '☆',
          'ラ', 'リ', 'ル', 'レ', 'ロ', 'ヴ', 'ヲ', '　', '英数', '決定'];
Window_NameInput.JAPAN3 = ['Ａ', 'Ｂ', 'Ｃ', 'Ｄ', 'Ｅ', 'ａ', 'ｂ', 'ｃ', 'ｄ', 'ｅ',
          'Ｆ', 'Ｇ', 'Ｈ', 'Ｉ', 'Ｊ', 'ｆ', 'ｇ', 'ｈ', 'ｉ', 'ｊ',
          'Ｋ', 'Ｌ', 'Ｍ', 'Ｎ', 'Ｏ', 'ｋ', 'ｌ', 'ｍ', 'ｎ', 'ｏ',
          'Ｐ', 'Ｑ', 'Ｒ', 'Ｓ', 'Ｔ', 'ｐ', 'ｑ', 'ｒ', 'ｓ', 'ｔ',
          'Ｕ', 'Ｖ', 'Ｗ', 'Ｘ', 'Ｙ', 'ｕ', 'ｖ', 'ｗ', 'ｘ', 'ｙ',
          'Ｚ', '［', '］', '＾', '＿', 'ｚ', '｛', '｝', '｜', '～',
          '０', '１', '２', '３', '４', '！', '＃', '＄', '％', '＆',
          '５', '６', '７', '８', '９', '（', '）', '＊', '＋', '－',
          '／', '＝', '＠', '＜', '＞', '：', '；', '　', 'かな', '決定'];

export default Window_NameInput;
