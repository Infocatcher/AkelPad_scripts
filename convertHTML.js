// (c) Infocatcher 2009-2010
// version 0.4.3 - 2010-12-06

//===================
// Encode HTML entities:
//   &    => &amp;
//   <    => &lt;
//   >    => &gt;
//   "    => &quot;
//   char => &#code; (see arguments)

// Decode HTML entities:
//   &amp;   => &
//   &lt;    => <
//   &gt;    => >
//   &quot;  => "
//   &#code; => char (see arguments)

// Arguments:
//   -mode=0                               - (default) auto encode or decode
//   -mode=1                               - encode
//   -mode=2                               - decode
//   -decodeCharCodes=true                 - (default: true) decode &#code; => char
//   -encodeChars=false                    - (default: false) encode char => &#code;
//   -encodeAsHex=false                    - use hex instead of decimal
//   -charsToEncode=/[^!-~ \t\n\rа-яё]/ig  - (optional) mask for chars to encode

// Usage:
//   Call("Scripts::Main", 1, "convertHTML.js", "-mode=0")
//   Call("Scripts::Main", 1, "convertHTML.js", "-mode=0 -decodeCharCodes=true -encodeChars=true '-charsToEncode=/[^!-~ \t\n\rа-яё]/ig'")
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
	if(/^[-\/](\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
		args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
function getArg(argName, defaultVal) {
	argName = argName.toLowerCase();
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

var decodeCharCodes = getArg("decodeCharCodes", true);
var encodeChars     = getArg("encodeChars", false);
var encodeAsHex     = getArg("encodeAsHex", false);
var charsToEncode   = getArg("charsToEncode", /[^!-~ \t\n\rа-яё]/ig);
// "!-~"     - latin symbols
// " \t\n\r" - spaces
// "а-яё"    - cyrillic symbols


//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd && !AkelPad.GetEditReadOnly(hWndEdit))
	convertHTML();

function convertHTML() {
	var text = AkelPad.GetSelText();
	var selectAll = false;
	if(!text) {
		text = getAllText();
		selectAll = true;
	}

	var res;
	if(decode || auto) {
		res = decodeHTML(text);
		if(auto)
			encode = res == text; // Can't decode (entities is missing)
	}
	if(encode)
		res = encodeHTML(text);
	if(res == text) {
		AkelPad.MessageBox(hMainWnd, _localize("Nothing to recode!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
		return;
	}

	insertNoScroll(res, selectAll);
}
function encodeHTML(str) {
	str = str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
	if(encodeChars)
		str = str.replace(
			charsToEncode,
			function(s) {
				var code = s.charCodeAt(0);
				if(encodeAsHex)
					code = "x" + code.toString(16);
				return "&#" + code + ";";
			}
		);
	return str;
}
function decodeHTML(str) {
	if(decodeCharCodes)
		str = str
			.replace(
				/&#(?:x([\da-f]+)|(\d+));/ig,
				function(s, hex, dec) {
					return String.fromCharCode(
						hex
							? parseInt(hex, 16)
							: parseInt(dec, 10)
					);
				}
			);
	return str
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&");
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