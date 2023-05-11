import electron from "electron";
import { ConfigurationSettings } from "../configuration/ConfigurationSettings"
import { Logger } from "../log/Logger";
import { ApplicationWindow } from "../ui/ApplicationWindow";
import path from "path";
import os from "os";
import { CommandlineArguments } from "../util/CommandlineArguments";
import { WindowSnapshot } from "../ui/WindowSnapshot";
import child_process from "child_process";

/** ネットワーク関連の詳細ログ */
let _netlog = false;

async function startNetLogging(): Promise<void> {
	stopNetLogging();
	_netlog = true;	
	await electron.netLog.startLogging('./netlog');
	console.log('Net-logs written to ./netlog');
}

function stopNetLogging(): void {
	if (_netlog === false)
		return;
	electron.netLog.stopLogging();
	_netlog = false;
}

/**
 * アプリケーション本体のクラス
 */
export class Application {

	/** electron.App */
	private readonly _application = electron.app;

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

		return this._application;
	}

	/**
	 * すべてのウィンドウが閉じられたときのイベントハンドラーです。
	 */
	public static onApplicationClose(): void {

		Logger.debug(["<Application.onApplicationClose()>"]);

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

	/** ネットワーク関連の詳細ログ */
	private static async setupLogging() {

		return;
		startNetLogging();
	}

	private static async onApplicationReady() {

		Logger.debug("<Application.onApplicationReady()>");

		await Application.setupLogging();

		const window = ApplicationWindow.getInstance().createWindow();

		// ショートカットキーの登録(ダメ)
		electron.globalShortcut.register("F12", () => {
			ApplicationWindow.getInstance().openDevTools();
		});
		ApplicationWindow.getInstance().openDevTools();

		// temporary data ??
		{
			const userData = Application.getInstance().getElectronApp().getPath("userData");
			Logger.debug(`userData is ${userData}`);
		}

		// Cookie ??
		if (false) electron.Session.defaultSession.cookies.on;

		// ========== 拡張をロードします ==========
		if (false) await Application.getInstance().loadExtensions();
	}

	private static onApplicationActivate(): void {

		Logger.debug("<Application.onApplicationActivate()>");
		ApplicationWindow.getInstance().createWindow();
	}

	private static onApplicationWillQuit(): void {

		Logger.debug("<Application.onApplicationWillQuit()>");
		stopNetLogging();
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

		Logger.debug("<Application.quit()>");

		// アプリケーションの終了状態を保存します。
		this.saveAppStatus(true);
		// electron アプリケーションを終了します。
		this.getElectronApp().quit();
	}

	/**
	 * 拡張をロードします。
	 */
	private async loadExtensions(): Promise<void> {
		const currentDir = path.resolve(".");
		Logger.debug("Your current directory is ... [", currentDir, "].");
		const editorPath = path.join(__dirname, "my-extension-1");
		electron.BrowserWindow.addExtension(editorPath);
	}

	/**
	 * アプリケーションを実行します。
	 */
	public run(): void {

		Logger.debug("<Application.run()> ### START ###");

		// 実行時の予期しない例外をキャッチする方法？？
		process.on("uncaughtException", (err) => {
			const messageBoxOptions = {
				type: "error",
				title: "Error in Main process",
				message: "Something failed"
			};
			electron.dialog.showMessageBox(messageBoxOptions);
			throw err;
		});

		const conf = ConfigurationSettings.getInstance();

		const args = CommandlineArguments.getInstance();

		const app = this.getElectronApp();
		// なんか8からデフォルト値が変わったという警告が出たので追加した
		app.allowRendererProcessReuse = true;

		if (args.getBoolean("--open-devtools")) {
			// app.def
		}

		{
			const path = app.getPath("userData");
			Logger.debug(`userData is: [${path}]`);
		}

		// アプリケーションが準備できた？
		app.on('ready', Application.onApplicationReady);
		// ウィンドウが閉じられた？
		app.on('window-all-closed', Application.onApplicationClose);
		// ウィンドウがアクティブになった？
		app.on('activate', Application.onApplicationActivate);
		// ？
		app.on('will-quit', Application.onApplicationWillQuit);
		// IPC message
		electron.ipcMain.on("#random", Application.onIPCMessage);

		Logger.debug(["<Application.run()> --- END ---"]);
	}

	/**
	 * アプリケーション唯一のインスタンスを返します。
	 * どこから呼び出されても同一のインスタンスを返します。
	 */
	public static getInstance(): Application {
		return Application._instance;
	}

	private static onIPCMessage(event: electron.IpcMainEvent, args: any[]): void {
		const message = `${args}`;
		Logger.debug("<Application.onIPCMessage()> RECV! [" + message + "] ", JSON.stringify(args));
		event.returnValue = "OK";
	}
}
