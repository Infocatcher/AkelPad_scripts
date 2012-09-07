// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#9927
// http://infocatcher.ucoz.net/js/akelpad_scripts/openFileIn.js

// (c) Infocatcher 2010-2011
// version 0.1.4 - 2011-02-21

//===================
// Open file in other application

// Usage:
//   Call("Scripts::Main", 1, "openFileIn.js", '"appID" "%f"')
// In "URL menu":
//   Call("Scripts::Main", 1, "openFileIn.js", '"appID" "%u"')
// Disable mappings:
//   Call("Scripts::Main", 1, "openFileIn.js", '"appID" "%f" -mappings=false')
//===================

//== Settings begin
// You can use openFileIn-options.js file for override or tweak settings
var mappings = {
	// Only for applications marked as 'isBrowser: true'
	// Example:
	// "D:\\Site\\": "http://localhost/",
	// "D:\\AnotherSite\\": "http://example.com/"
};
var appsData = {
	// Example:
	//	"appID": {
	//		paths: [
	//			"c:\\path\\to\\app.exe",
	//			"%EnvVar%\\another\\path\\to\\app.exe"
	//		],
	//		args: "-file:%f -line:%l",
	//		isBrowser: true
	//	}
	"Total Commander": {
		paths: [
			"%COMMANDER_PATH%\\TOTALCMD.EXE",
			"%AkelDir%\\..\\totalcmd\\TOTALCMD.EXE",
			"%AkelDir%\\..\\Total Commander\\TOTALCMD.EXE",
			"%__portable__%\\totalcmd\\TOTALCMD.EXE",
			"%ProgramFiles%\\totalcmd\\TOTALCMD.EXE",
			"%ProgramFiles%\\Total Commander\\TOTALCMD.EXE"
		],
		args: "/O /S /T %f"
	},

	"Notepad": {
		paths: [
			"%SystemRoot%\\notepad.exe"
		],
		args: "%f"
	},
	"Notepad++": {
		paths: [
			"%COMMANDER_PATH%\\..\\Notepad++\\notepad++.exe",
			"%AkelDir%\\..\\Notepad++\\notepad++.exe",
			"%__portable__%\\Notepad++\\notepad++.exe",
			"%ProgramFiles%\\Notepad++\\notepad++.exe"
		],
		args: "%f -n%l"
	},
	"PSPad": {
		paths: [
			"%COMMANDER_PATH%\\..\\PSPad\\PSPad.exe",
			"%COMMANDER_PATH%\\..\\PSPad editor\\PSPad.exe",
			"%AkelDir%\\..\\PSPad\\PSPad.exe",
			"%AkelDir%\\..\\PSPad editor\\PSPad.exe",
			"%ProgramFiles%\\PSPad\\PSPad.exe",
			"%ProgramFiles%\\PSPad editor\\PSPad.exe"
		],
		args: "%f"
	},
	"EmEditor": {
		paths: [
			"%COMMANDER_PATH%\\..\\EmEditor\\EmEditor.exe",
			"%AkelDir%\\..\\EmEditor\\EmEditor.exe",
			"%ProgramFiles%\\EmEditor\\EmEditor.exe"
		],
		args: "%f"
	},

	"Internet Explorer": {
		paths: [
			"%ProgramFiles%\\Internet Explorer\\iexplore.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Firefox": {
		paths: [
			"%ProgramFiles%\\Mozilla Firefox\\firefox.exe",
			"%COMMANDER_PATH%\\..\\FirefoxPortable\\FirefoxPortable.exe",
			"%AkelDir%\\..\\FirefoxPortable\\FirefoxPortable.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Opera": {
		paths: [
			"%ProgramFiles%\\Opera\\opera.exe",
			"%COMMANDER_PATH%\\..\\OperaUSB\\opera.exe",
			"%COMMANDER_PATH%\\..\\Opera\\opera.exe",
			"%AkelDir%\\..\\OperaUSB\\opera.exe",
			"%AkelDir%\\..\\Opera\\opera.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Google Chrome": {
		paths: [
			"%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe",
			"%UserProfile%\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe",
			"%UserProfile%\\Local Settings\\Application Data\\Bromium\\Application\\chrome.exe",
			"%COMMANDER_PATH%\\..\\GoogleChromePortable\\GoogleChromePortable.exe",
			"%AkelDir%\\..\\GoogleChromePortable\\GoogleChromePortable.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Safari": {
		paths: [
			"%ProgramFiles%\\Safari\\Safari.exe",
			"%COMMANDER_PATH%\\..\\SafariPortable\\SafariPortable.exe",
			"%AkelDir%\\..\\SafariPortable\\SafariPortable.exe"
		],
		args: "%f",
		isBrowser: true
	}
};
//== Settings end

var optionsPath = WScript.ScriptFullName.replace(/(\.[^.]+)?$/, "-options$&");
var fso = new ActiveXObject("Scripting.FileSystemObject");
if(fso.FileExists(optionsPath))
	eval(AkelPad.ReadFile(optionsPath));

var allowMappings = getArg("mappings", true);

var wsh = new ActiveXObject("WScript.Shell");
var akelDir = AkelPad.GetAkelDir();

if(WScript.Arguments.length >= 2) {
	var app = WScript.Arguments(0);
	var file = WScript.Arguments(1);
	if(app in appsData) {
		var appData = appsData[app];
		var path = getPath(appData.paths);
		if(path) {
			if(appData.isBrowser) {
				for(var p in mappings) {
					var pl = p.length;
					if(file.substr(0, p.length) == p) {
						file = mappings[p] + file.substr(pl).replace(/\\/g, "/");
						break;
					}
				}
			}
			var args = file
				? appData.args
					.replace(/%f/g, '"' + file + '"')
					.replace(/%l/g, getLine())
				: appData.args
					.replace(/\s*\S*%f\S*\s*/g, " ")
					.replace(/\s*\S*%l\S*\s*/g, " ");
			var cmdLine = ('"' + path + '" ' + args).replace(/\s+$/, "");
			try {
				wsh.Exec(cmdLine);
			}
			catch(e) {
				// Windows Vista/7 and admin rights required
				//WScript.Echo(e.name + "\n" + e.message);
				new ActiveXObject("Shell.Application").ShellExecute(path, args, "" /*directory*/, "runas");
			}
		}
		else {
			warn(app + " not found!\n\n" + appData.paths.join("\n"));
		}
	}
	else {
		warn("Application with id \"" + app + "\" not found in database!");
	}
}
else {
	warn('Wrong arguments!\nUsage:\nCall("Scripts::Main", 1, "' + WScript.ScriptName + '", \'"appID" "%f"\')');
}
function getPath(paths) {
	for(var i = 0, l = paths.length; i < l; i++) {
		var path = wsh.ExpandEnvironmentStrings(paths[i].replace(/^%AkelDir%/, akelDir));
		if(fso.FileExists(path))
			return path;
	}
	return "";
}
function getLine() {
	var hWndEdit = AkelPad.GetEditWnd();
	var wrpLine = AkelPad.SendMessage(hWndEdit, 1078 /*EM_EXLINEFROMCHAR*/, 0, AkelPad.GetSelStart());
	var unwrpLine = AkelPad.SendMessage(hWndEdit, 3143 /*AEM_GETUNWRAPLINE*/, wrpLine, 0);
	return unwrpLine + 1;
}
function warn(msg) {
	AkelPad.MessageBox(AkelPad.GetMainWnd(), msg, WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
}

function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; i++)
		if(/^[-\/](\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
			args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
	getArg = function(argName, defaultVal) {
		argName = argName.toLowerCase();
		return typeof args[argName] == "undefined" // argName in args
			? defaultVal
			: args[argName];
	};
	return getArg(argName, defaultVal);
}