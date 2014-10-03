// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11213#11213
// http://infocatcher.ucoz.net/js/akelpad_scripts/insertTag.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/insertTag.js

// (c) Infocatcher 2009-2012, 2014
// version 0.2.6 - 2014-07-28

//===================
// Simplify tags insertion.
// By default ask user for tag and insert
// <tag>{selected_text}</tag>

// Arguments:
//   -bbcode=0                            - Use <tag>
//          =1                            - Use [tag]
//          =-1                           - Autodetection
//   -xmlExts="[sx]html?|mht(ml)?|xml"    - Detect <html>, mask for Coder plugin alias or file extension (for -bbcode=-1)
//   -tagExts='{"": "i", "fb2": "em"}'    - Detect tag by Coder plugin alias or file extension, for %T variable
//                                          "": "i"            - default tag
//                                          "fb2|xhtml?": "em" - regular expression for special files
//                                          "ext": ""          - tag not supported in *.ext files
//   -clip=true                           - Use text from clipboard instead of selected text
//   -selectMode=0                        - Select all inserted text: [<tag>text</tag>]
//              =1                        - Select text inside tags:  <tag>[text]</tag>
//   -tag="div"                           - Don't ask tag, you also can use %T with -tagExts
//   -template='<a href="%%|">%%S</a>'    - Use template (and ignore all other arguments)
//   -saveLastTag=0                       - don't save last used tag
//               =1                       - save only typed (default)
//               =2                       - always save

// Special variables in templates:
//   %|  - selection start or end
//   %S  - selected text
//   %C  - clipboard text
//   %SC - selected text or clipboard text
//   %CS - clipboard text or selected text
//   %T  - tag (detected using -tagExts)

// Usage:
//   Call("Scripts::Main", 1, "insertTag.js")
//   Call("Scripts::Main", 1, "insertTag.js", `-bbcode=1 -tag="quote"`)
//   Call("Scripts::Main", 1, "insertTag.js", `-template='<a href="%%C">%%|%%S%%|</a>'`)
//   Call("Scripts::Main", 1, "insertTag.js", `-bbcode=-1 -tag="%%T" -tagExts='{"": "i", "fb2|xhtml?": "em"}'`)
//===================

