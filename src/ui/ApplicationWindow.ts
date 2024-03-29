import electron from "electron";
import { ConfigurationSettings } from "../configuration/ConfigurationSettings";
import { Logger } from "../log/Logger";
import path from "path";
import { Application } from "../core/Application";
import { CommandlineArguments } from "../util/CommandlineArguments";
import { WindowSnapshot } from "./WindowSnapshot";
import fs from "fs";

/**
 * ウィンドウの状態を表現する項目名
 */
export type WindowParameter = {
	width: string;
	height: string;
	left: string;
	top: string;
	fullscreen: boolean | null;
};

function detectPath(relativePath: string): string {
	let absolutePath = path.resolve(relativePath);
	if (!fs.existsSync(absolutePath)) return "";
	Logger.debug(`ファイルを検出した！ ${absolutePath}`);
	return absolutePath;
}

/**
 * preload.js のパスを返します。
 *
 * 開発時と Electron アプリケーションにパッケージされた時でパスに違いがあります。
 */
function getPreloadScriptPath(): string {
	return detectPath("./preload.js") || detectPath("./dist/preload.js") || path.resolve("./preload.js");
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
	private constructor() {}

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

		if (!window) return { width: "", height: "", left: "", top: "", fullscreen: null };

		// ウィンドウの大きさ
		const size = window.getContentSize();
		// Logger.trace("ウィンドウの大きさ: ", size);

		// ウィンドウの位置
		if (window.isVisible()) {
			const position = window.getPosition();
			// Logger.trace("ウィンドウの位置: left: ", position[0], ", top: ", position[1]);
			this._position.left = position[0];
			this._position.top = position[1];
		} else {
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
			fullscreen: fullscreen,
		};
		return windowState;
	}

	/**
	 * ウィンドウが閉じられたとき
	 */
	private static onClosed(): void {
		Logger.debug("<ApplicationWindow.onClosed()> EVENT: [closed]");
		// ウィンドウを閉じます。
		ApplicationWindow.getInstance().close();
	}

	/**
	 * ウィンドウの準備ができたとき
	 */
	private static onReadyToShow(): void {
		// ※来ない
		// throw new Error("NOT IMPLEMENTED!!");
		// Logger.trace("<ApplicationWindow.onReadyToShow()> EVENT: [ready-to-show] ★");
		ApplicationWindow.getInstance().getWindow()?.show();
	}

	/**
	 * システムのショートカットキー
	 *
	 * @param e
	 * @param cmd
	 */
	private static onAppCommand(e: Event, cmd: string): void {
		const window = ApplicationWindow.getInstance().getWindow();
		if (!window) return;

		// Navigate the window back when the user hits their mouse back button
		if (cmd === "browser-backward") {
			if (window.webContents.canGoBack()) window.webContents.goBack();
		}
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
		if (this._window) return this._window;
		// コンフィギュレーション
		Logger.debug("コンフィギュレーション");
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
				nodeIntegration: false,
				contextIsolation: true,
				preload: "dist/ui/preload.js",
			},
		} as electron.BrowserWindowConstructorOptions;
		// アプリケーションのメインウィンドウです。
		Logger.debug("<WindowSnapshot.createWindow()> Window state ", JSON.stringify(parameters));
		const window = new electron.BrowserWindow(parameters);
		{
			const pathname = path.resolve("./index.html");
			const state = fs.existsSync(pathname);
			Logger.debug(`${pathname} が存在しているかチェック ... ${state}`);
		}
		// メインウィンドウで index.html を開きます。
		window.loadFile("./index.html");
		// window.loadURL("http://localhost:3000");
		// window.loadURL("https://192.168.56.101");
		// window.loadURL("https://127.0.0.1");
		// window.loadURL("http://127.0.0.1");
		// window.loadURL("https://localhost");
		// Developer Tool を開きます。
		const args = CommandlineArguments.getInstance();
		if (args.getBoolean("--open-devtools")) {
			window.webContents.openDevTools();
		}
		// window.webContents.id
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
		// アプリケーションのコマンド
		window.on("app-command", ApplicationWindow.onAppCommand);
		this._window = window;
		return window;
	}

	/**
	 * 開発者ツールを開きます。
	 */
	public openDevTools(): void {
		const window = this.getWindow();
		if (!window) return;
		if (window.webContents.isDevToolsOpened()) return;
		if (window.webContents.isDevToolsFocused()) return;
		window.webContents.openDevTools({ mode: "detach" });
	}

	/**
	 * ウィンドウを閉じます。
	 */
	private close(): void {
		if (!this._window) return;
		this._window = null;
	}
}
