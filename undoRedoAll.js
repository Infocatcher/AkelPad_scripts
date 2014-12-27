// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#9927
// http://infocatcher.ucoz.net/js/akelpad_scripts/undoRedoAll.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/undoRedoAll.js

// (c) Infocatcher 2010, 2014
// Version: 0.1.1 - 2014-04-04
// Author: Infocatcher

//// Undo/redo all changes

// Arguments:
//   -mode=0       - undo
//   -mode=1       - redo
//   -stopOnSaved

// Usage:
//   Call("Scripts::Main", 1, "undoRedoAll.js", "-mode=0 -stopOnSaved=true")

var AEM_CANUNDO = 3075;
var AEM_CANREDO = 3076;
var AEM_UNDO    = 3077;
var AEM_REDO    = 3078;

var MODE_UNDO = 0;
var MODE_REDO = 1;

// Read arguments:
var mode        = AkelPad.GetArgValue("mode", MODE_UNDO);
var stopOnSaved = AkelPad.GetArgValue("stopOnSaved", false);

var CAN_ACTION = AEM_CANUNDO;
var ACTION     = AEM_UNDO;
if(mode == MODE_REDO) {
	CAN_ACTION = AEM_CANREDO;
	ACTION     = AEM_REDO;
}

var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(
	AkelPad.GetMainWnd()
	&& AkelPad.IsAkelEdit()
	&& canAction()
) {
	var nFirstLine = saveLineScroll(hWndEdit);

	do action();
	while(canAction());

	restoreLineScroll(hWndEdit, nFirstLine);
}
function canAction() {
	return (stopOnSaved ? AkelPad.SendMessage(hWndEdit, 3086 /*AEM_GETMODIFY*/, 0, 0) : true)
		&& AkelPad.SendMessage(hWndEdit, CAN_ACTION, 0, 0);
}
function action() {
	AkelPad.SendMessage(hWndEdit, ACTION, 0, 0);
}

// From Instructor's SearchReplace.js
function saveLineScroll(hWnd)
{
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, false, 0);
	return AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0);
}
function restoreLineScroll(hWnd, nBeforeLine)
{
	if (AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0) != nBeforeLine)
	{
		var lpScrollPos;
		var nPosY=AkelPad.SendMessage(hWnd, 3198 /*AEM_VPOSFROMLINE*/, 0 /*AECT_GLOBAL*/, nBeforeLine);

		if (lpScrollPos=AkelPad.MemAlloc(_X64?16:8 /*sizeof(POINT64)*/))
		{
			AkelPad.MemCopy(lpScrollPos + 0 /*offsetof(POINT64, x)*/, -1, 2 /*DT_QWORD*/);
			AkelPad.MemCopy(lpScrollPos + (_X64?8:4) /*offsetof(POINT64, y)*/, nPosY, 2 /*DT_QWORD*/);
			AkelPad.SendMessage(hWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpScrollPos);
			AkelPad.MemFree(lpScrollPos);
		}
	}
	AkelPad.SendMessage(hWnd, 3377 /*AEM_UPDATECARET*/, 0, 0);
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, true, 0);
	oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}