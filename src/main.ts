import { Application } from "./Application";
import { Logger } from "./Logger";
// import log from "electron-log";

/**
 * エントリーポイントです。ここからアプリケーションが開始されます。
 */
function main() {

	// if (false) {
	// 	console.log = log.log;
	// 	log.info("### start ###");
	// 	log.info("ロガー！！！");
	// 	log.info("--- end ---");
	// }

	Logger.trace("<main()> called.");
	const app = Application.getInstance();
	app.run();
}

// ここから開始(※package.json に定義)
main();
