// https://github.com/Infocatcher/AkelPad_scripts/blob/master/undoableReopen.js

// (c) Infocatcher 2012
// version 0.1.0pre - 2012-05-11

// Reopen file and preserve undo/redo buffer (just replace all text, if it was changed)

var oSys = AkelPad.SystemFunction();
var hWndEdit = AkelPad.GetEditWnd();
if(hWndEdit)
	undoableReopen();
function undoableReopen() {
	var file = AkelPad.GetEditFile(0);
	if(!file)
		return;

	var text = AkelPad.ReadFile(file);
	if(text == AkelPad.GetTextRange(0, -1, 4 - AkelPad.GetEditNewLine(0)))
		return;

	// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=13296#13296
	var lpSel = AkelPad.MemAlloc(_X64 ? 56 : 28 /*sizeof(AESELECTION)*/);
	if(!lpSel)
		return;
	var lpCaret = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
	if(!lpCaret)
		return;
	AkelPad.SendMessage(hWndEdit, 3185 /*AEM_LOCKSCROLL*/, 3 /*SB_BOTH*/, true);
	AkelPad.SendMessage(hWndEdit, 3125 /*AEM_GETSEL*/, lpCaret, lpSel);

	noScroll(function() {
		AkelPad.SetSel(0, -1);
		AkelPad.ReplaceSel(text);

		var dwFlags = AkelPad.MemRead(lpSel + (_X64 ? 48 : 24) /*AESELECTION.dwFlags*/, 3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpSel + (_X64 ? 48 : 24) /*AESELECTION.dwFlags*/, dwFlags | 0x808 /*AESELT_LOCKSCROLL|AESELT_INDEXUPDATE*/, 3 /*DT_DWORD*/);
		AkelPad.SendMessage(hWndEdit, 3126 /*AEM_SETSEL*/, lpCaret, lpSel);
		AkelPad.SendMessage(hWndEdit, 3185 /*AEM_LOCKSCROLL*/, 3 /*SB_BOTH*/, false);
	});
	AkelPad.SendMessage(hWndEdit, 3126 /*AEM_SETSEL*/, lpCaret, lpSel); // Needed for show caret
}
function noScroll(func, hWndEdit) {
	if(!hWndEdit)
		hWndEdit = AkelPad.GetEditWnd();
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	func();

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}