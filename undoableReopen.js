// https://github.com/Infocatcher/AkelPad_scripts/blob/master/undoableReopen.js

// (c) Infocatcher 2012, 2014
// Version: 0.1.0pre3 - 2014-04-18
// Author: Infocatcher

// Reopen file and preserve undo/redo buffer (just replace all text, if it was changed)

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var hWndEdit = AkelPad.GetEditWnd();
if(hMainWnd && hWndEdit)
	undoableReopen();
function undoableReopen() {
	var file = AkelPad.GetEditFile(0);
	if(!file)
		return;

	var text = AkelPad.ReadFile(file, 0, AkelPad.GetEditCodePage(0), AkelPad.GetEditBOM(0));
	if(text == AkelPad.GetTextRange(0, -1, 4 - AkelPad.GetEditNewLine(0))) {
		AkelPad.SendMessage(hMainWnd, 1229 /*AKD_SETMODIFY*/, hWndEdit, false);
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
	AkelPad.SendMessage(hWndEdit, 11 /*WM_SETREDRAW*/, true, 0);
	oSys.Call("user32::InvalidateRect", hWndEdit, 0, true);

	var dwFlags = AkelPad.MemRead(lpSel + (_X64 ? 48 : 24) /*AESELECTION.dwFlags*/, 3 /*DT_DWORD*/);
	AkelPad.MemCopy(lpSel + (_X64 ? 48 : 24) /*AESELECTION.dwFlags*/, dwFlags | 0x808 /*AESELT_LOCKSCROLL|AESELT_INDEXUPDATE*/, 3 /*DT_DWORD*/);
	AkelPad.SendMessage(hWndEdit, 3126 /*AEM_SETSEL*/, lpCaret, lpSel);
	AkelPad.SendMessage(hWndEdit, 3180 /*AEM_SETSCROLLPOS*/, 0, lpPoint64);
	cleanup();
}