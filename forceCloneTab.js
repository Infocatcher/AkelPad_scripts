// https://infocatcher.ucoz.net/js/akelpad_scripts/forceCloneTab.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/forceCloneTab.js

// (c) Infocatcher 2024
// Version: 0.1.0 - 2024-11-23
// Author: Infocatcher

//// Force clone tab (even if "Single open file" is turned on)
// Based on Instructor's code: https://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#p4222

// Usage:
//   Call("Scripts::Main", 1, "forceCloneTab.js")

var hMainWnd = AkelPad.GetMainWnd();
if(!hMainWnd)
	WScript.Quit();
var singleOpen = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 152 /*MI_SINGLEOPENFILE*/, 0);
singleOpen && AkelPad.Command(4255 /*IDM_OPTIONS_SINGLEOPEN_FILE*/);
AkelPad.Command(4322 /*IDM_WINDOW_FRAMECLONE*/);
singleOpen && AkelPad.Command(4255 /*IDM_OPTIONS_SINGLEOPEN_FILE*/);