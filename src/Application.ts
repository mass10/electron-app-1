import electron from 'electron';
import { ConfigurationSettings } from './ConfigurationSettings'
import { readFileSync, writeFileSync } from 'fs';
import { Logger } from './Logger';
import jsyaml from 'js-yaml';
import path from 'path';

enum WindowSnapshotKeys {
	width = "width",
	height = "height",
	left = "left",
	top = "top",
}

// ウィンドウの状態を格納するクラスです。前回終了時の状態を復元するために利用されます。
class WindowSnapshot {

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
type WindowParameter = {
	width: string;
	height: string;
	left: string;
	top: string;
	fullscreen: string;
}

// ウィンドウクラス
class ApplicationWindow {

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
		// 可視化されるときの処理(？)
		win.once('ready-to-show', ApplicationWindow.onReadyToShow);
		this._window = win;
		return win;
	}

	private close(): void {

		this._window = null;
	}
}

export class Application {

	private _application: electron.App | null = null;

	private static readonly _instance: Application = new Application();

	private constructor() {

	}

	private getCoreApp(): electron.App {

		if (!this._application)
			this._application = electron.app;
		return this._application;
	}

	public static onApplicationClose(): void {

		Logger.trace(["<Application.onApplicationClose()>"]);
		switch (process.platform) {
			case 'darwin':
				break;
			default:
				Application.getInstance().quit();
		}
	}

	public static onApplicationReady(): void {

		Logger.trace(["<Application.onApplicationReady()>"]);
		ApplicationWindow.getInstance().createWindow();
	}

	public static onApplicationActivate(): void {

		Logger.trace(["<Application.onApplicationActivate()>"]);
		ApplicationWindow.getInstance().createWindow();
	}

	private save(): void {

		Logger.trace(["<Application.save()> アプリケーションの状態を保存しています..."]);

		// ウィンドウの状態を取得します。
		const window = ApplicationWindow.getInstance();
		const param = window.getCurrentWindowState();

		// 一時ファイルに記録します。
		const temp = new WindowSnapshot();
		temp.set(WindowSnapshotKeys.left, param.left);
		temp.set(WindowSnapshotKeys.top, param.top);
		temp.set(WindowSnapshotKeys.width, param.width);
		temp.set(WindowSnapshotKeys.height, param.height);
		temp.save();
	}

	public quit(): void {

		Logger.trace(["<Application.quit()>"]);
		this.save();
		this.getCoreApp().quit();
	}

	public run(): void {

		Logger.trace(["<Application.run()> ### START ###"]);

		const conf = ConfigurationSettings.getInstance();

		const app = this.getCoreApp();
		// アプリケーションが準備できた？
		app.on('ready', Application.onApplicationReady);
		// ウィンドウが閉じられた？
		app.on('window-all-closed', Application.onApplicationClose);
		// ウィンドウがアクティブになった？
		app.on('activate', Application.onApplicationActivate);

		Logger.trace(["<Application.run()> --- END ---"]);
	}

	public static getInstance(): Application {

		return Application._instance;
	}
}
