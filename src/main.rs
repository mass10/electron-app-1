/// Destroy でファイルを削除するトレイト
trait Destroy {
	fn destroy(&self) -> std::result::Result<(), Box<dyn std::error::Error>>;
}

struct FileEraser {
	path: std::path::PathBuf,
}

impl FileEraser {
	pub fn new(path: &str) -> Self {
		Self {
			path: std::path::PathBuf::from(path),
		}
	}
}

/// ファイルを削除します。
impl Destroy for FileEraser {
	fn destroy(&self) -> std::result::Result<(), Box<dyn std::error::Error>> {
		if self.path.exists() {
			std::fs::remove_file(&self.path)?;
		}
		return Ok(());
	}
}

/// テキストファイルを作成します。
fn create_text_file(path: &str, content: &str) -> std::result::Result<(), Box<dyn std::error::Error>> {
	std::fs::write(path, content)?;
	return Ok(());
}

/// コマンドを実行します。
fn execute_command(command: &[&str]) -> std::result::Result<(), Box<dyn std::error::Error>> {
	// 先頭の要素をコマンドとして、残りを引数として扱います。
	let (command, args) = command.split_first().unwrap();
	let mut child = std::process::Command::new(command).args(args).spawn()?;
	let result = child.wait()?;
	if !result.success() {
		let exit_code = result.code().unwrap();
		println!("コマンドは [{}] で終了しました", exit_code);
		// std::process::exit(exit_code);
	}
	return Ok(());
}

#[allow(unused)]
fn execute_string_on_shell(command: &str) -> std::result::Result<(), Box<dyn std::error::Error>> {
	// 文字列をファイルに保存します。
	let path = ".tmp.bat";
	let _eraser = FileEraser::new(path);
	create_text_file(path, command).expect("Failed to create text file");
	execute_command(&["cmd", "/C", path])?;
	return Ok(());
}

/// アプリケーションのトランスパイル
fn build() -> std::result::Result<(), Box<dyn std::error::Error>> {
	execute_command(&["yarn.cmd", "install"])?;
	execute_command(&["yarn.cmd", "tsc", "--build"])?;
	return Ok(());
}

/// explorer.exe で指定したディレクトリを開きます。
fn open_explorer(path: &str) -> std::result::Result<(), Box<dyn std::error::Error>> {
	execute_command(&["explorer.exe", path])?;
	return Ok(());
}

/// アプリケーションのインストーラーを作成します。
fn build_installer() -> std::result::Result<(), Box<dyn std::error::Error>> {
	execute_command(&["yarn.cmd", "install"])?;
	execute_command(&["yarn.cmd", "tsc", "--build"])?;
	execute_command(&[
		"yarn.cmd",
		"electron-builder",
		"--win",
		"--x64",
		"-c.nsis.oneClick=false",
		"-c.nsis.perMachine=false",
		"-c.nsis.allowToChangeInstallationDirectory=true",
		// "-c.nsis.script=build\\install.nsi",
		"-c.nsis.include=build\\install.nsh",
	])?;
	open_explorer("OUT")?;

	return Ok(());
}

/// アプリケーションのエントリーポイント
fn main() {
	let args = std::env::args().skip(1).collect::<Vec<String>>();
	if args.len() == 0 {
		return;
	}

	let request = &args[0];
	if request == "--build" || request == "b" {
		let result = build();
		if result.is_err() {
			println!("ERROR: Failed to build. reason: [{}]", result.err().unwrap());
		}
	} else if request == "--installer" || request == "i" {
		let result = build_installer();
		if result.is_err() {
			println!("ERROR: Failed to build. reason: [{}]", result.err().unwrap());
		}
	} else if request == "--clean" || request == "c" {
		// clean();
	} else if request == "--help" || request == "h" {
		// help();
	} else {
		println!("Invalid request");
	}
}
