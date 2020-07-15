import { Application } from "./Application";
import { Logger } from "./Logger";
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
		Logger.trace("<main()> called.");
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
