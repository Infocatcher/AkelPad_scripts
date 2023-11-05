// https://akelpad.sourceforge.net/forum/viewtopic.php?p=11387#p11387
// https://infocatcher.ucoz.net/js/akelpad_scripts/tabsNextPrevious.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/tabsNextPrevious.js

// (c) Infocatcher 2011, 2014
// Version: 0.1.2 - 2014-03-03
// Author: Infocatcher

//===================
//// Switch between tabs in order of them usage (temporary check "Switch tabs: next-previous" option)
// Based on Instructor's code: https://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#p4222
// Proposed hotkeys: Ctrl+PageDown and Ctrl+PageUp

// Usage:
//   Call("Scripts::Main", 1, "tabsNextPrevious.js")           - switch to next tab
//   Call("Scripts::Main", 1, "tabsNextPrevious.js", "-prev")  - switch to previous tab
//===================

var next = WScript.Arguments.length ? WScript.Arguments(0) != "-prev" : true;

var hMainWnd = AkelPad.GetMainWnd();

if(hMainWnd && AkelPad.IsMDI()) {
	var tabOpts = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 157 /*MI_TABOPTIONSMDI*/, 0);
	var forceNextPrev = !(tabOpts & 0x10000 /*TAB_SWITCH_NEXTPREV*/);
	if(forceNextPrev)
		AkelPad.Command(4310 /*IDM_WINDOW_TABSWITCH_NEXTPREV*/);

	selectTab(next);

	if(forceNextPrev)
		AkelPad.SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 157 /*MIS_TABOPTIONSMDI*/, tabOpts);
}
else {
	AkelPad.MessageBox(hMainWnd, "MDI or PMDI window mode required!", WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
}

function selectTab(next) {
	var cmd = next ? 4316 /*IDM_WINDOW_FRAMENEXT*/ : 4317 /*IDM_WINDOW_FRAMEPREV*/;
	AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, cmd, 0);
}