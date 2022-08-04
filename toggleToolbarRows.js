// http://infocatcher.ucoz.net/js/akelpad_scripts/toggleToolbarRows.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/toggleToolbarRows.js

// (c) Infocatcher 2022
// Version: 0.1.0pre - 2022-06-06
// Author: Infocatcher

//// Toggle multiline toolbar from ToolBar plugin (convert BREAK <-> #BREAK)

// Arguments:
//   -toolBarName="ToolBar2"  - specify file name of ToolBar plugin

// Usage:
//   Call("Scripts::Main", 1, "toggleToolbarRows.js")
//   Call("Scripts::Main", 1, "toggleToolbarRows.js", '-toolBarName="ToolBar2"')

var tbPlugName = AkelPad.GetArgValue("toolBarName", "ToolBar");

function _localize(s) {
	var strings = {
		"ToolBarText data in %P plugin is empty!": {
			ru: "Содержимое ToolBarText плагина %P пустое!"
		},
		"ToolBarText data in %P plugin not recognized:\n%S": {
			ru: "Содержимое ToolBarText плагина %P не распознано:\n%S"
		},
		"Failed to read settings of %P plugin": {
			ru: "Не удалось прочитать настройки плагина %P"
		},
		"Failed to write settings of %P plugin": {
			ru: "Не удалось записать настройки плагина %P"
		},
		"Failed to toggle multiline toolbar from %P plugin: BREAK item not found": {
			ru: "Не удалось переключить многострочность панели инструментов плагина %P: элемент BREAK не найден"
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
function _str(s) {
	return _localize(s).replace("%P", tbPlugName);
}

var oSet = AkelPad.ScriptSettings();
var hMainWnd = AkelPad.GetMainWnd();
var isHex = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 5 /*MI_SAVESETTINGS*/, 0) == 2 /*SS_INI*/;

if(oSet.Begin(tbPlugName, 0x21 /*POB_READ|POB_PLUGS*/)) {
	var tbData = oSet.Read("ToolBarText", 3 /*PO_STRING*/);
	oSet.End();
	if(
		!tbData
		|| isHex && (tbData.length % 4 || /[^\dA-F]/i.test(tbData))
	) {
		error(
			tbData
				? _str("ToolBarText data in %P plugin not recognized:\n%S")
					.replace("%S", tbData.substr(0, 100))
				: _str("ToolBarText data in %P plugin is empty!")
		);
		WScript.Quit();
	}
}
else {
	error(_str("Failed to read settings of %P plugin"));
}

if(tbData && oSet.Begin(tbPlugName, 0x22 /*POB_SAVE|POB_PLUGS*/)) {
	var tbText = isHex ? hexToStr(tbData) : tbData;
	var changed;
	tbText = tbText.replace(/\r(#?)BREAK\r/g, function(s, commented) {
		changed = true;
		return "\r" + (commented ? "" : "#") + "BREAK\r";
	});
	if(changed) {
		tbData = isHex ? strToHex(tbText) : tbText;
		oSet.Write("ToolBarText", 3 /*PO_STRING*/, tbData);
	}
	else {
		error(_str("Failed to toggle multiline toolbar from %P plugin: BREAK item not found"), 48 /*MB_ICONEXCLAMATION*/);
	}
	oSet.End();

	if(changed && AkelPad.IsPluginRunning(tbPlugName + "::Main")) {
		AkelPad.Call(tbPlugName + "::Main");
		AkelPad.Call(tbPlugName + "::Main");
	}
}
else {
	tbData && error(_str("Failed to write settings of %P plugin"));
}

function hexToStr(h) {
	return h.replace(/[\dA-F]{4}/ig, function(h) {
		var n = parseInt(reorder(h), 16);
		return String.fromCharCode(n);
	});
}
function strToHex(s) {
	return s.replace(/[\s\S]/g, function(c) {
		var h = c.charCodeAt(0).toString(16).toUpperCase();
		h = "0000".substr(h.length) + h;
		return reorder(h);
	});
}
function reorder(h) { // LE <-> BE
	var b1 = h.substr(0, 2);
	var b2 = h.substr(2);
	return b2 + b1;
}

function error(msg, icon) {
	AkelPad.MessageBox(hMainWnd, msg, WScript.ScriptName, icon || 16 /*MB_ICONERROR*/);
}