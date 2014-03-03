// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11387#11387
// http://infocatcher.ucoz.net/js/akelpad_scripts/tabsNextPrevious.js

// (c) Infocatcher 2011
// version 0.1.1 - 2011-11-16

//===================
// Switch between tabs in order of them usage (temporary check "Switch tabs: next-previous" option)
// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#4222
// Proposed hotkeys: Ctrl+PageDown and Ctrl+PageUp

// Usage:
//   Call("Scripts::Main", 1, "tabsNextPrevious.js")           - switch to next tab
//   Call("Scripts::Main", 1, "tabsNextPrevious.js", "-prev")  - switch to previous tab
//===================

var next = WScript.Arguments.length ? WScript.Arguments(0) != "-prev" : true;

var hMainWnd = AkelPad.GetMainWnd();

if(hMainWnd) {
	var tabOpts = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 157 /*MI_TABOPTIONSMDI*/, 0);
	var forceNextPrev = !(tabOpts & 0x10000 /*TAB_SWITCH_NEXTPREV*/);
	if(forceNextPrev)
		AkelPad.Command(4310 /*IDM_WINDOW_TABSWITCH_NEXTPREV*/);

	selectTab(next);

	if(forceNextPrev)
		AkelPad.SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 157 /*MI_TABOPTIONSMDI*/, tabOpts);
}

function selectTab(next) {
	var cmd = next ? 4316 /*IDM_WINDOW_FRAMENEXT*/ : 4317 /*IDM_WINDOW_FRAMEPREV*/;
	AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, cmd, 0);
}