class ImageCache {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this._items = {};
	}

	add(key, value) {
		this._items[key] = {
			bitmap: value,
			touch: Date.now(),
			key
		};

		this._truncateCache();
	}

	get(key) {
		if (this._items[key]) {
			const item = this._items[key];
			item.touch = Date.now();
			return item.bitmap;
		}

		return null;
	}

	reserve(key, value, reservationId) {
		if (!this._items[key]) {
			this._items[key] = {
				bitmap: value,
				touch: Date.now(),
				key
			};
		}

		this._items[key].reservationId = reservationId;
	}

	releaseReservation(reservationId) {
		const items = this._items;

		Object.keys(items)
			.map(key => items[key])
			.forEach(item => {
				if (item.reservationId === reservationId) {
					delete item.reservationId;
				}
			});
	}

	_truncateCache() {
		const items = this._items;
		let sizeLeft = ImageCache.limit;

		Object.keys(items)
			.map(key => items[key])
			.sort((a, b) => a.touch - b.touch)
			.forEach(item => {
				if (sizeLeft > 0 || this._mustBeHeld(item)) {
					const bitmap = item.bitmap;
					sizeLeft -= bitmap.width * bitmap.height;
				} else {
					delete items[item.key];
				}
			});
	}

	_mustBeHeld({
		bitmap,
		reservationId
	}) {
		// request only is weak so It's purgeable
		if (bitmap.isRequestOnly()) return false;
		// reserved item must be held
		if (reservationId) return true;
		// not ready bitmap must be held (because of checking isReady())
		if (!bitmap.isReady()) return true;
		// then the item may purgeable
		return false;
	}

	isReady() {
		const items = this._items;
		return !Object.keys(items)
			.some(key => !items[key].bitmap.isRequestOnly() && !items[key].bitmap.isReady());
	}

	getErrorBitmap() {
		const items = this._items;
		let bitmap = null;
		if (Object.keys(items)
			.some(key => {
				if (items[key].bitmap.isError()) {
					bitmap = items[key].bitmap;
					return true;
				}
				return false;
			})) {
			return bitmap;
		}

		return null;
	}
}

ImageCache.limit = 10 * 1000 * 1000;

export default ImageCache;
