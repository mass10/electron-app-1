import { appendFileSync } from "fs";
import { Timestamp } from "./Timestamp";

/**
 * ロギングクラス
 */
export class Logger {

	/**
	 * コントラクターは非公開
	 */
	private constructor() {

	}

	/**
	 *
	 */
	private static roateLogs(): void {

	}

	/**
	 *
	 */
	public static trace(...params: any[]): void {

		// ログファイルをローテーション
		Logger.roateLogs();

		// ロギング
		let line = "";
		line += Timestamp.timestamp0();
		line += " [TRACE] ";
		params.forEach(e => {
			line += e;
		});
		appendFileSync(".electron-app-1.log", line + "\n");

		// 標準出力にも書き込み
		console.log(line);
	}

	/**
	 *
	 */
	public static error(...params: any[]): void {
		// ログファイルをローテーション
		Logger.roateLogs();
		// ロギング
		let line = "";
		line += Timestamp.timestamp0();
		line += " [ERROR] ";
		params.forEach(e => {
			line += e;
		});
		appendFileSync(".electron-app-1.log", line + "\n");
		// 標準出力にも書き込み
		console.error(line);
	}
}
