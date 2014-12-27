// http://akelpad.sourceforge.net/forum/viewtopic.php?p=24138#24138
// http://infocatcher.ucoz.net/js/akelpad_scripts/closeLeftOrRightTabs.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/closeLeftOrRightTabs.js

// (c) Infocatcher 2014
// Version: 0.1.1 - 2014-03-03
// Author: Infocatcher

//===================
// Close tabs to the left or right (temporary check "Switch tabs: right-left" option)
// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#4222

// Usage:
//   Call("Scripts::Main", 1, "closeLeftOrRightTabs.js")           - close tabs to the right
//   Call("Scripts::Main", 1, "closeLeftOrRightTabs.js", "-left")  - close tabs to the left
//===================

var toRight = WScript.Arguments.length ? WScript.Arguments(0) != "-left" : true;

var hMainWnd = AkelPad.GetMainWnd();
if(hMainWnd && AkelPad.IsMDI()) {
	var tabOpts = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 157 /*MI_TABOPTIONSMDI*/, 0);
	var forceRightLeft = !(tabOpts & 0x20000 /*TAB_SWITCH_RIGHTLEFT*/);
	if(forceRightLeft)
		AkelPad.Command(4311 /*IDM_WINDOW_TABSWITCH_RIGHTLEFT*/);

	closeTabs(toRight);

	if(forceRightLeft)
		AkelPad.SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 157 /*MIS_TABOPTIONSMDI*/, tabOpts);
}
else {
	AkelPad.MessageBox(hMainWnd, "MDI or PMDI window mode required!", WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
}

function closeTabs(toRight) {
	var nextFrameCmd = toRight ? 4316 /*IDM_WINDOW_FRAMENEXT*/ : 4317 /*IDM_WINDOW_FRAMEPREV*/;
	var lpFrameInitial = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
	var frameIndexInitial = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrameInitial);
	for(;;) {
		var restoreSelected = true;
		AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, nextFrameCmd, 0);
		var lpFrame = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
		//if(lpFrame == lpFrameInitial)
		//	break;
		var frameIndex = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrame);
		if(toRight ? frameIndex <= frameIndexInitial : frameIndex >= frameIndexInitial--)
			break; // Overflow
		if(!AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4318 /*IDM_WINDOW_FRAMECLOSE*/, 0))
			return; // Cancel
		restoreSelected = false;
		AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameInitial);
	}
	restoreSelected && AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameInitial);
}