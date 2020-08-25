class Collision {
	static checkCollide(obj1: Phaser.GameObjects.Sprite, obj2: Phaser.GameObjects.Sprite) {
		let distX = Math.abs(obj1.x - obj2.x);
		let distY = Math.abs(obj1.y - obj2.y);

		if (distX < obj1.width / 2 && distY < obj1.height) {
			return true;
		}

		return false;
	}
}