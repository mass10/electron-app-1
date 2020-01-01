import { Logger } from "./Logger";

export class CommandlineArguments {

	private readonly _map = new Map<string, any>();

	public constructor() {

		this._analyze();
	}

	private _analyze(): void {

		this._map.clear();

		let option = "";
		const options = {};
		for (const e of process.argv) {
			if (e.startsWith("--")) {
				if (option) {
					// 保留しているオプションを確定(boolean として格納)
					this._map.set(option, true);
					Logger.trace("option [", option, "] ... [true]");
					option = "";
				}
				if (0 <= e.indexOf("=")) {
					const left = e.substr(0, e.indexOf("="));
					const right = e.substr(e.indexOf("=") + 1);
					this._map.set(left, right);
					Logger.trace("option [", left, "] ... [", right, "]");
				}
				else {
					// このオプションを保留
					option = e;
				}
			}
			else {
				if (option) {
					// 保留しているオプションを確定(string として格納)
					this._map.set(option, e);
					Logger.trace("option [", option, "] ... [", e, "]");
					option = "";
				}
				console.log("value [" + e + "] is ignored.");
			}
		}

		if (option) {
			this._map.set(option, true);
			Logger.trace("option [", option, "] ... [true]");
			option = "";
		}

		if (false)
			this.dump();
	}

	public get(key: string): string {

		return this._map.get(key) ?? "";
	}

	public dump() {

		Logger.trace("parameter dump(2)");
		this._map.forEach((value: string, key: string) => {
			Logger.trace("parameter [", key, "] >> [", value, "]");
		});
	}
}
