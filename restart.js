// http://akelpad.sourceforge.net/forum/viewtopic.php?p=18433#18433
// http://infocatcher.ucoz.net/js/akelpad_scripts/restart.js

// (c) Infocatcher 2012
// version 0.1.0 - 2012-06-13

// Restart AkelPad

// Dependencies:
//   Sessions plugin
//   NirCmd utility - http://www.nirsoft.net/utils/nircmd.html

// Arguments:
//   -nirCmd="path\to\nircmd.exe" - you can use environment variables like %ProgramFiles%
//   -session="OnExit"            - name of autosaved session in Sessions plugin
//   -sessionAutoSave=false       - should be false if "save on exit" in Sessions plugin are unchecked
//   -sessionAutoLoad=false       - should be false if "open on start" in Sessions plugin are unchecked

// Usage:
//   Call("Scripts::Main", 1, "restart.js")
//   Call("Scripts::Main", 1, "restart.js", '-nirCmd="%a\..\NirCmd\nircmd.exe" -session="OnExit"')

var oSys = AkelPad.SystemFunction();
var akelDir = AkelPad.GetAkelDir();
var nirCmd = expandEnvironmentVariables(AkelPad.GetArgValue("nirCmd", akelDir + "\\AkelFiles\\Utils\\nircmd.exe"));
if(!new ActiveXObject("Scripting.FileSystemObject").FileExists(nirCmd)) {
	error("NirCmd utility not found!\n" + nirCmd);
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
AkelPad.Command(4109); // Exit
AkelPad.Exec(cmd, akelDir);

function expandEnvironmentVariables(s) {
	if(/^%a[\\\/]/.test(s))
		s = akelDir + s.substr(2);
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