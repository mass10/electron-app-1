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
}

// ウィンドウの状態を格納するクラスです。前回終了時の状態を復元するために利用されます。
export class WindowSnapshot {

	private _settings = {
		"width": "",
		"height": "",
		"left": "",
		"top": ""
	};

	public width: string = "";

	public height: string = "";

	public left: string = "";

	public top: string = "";

	public constructor() {

		try {
			const content = readFileSync("conf/.application-settings-snapshot.yml", { encoding: "utf-8" });
			const yaml = jsyaml.safeLoad(content);
			this._settings = yaml;
		}
		catch (e) {
			Logger.trace(["スナップショットファイルをオープンできませんでした。理由: ", e]);
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

	private constructor() {

	}

	public static getInstance(): ApplicationWindow {

		return ApplicationWindow._instance;
	}

	public getCurrentWindowState(): WindowParameter {

		// ウィンドウオブジェクト
		const window = this._window;

		if (!window)
			return { width: "", height: "", left: "", top: "", fullscreen: "" };

		// ウィンドウの大きさ
		const size = window.getContentSize();
		Logger.trace("ウィンドウの大きさ: ", size);

		// ウィンドウの位置
		const position = window.getPosition();
		Logger.trace("ウィンドウの位置: ", position);

		// フルスクリーン
		const fullscreen = window.isFullScreen();
		Logger.trace("フルスクリーン: ", fullscreen);

		return { width: `${size[0]}`, height: `${size[1]}`,
			left: `${position[0]}`, top: `${position[1]}`,
			fullscreen: `${fullscreen}` };
	}

	private static onClosed(): void {

		Logger.trace("EVENT: [closed]");
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
		const app = Application.getInstance();
		app.save();
	}

	public createWindow(): electron.BrowserWindow {

		if (this._window)
			return this._window;
		// コンフィギュレーション
		const conf = ConfigurationSettings.getInstance();
		// ウィンドウの状態を復元します。
		const windowState = new WindowSnapshot();
		windowState.get(WindowSnapshotKeys.left);
		windowState.get(WindowSnapshotKeys.top);
		windowState.get(WindowSnapshotKeys.width);
		windowState.get(WindowSnapshotKeys.height);
		const parameters = {
			width: windowState.get(WindowSnapshotKeys.width) || 800,
			height: windowState.get(WindowSnapshotKeys.height) || 600,
			left: 10,
			top: 10,
			webPreferences: {
				nodeIntegration: true,
				preload: 'dist/preload.js'
			}
		};
		const win = new electron.BrowserWindow(parameters);
		// index.html を開きます。
		win.loadFile('./index.html');
		// Developer Tool を開きます。
		if (false)
			win.webContents.openDevTools();
		// 閉じられるときの処理です。
		win.on('closed', ApplicationWindow.onClosed);
		// ウィンドウのリサイズ
		win.on("will-resize", ApplicationWindow.onWindowResize);
		// 可視化されるときの処理(？)
		win.once('ready-to-show', ApplicationWindow.onReadyToShow);
		this._window = win;
		return win;
	}

	private close(): void {

		this._window = null;
	}
}
