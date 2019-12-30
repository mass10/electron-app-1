import { Application } from "./Application";

// エントリーポイント
function main() {

	const app = Application.getInstance();
	app.run();
}

main();
