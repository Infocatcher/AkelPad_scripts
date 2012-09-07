// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11863#11863
// http://infocatcher.ucoz.net/js/akelpad_scripts/executeScript.js
// http://infocatcher.ucoz.net/js/akelpad_scripts/executeScript.vbs

// (c) Infocatcher 2011
// version 0.2.2 - 2011-12-20

//===================
// Execute selected or all code

// Arguments:
//   -useTempFile=true   - run script from temp file (useful for tracking errors)
//   -onlySelected=true  - use only selected text
//   -type="js"          - don't ask script type

// Usage:
//   Call("Scripts::Main", 1, "executeScript.js")
//   Call("Scripts::Main", 1, "executeScript.js", `-type="js"`)
//===================

function _localize(s) {
	var strings = {
		"Yes Ц run as JScript\nNo Ц run as VBScript": {
			ru: "ƒа Ц запустить как JScript\nЌет Ц запустить как VBScript"
		}
	};
	var lng;
	switch(AkelPad.GetLangId(1 /*LANGID_PRIMARY*/)) {
		case 0x19: lng = "ru"; break;
		default:   lng = "en";
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	return _localize(s);
}

// Read arguments:
// getArg(argName, defaultValue)
var useTempFile  = getArg("useTempFile", true);
var type         = getArg("type");
var fileToDelete = getArg("fileToDelete");
var onlySelected = getArg("onlySelected", false);

if(fileToDelete) {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	if(fso.FileExists(fileToDelete))
		fso.DeleteFile(fileToDelete);
	WScript.Quit();
}

var hMainWnd = AkelPad.GetMainWnd();
if(!hMainWnd)
	WScript.Quit();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

var filePath = AkelPad.GetEditFile(0);

var isJs  = type ? type == "js"  : isJsFile(filePath);
var isVbs = type ? type == "vbs" : isVbsFile(filePath);

if(!isJs && !isVbs) {
	var btn = AkelPad.MessageBox(
		hMainWnd,
		_localize("Yes Ц run as JScript\nNo Ц run as VBScript"),
		WScript.ScriptName,
		35 /*MB_YESNOCANCEL|MB_ICONQUESTION*/
	);
	isJs  = btn == 6; //IDYES
	isVbs = btn == 7; //IDNO
}

if(useTempFile && (isJs || isVbs)) {
	var tmpFile = WScript.ScriptFullName.replace(/\.[^.]+$/, "") + "-exec." + (isJs ? "js" : "vbs");

	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var textStream = fso.CreateTextFile(tmpFile, true /*overwrite*/, true /*unicode*/);
	textStream.Write(AkelPad.GetSelText() || AkelPad.GetTextRange(0, -1));
	textStream.Close();

	AkelPad.Call("Scripts::Main", 1, fso.GetFileName(tmpFile));
	AkelPad.Call("Scripts::Main", 1, WScript.ScriptName, "\"-fileToDelete='" + tmpFile.replace(/[\\'"]/g, "\\$&") + "'\"");
}
else if(isJs)
	eval(AkelPad.GetSelText() || (onlySelected ? "" : AkelPad.GetTextRange(0, -1)));
else if(isVbs)
	AkelPad.Call("Scripts::Main", 1, WScript.ScriptName.replace(/\.[^.]+$/, "") + ".vbs", "-onlySelected=" + onlySelected);

function getExt(path) {
	return /\.([^.]+)$/.test(path) ? RegExp.$1 : "";;
}
function isJsFile(path) {
	return /^js(m|on)?$/.test(getExt(path));
}
function isVbsFile(path) {
	return /^(bas|vb[s5]?|wbt|frm)$/.test(getExt(path));
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