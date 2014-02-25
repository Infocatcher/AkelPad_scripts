// http://akelpad.sourceforge.net/forum/viewtopic.php?p= //~ todo
// http://infocatcher.ucoz.net/js/akelpad_scripts/autoSaveSession.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/autoSaveSession.js

// (c) Infocatcher 2012-2014
// version 0.2.0pre6 - 2014-02-25

// Automatically saves current session after selection or scroll changes
// Required Sessions plugin!

// Arguments:
//   -startupDelay=1500    - (in ms) ignore all changes just after startup
//   -minDelay=8000        - (in ms) minimum interval between two saves
//   -smallDelay=500       - (in ms) minimum daley between change and save
//   -session="OnExit"     - name of session file

// Usage:
// add
//   /Call("Scripts::Main", 1, "autoSaveSession.js")
// or
//   /Call("Scripts::Main", 1, "autoSaveSession.js", '-startupDelay=2000 -minDelay=12000 -session="OnExit"')
// to "CmdLineBegin" option

var isMDI = AkelPad.IsMDI();
if(!isMDI) // We silently ignore SDI mode to allow use the same settings in any mode!
	WScript.Quit();

var startupDelay = AkelPad.GetArgValue("startupDelay", 1500);
var stopWait = new Date().getTime() + startupDelay;

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var minDelay = AkelPad.GetArgValue("minDelay", 8e3);
var smallDelay = AkelPad.GetArgValue("smallDelay", 500);
var sessionName = AkelPad.GetArgValue("session", "OnExit");

var timer = 0;
var lastSave = 0;

if(hMainWnd) {
	if(
		AkelPad.WindowSubClass(
			1 /*WSC_MAINPROC*/,
			mainCallback,
			0x4E /*WM_NOTIFY*/,
			0x416 /*AKDN_FRAME_ACTIVATE*/,
			0x418 /*AKDN_FRAME_DESTROY*/,
			//0x436 /*AKDN_OPENDOCUMENT_FINISH*/
			0x406 /*AKDN_MAIN_ONFINISH*/
		)
	) {
		if(
			isMDI != 1 /*WMD_MDI*/
			|| AkelPad.WindowSubClass(
				3 /*WSC_FRAMEPROC*/,
				mainCallback,
				0x4E /*WM_NOTIFY*/
			)
		) {
			AkelPad.ScriptNoMutex(5 /*ULT_UNLOCKSCRIPTSQUEUE|ULT_LOCKMULTICOPY*/); // Allow other scripts running
			AkelPad.WindowGetMessage(); // Message loop

			AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);
			AkelPad.WindowUnsubClass(3 /*WSC_FRAMEPROC*/);
		}
		else {
			AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);
			AkelPad.MessageBox(hMainWnd, "AkelPad.WindowSubClass(WSC_FRAMEPROC) failed!", WScript.ScriptName, 16 /*MB_ICONERROR*/);
		}
	}
	else {
		AkelPad.MessageBox(hMainWnd, "AkelPad.WindowSubClass(WSC_MAINPROC) failed!", WScript.ScriptName, 16 /*MB_ICONERROR*/);
	}
}

function mainCallback(hWnd, uMsg, wParam, lParam) {
	if(uMsg == 0x406 /*AKDN_MAIN_ONFINISH*/) {
		oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		return;
	}

	if(timer) // Already scheduled
		return;

	if(uMsg == 0x4E /*WM_NOTIFY*/) {
		var cmd = AkelPad.MemRead(lParam + 8, 3 /*DT_DWORD*/);
		switch(cmd) {
			case 0x804 /*AEN_HSCROLL*/:
			case 0x805 /*AEN_VSCROLL*/:
			case 0x81E /*AEN_SELCHANGED*/:
				uMsg = cmd;
			break;
			default: return;
		}
	}

	if(stopWait) {
		if(new Date().getTime() < stopWait)
			return;
		stopWait = 0;
	}
	if(!AkelPad.GetEditFile(0))
		return;

	var delay = new Date().getTime() - lastSave > minDelay ? smallDelay : minDelay;
	timer = setTimeout(saveSession, delay);
}
function saveSession() {
	if(!oSys.Call("user32::IsWindowEnabled", hMainWnd)) {
		timer = setTimeout(saveSession, minDelay);
		return;
	}
	timer = 0;
	lastSave = new Date().getTime();
	AkelPad.Call("Sessions::Main", 2, sessionName);
	//oSys.Call("user32::SetWindowText" + _TCHAR, hMainWnd, "Save: " + new Date().toLocaleString());
}
function setTimeout(f, d) {
	var window = new ActiveXObject("htmlfile").parentWindow;
	setTimeout = function(f, d) {
		try {
			return window.setTimeout(f, d);
		}
		catch(e) {
		}
		//oSys.Call("user32::SetWindowText" + _TCHAR, hMainWnd, "setTimeout() failed! " + new Date().toLocaleString());
		window = new ActiveXObject("htmlfile").parentWindow;
		return window.setTimeout(f, d);
	};
	return setTimeout(f, d);
}