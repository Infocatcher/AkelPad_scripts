// https://github.com/Infocatcher/AkelPad_scripts/blob/master/forceCloneTab.js

//// Force clone tab (even if "Single open file" in turned on)

var hMainWnd = AkelPad.GetMainWnd();
if(!hMainWnd)
	WScript.Quit();
var singleOpen = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 152 /*MI_SINGLEOPENFILE*/, 0);
singleOpen && AkelPad.Command(4255 /*IDM_OPTIONS_SINGLEOPEN_FILE*/);
AkelPad.Command(4322 /*IDM_WINDOW_FRAMECLONE*/);
singleOpen && AkelPad.Command(4255 /*IDM_OPTIONS_SINGLEOPEN_FILE*/);