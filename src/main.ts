import { Application } from "./core/Application";
import { Logger } from "./log/Logger";
import log from "electron-log";

function init(): void {

	return;

	console.log = log.log;
	log.info("ロガー置き換え");
}

/**
 * エントリーポイントです。ここからアプリケーションが開始されます。
 */
function main(): void {

	try {

		init();

		log.info("### start ###");
		Logger.debug("<main()> called.");
		const app = Application.getInstance();
		app.run();
		log.info("--- end ---");
	}
	catch (e) {
		console.error(e);
	}
}

// ここから開始(※package.json に定義)
main();
