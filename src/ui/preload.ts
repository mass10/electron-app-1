import electron from "electron";

namespace EXPOSED {

	export function sendElectronMessage(channel: string, message: string): string {
		console.log(`[TRACE] <EXPOSED.sendElectronMessage()> SEND (FRONTEND >> ELECTRON). CHANNEL: [${channel}], MESSAGE: [${message}]`);
		const response = electron.ipcRenderer.sendSync(channel, message); // newer operation is invoke().
		return response;
	}

	export function registerHandler(channel: string, listener: (event: electron.IpcRendererEvent, ...args: any[]) => void): void {
		electron.ipcRenderer.on(channel, listener);
	}
}

namespace PRELOAD {

	function initialize(): void {
		window.addEventListener('DOMContentLoaded', onDOMContentLoaded);
	}

	function onDOMContentLoaded() {
		console.info("[TRACE] <preload.ts> DOMContentLoaded!");
	}

	function expose(): void {
		const exportedOperations: Record<string, any> = {
			sendElectronMessage: EXPOSED.sendElectronMessage,
			registerHandler: EXPOSED.registerHandler
		};
		electron.contextBridge.exposeInMainWorld("__exposed_symbols_by_electron_app", exportedOperations);
		console.log("[TRACE] <preload.expose()> expose objects.");
	}

	export function main(): void {
		console.log("");
		console.log("");
		console.log("");
		console.log("[TRACE] <preload.ts> ### begin ###");
		initialize();
		expose();
		console.log("[TRACE] <preload.ts> --- end ---");
	}
}

PRELOAD.main();
