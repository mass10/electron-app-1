import { readFileSync } from "fs";
import jsyaml from "js-yaml";
import { Logger } from "../log/Logger";
import { CommandlineArguments } from "../util/CommandlineArguments";

/**
 * コンフィギュレーション
 */
export class ConfigurationSettings {

	/** 唯一のインスタンス */
	private static _instance: ConfigurationSettings | null = null;

	/**
	 * コンストラクター
	 */
	private constructor() {

	}
	
	/**
	 * インスタンスを返します。
	 */
	public static getInstance(): ConfigurationSettings {

		if (ConfigurationSettings._instance)
			return ConfigurationSettings._instance;
		// コンフィギュレーション
		const conf = new ConfigurationSettings();
		conf._configure("conf/settings.yml");
		ConfigurationSettings._instance = conf;
		return conf;
	}

	private _configure(path: string): void {

		try {
			Logger.debug("<ConfigurationSettings._configure()> $$$ begin configuration $$$");
			Logger.debug("<ConfigurationSettings._configure()> path: [%s]", path);
			const content = readFileSync(path, { encoding: "utf-8" });
			const tree = jsyaml.safeLoad(content);
			const args = CommandlineArguments.getInstance();
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
