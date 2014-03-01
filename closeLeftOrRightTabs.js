// http://akelpad.sourceforge.net/forum/viewtopic.php?p= ~todo
// http://infocatcher.ucoz.net/js/akelpad_scripts/closeLeftOrRightTabs.js

// (c) Infocatcher 2014
// version 0.1.0 - 2014-03-01

//===================
// Close tabs to the left or right (temporary check "Switch tabs: right-left" option)
// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#4222

// Usage:
//   Call("Scripts::Main", 1, "closeLeftOrRightTabs.js")           - close tabs to the right
//   Call("Scripts::Main", 1, "closeLeftOrRightTabs.js", "-left")  - close tabs to the left
//===================

var toRight = WScript.Arguments.length ? WScript.Arguments(0) != "-left" : true;

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd) {
	//var hMenuMain = oSys.Call("user32::GetMenu", hMainWnd);
	var hMenuMain = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 21 /*MI_MENUMAIN*/, 0);
	if(hMenuMain) {
		var dwState = oSys.Call(
			"user32::GetMenuState",
			hMenuMain,
			4310 /*IDM_WINDOW_TABSWITCH_NEXTPREV*/,
			0 /*MF_BYCOMMAND*/
		);
		if(dwState & 0x8 /*MF_CHECKED*/) {
			AkelPad.Command(4311 /*IDM_WINDOW_TABSWITCH_RIGHTLEFT*/);
			closeTabs(toRight);
			AkelPad.Command(4310 /*IDM_WINDOW_TABSWITCH_NEXTPREV*/);
		}
		else {
			closeTabs(toRight);
		}
	}
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