function _localize(s) {
	var strings = {
		"Tag or template:": {
			ru: "Тэг или шаблон:"
		},
		"Tag %T not supported!": {
			ru: "Тэг %T не поддерживается!"
		},
		"Tags %T not supported!": {
			ru: "Тэги %T не поддерживаются!"
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
var xmlExts      = getArg("xmlExts", "[xs]?html?|mht(ml)?|hta|asp|jsm?|css|xml|axl|dxl|fb2|kml|manifest|msc|ndl|rdf|rss|svg|user|wsdl|xaml|xmp|xsd|xslt?|xul|xbl|resx|v[cbd]proj|csproj|wx[ils]|wixobj|wixout|wixlib|wixpdb|wixmsp|wixmst");
var tagExts      = getArg("tagExts", "");
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
		if(/%T/.test(template)) {
			var autoTag = detectTag();
			if(tagNotSupported(autoTag))
				return;
		}

		txt = template
			.replace(/%%/g, percent)
			.replace(/%\|/g, posMarker)
			.replace(/%SC/g, sel || clip)
			.replace(/%CS/g, clip || sel)
			.replace(/%S/g, sel)
			.replace(/%C/g, clip)
			.replace(/%T/g, autoTag)
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
				_localize("Tag or template:"),
				saveLastTag && pref("lastTag", 3 /*PO_STRING*/) || ""
			);
		}
		if(!tag)
			return;
		if(saveLastTag && (tagTyped || saveLastTag == 2))
			pref("lastTag", 3 /*PO_STRING*/, tag);

		if(tagTyped && /%[%|SC]/.test(tag)) {
			template = tag;
			useBBCode = tag.charAt(0) == "[";
			insertTag();
			return;
		}

		if(tagTyped) {
			var first = tag.charAt(0);
			if(first == "<" || first == "[") { // [tag -> tag
				useBBCode = first == "[";
				tag = tag.substr(1);
				if(tag.charAt(tag.length - 1) == (useBBCode ? "]" : ">")) // tag] -> tag
					tag = tag.slice(0, -1);
			}
		}

		if(useBBCode == -1)
			useBBCode = detectBBCode();

		var attrs = "";
		if(/^[<\[]?[^\s="'<>\[\]]+/.test(tag)) {
			tag = RegExp.lastMatch;
			attrs = RegExp.rightContext;
		}

		if(/%T/.test(tag)) {
			var autoTag = detectTag();
			if(tagNotSupported(autoTag))
				return;
			tag = tag.replace(/%T/g, autoTag);
		}

		var makeTag = function(tagData) {
			return (useBBCode ? "["  : "<")  + tagData + (useBBCode ? "]" : ">");
		};

		var closeTags = [];
		var openedTagPattern = new RegExp((useBBCode ? "\\[" : "<") + "([^/\\s=\"'<>\\[\\]]+)");
		for(var part = attrs; part; ) {
			if(openedTagPattern.test(part)) {
				var openedTag = RegExp.$1;
				part = RegExp.rightContext;
				closeTags.push(makeTag("/" + openedTag));
				continue;
			}
			break;
		}

		var sTag = makeTag(tag + attrs);
		var eTag = closeTags.reverse().join("") + makeTag("/" + tag);

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
	return !extPattern(xmlExts).test(getFileType());
}
function detectTag() {
	var patterns = getTagData();
	if(!patterns)
		return undefined;
	var fileType = getFileType();
	for(var exts in patterns)
		if(extPattern(exts).test(fileType))
			return patterns[exts];
	return patterns[""] || undefined;
}
function getTagData() {
	var patterns = tagExts && eval("(" + tagExts + ")");
	getTagData = function() {
		return patterns;
	};
	return patterns;
}
function tagNotSupported(tag) {
	if(!tag) {
		var tags = [];
		var patterns = getTagData();
		if(patterns) for(var exts in patterns)
			if(patterns[exts])
				tags.push(patterns[exts]);
		AkelPad.MessageBox(
			hMainWnd,
			_localize(tags.length > 1 ? "Tags %T not supported!" : "Tag %T not supported!")
				.replace("%T", tags.join(", ")),
			WScript.ScriptName,
			48 /*MB_ICONEXCLAMATION*/
		);
	}
	return !tag;
}
function extPattern(exts) {
	return new RegExp("\\.(" + exts + ")$", "i");
}
function getFileType() {
	var fileType = getCoderAlias() || AkelPad.GetEditFile(0);
	getFileType = function() {
		return fileType;
	};
	return fileType;
}
function getCoderAlias() {
	if(
		!AkelPad.IsPluginRunning("Coder::HighLight")
		&& !AkelPad.IsPluginRunning("Coder::CodeFold")
		&& !AkelPad.IsPluginRunning("Coder::AutoComplete")
	)
		return "";
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
	var nFirstLine = saveLineScroll(hWndEdit);

	//var ss = AkelPad.GetSelStart();
	AkelPad.ReplaceSel(str, true);
	//if(ss != AkelPad.GetSelStart())
	//	AkelPad.SetSel(ss, ss + str.length);

	if(ss != undefined || se != undefined) {
		if(ss == undefined) ss = AkelPad.GetSelStart();
		if(se == undefined) se = AkelPad.GetSelEnd();
		AkelPad.SetSel(ss, se);
	}

	restoreLineScroll(hWndEdit, nFirstLine);
}
// From Instructor's SearchReplace.js
function saveLineScroll(hWnd)
{
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, false, 0);
	return AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0);
}
function restoreLineScroll(hWnd, nBeforeLine)
{
	if (AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0) != nBeforeLine)
	{
		var lpScrollPos;
		var nPosY=AkelPad.SendMessage(hWnd, 3198 /*AEM_VPOSFROMLINE*/, 0 /*AECT_GLOBAL*/, nBeforeLine);

		if (lpScrollPos=AkelPad.MemAlloc(_X64?16:8 /*sizeof(POINT64)*/))
		{
			AkelPad.MemCopy(lpScrollPos + 0 /*offsetof(POINT64, x)*/, -1, 2 /*DT_QWORD*/);
			AkelPad.MemCopy(lpScrollPos + (_X64?8:4) /*offsetof(POINT64, y)*/, nPosY, 2 /*DT_QWORD*/);
			AkelPad.SendMessage(hWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpScrollPos);
			AkelPad.MemFree(lpScrollPos);
		}
	}
	AkelPad.SendMessage(hWnd, 3377 /*AEM_UPDATECARET*/, 0, 0);
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, true, 0);
	oSys.Call("user32::InvalidateRect", hWnd, 0, true);
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