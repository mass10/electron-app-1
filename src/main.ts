import { Application } from "./Application";
import { Logger } from "./Logger";

/**
 * エントリーポイントです。ここからアプリケーションが開始されます。
 */
function main() {

	Logger.trace("<main()> called.");
	const app = Application.getInstance();
	app.run();
}

// ここから開始(※package.json に定義)
main();
