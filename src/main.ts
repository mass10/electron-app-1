import electron from 'electron';

class ApplicationWindow {

	private static win: electron.BrowserWindow | null;

	private constructor() {

	}

	public static createWindow(): electron.BrowserWindow | null {

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

function main() {

	const app = electron.app;

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

main();
