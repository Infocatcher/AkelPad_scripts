// https://akelpad.sourceforge.net/forum/viewtopic.php?p=18433#p18433
// https://infocatcher.ucoz.net/js/akelpad_scripts/restart.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/restart.js

// (c) Infocatcher 2012-2014
// Version: 0.1.1+ - 2014-03-29
// Author: Infocatcher

//// Restart AkelPad

// Dependencies:
//   Sessions plugin
//   NirCmd utility - http://www.nirsoft.net/utils/nircmd.html

// Arguments:
//   -nirCmd="path\to\nircmd.exe" - you can use environment variables like %ProgramFiles%
//   -session="OnExit"            - name of autosaved session in Sessions plugin
//   -sessionAutoSave=false       - checked state of "save on exit" in Sessions plugin settings
//   -sessionAutoLoad=false       - checked state of "open on start" in Sessions plugin settings

// Usage:
//   Call("Scripts::Main", 1, "restart.js")
//   Call("Scripts::Main", 1, "restart.js", '-nirCmd="%a\..\NirCmd\nircmd.exe" -session="OnExit"')

var oSys = AkelPad.SystemFunction();
var akelDir = AkelPad.GetAkelDir();
var nirCmdPath = AkelPad.GetArgValue("nirCmd", "%a\\AkelFiles\\Utils\\nircmd.exe");
var nirCmd = expandEnvironmentVariables(nirCmdPath);
if(oSys.Call("kernel32::GetFileAttributes" + _TCHAR, nirCmd) == -1) {
	error(
		"NirCmd utility not found!\nYou can download it here: http://www.nirsoft.net/utils/nircmd.html\n\n"
		+ (nirCmd == nirCmdPath ? nirCmd : nirCmdPath + "\n=> " + nirCmd)
	);
	WScript.Quit();
}
var session = AkelPad.GetArgValue("session", "OnExit");
var sessionAutoSave = AkelPad.GetArgValue("sessionAutoSave", false);
var sessionAutoLoad = AkelPad.GetArgValue("sessionAutoLoad", false);
var pid = oSys.Call("kernel32::GetCurrentProcessId");

// Get real AkelPad executable
var MAX_PATH = 0x104;
var lpBuffer = AkelPad.MemAlloc(MAX_PATH*_TSIZE);
if(lpBuffer) {
	if(oSys.Call("kernel32::GetModuleFileName" + _TCHAR, null, lpBuffer, MAX_PATH))
		var akelExe = AkelPad.MemRead(lpBuffer, _TSTR);
	else
		failed("GetModuleFileName");
	AkelPad.MemFree(lpBuffer);
}
if(!akelExe)
	akelExe = akelDir + "\\AkelPad.exe";

// Get current directory
var nBufferLength = oSys.Call("kernel32::GetCurrentDirectory" + _TCHAR, 0, 0);
if(nBufferLength) {
	var lpBuffer = AkelPad.MemAlloc(nBufferLength*_TSIZE);
	if(lpBuffer) {
		if(oSys.Call("kernel32::GetCurrentDirectory" + _TCHAR, nBufferLength, lpBuffer))
			var curDir = AkelPad.MemRead(lpBuffer, _TSTR);
		else
			failed("GetCurrentDirectory");
		AkelPad.MemFree(lpBuffer);
	}
}
if(!curDir)
	curDir = akelDir;

if(!sessionAutoSave || !AkelPad.IsPluginRunning("Sessions::Main"))
	AkelPad.Call("Sessions::Main", 2, session);

AkelPad.Exec('"%nirCmd%" killprocess "%nirCmd%"'.replace(/%nirCmd%/g, nirCmd)); //~ todo: check process command line

var cmd = '"%nirCmd%" waitprocess /%pid% exec2 show "%workDir%" "%akelExe%"';
if(!sessionAutoLoad)
	cmd += ' /Call("Sessions::Main", 1, "%session%")';
cmd = cmd
	.replace(/%nirCmd%/g, nirCmd)
	.replace(/%pid%/g, pid)
	.replace(/%workDir%/g, curDir)
	.replace(/%akelExe%/g, akelExe)
	.replace(/%session%/g, session);
oSys.Call("kernel32::SetEnvironmentVariable" + _TCHAR, "__AkelPad:autoSaveSession.js", "");
AkelPad.Exec(cmd, akelDir);
AkelPad.Command(4109); // Exit

function expandEnvironmentVariables(s) {
	if(/^%a[\\\/]/.test(s))
		s = akelDir + s.substr(2);
	if(s.indexOf("%") == -1)
		return s;
	return new ActiveXObject("WScript.Shell").ExpandEnvironmentStrings(s);
}
function error(s) {
	AkelPad.MessageBox(
		AkelPad.GetMainWnd(),
		s,
		WScript.ScriptName,
		16 /*MB_ICONERROR*/
	);
}
function failed(func) {
	error(func + "() failed!\nError: " + oSys.Call("kernel32::GetLastError"));
}