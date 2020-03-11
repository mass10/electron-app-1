import { readFileSync } from "fs";
import jsyaml from "js-yaml";
import { app } from "electron";
import { Logger } from "./Logger";
import { CommandlineArguments } from "./CommandlineArguments";

/**
 * コンフィギュレーション
 */
export class ConfigurationSettings {

	private static _instance: ConfigurationSettings | null = null;

	public aaa: string = "";

	private construct() {

	}
	
	public static getInstance(): ConfigurationSettings {

		if (ConfigurationSettings._instance)
			return ConfigurationSettings._instance;

		// コンフィギュレーション
		const conf = new ConfigurationSettings();
		conf._configure("conf/settings.yml");
		ConfigurationSettings._instance = conf;
		return conf;
	}

	private _configure(path: string) {

		try {
			Logger.trace("$$$ begin configuration $$$");
			const content = readFileSync(path, { encoding: "utf-8" });
			const tree = jsyaml.safeLoad(content);
			this.aaa = tree.aaa ?? "";
			const args = new CommandlineArguments();
			if (args.get("--aaa")) {
				this.aaa = args.get("--aaa");
			}
		}
		catch (e) {
			if (e instanceof Error) {
				console.log("[ERROR] configuration error. reason: ", e.message, ", name: ", e.name, ", stack: ", e.stack);
			}
			else {
				console.log("[ERROR] configuration error. reason: ", e);
			}
		}
	}
}
