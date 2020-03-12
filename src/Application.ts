import electron from 'electron';
import { ConfigurationSettings } from './ConfigurationSettings'
import { Logger } from './Logger';
import { ApplicationWindow, WindowSnapshot, WindowSnapshotKey } from './ApplicationWindow';

/**
 * アプリケーション本体のクラス
 */
export class Application {

	/** electron.App */
	private _application: electron.App | null = null;

	/** 唯一のインスタンス */
	private static readonly _instance: Application = new Application();

	/**
	 * コンストラクター
	 */
	private constructor() {

	}

	/**
	 * electron.App オブジェクトを返します。
	 */
	private getElectronApp(): electron.App {

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
				// なにもしない
				break;
			default:
				// アプリケーションを終了します。
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

	public static onApplicationFullScreen(): void {
	}

	public static onApplicationWillQuit(): void {

		Logger.trace(["<Application.onApplicationWillQuit()>"]);
	}

	private readonly _temp = new WindowSnapshot();

	/**
	 * アプリケーションの状態を保存します。
	 * 
	 * @param flush true が要求された場合はファイルに書き込みを行います。
	 * false のときはメモリを更新するだけです。
	 * 引数が指定されなかっったときは false が指定されたものとします。
	 */
	public saveAppStatus(flush: boolean = false): void {

		// ウィンドウの状態を取得します。
		const window = ApplicationWindow.getInstance();
		if (!window)
			// アプリケーションのウィンドウはありません。
			return;

		const state = window.getCurrentWindowState();
		if (!state)
			// アプリケーションのウィンドウはありません。
			return;

		// ウィンドウの状態を記録します。
		if (window.isVisible()) {
			this._temp.set("left", state.left);
			this._temp.set("top", state.top);
			this._temp.set("width", state.width);
			this._temp.set("height", state.height);
			this._temp.set("fullscreen", state.fullscreen);
		}

		if (!flush) {
			// ファイルに出力せずに終了します。
			return;
		}

		// ファイルに記録します。
		this._temp.save();
	}

	/**
	 * アプリケーションを終了します。
	 */
	public quit(): void {

		Logger.trace(["<Application.quit()>"]);

		// アプリケーションの終了状態を保存します。
		this.saveAppStatus(true);
		// electron アプリケーションを終了します。
		this.getElectronApp().quit();
	}

	/**
	 * アプリケーションを実行します。
	 */
	public run(): void {

		Logger.trace("<Application.run()> ### START ###");
		const conf = ConfigurationSettings.getInstance();

		const app = this.getElectronApp();
		// アプリケーションが準備できた？
		app.on('ready', Application.onApplicationReady);
		// ウィンドウが閉じられた？
		app.on('window-all-closed', Application.onApplicationClose);
		// ウィンドウがアクティブになった？
		app.on('activate', Application.onApplicationActivate);
		// ？？
		app.on('will-quit', Application.onApplicationWillQuit);
		// app.on("enter-full-screen", Application.onApplicationFullScreen);

		Logger.trace(["<Application.run()> --- END ---"]);
	}

	/**
	 * アプリケーション唯一のインスタンスを返します。
	 * どこから呼び出されても同一のインスタンスを返します。
	 */
	public static getInstance(): Application {

		return Application._instance;
	}
}
