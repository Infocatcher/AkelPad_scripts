var tbPlugName = AkelPad.GetArgValue("toolBarName", "ToolBar");

var oSet = AkelPad.ScriptSettings();
if(oSet.Begin(tbPlugName, 0x21 /*POB_READ|POB_PLUGS*/)) {
	var tbData = oSet.Read("ToolBarText", 3 /*PO_STRING*/);
	oSet.End();
	if(!tbData) {
		AkelPad.MessageBox(
			AkelPad.GetMainWnd(),
			"ToolBarText data is empty.\nToolBar plugin not installed or not configured?",
			WScript.ScriptName,
			16 /*MB_ICONERROR*/
		);
		WScript.Quit();
	}
}

if(tbData && oSet.Begin(tbPlugName, 0x22 /*POB_SAVE|POB_PLUGS*/)) {
	var isPlain = tbData.length % 4 || /[^\dA-F]/i.test(tbData); // Hex-coded, if stored in INI
	var tbText = isPlain ? tbData : hexToStr(tbData);
	tbText = tbText.replace(/\r(#?)BREAK\r/g, function(s, commented) {
		return "\r" + (commented ? "" : "#") + "BREAK\r";
	});
	tbData = isPlain ? tbText : strToHex(tbText);
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