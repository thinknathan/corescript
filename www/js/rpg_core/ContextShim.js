class ContextShim {
	constructor(...args) {
		this.globalCompositeOperation = '';
		this.fillStyle = '';
		this.globalAlpha = 1;
	}

	clearRect() {
		console.log('ContextShim clearRect');
	}

	save() {
		console.log('ContextShim save');
	}

	drawImage() {
		console.log('ContextShim drawImage');
	}

	restore() {
		console.log('ContextShim restore');
	}

	fillRect() {
		console.log('ContextShim fillRect');
	}

	beginPath() {
		console.log('ContextShim beginPath');
	}

	arc() {
		console.log('ContextShim arc');
	}

	stroke() {
		console.log('ContextShim stroke');
	}

	setTransform() {
		console.log('ContextShim setTransform');
	}

	putImageData() {
		console.log('ContextShim putImageData');
	}

	createLinearGradient() {
		console.log('ContextShim createLinearGradient');
		return {
			addColorStop: () =>
				console.log('ContextShim createLinearGradient.addColorStop'),
		};
	}

	getImageData() {
		console.log('ContextShim getImageData');
		return {
			data: [],
		};
	}
}

export default ContextShim;
