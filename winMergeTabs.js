// http://akelpad.sourceforge.net/forum/viewtopic.php?p=21354#21354
// http://infocatcher.ucoz.net/js/akelpad_scripts/winMergeTabs.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/winMergeTabs.js

// (c) Infocatcher 2013-2014
// Version: 0.1.2 - 2014-04-13
// Author: Infocatcher

//// Compare contents of current and next selected tab using WinMerge (http://winmerge.org/)
// or any other compare tool
// Required MDI or PMDI window mode and timer.js library!
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/Include/timer.js
// (or use -noBlink=true argument to work without timer.js)

// Arguments:
//   -path="%ProgramFiles%\WinMerge\WinMerge.exe" - path to compare tool executable:
//                                                  - %AkelDir% - path to AkelPad directory
//                                                  - %AkelScripts% - path to scripts directory
//                                                  - <HKLM\…\key> - value from registry
//                                                  - path1|path2|path3 - to specify many paths
//   -cmd="<exe> /S=C <f1> <f2>"                  - set custom command line (example for Total Commander)
//   -save=true                                   - save (already saved, but modified) file before compare
//        =false                                  - (default) use temporary files for modified files
//   -temp="%AkelScripts%\temp"                   - path to temporary directory (%temp% by default)
//   -useTabsOrder=true                           - always compare left tab with right tab
//   -noBlink=true                                - disable blink in status bar (and just show "Select tab!" text)
//   -item="%m:%i"                                - check toolbar button or menu item

// Usage:
//   Call("Scripts::Main", 1, "winMergeTabs.js")
//   Call("Scripts::Main", 1, "winMergeTabs.js", '-path="%COMMANDER_PATH%\TOTALCMD.EXE" -cmd="<exe> /S=C <f1> <f2>"')

