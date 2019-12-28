import electron from "electron";

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
	win.loadFile("index.html");
	win.webContents.openDevTools();
	win.on('closed', () => {
		win = null;
	});
}

function main() {

	const app = electron.app;

	app.on("ready", createWindow);

	// Quit when all windows are closed.
	app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
	})

	app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
	});
}

main();
