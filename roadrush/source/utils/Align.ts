class Align {
	static scaleToGameWidth(obj: any, percentage: number) {
		obj.displayWidth = Config.options.width * percentage;
		obj.scaleY = obj.scaleX;
	}

	static center(obj: any) {
		obj.x = Config.options.width / 2;
		obj.y = Config.options.height / 2;
	}

	static centerHorizontal(obj: any) {
		obj.x = Config.options.width / 2;
	}

	static centerVertical(obj: any) {
		obj.y = Config.options.height / 2;
	}
}