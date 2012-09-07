// (c) Infocatcher 2010
// version 0.1.6 - 2010-12-09

//===================
// Convert JavaScript escape sequences like "\u00a9" or "\xa9" ((c) symbol)

// Arguments:
//   -mode=0  - (default) auto encode or decode
//   -mode=1  - encode
//   -mode=2  - decode

// Usage:
//   Call("Scripts::Main", 1, "convertEscapes.js", "-mode=0")
//===================

function _localize(s) {
	var strings = {
		"Nothing to recode!": {
			ru: "Нечего перекодировать!"
		}
	};
	var lng;
	switch(AkelPad.SystemFunction().Call("kernel32::GetUserDefaultLangID") & 0x3ff /*PRIMARYLANGID*/) {
		case 0x19: lng = "ru"; break;
		default:   lng = "en";
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	return _localize(s);
}

// Read arguments:
var args = {};
for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; i++)
	if(/^-(\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
		args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
function getArg(argName, defaultVal) {
	return typeof args[argName] == "undefined" // argName in args
		? defaultVal
		: args[argName];
}

var MODE_AUTO   = 0;
var MODE_ENCODE = 1;
var MODE_DECODE = 2;

var mode = getArg("mode", MODE_AUTO);
var auto   = mode == MODE_AUTO;
var encode = mode == MODE_ENCODE;
var decode = mode == MODE_DECODE;


//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd && !AkelPad.GetEditReadOnly(hWndEdit))
	convertEscapes();

function convertEscapes() {
	var text = AkelPad.GetSelText();
	var selectAll = false;
	if(!text) {
		text = getAllText();
		selectAll = true;
	}

	var res;
	if(encode || auto) {
		res = encodeEscapes(text);
		if(auto)
			decode = res == text; // Can't encode
	}
	if(decode) {
		res = decodeEscapes(text);
		if(res == null) // Decode error
			return;
	}
	if(res == text) {
		AkelPad.MessageBox(hMainWnd, _localize("Nothing to recode!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
		return;
	}

	insertNoScroll(res, selectAll);
}

function encodeEscapes(str) {
	return str.replace(
		/[^!-~ \t\n\r]/ig,
		function(s) {
			var hex = s.charCodeAt(0).toString(16);
			return "\\u" + "0000".substr(hex.length) + hex;
		}
	);
}
function decodeEscapes(str) {
	// Keep some escaped chars inside string literals
	// "ab\ncd" => "ab\\ncd" => eval() => "ab\ncd"
	var doubleEscape = function(s) {
		return s.replace(
			/(\\+)([nrt'"])?/g,
			function(s, bs, chr) {
				if(bs.length % 2 == 0 || chr) // \ => \\ (*2)
					return new Array(bs.length + 1).join("\\") + s;
				// \\\ => \\ + \ => (\\)*2 + \
				return new Array(Math.floor(bs.length/2)*2 + 1).join("\\") + s;
			}
		);
	};
	str = str // Single RegExp like /("|')(?:\\\1|[^\1])*\1/g fail
		.replace(/"(?:\\"|[^"\n\r])*"/g, doubleEscape)
		.replace(/'(?:\\'|[^'\n\r])*'/g, doubleEscape);

	try {
		// Stupid, but sample :D
		str = eval(
			'"' +
			str // Make valid string
				.replace(
					/(\\*)["']/g,
					function(s, bs) {
						return bs.length % 2 == 0
							? "\\" + s
							: s;
					}
				)
				.replace(/\n/g, "\\n")
				.replace(/\r/g, "\\r")
				.replace(/\u2028/g, "\\u2028")
				.replace(/\u2029/g, "\\u2029") +
			'"'
		);
	}
	catch(e) {
		AkelPad.MessageBox(hMainWnd, e.name + '\neval("string") fail\n' + e.message, WScript.ScriptName, 16 /*MB_ICONERROR*/);
		return null;
	}

	return str;
}

function getAllText() {
	if(typeof AkelPad.GetTextRange != "undefined")
		return AkelPad.GetTextRange(0, -1);
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return "";
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	var columnSel = AkelPad.SendMessage(hWndEdit, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0);
	var ss = AkelPad.GetSelStart();
	var se = AkelPad.GetSelEnd();

	AkelPad.SetSel(0, -1);
	var str = AkelPad.GetSelText();

	AkelPad.SetSel(ss, se);
	columnSel && AkelPad.SendMessage(hWndEdit, 3128 /*AEM_UPDATESEL*/, 0x1 /*AESELT_COLUMNON*/, 0);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	AkelPad.MemFree(lpPoint);
	setRedraw(hWndEdit, true);
	return str;
}
function insertNoScroll(str, selectAll) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	selectAll && AkelPad.SetSel(0, -1);
	//var ss = AkelPad.GetSelStart();
	AkelPad.ReplaceSel(str, true);
	//if(ss != AkelPad.GetSelStart())
	//	AkelPad.SetSel(ss, ss + str.length);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}