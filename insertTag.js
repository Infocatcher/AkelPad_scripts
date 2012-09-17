// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11213#11213
// http://infocatcher.ucoz.net/js/akelpad_scripts/insertTag.js

// (c) Infocatcher 2009-2012
// version 0.2.4 - 2012-09-17

//===================
// Simplify tags insertion.
// By default ask user for tag and insert
// <tag>{selected_text}</tag>

// Arguments:
//   -bbcode=0                            - Use <tag>
//          =1                            - Use [tag]
//          =-1                           - Autodetection
//   -xmlExts="[sx]html?|mht(ml)?|xml"    - Mask for file extension or Coder plugin alias (for -bbcode=-1)
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
//   Call("Scripts::Main", 1, "insertTag.js", `-bbcode=1 -tag="quote"`)
//   Call("Scripts::Main", 1, "insertTag.js", `'-template="<a href=\"%%C\">%%|%%S%%|</a>"'`)
//===================

function _localize(s) {
	var strings = {
		"Tag:": {
			ru: "Òýã:"
		}
	};
	var lng = "en";
	switch(AkelPad.GetLangId(1 /*LANGID_PRIMARY*/)) {
		case 0x19: lng = "ru";
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	return _localize(s);
}

// Read arguments:
// getArg(argName, defaultValue)
var useBBCode    = getArg("bbcode", -1);
var xmlExts      = getArg("xmlExts", "[xs]?html?|mht(ml)?|hta|asp|jsm?|css|xml|axl|dxl|fb2|kml|manifest|msc|ndl|rdf|rss|svg|user|wsdl|xaml|xmp|xsd|xslt?|xul|resx|v[cbd]proj|csproj|wx[ils]|wixobj|wixout|wixlib|wixpdb|wixmsp|wixmst");
var useClipboard = getArg("clip", false);
var selectMode   = getArg("selectMode", 0);
var tag          = getArg("tag"); // Override tag prompt
var template     = getArg("template"); // Use template and ignore all arguments except -bbcode=-1 (and -xmlExts)
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
		if(useBBCode == -1) {
			template = detectBBCode()
				? template.replace(/</g, "[").replace(/>/g, "]")
				: template.replace(/\[/g, "<").replace(/\]/g, ">");
		}

		var rnd = function() {
			return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
		};
		var posMarker = rnd();
		var percent   = rnd();

		var sel  = /%C?S/.test(template) && AkelPad.GetSelText();
		var clip = /%S?C/.test(template) && AkelPad.GetClipboardText();

		txt = template
			.replace(/%%/g, percent)
			.replace(/%\|/g, posMarker)
			.replace(/%SC/g, sel || clip)
			.replace(/%CS/g, clip || sel)
			.replace(/%S/g, sel)
			.replace(/%C/g, clip)
			.replace(new RegExp(percent, "g"), "%");

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

		if(tagTyped) {
			var first = tag.charAt(0);
			if(first == "<" || first == "[") {
				useBBCode = first == "[";
				tag = tag.substr(1);
			}
		}

		if(useBBCode == -1)
			useBBCode = detectBBCode();

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
function detectBBCode() {
	var file = AkelPad.GetEditFile(0);
	if(!file)
		file = getCoderAlias();
	else if(/\.[^.]*$/.test(file))
		file = RegExp.lastMatch;
	return !new RegExp("\\.(" + xmlExts + ")$", "i").test(file);
}
function getCoderAlias() {
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=19363#19363
	var hWndEdit = AkelPad.GetEditWnd();
	var hDocEdit = AkelPad.GetEditDoc();
	var pAlias = "";
	if(hWndEdit && hDocEdit) {
		var lpAlias = AkelPad.MemAlloc(256 * 2 /*sizeof(wchar_t)*/);
		if(lpAlias) {
			AkelPad.CallW("Coder::Settings", 18 /*DLLA_CODER_GETALIAS*/, hWndEdit, hDocEdit, lpAlias, 0);
			pAlias = AkelPad.MemRead(lpAlias, 1 /*DT_UNICODE*/);
			AkelPad.MemFree(lpAlias);
		}
	}
	return pAlias;
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