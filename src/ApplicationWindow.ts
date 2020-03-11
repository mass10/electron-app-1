import electron from 'electron';
import { ConfigurationSettings } from './ConfigurationSettings'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { Logger } from './Logger';
import jsyaml from 'js-yaml';
import { Application } from './Application';

/**
 * スナップショット属性のキー
 */
export enum WindowSnapshotKeys {
	width = "width",
	height = "height",
	left = "left",
	top = "top",
	fullscreen = "fullscreen"
}

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
			Logger.trace("スナップショットファイルをオープンできませんでした。理由: ", e);
		}
	}

	/**
	 * スナップショットに値を保管します。
	 * @param key 
	 * @param value 
	 */
	public set(key: WindowSnapshotKeys, value: any): void {

		this._settings[key] = value;
	}

	/**
	 * スナップショットから値を取り出します。
	 * @param key 
	 */
	public get(key: WindowSnapshotKeys): any {

		return this._settings[key];
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
	fullscreen: string;
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
			return { width: "", height: "", left: "", top: "", fullscreen: "" };

		// ウィンドウの大きさ
		const size = window.getContentSize();
		Logger.trace("ウィンドウの大きさ: ", size);

		// ウィンドウの位置
		if (window.isVisible()) {
			const position = window.getPosition();
			Logger.trace("ウィンドウの位置: left: ", position[0], ", top: ", position[1]);
			this._position.left = position[0];
			this._position.top = position[1];
		}
		else {
			Logger.trace("ウィンドウの位置: (invisible)");
		}

		// フルスクリーン
		const fullscreen = window.isFullScreen();
		Logger.trace("フルスクリーン: ", fullscreen);

		const windowState = {
			width: `${size[0]}`,
			height: `${size[1]}`,
			left: `${this._position.left}`,
			top: `${this._position.top}`,
			fullscreen: `${fullscreen}`
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

		Logger.trace("EVENT: [will-resize]");

		// アプリケーションの状態を保存します。
		Application.getInstance().saveAppStatus();
	}

	/**
	 * ウィンドウのスクリーン座標が変更されたとき
	 */
	private static onMoveWindow(): void {

		Logger.trace("EVENT: [move]");

		// アプリケーションの状態を保存します。
		Application.getInstance().saveAppStatus();
	}

	/**
	 * ウィンドウを作成します。
	 * @returns electron.BrowserWindow
	 */
	public createWindow(): electron.BrowserWindow {

		if (this._window)
			return this._window;
		// コンフィギュレーション
		const conf = ConfigurationSettings.getInstance();
		// ウィンドウの状態を復元します。
		const windowState = new WindowSnapshot();
		Logger.trace("ウィンドウ初期状態: ");
		console.log(windowState);
		const parameters = {
			width: windowState.get(WindowSnapshotKeys.width) || 800,
			height: windowState.get(WindowSnapshotKeys.height) || 600,
			left: windowState.get(WindowSnapshotKeys.left) ?? 0,
			top: windowState.get(WindowSnapshotKeys.top) ?? 0,
			fullscreen: windowState.get(WindowSnapshotKeys.fullscreen) ?? false,
			webPreferences: {
				nodeIntegration: true,
				preload: 'dist/preload.js'
			}
		};
		// アプリケーションのメインウィンドウです。
		const window = new electron.BrowserWindow(parameters);
		// メインウィンドウで index.html を開きます。
		window.loadFile('./index.html');
		// Developer Tool を開きます。
		if (false)
			window.webContents.openDevTools();
		// 閉じられるときの処理です。
		window.on("closed", ApplicationWindow.onClosed);
		// ウィンドウのリサイズ
		window.on("will-resize", ApplicationWindow.onWindowResize);
		// ウィンドウの移動
		window.on("move", ApplicationWindow.onMoveWindow);
		// 可視化されるときの処理(？)
		window.once("ready-to-show", ApplicationWindow.onReadyToShow);
		this._window = window;
		return window;
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
