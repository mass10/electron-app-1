import fs from "fs";
import { Timestamp } from "../util/Timestamp";

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
	 * デバッグログを出力します。
	 */
	public static debug(...params: any[]): void {
		// ログファイルをローテーション
		Logger.roateLogs();

		// ロギング
		let line = `${Timestamp.timestamp0()} [DEBUG] `;
		for (const e of params) {
			line += e;
		}
		line += "\n";
		fs.appendFileSync("electron-app-1.log", line);

		// 標準出力にも書き込み
		console.log(line);
	}

	/**
	 * エラーログを出力します。
	 */
	public static error(...params: any[]): void {
		// ログファイルをローテーション
		Logger.roateLogs();

		// ロギング
		let line = `${Timestamp.timestamp0()} [ERROR] `;
		for (const e of params) {
			line += e;
		}
		line += "\n";
		fs.appendFileSync("electron-app-1.log", line);

		// 標準出力にも書き込み
		console.error(line);
	}
}
