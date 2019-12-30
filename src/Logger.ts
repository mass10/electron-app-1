import { appendFileSync, writeFileSync } from "fs";
import { Timestamp } from "./Timestamp";

// ロギングクラス
export class Logger {

	private constructor() {

	}

	private static roateLogs(): void {

	}

	public static trace(...params: object[]): void {

		// ログファイルをローテーション
		Logger.roateLogs();

		// ロギング
		let line = "";
		line += Timestamp.timestamp0();
		line += " [TRACE] ";
		params.forEach(e => {
			line += e;
		});
		appendFileSync("electron-app-1.log", line + "\n");

		// 標準出力にも書き込み
		console.log(line);
	}
}
