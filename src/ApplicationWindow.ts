import electron from "electron";
import { ConfigurationSettings } from "./ConfigurationSettings";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { Logger } from "./Logger";
import jsyaml from "js-yaml";
import path from "path";
import { Application } from "./Application";
import { CommandlineArguments } from "./CommandlineArguments";

/**
 * スナップショット属性のキー
 */
export type WindowSnapshotKey =
	"width" |
	"height" |
	"left" |
	"top" |
	"fullscreen";

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
		}
		catch (e) {
			Logger.trace("<WindowSnapshot.constructor()> スナップショットファイルをオープンできませんでした。理由: ", e);
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
		}
		catch {
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
		}
		catch {
			return false;
		}
	}

	/**
	 * スナップショットをファイルに書き込みます。
	 */
	public save(): void {

		Logger.trace(["<WindowSnapshot.save()>"]);
		const content = jsyaml.safeDump(this._settings);
		if (!existsSync("conf"))
			mkdirSync("conf");
		writeFileSync("conf/.application-settings-snapshot.yml", content, { flag: "w" });
	}
}

/**
 * ウィンドウの状態を表現する項目名
 */
export type WindowParameter = {
	width: string;
	height: string;
	left: string;
	top: string;
	fullscreen: boolean | null;
}

/**
 * ウィンドウクラス
 */
export class ApplicationWindow {

	/** ウィンドウクラスのインスタンス */
	private _window: electron.BrowserWindow | null = null;

	/** 唯一のインスタンス */
	private static readonly _instance = new ApplicationWindow();

	/** ウィンドウの位置 */
	private readonly _position = { left: 0, top: 0 };

	/**
	 * コンストラクター
	 */
	private constructor() {

	}

	/**
	 * グローバルなインスタンスを返します。
	 */
	public static getInstance(): ApplicationWindow {

		return ApplicationWindow._instance;
	}

	/**
	 * ウィンドウが可視状態にあるかどうかを調べます。
	 */
	public isVisible(): boolean {

		return this.getWindow()?.isVisible() ?? false;
	}

	/**
	 * ウィンドウの状態を調べます。
	 */
	public getCurrentWindowState(): WindowParameter {

		// ウィンドウオブジェクト
		const window = this.getWindow();

		if (!window)
			return { width: "", height: "", left: "", top: "", fullscreen: null };

		// ウィンドウの大きさ
		const size = window.getContentSize();
		// Logger.trace("ウィンドウの大きさ: ", size);

		// ウィンドウの位置
		if (window.isVisible()) {
			const position = window.getPosition();
			// Logger.trace("ウィンドウの位置: left: ", position[0], ", top: ", position[1]);
			this._position.left = position[0];
			this._position.top = position[1];
		}
		else {
			// Logger.trace("ウィンドウの位置: (invisible)");
		}

		// フルスクリーン
		const fullscreen = window.isFullScreen();
		// Logger.trace("フルスクリーン: ", fullscreen);

		const windowState = {
			width: `${size[0]}`,
			height: `${size[1]}`,
			left: `${this._position.left}`,
			top: `${this._position.top}`,
			fullscreen: fullscreen
		};
		return windowState;
	}

	/**
	 * ウィンドウが閉じられたとき
	 */
	private static onClosed(): void {

		Logger.trace("EVENT: [closed]");

		// ウィンドウを閉じます。
		ApplicationWindow.getInstance().close();
	}

	/**
	 * ウィンドウの準備ができたとき
	 */
	private static onReadyToShow(): void {

		Logger.trace("EVENT: [ready-to-show]");
	}

	/**
	 * ウィンドウを返します。
	 */
	private getWindow(): electron.BrowserWindow | null {

		return this._window;
	}

	/**
	 * ウィンドウのサイズが変更されたとき
	 */
	private static onWindowResize(): void {

		// アプリケーションの状態を保存します。
		Application.getInstance().saveAppStatus();
	}

	/**
	 * ウィンドウのスクリーン座標が変更されたとき
	 */
	private static onMoveWindow(): void {

		// アプリケーションの状態を保存します。
		Application.getInstance().saveAppStatus();
	}

	/**
	 * ウィンドウを作成します。
	 * 
	 * @returns electron.BrowserWindow
	 */
	public createWindow(): electron.BrowserWindow {

		if (this._window)
			return this._window;
		// コンフィギュレーション
		const conf = ConfigurationSettings.getInstance();
		// ウィンドウの状態を復元します。
		const windowState = new WindowSnapshot();
		const parameters = {
			width: windowState.getNumber("width") || 800,
			height: windowState.getNumber("height") || 600,
			left: windowState.getNumber("left") ?? 0,
			top: windowState.getNumber("top") ?? 0,
			fullscreen: windowState.getBoolean("fullscreen") ?? false,
			webPreferences: {
				nodeIntegration: true,
				preload: path.resolve("dist/preload.js")
			}
		};
		// アプリケーションのメインウィンドウです。
		Logger.trace("<WindowSnapshot.createWindow()> Window state ", JSON.stringify(parameters));
		const window = new electron.BrowserWindow(parameters);
		// メインウィンドウで index.html を開きます。
		// window.loadFile('./index.html');
		window.loadURL("http://localhost:3000");
		// alert("http://localhost:3000");
		// Developer Tool を開きます。
		const args = new CommandlineArguments();
		if (args.getBoolean("--open-devtools")) {
			window.webContents.openDevTools();
		}
		// 閉じられるときの処理です。
		window.on("closed", ApplicationWindow.onClosed);
		// ウィンドウのリサイズ
		window.on("will-resize", ApplicationWindow.onWindowResize);
		// ウィンドウの移動
		window.on("move", ApplicationWindow.onMoveWindow);
		// フルスクリーン
		window.on("enter-full-screen", ApplicationWindow.onWindowResize);
		// フルスクリーン
		window.on("leave-full-screen", ApplicationWindow.onWindowResize);
		// 可視化されるときの処理(？)
		window.once("ready-to-show", ApplicationWindow.onReadyToShow);
		this._window = window;
		return window;
	}

	/**
	 * 開発者ツールを開きます。
	 */
	public openDevTools(): void {
		const window = this.getWindow();
		if (!window)
			return;
		if (window.webContents.isDevToolsOpened())
			return;
		if (window.webContents.isDevToolsFocused())
			return;
		window.webContents.openDevTools();
	}

	/**
	 * ウィンドウを閉じます。
	 */
	private close(): void {

		if (!this._window)
			return;
		this._window = null;
	}
}
