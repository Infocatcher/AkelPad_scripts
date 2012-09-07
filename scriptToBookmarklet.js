// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#9927
// http://infocatcher.ucoz.net/js/akelpad_scripts/scriptToBookmarklet.js

// (c) Infocatcher 2008-2011
// version 0.3.0 - 2011-12-20
// Windows XP +

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

var saveSpaces     = getArg("saveSpaces", 0);
var removeNewLines = getArg("removeNewLines", true);
var saveComments   = getArg("saveComments", 0);

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd)
	scriptToBookmarklet();

function scriptToBookmarklet() {
	var text = getText();

	var excludes = {};
	var rnd = function() {
		return "<#" + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + "#>";
	};

	text = text
		// Remove "strings" and 'strings'
		.replace(
			/"(\\.|[^"\\\n\r])*"|'(\\.|[^'\\\n\r])*'/g,
			function(s) {
				var r = rnd();
				excludes[r] = s;
				return r;
			}
		)
		// Try remove regular expressions like /x*/ and /\/*x/
		// We search for invalid divisions:
		// x = /./;            -> =
		// if(/a/.test(b))     -> (
		// a = [/a/, /b/]      -> [ ,
		// x = a && /b/test(c) -> & |
		// x = a ? /b/ : /c/   -> ? :
		// x = !/a/.test(b)    -> !
		.replace(
			/([=(\[,&|?:!]\s*((\/\/[^\n\r]*[\n\r]+|\/\*[\s\S]*?\*\/)\s*)*)\/([^*+?\\\/\n\r]|\\[^\n\r])(\\\/|[^\/\n\r])*\//g,
			// special chars   line comments       block comments         regexp begin                         regexp end
			function(s, prefix) {
				var r = rnd();
				excludes[r] = s.substr(prefix.length);
				return prefix + r;
			}
		);


	if(!(saveComments & 1))
		text = text.replace(/\/\*[\s\S]*?\*\//g, ""); // /*comment*/
	if(!(saveComments & 2))
		text = text.replace(/(^|[\t ]+|([^:\\]))\/\/[^\n\r]*$/mg, "$2"); // //comment
	else
		text = text
			.replace(/(^|[\t ]+|[^:\\])\/\/([ \t]?)[ \t]*([^\n\r]*)$/mg, "$1/*$2$3*/") // //comment -> /*comment*/
			.replace(/\*\/[\n\r]+\/\*/g, " ");

	text = text
		.replace(/^\s*javascript:\s*/i, "")
		.replace(/^\s+|\s+$/g, "");

	var newLinesReplacement = removeNewLines ? "" : " ";

	if(saveSpaces == 0)
		text = text.replace(/\s+/g, " ");
	else if(saveSpaces == 1)
		text = text
			.replace(/^[ \t]+|[ \t]+$/mg, "")
			.replace(/[\n\r]+/g, newLinesReplacement);
	else if(saveSpaces >= 2)
		text = text.replace(/[\n\r]+/g, newLinesReplacement);


	text = text.replace(/<#[a-z0-9]{2,}#>/g, function(s) {
		if(s in excludes)
			return excludes[s];
		return s;
	});

	if(
		!/^\(function\s*\(\)\s*\{.+\}\)\s*\(\);?$/.test(text) // (function(){ ... })();
		&& !/^alert\s*\(([^()]*\([^()]+\))*[^()]*\);?$/.test(text) // alert( ... );
		&& !/\Walert\s*\(\s*[^)]+\s*\);?$/.test(text) // ... alert(x);
	)
		text += " void(0);";

	text = "javascript: " + text;

	text = AkelPad.InputBox(
		hMainWnd,
		WScript.ScriptName,
		_localize("Code of bookmarklet (OK - copy):"),
		text
	);
	if(text)
		AkelPad.SetClipboardText(text);
}
function getText() {
	// Get selection or all text
	var text = AkelPad.GetSelText();
	if(text)
		return text;
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
		text = AkelPad.GetSelText();

		AkelPad.SetSel(ss, se);
		columnSel && AkelPad.SendMessage(hWndEdit, 3128 /*AEM_UPDATESEL*/, 0x1 /*AESELT_COLUMNON*/, 0);

		AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
		AkelPad.MemFree(lpPoint);
		setRedraw(hWndEdit, true);
	}
	return text;
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