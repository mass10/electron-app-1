import { readFileSync } from "fs";
import jsyaml from "js-yaml";

// コンフィギュレーション
export class ConfigurationSettings {

	private _yaml = {};

	private construct() {

	}

	public static configure(): ConfigurationSettings {

		const conf = new ConfigurationSettings();
		conf.configure("conf/settings.yml");
		return conf;
	}

	public configure(path: string) {

		try {
			const content = readFileSync(path, {encoding: "utf-8"});
			const tree = jsyaml.safeLoad(content);
			this._yaml = tree["settings"];
		}
		catch (e) {
			if (e instanceof Error) {
				console.log("[ERROR] コンフィギュレーションのエラーです。理由: ", e.message, ", name: ", e.name, ", stack: ", e.stack);
			}
			else {
				console.log("[ERROR] コンフィギュレーションのエラーです。理由: ", e);
			}
		}
	}

	public get(key: string): any {

		if (!this._yaml)
			return "";
		// @ts-ignore
		return this._yaml[key];
	}
}