function _localize(s) {
	var strings = {
		"No tabs!": {
			ru: "Отсутствуют вкладки!"
		},
		"MDI or PMDI window mode required!": {
			ru: "Требуется оконный режим MDI или PMDI!"
		},
		"WinMerge not found!": {
			ru: "Не удалось найти WinMerge!"
		},
		"Compare tool not found!": {
			ru: "Не удалось найти программу для сравнения!"
		},
		"Select tab!": {
			ru: "Выберите вкладку!"
		},
		"Not found file from first tab:\n": {
			ru: "Не найден файл из первой вкладки:\n"
		},
		"Not found file from second tab:\n": {
			ru: "Не найден файл из второй вкладки:\n"
		}
	};
	var lng = "en";
	switch(AkelPad.GetLangId(1 /*LANGID_PRIMARY*/)) {
		case 0x19: lng = "ru";
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	return _localize(s);
}

var hScript = AkelPad.ScriptHandle(WScript.ScriptName, 3 /*SH_FINDSCRIPT*/);
if(hScript) do {
	if(AkelPad.ScriptHandle(hScript, 13 /*SH_GETMESSAGELOOP*/)) {
		// Script is running, second call close it
		AkelPad.ScriptHandle(hScript, 33 /*SH_CLOSESCRIPT*/);
		WScript.Quit();
	}
}
while(hScript = AkelPad.ScriptHandle(hScript, 32 /*SH_NEXTSAMESCRIPT*/));

var paths = AkelPad.GetArgValue("path", "");
var cmdLineTemplate = AkelPad.GetArgValue("cmd", "<exe> <f1> <f2>");
var save = AkelPad.GetArgValue("save", false);
var tempDir = AkelPad.GetArgValue("temp", "%temp%");
var useTabsOrder = AkelPad.GetArgValue("useTabsOrder", false);

var winMergePaths = paths
	? paths.split("|")
	: [
		"<HKCU\\Software\\Thingamahoochie\\WinMerge\\Executable>",
		"<HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\WinMergeU.exe\\>",
		"<HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\WinMerge.exe\\>",
		"%ProgramFiles%\\WinMerge\\WinMergeU.exe",
		"%ProgramFiles (x86)%\\WinMerge\\WinMergeU.exe",
		"%AkelDir%\\..\\WinMergePortable\\WinMergePortable.exe",
		"%COMMANDER_PATH%\\..\\WinMergePortable\\WinMergePortable.exe"
	];

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var fso = new ActiveXObject("Scripting.FileSystemObject");
var wsh = new ActiveXObject("WScript.Shell");

if(
	hMainWnd
	&& AkelPad.IsMDI() // WMD_MDI or WMD_PMDI
) {
	var lpFrame = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
	var lpFrame2;
	if(!lpFrame) {
		AkelPad.MessageBox(hMainWnd, _localize("No tabs!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
		WScript.Quit();
	}

	var item = new Item();
	item.check(true);

	var statusbar = new Statusbar();
	statusbar.save();
	var statusMsg = _localize("Select tab!");
	statusbar.set(statusMsg);

	if(
		!AkelPad.GetArgValue("noBlink", false)
		&& AkelPad.Include("timer.js")
	) {
		var showDelay = 600;
		var hideDelay = 150;
		// show -> [showDelay] -> hide -> [hideDelay] -> show -> [showDelay] -> hide
		var timerHide = setTimeout(function() {
			statusbar.set("");
			clearTimeout(timerHide);
			timerHide = setInterval(function() {
				statusbar.set("");
			}, showDelay + hideDelay, timerHide);
		}, showDelay);
		var timerShow = setInterval(function() {
			statusbar.set(statusMsg);
		}, showDelay + hideDelay);
		var stopTimers = function() {
			clearInterval(timerHide);
			clearInterval(timerShow);
		};
	}

	if(
		AkelPad.WindowSubClass(
			1 /*WSC_MAINPROC*/,
			mainCallback,
			0x416 /*AKDN_FRAME_ACTIVATE*/,
			0x418 /*AKDN_FRAME_DESTROY*/
		)
	) {
		AkelPad.ScriptNoMutex(); // Allow other scripts running
		AkelPad.WindowGetMessage(); // Message loop
		AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);

		stopTimers && stopTimers();
		statusbar.restore();
		if(lpFrame2)
			compareTabs(lpFrame, lpFrame2);
	}
	else {
		stopTimers && stopTimers();
		statusbar && statusbar.restore();
		AkelPad.MessageBox(hMainWnd, "AkelPad.WindowSubClass() failed!", WScript.ScriptName, 16 /*MB_ICONERROR*/);
	}
	item.check(false);
}
else {
	AkelPad.MessageBox(hMainWnd, _localize("MDI or PMDI window mode required!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
}
function mainCallback(hWnd, uMsg, wParam, lParam) {
	if(uMsg == 0x416 /*AKDN_FRAME_ACTIVATE*/) {
		if(lParam != lpFrame) {
			lpFrame2 = lParam;
			oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		}
	}
	else if(uMsg == 0x418 /*AKDN_FRAME_DESTROY*/) {
		if(lParam == lpFrame)
			oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
	}
}

function compareTabs(lpFrame, lpFrame2) {
	var winMerge = getWinMerge();
	if(!winMerge) {
		AkelPad.MessageBox(
			hMainWnd,
			_localize(paths ? "Compare tool not found!" : "WinMerge not found!")
				+ "\n\n" + getWinMergePaths(),
			WScript.ScriptName,
			48 /*MB_ICONEXCLAMATION*/
		);
		return;
	}

	var file  = getFile(lpFrame);
	var file2 = getFile(lpFrame2);

	var noFile  = !fso.FileExists(file);
	var noFile2 = !fso.FileExists(file2);
	if(noFile || noFile2) {
		var errs = [];
		if(noFile)
			errs[errs.length] = _localize("Not found file from first tab:\n") + file;
		if(noFile2)
			errs[errs.length] = _localize("Not found file from second tab:\n") + file2;
		AkelPad.MessageBox(
			hMainWnd,
			errs.join("\n\n"),
			WScript.ScriptName,
			48 /*MB_ICONEXCLAMATION*/
		);
		if(!noFile && file.isTemp)
			fso.DeleteFile(file);
		if(!noFile2 && file2.isTemp)
			fso.DeleteFile(file2);
		return;
	}

	if(useTabsOrder) {
		var pos  = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrame);
		var pos2 = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrame2);
		if(pos2 < pos) {
			var tmp = file;
			file = file2;
			file2 = tmp;
		}
	}

	var cmdLine = cmdLineTemplate
		.replace("<exe>", '"' + winMerge + '"')
		.replace("<f1>", '"' + file + '"')
		.replace("<f2>", '"' + file2 + '"');
	var wm = wsh.Exec(cmdLine);
	if(file.isTemp || file2.isTemp) {
		// If WinMerge is already opened, new process will be closed immediately,
		// so don't delete files too early
		WScript.Sleep(4000);
		while(!wm.Status)
			WScript.Sleep(1500);
		file.isTemp  && fso.DeleteFile(file);
		file2.isTemp && fso.DeleteFile(file2);
	}
}
function getFile(lpFrame) {
	var hWndEdit = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 2 /*FI_WNDEDIT*/, lpFrame);
	var hDocEdit = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 3 /*FI_DOCEDIT*/, lpFrame);
	var origFile = AkelPad.GetEditFile(hWndEdit);
	var file = origFile;
	if(!origFile || AkelPad.SendMessage(hWndEdit, 3086 /*AEM_GETMODIFY*/, 0, 0)) {
		if(origFile && save)
			AkelPad.SaveFile(hWndEdit, origFile);
		else {
			var tempFile = file = getTempFile(hWndEdit, hDocEdit, origFile);
			var codePage = -1;
			var hasBOM = -1;
			if(!origFile) {
				// Will use UTF-8 with BOM to correctly save all (most?) new documents
				codePage = 65001;
				hasBOM = 1;
			}
			AkelPad.SaveFile(hWndEdit, tempFile, codePage, hasBOM, 0 /* W/o SD_UPDATE */);
		}
	}
	return file;
}
function getWinMerge() {
	for(var i = 0, l = winMergePaths.length; i < l; ++i) {
		var path = expandVariables(winMergePaths[i]);
		if(fso.FileExists(path))
			return path;
	}
	return "";
}
function getWinMergePaths() {
	var out = [];
	for(var i = 0, l = winMergePaths.length; i < l; ++i) {
		var rawPath = winMergePaths[i];
		var path = expandVariables(rawPath);
		out[out.length] = path == rawPath
			? path
			: rawPath + "\n=> " + path
	}
	return out.join("\n");
}
function getTempFile(hWndEdit, hDocEdit, file) {
	var fileName, fileExt;
	var tmp = file && /[^\/\\]+$/.test(file) && RegExp.lastMatch;
	if(tmp) {
		fileExt = /\.[^.]+$/.test(tmp) && RegExp.lastMatch || "";
		fileName = tmp.slice(0, -fileExt.length);
	}
	else {
		fileExt = getExtension(hWndEdit, hDocEdit);
		fileName = "AkelPad_winMergeTabs_temp";
	}
	var tmpDir = expandVariables(tempDir);
	if(!fso.FolderExists(tmpDir))
		fso.CreateFolder(tmpDir);
	var i = -1;
	do tmp = tmpDir + "\\" + fileName + (++i ? "-" + i : "") + fileExt;
	while(fso.FileExists(tmp) || fso.FolderExists(tmp));
	var out = new String(tmp);
	out.isTemp = true;
	return out;
}
function getExtension(hWndEdit, hDocEdit) {
	var alias = getCoderAlias(hWndEdit, hDocEdit);
	if(/\.[^.]+$/.test(alias))
		return RegExp.lastMatch;
	return ".txt";
}
function getCoderAlias(hWndEdit, hDocEdit) {
	if(
		!AkelPad.IsPluginRunning("Coder::HighLight")
		&& !AkelPad.IsPluginRunning("Coder::CodeFold")
		&& !AkelPad.IsPluginRunning("Coder::AutoComplete")
	)
		return "";
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=19363#19363
	//hWndEdit = hWndEdit || AkelPad.GetEditWnd();
	//hDocEdit = hDocEdit || AkelPad.GetEditDoc();
	var pAlias = "";
	if(hWndEdit && hDocEdit) {
		var lpAlias = AkelPad.MemAlloc(256 * 2 /*sizeof(wchar_t)*/);
		if(lpAlias) {
			AkelPad.CallW("Coder::Settings", 18 /*DLLA_CODER_GETALIAS*/, hWndEdit, hDocEdit, lpAlias, 0);
			pAlias = AkelPad.MemRead(lpAlias, 1 /*DT_UNICODE*/);
			AkelPad.MemFree(lpAlias);
		}
	}
	return pAlias;
}

