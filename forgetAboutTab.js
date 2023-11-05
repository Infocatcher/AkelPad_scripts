﻿// https://akelpad.sourceforge.net/forum/viewtopic.php?p=19810#p19810
// https://infocatcher.ucoz.net/js/akelpad_scripts/forgetAboutTab.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/forgetAboutTab.js

// (c) Infocatcher 2012, 2014
// Version: 0.1.0.1 - 2014-04-20
// Author: Infocatcher

//// Close current tab and remove information about it from recent files

// Dependencies:
//   DeleteRecentFile.js
//   https://akelpad.sourceforge.net/forum/viewtopic.php?p=10810#p10810

// Arguments:
//   -file='%f'     - file to forget (or don't specify to use current)
//   -confirm=true  - show confirmation dialog

// Usage in ContextMenu plugin:
//   -"Forget about this tab" Call("Scripts::Main", 1, "forgetAboutTab.js") Icon("%a\AkelFiles\Plugs\RecentFiles.dll", 5)
//   -"Забыть об этой вкладке" Call("Scripts::Main", 1, "forgetAboutTab.js") Icon("%a\AkelFiles\Plugs\RecentFiles.dll", 5)

var file = AkelPad.GetArgValue("file", "") || AkelPad.GetEditFile(0);
var ask  = AkelPad.GetArgValue("confirm", true);
if(file && (!ask || confirm())) {
	WScript.Sleep(50);
	AkelPad.Command(4318 /*IDM_WINDOW_FRAMECLOSE*/);
	//WScript.Sleep(50);
	AkelPad.Call("Scripts::Main", 1, "DeleteRecentFile.js", file);
}

function confirm() {
	return AkelPad.MessageBox(
		AkelPad.GetMainWnd(),
		getConfirmText(),
		WScript.ScriptName,
		33 /*MB_OKCANCEL|MB_ICONQUESTION*/
	) == 1 /*IDOK*/;
}
function getConfirmText() {
	switch(AkelPad.GetLangId(1 /*LANGID_PRIMARY*/)) {
		case 0x19: /*ru*/ return "Забыть об этой вкладке?";
		default:   /*en*/ return "Forget about this tab?";
	}
}