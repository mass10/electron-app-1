import electron from 'electron';
import { ConfigurationSettings } from './ConfigurationSettings'
import { readFileSync, writeFileSync } from 'fs';
import { Logger } from './Logger';
import jsyaml from 'js-yaml';
import { Application } from './Application';

export enum WindowSnapshotKeys {
	width = "width",
	height = "height",
	left = "left",
	top = "top",
	fullscreen = "fullscreen"
}

// ウィンドウの状態を格納するクラスです。前回終了時の状態を復元するために利用されます。
export class WindowSnapshot {

	private _settings: any = {};

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

	public set(key: WindowSnapshotKeys, value: any): void {

		this._settings[key] = value;
	}

	public get(key: WindowSnapshotKeys): any {

		return this._settings[key];
	}

	public save(): void {

		Logger.trace(["<WindowSnapshot.save()>"]);
		const content = jsyaml.safeDump(this._settings);
		writeFileSync("conf/.application-settings-snapshot.yml", content, { flag: "w" });
	}
}

// ウィンドウの状態を表現する項目名
export type WindowParameter = {
	width: string;
	height: string;
	left: string;
	top: string;
	fullscreen: string;
}

// ウィンドウクラス
export class ApplicationWindow {

	private _window: electron.BrowserWindow | null = null;

	private static readonly _instance = new ApplicationWindow();

	private readonly _position = { left: 0, top: 0 };

	private constructor() {

	}

	public static getInstance(): ApplicationWindow {

		return ApplicationWindow._instance;
	}

	public isVisible(): boolean {

		return this.getWindow()?.isVisible() ?? false;
	}

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
			Logger.trace("ウィンドウの位置: invisible");
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

	private static onClosed(): void {

		Logger.trace("EVENT: [closed]");

		// ウィンドウを閉じます。
		ApplicationWindow.getInstance().close();
	}

	private static onReadyToShow(): void {

		Logger.trace("EVENT: [ready-to-show]");
	}

	private getWindow(): electron.BrowserWindow | null {

		return this._window;
	}

	private static onWindowResize(): void {

		Logger.trace("EVENT: [will-resize]");

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
		window.on('closed', ApplicationWindow.onClosed);
		// ウィンドウのリサイズ
		window.on("will-resize", ApplicationWindow.onWindowResize);
		// 可視化されるときの処理(？)
		window.once('ready-to-show', ApplicationWindow.onReadyToShow);
		this._window = window;
		return window;
	}

	private close(): void {

		this._window = null;
	}
}
