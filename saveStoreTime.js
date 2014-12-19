// http://akelpad.sourceforge.net/forum/viewtopic.php?p=10403#10403
// http://infocatcher.ucoz.net/js/akelpad_scripts/saveStoreTime.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/saveStoreTime.js

// (c) Infocatcher 2010-2011, 2014
// Version: 0.1.4 - 2014-03-03

// Save file and don't update modification time
// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#4222

// Usage:
//   Call("Scripts::Main", 1, "saveStoreTime.js")

var hMainWnd = AkelPad.GetMainWnd();

if(hMainWnd) {
	var saveTime = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 148 /*MI_SAVETIME*/, 0);
	if(!saveTime)
		AkelPad.Command(4252 /*IDM_OPTIONS_SAVETIME*/);
	AkelPad.Command(4105 /*IDM_FILE_SAVE*/);
	if(!saveTime)
		AkelPad.SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 148 /*MIS_SAVETIME*/, saveTime);
}