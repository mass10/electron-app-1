import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { Logger } from "../log/Logger";
import jsyaml from "js-yaml";

/**
 * スナップショット属性のキー
 */
export type WindowSnapshotKey = "width" | "height" | "left" | "top" | "fullscreen";

/**
 * ウィンドウの状態を格納するクラスです。前回終了時の状態を復元するために利用されます。
 */
export class WindowSnapshot {
	private _settings: any = {};

	/**
	 * コンストラクター
	 */
	public constructor() {
		try {
			const content = readFileSync("conf/.application-settings-snapshot.yml", { encoding: "utf-8" });
			const yaml = jsyaml.safeLoad(content);
			this._settings = yaml;
		} catch (e) {
			Logger.debug(
				"<WindowSnapshot.constructor()> スナップショットファイルをオープンできませんでした。理由: ",
				e
			);
		}
	}

	/**
	 * スナップショットに値を保管します。
	 *
	 * @param key
	 * @param value
	 */
	public set(key: WindowSnapshotKey, value: any): void {
		this._settings[key] = value;
	}

	/**
	 * スナップショットから値を取り出します。
	 *
	 * @param key
	 */
	public get(key: WindowSnapshotKey): any {
		return this._settings[key];
	}

	/**
	 * スナップショットから値を取り出します。
	 *
	 * @param key
	 */
	public getNumber(key: WindowSnapshotKey): number {
		try {
			return parseInt(this._settings[key]);
		} catch {
			return 0;
		}
	}

	/**
	 * スナップショットから値を取り出します。
	 *
	 * @param key
	 */
	public getBoolean(key: WindowSnapshotKey): boolean {
		try {
			const value = ("" + this._settings[key]).toLowerCase();
			return value === "true" || value === "1";
		} catch {
			return false;
		}
	}

	/**
	 * スナップショットをファイルに書き込みます。
	 */
	public save(): void {
		Logger.debug(["<WindowSnapshot.save()>"]);
		const content = jsyaml.safeDump(this._settings);
		if (!existsSync("conf")) mkdirSync("conf");
		writeFileSync("conf/.application-settings-snapshot.yml", content, { flag: "w" });
	}
}
