import electron from 'electron';

let win: electron.BrowserWindow | null;

function createWindow() {

	// Create the browser window.
	const windowParameters = {
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	};
	win = new electron.BrowserWindow(windowParameters);
	// and load the index.html of the app.
	win.loadFile('src/index.html');
	win.webContents.openDevTools();
	win.on('closed', () => {
		win = null;
	});
}

function main() {

	const app = electron.app;

	// アプリケーションが準備できた？
	app.on('ready', createWindow);

	// ウィンドウが閉じられた？
	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	// ウィンドウがアクティブになった？
	app.on('activate', () => {
		if (win === null) {
			createWindow()
		}
	});
}

main();
