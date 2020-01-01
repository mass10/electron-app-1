"use strict";

import { Application } from "./Application";
import { Logger } from "./Logger";

// エントリーポイントです。ここからアプリケーションが開始されます。(package.json に定義)
function main() {

	Logger.trace("<main()> called.");
	const app = Application.getInstance();
	app.run();
}

main();
