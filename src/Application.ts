import electron from 'electron';
import { ConfigurationSettings } from './ConfigurationSettings'
import { readFileSync, writeFileSync } from 'fs';
import { Logger } from './Logger';
import { ApplicationWindow, WindowSnapshot, WindowSnapshotKeys } from './ApplicationWindow';

// enum WindowSnapshotKeys {
// 	width = "width",
// 	height = "height",
// 	left = "left",
// 	top = "top",
// 	fullscreen = "fullscreen"
// }

export class Application {

	private _application: electron.App | null = null;

	private static readonly _instance: Application = new Application();

	/**
	 * コンストラクター
	 */
	private constructor() {

	}

	/**
	 * electron.App オブジェクトを返します。
	 */
	private getCoreApp(): electron.App {

		if (!this._application)
			this._application = electron.app;
		return this._application;
	}

	/**
	 * すべてのウィンドウが閉じられたときのイベントハンドラーです。
	 */
	public static onApplicationClose(): void {

		Logger.trace(["<Application.onApplicationClose()>"]);

		switch (process.platform) {
			case 'darwin':
				break;
			default:
				Application.getInstance().quit();
				break;
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

	public static onApplicationWillQuit(): void {

		Logger.trace(["<Application.onApplicationWillQuit()>"]);
	}

	private readonly temp = new WindowSnapshot();

	public saveAppStatus(flush: boolean = false): void {

		Logger.trace(["<Application.saveAppStatus()> アプリケーションの状態を保存しています..."]);

		// ウィンドウの状態を取得します。
		const window = ApplicationWindow.getInstance();
		if (!window)
			// アプリケーションのウィンドウはありません。
			return;

		const param = window.getCurrentWindowState();
		if (!param)
			// アプリケーションのウィンドウはありません。
			return;

		// ウィンドウの状態を記録します。
		this.temp.set(WindowSnapshotKeys.left, param.left);
		this.temp.set(WindowSnapshotKeys.top, param.top);
		this.temp.set(WindowSnapshotKeys.width, param.width);
		this.temp.set(WindowSnapshotKeys.height, param.height);
		this.temp.set(WindowSnapshotKeys.fullscreen, param.height);

		if (!flush)
			// ファイルに出力せずに終了します。
			return;

		// ファイルに記録します。
		this.temp.save();
	}

	public quit(): void {

		Logger.trace(["<Application.quit()>"]);
		// アプリケーションの終了状態を保存します。
		this.saveAppStatus(true);
		// electron アプリケーションを終了します。
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
		// ？？
		app.on('will-quit', Application.onApplicationWillQuit);

		Logger.trace(["<Application.run()> --- END ---"]);
	}

	public static getInstance(): Application {

		return Application._instance;
	}
}
