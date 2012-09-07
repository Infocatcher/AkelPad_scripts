// http://akelpad.sourceforge.net/forum/viewtopic.php?p=10403#10403
// http://infocatcher.ucoz.net/js/akelpad_scripts/saveStoreTime.js

// (c) Infocatcher 2010-2011
// version 0.1.3 - 2011-11-16

// Save file and don't update modification time
// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#4222

// Usage:
//   Call("Scripts::Main", 1, "saveStoreTime.js")

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd) {
	//var hMenuMain = oSys.Call("user32::GetMenu", hMainWnd);
	var hMenuMain = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 21 /*MI_MENUMAIN*/, 0);
	if(hMenuMain) {
		var dwState = oSys.Call(
			"user32::GetMenuState",
			hMenuMain,
			4252 /*IDM_OPTIONS_SAVETIME*/,
			0 /*MF_BYCOMMAND*/
		);
		if(dwState & 0x8 /*MF_CHECKED*/) {
			AkelPad.Command(4105 /*IDM_FILE_SAVE*/);
		}
		else {
			AkelPad.Command(4252 /*IDM_OPTIONS_SAVETIME*/);
			AkelPad.Command(4105 /*IDM_FILE_SAVE*/);
			AkelPad.Command(4252 /*IDM_OPTIONS_SAVETIME*/);
		}
	}
}