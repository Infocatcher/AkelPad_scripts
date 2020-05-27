// http://infocatcher.ucoz.net/js/akelpad_scripts/closeUnsavedTabs.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/closeUnsavedTabs.js

// (c) Infocatcher 2019-2020
// Version: 0.1.0 - 2020-05-24
// Author: Infocatcher

//// Close all unsaved tabs

// Arguments:
//   -onlyEmpty=false     - close only empty tabs
//   -askToSave=true      - ask to save (or mark file as not modified to silently close)
//   -closeCurrent=true   - also close current tab
//   -stopOnCancel=true   - stop tabs iteration, if pressed Cancel button

// Usage:
//   Call("Scripts::Main", 1, "closeUnsavedTabs.js")
//   Call("Scripts::Main", 1, "closeUnsavedTabs.js", "-onlyEmpty=false -askToSave=false -closeCurrent=true -stopOnCancel=true")

var hMainWnd = AkelPad.GetMainWnd();
var onlyEmpty = AkelPad.GetArgValue("onlyEmpty", false);
var askToSave = AkelPad.GetArgValue("askToSave", true);
var closeCurrent = AkelPad.GetArgValue("closeCurrent", true);
var stopOnCancel = AkelPad.GetArgValue("stopOnCancel", true);

if(AkelPad.IsMDI())
	closeEmptyTabs();
else
	AkelPad.MessageBox(hMainWnd, "MDI or PMDI window mode required!", WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);

function closeEmptyTabs() {
	var lpFrameInitial = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
	for(; !stop; ) {
		AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4316 /*IDM_WINDOW_FRAMENEXT*/, 0);
		var lpFrame = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
		var stop = lpFrame == lpFrameInitial;
		if((!stop || closeCurrent) && !closeEmptyTab()) { // Canceled
			if(stopOnCancel)
				return;
			else
				continue;
		}
	}
	AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameInitial);
}
function closeEmptyTab() {
	if(
		AkelPad.GetEditFile(0) // Saved
		|| onlyEmpty && AkelPad.GetTextRange(0, 1) // Not empty
	)
		return true;
	if(!askToSave) { // Force mark as not modified
		var hWndEdit = AkelPad.GetEditWnd();
		if(AkelPad.SendMessage(hWndEdit, 3086 /*AEM_GETMODIFY*/, 0, 0))
			AkelPad.SendMessage(hWndEdit, 3087 /*AEM_SETMODIFY*/, false, 0);
	}
	return AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4318 /*IDM_WINDOW_FRAMECLOSE*/, 0);
}