class RequestQueue {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this._queue = [];
	}

	enqueue(key, value) {
		this._queue.push({
			key,
			value,
		});
	}

	update() {
		if (this._queue.length === 0) return;

		const top = this._queue[0];
		if (top.value.isRequestReady()) {
			this._queue.shift();
			if (this._queue.length !== 0) {
				this._queue[0].value.startRequest();
			}
		} else {
			top.value.startRequest();
		}
	}

	raisePriority(key) {
		for (let n = 0; n < this._queue.length; n++) {
			const item = this._queue[n];
			if (item.key === key) {
				this._queue.splice(n, 1);
				this._queue.unshift(item);
				break;
			}
		}
	}

	clear() {
		this._queue.splice(0);
	}
}

export default RequestQueue;
