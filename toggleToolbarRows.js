﻿var tbPlugName = "ToolBar";

var oSet = AkelPad.ScriptSettings();
if(oSet.Begin("..\\" + tbPlugName, 0x1 /*POB_READ*/)) {
	var tbData = oSet.Read("ToolBarText", 3 /*PO_STRING*/);
	oSet.End();
}

if(tbData && oSet.Begin("..\\" + tbPlugName, 0x2 /*POB_SAVE*/)) {
	var tbText = hexToStr(tbData);
	tbText = tbText.replace(/(#?)BREAK/g, function(s, commented) {
		return (commented ? "" : "#") + "BREAK";
	});
	tbData = strToHex(tbText);
	oSet.Write("ToolBarText", 3 /*PO_STRING*/, tbData);
	oSet.End();

	if(AkelPad.IsPluginRunning(tbPlugName + "::Main")) {
		AkelPad.Call(tbPlugName + "::Main");
		AkelPad.Call(tbPlugName + "::Main");
	}
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