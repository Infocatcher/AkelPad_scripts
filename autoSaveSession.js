// https://akelpad.sourceforge.net/forum/viewtopic.php?p=24561#p24561
// https://infocatcher.ucoz.net/js/akelpad_scripts/autoSaveSession.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/autoSaveSession.js

// (c) Infocatcher 2012-2024
// Version: 0.2.3pre2 - 2024-08-24
// Author: Infocatcher

//// Automatically saves current session after selection or scroll changes
// Required Sessions plugin!

// Arguments:
//   -startupDelay=1500      - (in ms) initial delay to ignore all changes just after startup
//   -minDelay=8000          - (in ms) minimum interval between two saves
//   -saveDelay=500          - (in ms) minimum delay between change and save
//   -session="OnExit"       - name of session file
//   -sessionBackup="OnExit" - name of session to backup before first write
//   -backupInterval=120     - also backup session file (see -session) each N minutes (only if something was changed)
//   -maxBackups=5           - max backups to preserve or 0 to disable backups (see -sessionBackup)
//   -maxIntervalBackups=5   - max backups to preserve or 0 to disable backups (see -backupInterval)
//                             will be stored in \Sessions\%SessionName%*_autobackup_%date%.session
//   -debug=true             - show debug messages in window title

// Usage:
// In AkelPad.ini or in registry (HKEY_CURRENT_USER\Software\Akelsoft\AkelPad)
//   CmdLineBegin=/Call("Scripts::Main", 1, "autoSaveSession.js")
//   CmdLineBegin=/Call("Scripts::Main", 1, "autoSaveSession.js", '-startupDelay=2000 -minDelay=12000 -session="AutoSave"')
// (see AkelHelp-Eng.htm#ch4/AkelHelp-Rus.htm#ch4 for manual settings)

// Known issues:
// Script will be unloaded, if window closing was canceled from usaved tab(s) prompt, see
// https://akelpad.sourceforge.net/forum/viewtopic.php?p=35042#p35042

var isMDI = AkelPad.IsMDI();
if(!isMDI) // Silently ignore SDI mode to allow use the same settings in any mode
	WScript.Quit();

var hMainWnd = AkelPad.GetMainWnd();
if(!hMainWnd)
	WScript.Quit();
var oSys = AkelPad.SystemFunction();

var startupDelay       = AkelPad.GetArgValue("startupDelay",       1500);
var minDelay           = AkelPad.GetArgValue("minDelay",           8000);
var saveDelay          = AkelPad.GetArgValue("saveDelay",          500);
var sessionName        = AkelPad.GetArgValue("session",            "OnExit");
var sessionBackup      = AkelPad.GetArgValue("sessionBackup",      "OnExit");
var backupInterval     = AkelPad.GetArgValue("backupInterval",     2*60)*60e3;
var maxBackups         = AkelPad.GetArgValue("maxBackups",         5);
var maxIntervalBackups = AkelPad.GetArgValue("maxIntervalBackups", 5);
var onTitle            = AkelPad.GetArgValue("onTitle",            "AkelPad");
var offTitle           = AkelPad.GetArgValue("offTitle",           "AkelPad !@");
var debug              = AkelPad.GetArgValue("debug",              false);

// Deprecated arguments:
var smallDelay = AkelPad.GetArgValue("smallDelay", undefined);
if(smallDelay != undefined && AkelPad.GetArgValue("saveDelay", undefined) == undefined)
	saveDelay = smallDelay;

var bakName = "autobackup"; // Note: will search for "*_%bakName%_*.session" files
var envKey = "__AkelPad:autoSaveSession.js";

var stopWait = now() + startupDelay;
var timer = 0;
var lastSave = 0;
var lastBackup = 0;

var lpTimerCallback = 0;
var nIDEvent;
var hWndTimer;
var lastError = "";
var backuped = {};
var tweakTitle = (onTitle || offTitle) && onTitle != offTitle;

debug && _log("start");

