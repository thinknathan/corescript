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

	restore() {
		console.log('ContextShim restore');
	 }

	setTransform() {
		console.log('ContextShim setTransform');
	 }
}

export default ContextShim;
