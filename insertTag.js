// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11213#11213
// http://infocatcher.ucoz.net/js/akelpad_scripts/insertTag.js

// (c) Infocatcher 2009-2011
// version 0.2.3 - 2011-12-20

//===================
// Simplify tags insertion.
// By default ask user for tag and insert
// <tag>{selected_text}</tag>

// Arguments:
//   -bbcode=true                         - Use [tag] instead of <tag>
//   -clip=true                           - Use text from clipboard instead of selected text
//   -selectMode=0                        - Select all inserted text: [<tag>text</tag>]
//              =1                        - Select text inside tags:  <tag>[text]</tag>
//   -tag="div"                           - Don't ask tag
//   -template="<a href=\"%%|\">%%S</a>"  - Use template (and ignore all other arguments)
//   -saveLastTag=0                       - don't save last used tag
//               =1                       - save only typed (default)
//               =2                       - always save

// Special variables in templates:
//   %|  - selection start or end
//   %S  - selected text
//   %C  - clipboard text
//   %SC - selected text or clipboard text
//   %CS - clipboard text or selected text

// Usage:
//   Call("Scripts::Main", 1, "insertTag.js")
//   Call("Scripts::Main", 1, "insertTag.js", `-bbcode=true -tag="quote"`)
//   Call("Scripts::Main", 1, "insertTag.js", `'-template="<a href=\"%%C\">%%|%%S%%|</a>"'`)
//===================

function _localize(s) {
	var strings = {
		"Tag:": {
			ru: "Òýã:"
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
var useBBCode    = getArg("bbcode", false);
var useClipboard = getArg("clip", false);
var selectMode   = getArg("selectMode", 0);
var tag          = getArg("tag"); // Override tag prompt
var template     = getArg("template"); // All above settings will be ignored, if template used!
var saveLastTag  = getArg("saveLastTag", 1);


var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd && !AkelPad.GetEditReadOnly(hWndEdit))
	insertTag();

function insertTag() {
	var txt, ss, se;
	if(template) {
		// Example: <a href="%C">%|%S%|</a>
		var rnd = function() {
			return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
		};
		var posMarker = rnd();
		var percent   = rnd();
		txt = template
			.replace(/%%/g, percent)
			.replace(/%\|/g, posMarker)
			.replace(/%SC/g, AkelPad.GetSelText() || AkelPad.GetClipboardText())
			.replace(/%CS/g, AkelPad.GetClipboardText() || AkelPad.GetSelText())
			.replace(/%S/g, AkelPad.GetSelText())
			.replace(/%C/g, AkelPad.GetClipboardText())
			.replace(new RegExp(percent, "g"), "%");

		//if(/>(<\/\w+>)$/.test(txt) || /\](\[\/\w+\])$/.test(txt))
		//	ss = se = AkelPad.GetSelEnd() - RegExp.$1.length;

		var posMarkerRe = new RegExp(posMarker);
		if(posMarkerRe.test(txt)) {
			ss = se = AkelPad.GetSelStart() + RegExp.leftContext.length;
			txt = RegExp.leftContext + RegExp.rightContext;
		}
		if(posMarkerRe.test(txt)) {
			se = AkelPad.GetSelStart() + RegExp.leftContext.length;
			txt = RegExp.leftContext + RegExp.rightContext;
		}
	}
	else {
		txt = useClipboard
			? AkelPad.GetClipboardText()
			: AkelPad.GetSelText();
		var hasTxt = !!txt;

		if(!tag) {
			var tagTyped = true;
			tag = AkelPad.InputBox(
				hMainWnd,
				WScript.ScriptName,
				_localize("Tag:"),
				saveLastTag && pref("lastTag", 3 /*PO_STRING*/) || ""
			);
		}
		if(!tag)
			return;
		if(saveLastTag && (tagTyped || saveLastTag == 2))
			pref("lastTag", 3 /*PO_STRING*/, tag);

		var attrs = /^([^\s=]+)([\s=].*)$/.test(tag) ? RegExp.$2 : "";
		if(attrs)
			tag = RegExp.$1;

		var sTag = (useBBCode ? "["  : "<")  + tag + attrs + (useBBCode ? "]" : ">");
		var eTag = (useBBCode ? "[/" : "</") + tag         + (useBBCode ? "]" : ">");
		txt = sTag + txt + eTag;

		if(!hasTxt || selectMode == 1) {
			var _ss = AkelPad.GetSelStart();
			ss = _ss + sTag.length;
			se = _ss + txt.length - eTag.length;
		}
	}
	insertNoScroll(txt, ss, se);
}

function insertNoScroll(str, ss, se) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, false);

	//var ss = AkelPad.GetSelStart();
	AkelPad.ReplaceSel(str, true);
	//if(ss != AkelPad.GetSelStart())
	//	AkelPad.SetSel(ss, ss + str.length);

	if(ss != undefined || se != undefined) {
		if(ss == undefined) ss = AkelPad.GetSelStart();
		if(se == undefined) se = AkelPad.GetSelEnd();
		AkelPad.SetSel(ss, se);
	}

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
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
function pref(name, type, val) {
	var oSet = AkelPad.ScriptSettings();
	if(arguments.length == 3) {
		if(!oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
			return false;
		var ok = oSet.Write(name, type, val);
		oSet.End();
		return ok;
	}
	if(!oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/))
		return undefined;
	var ret = oSet.Read(name, type || 1 /*PO_DWORD*/);
	oSet.End();
	return ret;
}