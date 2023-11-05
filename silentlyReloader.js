// https://github.com/Infocatcher/AkelPad_scripts/blob/master/silentlyReloader.js

// (c) Infocatcher 2021
// Version: 0.1a1 - 2021-08-25
// Author: Infocatcher

//// Automatically reload log-like file

// Required timer.js library
// https://akelpad.sourceforge.net/forum/viewtopic.php?p=24559#p24559
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/Include/timer.js

var delay = 2e3; // In milliseconds
var noUndo = false;


var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var hWndEdit = AkelPad.GetEditWnd();

var hScript = AkelPad.ScriptHandle(WScript.ScriptName, 3 /*SH_FINDSCRIPT*/);
if(hScript && AkelPad.ScriptHandle(hScript, 13 /*SH_GETMESSAGELOOP*/)) {
	// Script is running, second call close it
	//WScript.Echo("Try to close");
	AkelPad.ScriptHandle(hScript, 33 /*SH_CLOSESCRIPT*/);
	WScript.Quit();
}

if(
	!hMainWnd || !hWndEdit || !AkelPad.GetEditFile(0)
	|| !AkelPad.Include("timer.js")
)
	WScript.Quit();

var reloadTimer = setInterval(reloadSilently, delay);

//Allow other scripts running and unlock main thread from waiting this script.
AkelPad.ScriptNoMutex(0x3 /*ULT_UNLOCKSCRIPTSQUEUE|ULT_UNLOCKPROGRAMTHREAD*/);
AkelPad.WindowGetMessage(); // Message loop


function reloadSilently() {
	if(!AkelPad.SetEditWnd(hWndEdit)) {
		clearInterval(reloadTimer);
		reloadTimer = 0;
		oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		return;
	}

	// See https://github.com/Infocatcher/AkelPad_scripts/blob/master/undoableReopen.js
	var file = AkelPad.GetEditFile(hWndEdit);
	if(!file)
		return;

	var text = AkelPad.ReadFile(file, 0, AkelPad.GetEditCodePage(0), AkelPad.GetEditBOM(0));
	if(text == AkelPad.GetTextRange(0, -1, 4 - AkelPad.GetEditNewLine(0))) {
		AkelPad.SendMessage(hMainWnd, 1229 /*AKD_SETMODIFY*/, hWndEdit, false);
		noUndo && AkelPad.SendMessage(hWndEdit, 3079 /*AEM_EMPTYUNDOBUFFER*/ , 0, 0);
		return;
	}

	// Based on code from built-in RenameFile.js
	var lpPoint64 = AkelPad.MemAlloc(_X64 ? 16 : 8 /*sizeof(POINT64)*/);
	if(!lpPoint64)
		return;
	function cleanup() {
		AkelPad.MemFree(lpPoint64);
		lpSel     && AkelPad.MemFree(lpSel);
		lpCaret   && AkelPad.MemFree(lpCaret);
	}
	var lpSel = AkelPad.MemAlloc(_X64 ? 56 : 32 /*sizeof(AESELECTION)*/);
	if(!lpSel)
		return cleanup();
	var lpCaret = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
	if(!lpCaret)
		return cleanup();
	AkelPad.SendMessage(hWndEdit, 3179 /*AEM_GETSCROLLPOS*/, 0, lpPoint64);
	AkelPad.SendMessage(hWndEdit, 3125 /*AEM_GETSEL*/, lpCaret, lpSel);

	AkelPad.SendMessage(hWndEdit, 11 /*WM_SETREDRAW*/, false, 0);
	AkelPad.SetSel(0, -1);
	AkelPad.ReplaceSel(text);
	AkelPad.SendMessage(hMainWnd, 1229 /*AKD_SETMODIFY*/, hWndEdit, false);
	noUndo && AkelPad.SendMessage(hWndEdit, 3079 /*AEM_EMPTYUNDOBUFFER*/ , 0, 0);
	AkelPad.SendMessage(hWndEdit, 11 /*WM_SETREDRAW*/, true, 0);
	oSys.Call("user32::InvalidateRect", hWndEdit, 0, true);

	var lpOffset = _PtrAdd(lpSel, _X64 ? 48 : 24 /*AESELECTION.dwFlags*/);
	var dwFlags = AkelPad.MemRead(lpOffset, 3 /*DT_DWORD*/);
	AkelPad.MemCopy(lpOffset, dwFlags | 0x808 /*AESELT_LOCKSCROLL|AESELT_INDEXUPDATE*/, 3 /*DT_DWORD*/);
	AkelPad.SendMessage(hWndEdit, 3126 /*AEM_SETSEL*/, lpCaret, lpSel);
	AkelPad.SendMessage(hWndEdit, 3180 /*AEM_SETSCROLLPOS*/, 0, lpPoint64);
	cleanup();
}