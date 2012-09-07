// (c) Infocatcher 2010
// version 0.1.0 - 2010-06-22

// Usage:
//   -"Copy path to file"                Call("Scripts::Main", 1, "copyPath.js", `"%f"`)
// Or with template:
//   -"Copy path to file"                Call("Scripts::Main", 1, "copyPath.js", `"%f" "<path>/<file>.<ext>"`)
//   -"Copy path to file directory"      Call("Scripts::Main", 1, "copyPath.js", `"%f" "<path>"`)
//   -"Copy file name"                   Call("Scripts::Main", 1, "copyPath.js", `"%f" "<file>.<ext>"`)
//   -"Copy file name without extension" Call("Scripts::Main", 1, "copyPath.js", `"%f" "<file>"`)

var argsCount = WScript.Arguments.length;
if(argsCount) {
	var arg = WScript.Arguments(0);
	if(argsCount > 1) {
		var path = arg, sep = "", file = "", dot ="", ext = "";
		if(/([\\/])?([^\\/]*)$/.test(path)) {
			sep = RegExp.$1;
			file = RegExp.$2;
			path = path.substring(0, path.length - RegExp.lastMatch.length);
			if(/\.([^.]+)$/.test(file)) {
				dot = ".";
				ext = RegExp.$1;
				file = file.substring(0, file.length - RegExp.lastMatch.length);
			}
		}
		arg = WScript.Arguments(1)
			.replace("<path>", path)
			.replace("/", sep)
			.replace("<file>", file)
			.replace(".", dot)
			.replace("<ext>", ext);
	}
	//var AkelPad = new ActiveXObject("AkelPad.document");
	AkelPad.SetClipboardText(arg);
}