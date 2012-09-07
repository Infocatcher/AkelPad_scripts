// http://akelpad.sourceforge.net/forum/viewtopic.php?p=4270#4270
// http://infocatcher.ucoz.net/js/akelpad_scripts/highlighter.js

// (c) Infocatcher 2009-2012
// version 0.3.4 - 2012-04-06

//===================
// Set extension manually for Coder plugin

// Arguments:
//   -noRecognize    - don't use recognize mechanism for unsaved files or files without extension
//   -restore        - use extension of current file (without dialog)
//   -saveLastExt=0  - don't save last used extension
//               =1  - save only typed (default)
//               =2  - always save

// Usage:
//   Call("Scripts::Main", 1, "highlighter.js")
//   Call("Scripts::Main", 1, "highlighter.js", "-noRecognize")
//   Call("Scripts::Main", 1, "highlighter.js", "-restore")
//   Call("Scripts::Main", 1, "highlighter.js", "-noRecognize=true -restore=false -saveLastExt=0")
//===================

//== Settings begin
var hlExtRegions = {
	// Syntax:
	//   extension: {
	//       subExtension0: [[ext0_startMask0, ext0_endMask0], [ext0_startMask1, ext0_endMask1]],
	//       subExtension1: [[ext1_startMask0, ext1_endMask0]]
	//   }
	// Or "links" like
	//   otherExtension: "extension"
	// "extension" must be already defined!
	// Masks is case unsensitive.
	html: {
		js: [["<script", "</script>"]],
		css: [["<style", "</style>"]],
		php: [["<?php", "?>"], ["<?", "?>"]]
	},
	htm: "html",
	xhtml: "html",
	shtml: "html",
	php: "html",
	xml: {
		js: [
			["<script", "</script>"],
			["<![cdata[", "]]>"],
			["<constructor>", "</constructor>"],
			["<destructor>", "</destructor>"],
			["<getter>", "</getter>"],
			["<setter>", "</setter>"],
			["<field", "</field>"],
			["<method", "</method>"],
			["<handler", "</handler>"]
		],
		css: [["<style", "</style>"]],
		php: [["<?php", "?>"], ["<?", "?>"]]
	},
	xul: "xml",
	xbl: "xml"
};
var hlExtForceRecognize = {
	// Force use recognize algorithm for following extension
	// Syntax:
	//   extension: true
	xml: true // XBL-files use same extension
};
var hlExtRecognize = {
	// Used for unsaved files without filename and extension
	// Syntax:
	//   extension: function(str) { return isExtension; }
	html: function(str) {
		return /^\s*<!DOCTYPE html\W/.test(str) || /<\/html[\s>]/i.test(str);
	},
	php: function(str) {
		return /<\?php\W.*\?>/.test(str)
			|| /<\?.*\?>/.test(str) && (
				/\Whtmlspecialchars\s*\(/i.test(str)
				|| /\Wsession_start\s*\(\)/i.test(str)
				|| /\Wmysql_query\s*\(/i.test(str)
			);
	},
	xbl: function(str) {
		return /^\s*<\?xml/.test(str)
			&& /\sxmlns\s*=\s*("|')http:\/\/www\.mozilla\.org\/xbl\1[\s>]/.test(str)
			&& /<bindings[\s>]/.test(str);
	},
	xul: function(str) {
		return /^\s*<\?xml\W/.test(str)
			&& /\sxmlns\s*=\s*("|')http:\/\/www\.mozilla\.org\/keymaster\/gatekeeper\/there\.is\.only\.xul\1[\s>]/.test(str);
	},
	rdf: function(str) {
		return /^\s*<\?xml/.test(str)
			&& /\sxmlns\s*=\s*("|')http:\/\/www\.w3\.org\/1999\/02\/22-rdf-syntax-ns#\1[\s>]/.test(str);
	},
	xsl: function(str) {
		return /^\s*<\?xml/.test(str)
			&& /\sxmlns\s*=\s*("|')http:\/\/www\.w3\.org\/1999\/XSL\/Transform\1[\s>]/.test(str);
	},
	svg: function(str) {
		return /^\s*<\?xml/.test(str)
			&& /\sxmlns\s*=\s*("|')http:\/\/www\.w3\.org\/2000\/svg\1[\s>]/.test(str);
	},
	dtd: function(str) {
		return /<!ENTITY\s[^<>]+>/.test(str);
	},
	xml: function(str) {
		return /^\s*<\?xml\W/.test(str);
	},
	rc: function(str) {
		return (
			(/(^|\n|\r)#define\s\S/.test(str) || /(^|\n|\r)#include\s\S/.test(str))
			|| /\sMENUITEM\s/.test(str)
			|| /\sBLOCK\s/.test(str)
		)
		&& /\sBEGIN\s/.test(str) && /\sEND\s/.test(str);
	},
	cpp: function(str) {
		return /(^|\n|\r)#define\s\S/.test(str)
			|| /(^|\n|\r)#include\s\S/.test(str);
	},
	manifest: function(str) {
		return /(^|\n|\r)content[ \t]\S/.test(str);
	},
	akelmenu: function(str) {
		return /("|'|`)[ +](Command\(\d+\)|Call\(|Exec\()/.test(str);
	},
	bat: function(str) {
		return /^@echo off\s/i.test(str)
			|| /(^|\s)if( not)? exist\s/.test(str);
	},
	coder: function(str) {
		return /(^|\n|\r)Delimiters:[\n\r]/.test(str)
			&& /(^|\n|\r)Words:[\n\r]/.test(str);
	},
	js: function(str) {
		return /(^|\s)var\s+\S/.test(str);
	},
	vbs: function(str) {
		return /(^|\s)dim\s+\S/i.test(str);
	},
	css: function(str) {
		return /!\s*important[\s;]/.test(str)
			|| /\Wcolor\s*:\s*(#[a-f0-9]{3}|#[a-f0-9]{6}|[a-z-]+)\s*(!\s*important)?[\s;]/i.test(str)
			|| /\W[a-z-]\s*:\s*(\d+|(\d+)?\.\d+)(px|em|%|pt)[\s;]/i.test(str);
	},
	ini: function(str) {
		return /(^|\n|\r)[^=\s]+=/.test(str);
	}
};
//== Settings end

function _localize(s) {
	var strings = {
		"Syntax highlighting:": {
			ru: "ѕодсветка синтаксиса:"
		},
		"Syntax highlighting (%S):": {
			ru: "ѕодсветка синтаксиса (%S):"
		},
		"by file extension": {
			ru: "по расширению файла"
		},
		"special detection": {
			ru: "специальное определение"
		},
		"recognition": {
			ru: "автоопределение"
		},
		"region": {
			ru: "регион"
		},
		"recognition + region": {
			ru: "автоопределение + регион"
		},
		"history": {
			ru: "предыдущее значение"
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
var noRecognize = getArg("noRecognize", false);
var restore     = getArg("restore",     false);
var saveLastExt = getArg("saveLastExt", 1);

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();
var fullText;
var detectType;

if(hMainWnd) {
	var ext, forceSet;
	if(restore) {
		forceSet = true;
		ext = /\.([^.]+)$/i.test(AkelPad.GetEditFile(0)) ? RegExp.$1.toLowerCase() : "";
	}
	else {
		ext = getExt();
	}
	if(ext || forceSet) {
		//AkelPad.IsPluginRunning("HighLight::Main")    && AkelPad.Call("HighLight::Main", 1, ext);
		//AkelPad.IsPluginRunning("AutoComplete::Main") && AkelPad.Call("AutoComplete::Main", 1, ext);
		//AkelPad.IsPluginRunning("CodeFold::Main")     && AkelPad.Call("CodeFold::Main", 1, ext);
		if(
			AkelPad.IsPluginRunning("Coder::HighLight")
			|| AkelPad.IsPluginRunning("Coder::AutoComplete")
			|| AkelPad.IsPluginRunning("Coder::CodeFold")
		)
			AkelPad.Call("Coder::Settings", 1, ext);
	}
}

function getExt() {
	var ext = getCurrentExt();
	if(!ext) {
		ext = saveLastExt && pref("lastExt", 3 /*PO_STRING*/) || "";
		if(ext)
			detectType = "history";
	}
	var typedExt = AkelPad.InputBox(
		hMainWnd,
		WScript.ScriptName,
		detectType
			? _localize("Syntax highlighting (%S):").replace("%S", _localize(detectType))
			: _localize("Syntax highlighting:"),
		ext
	);
	if(!typedExt)
		return "";
	typedExt = typedExt.toLowerCase();
	if(saveLastExt && (typedExt != ext.toLowerCase() || saveLastExt == 2))
		pref("lastExt", 3 /*PO_STRING*/, typedExt);
	return typedExt;
}
function getCurrentExt() {
	var filePath = AkelPad.GetEditFile(0);
	var ext = filePath && /\.([^.]+)$/i.test(filePath) && RegExp.$1.toLowerCase();
	if(ext)
		detectType = "by file extension";
	if(
		(ext == "coder" || ext == "highlight" || ext == "autocomplete" || ext == "codefold")
		&& /[\n\r](Files|Extensions):[\n\r]+(;[^\n\r]*[\n\r]+)*[\n\r]*([^;][^\s]*)[\n\r]/.test(getFullText())
	) {
		detectType = "special detection";
		return RegExp.$3;
	}
	if(ext == "txt" && /log/i.test(filePath)) {
		detectType = "special detection";
		return "log";
	}
	if(!ext || hlExtForceRecognize[ext])
		ext = recognizeExt() || ext;
	var mSet = ext && getParams(hlExtRegions, ext);
	var rgnExt = mSet && defineExtRegion(mSet);
	return rgnExt || ext || "";
}
function getParams(sets, key) {
	var params = sets[key];
	if(typeof params == "string")
		params = sets[params];
	return params;
}
function recognizeExt() {
	if(noRecognize)
		return undefined;
	var fullText = getFullText();
	if(!fullText)
		return undefined;
	for(var rcgExt in hlExtRecognize) {
		if(hlExtRecognize[rcgExt](fullText)) {
			detectType = "recognition";
			return rcgExt;
		}
	}
	return undefined;
}
function defineExtRegion(mSet) {
	var fText = getFullText();
	var ss = AkelPad.GetSelStart();
	var se = AkelPad.GetSelEnd();
	var startText = fText.substring(0, ss).toLowerCase();
	var selText   = fText.substring(ss, se).toLowerCase();
	var endText   = fText.substring(se, fText.length).toLowerCase();
	var i, start, end, startIndx, endIndx;
	var mParams;
	for(var ext in mSet) {
		mParams = mSet[ext];
		for(i = 0, len = mParams.length; i < len; i++) {
			start = mParams[i][0];
			end = mParams[i][1];
			startIndx = endText.indexOf(start);
			endIndx = endText.indexOf(end);
			if(
				startText.lastIndexOf(start) > startText.lastIndexOf(end)
				&& selText.indexOf(start) == -1 && selText.indexOf(end) == -1
				&& endIndx != -1
				&& (startIndx == -1 || endIndx < startIndx)
			) {
				detectType = detectType == "recognition"
					? "recognition + region"
					: "region";
				return ext;
			}
		}
	}
	return "";
}
function getFullText() {
	if(fullText != undefined)
		return fullText;

	if(typeof AkelPad.GetTextRange != "undefined")
		return fullText = AkelPad.GetTextRange(0, -1);
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return "";
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	var columnSel = AkelPad.SendMessage(hWndEdit, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0);
	var ss = AkelPad.GetSelStart();
	var se = AkelPad.GetSelEnd();

	AkelPad.SetSel(0, -1);
	fullText = AkelPad.GetSelText();

	AkelPad.SetSel(ss, se);
	columnSel && AkelPad.SendMessage(hWndEdit, 3128 /*AEM_UPDATESEL*/, 0x1 /*AESELT_COLUMNON*/, 0);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	AkelPad.MemFree(lpPoint);
	setRedraw(hWndEdit, true);
	return fullText;
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
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