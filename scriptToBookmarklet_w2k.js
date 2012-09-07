// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#9927
// http://infocatcher.ucoz.net/js/akelpad_scripts/scriptToBookmarklet_w2k.js

// (c) Infocatcher 2008-2011
// version 0.3.0 - 2011-12-20
// Windows 2000 SP2 +

//===================
// Convert JavaScript code to one line bookmarklet
// http://en.wikipedia.org/wiki/Bookmarklet
// http://ru.wikipedia.org/wiki/Букмарклет

// Arguments:
//   -saveSpaces=0         - replace multiple spaces with one
//              =1         - don't replace spaces inside lines
//              =2         - only replace new lines
//   -removeNewLines=true  - remove new lines instead of replace them with space
//   -saveComments=0       - sum of flags: 1 - save block comments, 2 - save line comments

// Usage:
//   Call("Scripts::Main", 1, "converter.js")
//   Call("Scripts::Main", 1, "converter.js", "-saveSpaces=0 -removeNewLines=true -saveComments=3")
//===================

function _localize(s) {
	var strings = {
		"Code of bookmarklet (OK - copy):": {
			ru: "Код букмарклета (ОК - копировать):"
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

var saveSpaces     = getArg("saveSpaces", 1);
var removeNewLines = getArg("removeNewLines", false);
var saveComments   = getArg("saveComments", 0);

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd)
	scriptToBookmarklet();

function scriptToBookmarklet() {
	var txt = getText();

	if(!(saveComments & 1))
		txt = txt.replace(/\/\*[\s\S]*\*\//g, ""); // /*comment*/

	if(!(saveComments & 2)) {
		var lines = txt.split("\r");
		for(var i = 0, l = lines.length; i < l; i++)
			lines[i] = lines[i].replace(/(^|[\t ]+|([^:\\]))\/\/[^\n\r]*$/, "$2"); // //comment
		txt = lines.join("\r");
	}
	else {
		// //comment -> /*comment*/
		var lines = txt.split("\r");
		for(var i = 0, l = lines.length; i < l; i++)
			lines[i] = lines[i].replace(/(^|[\t ]+|[^:\\])\/\/([ \t]?)[ \t]*([^\n\r]*)$/, "$1/*$2$3*/");
		txt = lines.join("\r")
			.replace(/\*\/[\n\r]+\/\*/g, "");
	}

	var newLinesReplacement = removeNewLines ? "" : " ";

	txt = txt
		.replace(/^\s*javascript:\s*/i, "")
		.replace(/^\s+|\s+$/g, "");

	if(saveSpaces == 0)
		txt = txt.replace(/[\n\r\t\s]+/g, " ");
	else if(saveSpaces == 1)
		txt = txt
			.replace(/^[ \t]+|[ \t]+$/mg, "")
			.replace(/[\n\r]+/g, newLinesReplacement);
	else if(saveSpaces >= 2)
		txt = txt.replace(/[\n\r]+/g, newLinesReplacement);

	if(
		!/^\(function\s*\(\)\s*\{.+\}\)\s*\(\);?$/.test(txt) // (function(){ ... })();
		&& !/^alert\s*\(([^()]*\([^()]+\))*[^()]*\);?$/.test(txt) // alert( ... );
		&& !/\Walert\s*\(\s*[^)]+\s*\);?$/.test(txt) // ... alert(x);
	)
		txt += " void(0);";

	txt = "javascript: " + txt;

	txt = AkelPad.InputBox(
		hMainWnd,
		WScript.ScriptName,
		_localize("Code of bookmarklet (OK - copy):"),
		txt
	);
	if(txt)
		AkelPad.SetClipboardText(txt);
}
function getText() {
	// Get selection or all text
	var txt = AkelPad.GetSelText();
	if(txt)
		return txt;
	if(typeof AkelPad.GetTextRange != "undefined")
		return AkelPad.GetTextRange(0, -1);
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(lpPoint) {
		setRedraw(hWndEdit, false);
		AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

		var columnSel = AkelPad.SendMessage(hWndEdit, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0);
		var ss = AkelPad.GetSelStart();
		var se = AkelPad.GetSelEnd();

		AkelPad.SetSel(0, -1);
		txt = AkelPad.GetSelText();

		AkelPad.SetSel(ss, se);
		columnSel && AkelPad.SendMessage(hWndEdit, 3128 /*AEM_UPDATESEL*/, 0x1 /*AESELT_COLUMNON*/, 0);

		AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
		AkelPad.MemFree(lpPoint);
		setRedraw(hWndEdit, true);
	}
	return txt;
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
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