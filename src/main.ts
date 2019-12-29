import electron, { systemPreferences } from 'electron';
import { writeFileSync } from 'fs';

// ロギングクラス
class Logger {

	private constructor() {

	}

	public static writeLine(...params: object[]) {

		// const file = new writeFileSync("electron-app-1.log", );
	}
}

// ウィンドウクラス
class ApplicationWindow {

	private static win: electron.BrowserWindow | null;

	private constructor() {

	}

	public static createWindow(): electron.BrowserWindow {

		if (ApplicationWindow.win)
			return ApplicationWindow.win;

		const parameters = {
			width: 800,
			height: 600,
			webPreferences: {
				nodeIntegration: true
			}
		};
		ApplicationWindow.win = new electron.BrowserWindow(parameters);
		// index.html を開きます。
		ApplicationWindow.win.loadFile('src/index.html');
		// Developer Tool を開きます。
		if (false)
			// @ts-ignore
			win.webContents.openDevTools();
		// 閉じられるときの処理です。
		ApplicationWindow.win.on('closed', () => {
			ApplicationWindow.close();
		});
		return ApplicationWindow.win;
	}

	private static close(): void {

		ApplicationWindow.win = null;
	}
}

// アプリケーションクラス
class Application {

	private _app: electron.App | null = null;

	private static _instance: Application | null = null;

	private constructor() {

	}

	private getCoreApp(): electron.App {

		if (!this._app)
			this._app = electron.app;
		return this._app;
	}

	public run(): void {

		const app = this.getCoreApp();

		// アプリケーションが準備できた？
		app.on('ready', ApplicationWindow.createWindow);

		// ウィンドウが閉じられた？
		app.on('window-all-closed', () => {
			if (process.platform !== 'darwin') {
				app.quit()
			}
		})

		// ウィンドウがアクティブになった？
		app.on('activate', () => {
			ApplicationWindow.createWindow()
		});
	}

	public static getInstance(): Application {

		if (!Application._instance) {
			Application._instance = new Application();
		}
		return Application._instance;
	}
}

// エントリーポイント
function main() {

	const app = Application.getInstance();
	app.run();
}

main();
