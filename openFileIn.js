// https://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#p9927
// https://infocatcher.ucoz.net/js/akelpad_scripts/openFileIn.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/openFileIn.js

// (c) Infocatcher 2010-2021
// Version: 0.2.0.1 - 2021-08-15
// Author: Infocatcher

//===================
//// Open file in other application

// Usage (see "var appsData = { ... }" for appID):
//   Call("Scripts::Main", 1, "openFileIn.js", '"appID" "%f" "%u"')
// Disable mappings:
//   Call("Scripts::Main", 1, "openFileIn.js", '"appID" "%f" "%u" -mappings=false')
// Trick to not open archive-like files in Total Commander:
//   Call("Scripts::Main", 1, "openFileIn.js", '"Total Commander" "%f\:"')
//===================

//== Settings begin
// You can use openFileIn-options.jsm file to override or tweak settings
// Override:
//   var appsData = { ... };
// Tweak:
//   appsData["App"] = { ... };       - add application
//   appsData["App"].paths = [ ... ]  - change paths
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
	//			"%EnvVar%\\another\\path\\to\\app.exe",
	//			// Special: %AkelDir% - path to AkelPad directory (e.g. C:\Soft\AkelPad),
	//			//          %AkelDrive% - path to AkelPad drive (e.g. C:)
	//			"<HKCU\\path\\from\\registry>app.exe",
	//			"?x64?...\\app64.exe", // Check only on x64 system
	//			"?x86?...\\app32.exe"  // Check only on x86 system
	//		],
	//		args: "-file:%f -line:%l",
	//		isBrowser: true
	//	}
	"Total Commander": {
		paths: [
			"%COMMANDER_EXE%",
			"%COMMANDER_PATH%\\TOTALCMD.EXE",
			"?x64?%COMMANDER_PATH%\\TOTALCMD64.EXE",
			"%AkelDir%\\..\\totalcmd\\TOTALCMD.EXE",
			"%AkelDir%\\..\\Total Commander\\TOTALCMD.EXE",
			"%AkelDir%\\..\\..\\TOTALCMD.EXE",
			"%__portable__%\\totalcmd\\TOTALCMD.EXE",
			"?x64?<HKCU\\Software\\Ghisler\\Total Commander\\InstallDir>\\TOTALCMD64.EXE",
			"<HKCU\\Software\\Ghisler\\Total Commander\\InstallDir>\\TOTALCMD.EXE",
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
	"Edge": {
		paths: [
			"<HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe\\>",
			"%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe",
			"%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Firefox": {
		paths: [
			"<HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\firefox.exe\\>",
			"%ProgramFiles%\\Mozilla Firefox\\firefox.exe",
			"%COMMANDER_PATH%\\..\\FirefoxPortable\\FirefoxPortable.exe",
			"%AkelDir%\\..\\FirefoxPortable\\FirefoxPortable.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Opera": {
		paths: [
			"<HKCU\\Software\\Opera Software\\Last Install Path>\\opera.exe",
			"%ProgramFiles%\\Opera\\opera.exe",
			"%COMMANDER_PATH%\\..\\OperaUSB\\opera.exe",
			"%COMMANDER_PATH%\\..\\Opera\\opera.exe",
			"%AkelDir%\\..\\OperaUSB\\opera.exe",
			"%AkelDir%\\..\\Opera\\opera.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Vivaldi": {
		paths: [
			"<HKCU\\Software\\Vivaldi\\DestinationFolder>\\Application\\vivaldi.exe",
			"%ProgramFiles%\\Vivaldi\\Application\\vivaldi.exe",
			"%LocalAppData%\\Vivaldi\\Application\\vivaldi.exe",
			"%COMMANDER_PATH%\\..\\Vivaldi\\Application\\vivaldi.exe",
			"%AkelDir%\\..\\Vivaldi\\Application\\vivaldi.exe"
		],
		args: "%f",
		isBrowser: true
	},
	"Google Chrome": {
		paths: [
			"<HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe\\>",
			"<HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe\\>",
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

var fso = new ActiveXObject("Scripting.FileSystemObject");
var optionsPath = WScript.ScriptFullName.replace(/\.[^.]+$/, "") + "-options.jsm";
(function loadOptions(legacy) {
	if(fso.FileExists(optionsPath))
		AkelPad.Include(".." + optionsPath.replace(/^.*(\\|\/)/, "$1"));
	else if(!legacy) {
		optionsPath = optionsPath.slice(0, -1); // Try legacy ...-options.js
		loadOptions(true);
	}
})();

var allowMappings = AkelPad.GetArgValue("mappings", true);

var wsh = new ActiveXObject("WScript.Shell");
var akelDir = AkelPad.GetAkelDir();

var argsl = WScript.Arguments.length;
if(argsl >= 2) {
	var app = WScript.Arguments(0);
	var file = WScript.Arguments(1);
	var url = argsl >= 3 && WScript.Arguments(2);
	if(url && url.substr(0, 10) != "-mappings=")
		file = url;
	if(app in appsData) {
		var appData = appsData[app];
		var path = getPath(appData.paths);
		if(path) {
			if(appData.isBrowser && allowMappings) {
				for(var p in mappings) {
					var pl = p.length;
					if(file.substr(0, pl) == p) {
						file = mappings[p] + file.substr(pl).replace(/\\/g, "/");
						break;
					}
				}
			}
			var args = appData.args;
			if(file) {
				if(/%f/.test(args))
					args = args.replace(/%f/g, '"' + file + '"');
				if(/%l/.test(args))
					args = args.replace(/%l/g, getLine());
			}
			else {
				args = args
					.replace(/\s*\S*%f\S*\s*/g, " ")
					.replace(/\s*\S*%l\S*\s*/g, " ");
			}
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
		warn("Application with \"" + app + "\" id not found in the database!");
	}
}
else {
	warn('Wrong arguments!\nUsage:\nCall("Scripts::Main", 1, "' + WScript.ScriptName + '", \'"appID" "%f"\')');
}
function getPath(paths) {
	for(var i = 0, l = paths.length; i < l; ++i) {
		var path = paths[i];
		if(path.charAt(0) == "?") {
			if(path.substr(0, 5) != (_X64 ? "?x64?" : "?x86?"))
				continue;
			path = path.substr(5);
		}
		var path = expandVariables(paths[i]);
		//WScript.Echo(paths[i] + "\n=>\n" + path);
		if(fso.FileExists(path))
			return path;
	}
	return "";
}
function expandVariables(s) {
	return expandEnvironmentVariables(expandRegistryVariables(s));
}
function expandEnvironmentVariables(s) {
	if(s.substr(0, 5) == "%Akel") {
		s = s
			.replace(/^%AkelDir%/, akelDir)
			.replace(/^%AkelDrive%/, fso.GetDriveName(akelDir));
	}
	return wsh.ExpandEnvironmentStrings(s);
}
function expandRegistryVariables(s) { // <HKCU\Software\Foo\installPath>\foo.exe
	return s.replace(/<(.+?)>/g, function(s, path) {
		var val = getRegistryValue(path);
		if(val)
			return val;
		return s;
	});
}
function getRegistryValue(path) {
	try {
		return wsh.RegRead(path);
	}
	catch(e) {
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