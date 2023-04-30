﻿// http://akelpad.sourceforge.net/forum/viewtopic.php?p=24561#24561
// http://infocatcher.ucoz.net/js/akelpad_scripts/autoSaveSession.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/autoSaveSession.js

// (c) Infocatcher 2012-2014
// Version: 0.2.1 - 2014-04-22
// Author: Infocatcher

//// Automatically saves current session after selection or scroll changes
// Required Sessions plugin!

// Arguments:
//   -startupDelay=1500    - (in ms) ignore all changes just after startup
//   -minDelay=8000        - (in ms) minimum interval between two saves
//   -smallDelay=500       - (in ms) minimum daley between change and save
//   -session="OnExit"     - name of session file
//   -debug=true           - show debug messages in window title

// Usage:
//   CmdLineBegin=/Call("Scripts::Main", 1, "autoSaveSession.js")
//   CmdLineBegin=/Call("Scripts::Main", 1, "autoSaveSession.js", '-startupDelay=2000 -minDelay=12000 -session="OnExit"')
// (see AkelHelp*.htm for manual settings)

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
var debug = AkelPad.GetArgValue("debug", false);

var timer = 0;
var lastSave = 0;

var lpTimerCallback = 0;
var nIDEvent;
var hWndTimer;
var error = "";

debug && _log("start");

var hScript = AkelPad.ScriptHandle(WScript.ScriptName, 3 /*SH_FINDSCRIPT*/);
if(hScript && AkelPad.ScriptHandle(hScript, 13 /*SH_GETMESSAGELOOP*/)) {
	// Script is running, second call close it
	debug && _log("quit");
	AkelPad.ScriptHandle(hScript, 33 /*SH_CLOSESCRIPT*/);
	WScript.Quit();
}

if(hMainWnd) {
	if(
		AkelPad.WindowSubClass(
			1 /*WSC_MAINPROC*/,
			mainCallback,
			0x4E /*WM_NOTIFY*/,
			0x416 /*AKDN_FRAME_ACTIVATE*/,
			0x418 /*AKDN_FRAME_DESTROY*/
			//0x436 /*AKDN_OPENDOCUMENT_FINISH*/
			//0x406 /*AKDN_MAIN_ONFINISH*/
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
			AkelPad.ScriptNoMutex(); // Allow other scripts running
			AkelPad.WindowGetMessage(); // Message loop

			AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);
			AkelPad.WindowUnsubClass(3 /*WSC_FRAMEPROC*/);
			destroyTimer();
			error && AkelPad.MessageBox(hMainWnd, error, WScript.ScriptName, 16 /*MB_ICONERROR*/);
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
	//if(uMsg == 0x406 /*AKDN_MAIN_ONFINISH*/) {
	//	oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
	//	return;
	//}

	if(timer) // Already scheduled
		return;

	if(uMsg == 0x4E /*WM_NOTIFY*/) {
		var cmd = AkelPad.MemRead(_PtrAdd(lParam, 8), 3 /*DT_DWORD*/);
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
	timer = saveSessionDelayed(delay);
}
function saveSession() {
	if(!oSys.Call("user32::IsWindowEnabled", hMainWnd)) {
		timer = saveSessionDelayed(minDelay);
		return;
	}
	timer = 0;
	lastSave = new Date().getTime();
	backupSessionOnce();
	AkelPad.Call("Sessions::Main", 2, sessionName);
	debug && _log("saved at " + new Date().toLocaleString());
}
function saveSessionDelayed(delay) {
	try { // AkelPad 4.8.8+
		lpTimerCallback = oSys.RegisterCallback(saveSessionTimerProc);
	}
	catch(e) {
		lpTimerCallback = oSys.RegisterCallback("saveSessionTimerProc");
	}
	if(!lpTimerCallback) {
		error = "oSys.RegisterCallback() failed!\nScript was terminated.";
		oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		return 0;
	}
	nIDEvent = AkelPad.SendMessage(hMainWnd, 1319 /*AKD_UNIQUEID*/, 0, 0) || 10;
	hWndTimer = AkelPad.ScriptHandle(0, 17 /*SH_GETSERVICEWINDOW*/) || hMainWnd;
	saveSessionDelayed = function(delay) {
		return oSys.Call("user32::SetTimer", hWndTimer, nIDEvent, delay, lpTimerCallback);
	};
	return saveSessionDelayed(delay);
}
function saveSessionTimerProc(hWnd, uMsg, nIDEvent, dwTime) {
	oSys.Call("user32::KillTimer", hWndTimer, nIDEvent);
	saveSession();
}
function destroyTimer() {
	if(lpTimerCallback) {
		oSys.Call("user32::KillTimer", hWndTimer, nIDEvent);
		oSys.UnregisterCallback(lpTimerCallback);
		lpTimerCallback = 0;
	}
}
function sessionsDir() {
	var sd = AkelPad.GetAkelDir(4 /*ADTYPE_PLUGS*/) + "\\Sessions\\";
	sessionsDir = function() {
		return sd;
	};
	return sd;
}
function backupSessionOnce() {
	backupSessionOnce = function() {};

	var fileBase = sessionsDir() + "OnExit";
	var fileExt = ".session";

	var fileBak = fileBase + "_autobackup_" + new Date().getTime() + fileExt;

	var fso = new ActiveXObject("Scripting.FileSystemObject");
	try {
		fso.CopyFile(fileBase + fileExt, fileBak, true);
	}
	catch(e) {
		debug && _log("backup failed: " + (e.message || e) + " " + file);
	}
}
function _log(s) {
	oSys.Call("user32::SetWindowText" + _TCHAR, hMainWnd, WScript.ScriptName + ": " + s);
}