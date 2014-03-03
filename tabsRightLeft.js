// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11387#11387
// http://infocatcher.ucoz.net/js/akelpad_scripts/tabsRightLeft.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/tabsRightLeft.js

// (c) Infocatcher 2011
// version 0.1.2 - 2011-11-16

//===================
// Switch between tabs in order of them arrangement (temporary check "Switch tabs: right-left" option)
// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#4222
// Proposed hotkeys: Ctrl+PageDown and Ctrl+PageUp

// Usage:
//   Call("Scripts::Main", 1, "tabsRightLeft.js")           - switch to next tab
//   Call("Scripts::Main", 1, "tabsRightLeft.js", "-prev")  - switch to previous tab
//===================

var next = WScript.Arguments.length ? WScript.Arguments(0) != "-prev" : true;

var hMainWnd = AkelPad.GetMainWnd();

if(hMainWnd && AkelPad.IsMDI()) {
	var tabOpts = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 157 /*MI_TABOPTIONSMDI*/, 0);
	var forceRightLeft = !(tabOpts & 0x20000 /*TAB_SWITCH_RIGHTLEFT*/);
	if(forceRightLeft)
		AkelPad.Command(4311 /*IDM_WINDOW_TABSWITCH_RIGHTLEFT*/);

	selectTab(next);

	if(forceRightLeft)
		AkelPad.SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 157 /*MI_TABOPTIONSMDI*/, tabOpts);
}
else {
	AkelPad.MessageBox(hMainWnd, "MDI or PMDI window mode required!", WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
}

function selectTab(next) {
	var cmd = next ? 4316 /*IDM_WINDOW_FRAMENEXT*/ : 4317 /*IDM_WINDOW_FRAMEPREV*/;
	AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, cmd, 0);
}