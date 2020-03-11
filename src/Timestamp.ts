/**
 * 右埋め
 * @param s 
 * @param len 
 */
function _rpad(s: any, len: number): string {

	s = "" + s;
	while (s.length < len) {
		s = "0" + s;
	}
	return s;
}

/**
 * タイムスタンプに関するさまざまな操作を提供します。
 */
export class Timestamp {

	private constructor() {

	}

	public static timestamp0(): string {

		const now = new Date();
		const year = now.getFullYear();
		const month = 1 + now.getMonth();
		const day = now.getDate();
		const hour = now.getHours();
		const minutes = + now.getMinutes();
		const seconds = now.getSeconds();
		const milliseconds = now.getMilliseconds();

		return _rpad(year, 4) + "-" + _rpad(month, 2) + "-" + _rpad(day, 2) +
			" " + _rpad(hour, 2) + ":" + _rpad(minutes, 2) + ":" + _rpad(seconds, 2) +
			"." + _rpad(milliseconds, 3);
	}
}
