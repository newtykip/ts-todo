class Greeter {
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	hello() {
		console.log(`Hello, ${this.name}!`);
	}
}

const world = new Greeter('world');
world.hello();
