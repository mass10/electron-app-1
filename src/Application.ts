import electron from 'electron';
import { ConfigurationSettings } from './ConfigurationSettings'
import { readFileSync, writeFileSync } from 'fs';
import { Logger } from './Logger';
import { ApplicationWindow, WindowSnapshot } from './ApplicationWindow';

enum WindowSnapshotKeys {
	width = "width",
	height = "height",
	left = "left",
	top = "top",
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

	public save(): void {

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
