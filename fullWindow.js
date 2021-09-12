// http://akelpad.sourceforge.net/forum/viewtopic.php?p=24434#24434
// http://infocatcher.ucoz.net/js/akelpad_scripts/fullWindow.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/fullWindow.js

// (c) Infocatcher 2014
// Version: 0.1.0 - 2014-04-03
// Author: Infocatcher

//// Just like full screen mode, but preserve window size and position
// Required FullScreen plugin!

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var lpRect;

if(hMainWnd && (lpRect = AkelPad.MemAlloc(16 /*sizeof(RECT)*/))) {
	oSys.Call("user32::GetWindowRect", hMainWnd, lpRect);
	var x = AkelPad.MemRead(_PtrAdd(lpRect,  0), 3 /*DT_DWORD*/);
	var y = AkelPad.MemRead(_PtrAdd(lpRect,  4), 3 /*DT_DWORD*/);
	var w = AkelPad.MemRead(_PtrAdd(lpRect,  8), 3 /*DT_DWORD*/) - x;
	var h = AkelPad.MemRead(_PtrAdd(lpRect, 12), 3 /*DT_DWORD*/) - y;
	AkelPad.MemFree(lpRect);

	AkelPad.Call("FullScreen::Main");
	oSys.Call("user32::SetWindowPos", hMainWnd, 0, x, y, w, h, 0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);
}