var hScript = AkelPad.ScriptHandle(WScript.ScriptName, 3 /*SH_FINDSCRIPT*/);
if(hScript && AkelPad.ScriptHandle(hScript, 13 /*SH_GETMESSAGELOOP*/)) {
	// Script is running, second call close it
	oSys.Call("kernel32::SetEnvironmentVariable" + _TCHAR, envKey, 0);
	tweakTitle && windowText(hMainWnd, offTitle);
	debug && _log("second call -> quit");
	AkelPad.ScriptHandle(hScript, 33 /*SH_CLOSESCRIPT*/);
	WScript.Quit();
}

var MAX_PATH = 0x104;
var lpBuffer = AkelPad.MemAlloc(MAX_PATH*_TSIZE);
if(!lpBuffer)
	WScript.Quit();

var akelDir = AkelPad.GetAkelDir();
var readEnv, newSize, envVal;
(readEnv = function(bufSize) {
	newSize = oSys.Call("kernel32::GetEnvironmentVariable" + _TCHAR, envKey, lpBuffer, bufSize);
	envVal = newSize && AkelPad.MemRead(lpBuffer, _TSTR);
})(MAX_PATH);
AkelPad.MemFree(lpBuffer);
if(
	newSize > MAX_PATH
	&& (lpBuffer = AkelPad.MemAlloc(newSize*_TSIZE))
) {
	readEnv(newSize);
	AkelPad.MemFree(lpBuffer);
}
if(envVal && envVal == akelDir) {
	tweakTitle && windowText(hMainWnd, offTitle);
	debug && _log("ignore second instance");
	WScript.Quit();
}
oSys.Call("kernel32::SetEnvironmentVariable" + _TCHAR, envKey, akelDir);
tweakTitle && windowText(hMainWnd, onTitle);

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
		if(sessionBackup != sessionName)
			backupSessionOnce();
		if(sessionBackup && maxBackups >= 0)
			cleanupBackups(sessionBackup, maxBackups);
		if((!sessionBackup || sessionBackup != sessionName) && maxIntervalBackups == 0)
			cleanupBackups(sessionName, maxIntervalBackups);
		oSys.Call("kernel32::SetEnvironmentVariable" + _TCHAR, envKey, 0);
	}
	else {
		AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);
		lastError = "AkelPad.WindowSubClass(WSC_FRAMEPROC) failed!";
	}
}
else {
	lastError = "AkelPad.WindowSubClass(WSC_MAINPROC) failed!";
}
lastError && _error(lastError);

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
			break;
			default: return;
		}
	}

	if(stopWait) {
		if(now() < stopWait)
			return;
		stopWait = 0;
	}
	if(!AkelPad.GetEditFile(0))
		return;

	var delay = now() - lastSave > minDelay ? saveDelay : minDelay;
	timer = saveSessionDelayed(delay);
}
function saveSession() {
	if(!oSys.Call("user32::IsWindowEnabled", hMainWnd)) {
		timer = saveSessionDelayed(minDelay);
		return;
	}
	timer = 0;
	lastSave = now();
	if(
		backupInterval > 0
		&& maxIntervalBackups > 0
		&& lastSave > lastBackup + backupInterval
	) {
		lastBackup = lastSave;
		backupSession(sessionName);
		cleanupBackups(sessionName, maxIntervalBackups);
	}
	if(sessionBackup == sessionName)
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
		lastError = "oSys.RegisterCallback() failed!\nScript was terminated.";
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
	if(!lpTimerCallback)
		return;
	oSys.Call("user32::KillTimer", hWndTimer, nIDEvent);
	oSys.UnregisterCallback(lpTimerCallback);
	lpTimerCallback = 0;
}
function sessionsDir() {
	var sd = (function() {
		var oSet = AkelPad.ScriptSettings();
		if(oSet.Begin("Sessions", 0x21 /*POB_READ|POB_PLUGS*/)) {
			var inAppData = oSet.Read("SaveSessions", 1 /*PO_DWORD*/) == 2;
			oSet.End();
		}
		if(inAppData) {
			var wsh = new ActiveXObject("WScript.Shell");
			return wsh.ExpandEnvironmentStrings("%AppData%\\AkelPad\\Sessions\\");
		}
		return AkelPad.GetAkelDir(4 /*ADTYPE_PLUGS*/) + "\\Sessions\\";
	})();
	sessionsDir = function() {
		return sd;
	};
	return sd;
}
function backupSessionOnce() {
	if(sessionBackup && maxBackups > 0 && !backuped[sessionBackup])
		backupSession(sessionBackup);
}
function backupSession(sessionName) {
	var fileBase = sessionsDir() + sessionName;
	var fileExt = ".session";

	var fileBak = fileBase + "_" + bakName + gts() + fileExt;

	var fso = backupSession._fso || (backupSession._fso = new ActiveXObject("Scripting.FileSystemObject"));
	try {
		fso.CopyFile(fileBase + fileExt, fileBak, true);
		backuped[sessionName] = true;
	}
	catch(e) {
		debug && _log("backup failed: " + (e.message || e) + " " + file);
	}
}
function gts() {
	var d = new Date();
	return "_" + d.getFullYear()   + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
	     + "_" + pad(d.getHours()) + "-" + pad(d.getMinutes())   + "-" + pad(d.getSeconds());
}
function pad(n) {
	return n > 9 ? "" + n : "0" + n;
}
function cleanupBackups(sessionName, maxBackups) {
	var files = [];
	var dir = sessionsDir();
	// Based on Instructor's code: https://akelpad.sourceforge.net/forum/viewtopic.php?p=12548#p12548
	var lpFindData = AkelPad.MemAlloc(592 /*sizeof(WIN32_FIND_DATAW)*/);
	if(!lpFindData)
		return;
	var hSearch = oSys.Call("kernel32::FindFirstFile" + _TCHAR, dir + sessionName + "_" + bakName + "_*.session", lpFindData)
		|| AkelPad.MemFree(lpFindData);
	if(!hSearch || hSearch == -1) {
		AkelPad.MemFree(lpFindData);
		return;
	}
	do {
		var fName = AkelPad.MemRead(_PtrAdd(lpFindData, 44 /*offsetof(WIN32_FIND_DATAW, cFileName)*/), _TSTR);
		if(fName == "." || fName == "..")
			continue;
		var dwAttributes = AkelPad.MemRead(_PtrAdd(lpFindData, 0) /*offsetof(WIN32_FIND_DATAW, dwAttributes)*/, 3 /*DT_DWORD*/);
		if(dwAttributes & 0x10 /*FILE_ATTRIBUTE_DIRECTORY*/)
			continue;
		files[files.length] = fName;
	}
	while(oSys.Call("kernel32::FindNextFile" + _TCHAR, hSearch, lpFindData));
	oSys.Call("kernel32::FindClose", hSearch);
	AkelPad.MemFree(lpFindData);
	files.sort();

	if(files.length <= maxBackups)
		return;
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var errs = 0;
	for(var i = files.length - maxBackups - 1; i >= 0; --i) {
		var path = dir + files[i];
		try {
			fso.DeleteFile(path);
		}
		catch(e) {
			++errs;
			lastError = path + ":\n" + (e.message || e);
		}
	}
	if(errs >= 10) {
		_error(
			"Failed to cleanup auto-backups, last error:\n" + lastError
			+ "\n\nPlease, check manually: " + dir + "*_" + bakName + "_*.session"
		);
	}
}
function now() {
	return new Date().getTime();
}
function windowText(hWnd, pText) {
	return oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, pText);
}
function _error(e) {
	AkelPad.MessageBox(hMainWnd, e, WScript.ScriptName, 16 /*MB_ICONERROR*/);
}
function _log(s) {
	windowText(hMainWnd, WScript.ScriptName + ": " + s);
}