function expandVariables(s) {
	return expandEnvironmentVariables(expandRegistryVariables(s));
}
function expandEnvironmentVariables(s) {
	if(s.substr(0, 9) == "%AkelDir%")
		s = AkelPad.GetAkelDir() + s.substr(9);
	if(s.substr(0, 13) == "%AkelScripts%")
		s = AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/) + s.substr(13);
	return wsh.ExpandEnvironmentStrings(s);
}
function expandRegistryVariables(s) { // <HKCU\Software\Foo\installPath>\foo.exe
	return s.replace(/<(.+?)>/g, function(s, path) {
		return getRegistryValue(path) || s;
	});
}
function getRegistryValue(path) {
	try {
		return wsh.RegRead(path);
	}
	catch(e) {
	}
	return "";
}

function Item() {
	this.check = function() {};
	// "%m:%i" (legacy: "menu:%m:%i" or "toolbar:%m:%i")
	var itemData = AkelPad.GetArgValue("item", "").split(":");
	if(itemData[0] == "menu" || itemData[0] == "toolbar") // Legacy
		itemData.shift();
	if(itemData.length != 2)
		return;
	var hHandle = +itemData[0];
	var nItemID = +itemData[1];
	if(!hHandle || !nItemID)
		return;
	this.check = function(checked) {
		if(oSys.Call("User32::IsMenu", hHandle)) {
			var cmd = checked ? 0x8 /*MF_BYCOMMAND|MF_CHECKED*/ : 0 /*MF_BYCOMMAND|MF_UNCHECKED*/;
			oSys.call("user32::CheckMenuItem", hHandle, nItemID, cmd);
		}
		else {
			AkelPad.SendMessage(hHandle, 1026 /*TB_CHECKBUTTON*/, nItemID, checked);
		}
	};
}
function Statusbar() {
	this.get = this.set = this.save = this.restore = function() {};

	// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=13656#13656
	var hWndStatus = oSys.Call("user32::GetDlgItem", hMainWnd, 10002 /*ID_STATUS*/);
	if(!hWndStatus || !oSys.Call("user32::IsWindowVisible", hWndStatus))
		return;
	var nParts = AkelPad.SendMessage(hWndStatus, 1030 /*SB_GETPARTS*/, 0, 0);
	if(nParts <= 5)
		return;
	var _origStatus, _customStatus;
	var _this = this;
	function buffer(callback) {
		var lpTextBuffer = AkelPad.MemAlloc(1024 * _TSIZE);
		if(lpTextBuffer) {
			var ret = callback.call(_this, lpTextBuffer);
			AkelPad.MemFree(lpTextBuffer);
			return ret;
		}
		return undefined;
	}
	this.get = function() {
		return buffer(function(lpTextBuffer) {
			AkelPad.SendMessage(hWndStatus, _TSTR ? 1037 /*SB_GETTEXTW*/ : 1026 /*SB_GETTEXTA*/, nParts - 1, lpTextBuffer);
			return AkelPad.MemRead(lpTextBuffer, _TSTR);
		});
	};
	this.set = function(pStatusText) {
		buffer(function(lpTextBuffer) {
			_customStatus = pStatusText;
			AkelPad.MemCopy(lpTextBuffer, pStatusText, _TSTR);
			AkelPad.SendMessage(hWndStatus, _TSTR ? 1035 /*SB_SETTEXTW*/ : 1025 /*SB_SETTEXTA*/, nParts - 1, lpTextBuffer);
		});
	};
	this.save = function() {
		_origStatus = this.get();
	};
	this.restore = function() {
		if(_origStatus != undefined && this.get() == _customStatus)
			this.set(_origStatus);
	};
}