// http://akelpad.sourceforge.net/forum/viewtopic.php?p=21354#21354
// http://infocatcher.ucoz.net/js/akelpad_scripts/winMergeTabs.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/winMergeTabs.js

// (c) Infocatcher 2013
// version 0.1.1.1 - 2013-08-07

// Compare contents of current and next selected tab using WinMerge (http://winmerge.org/)
// or any other compare tool

// Arguments:
//   -path="%ProgramFiles%\WinMerge\WinMerge.exe" - path to WinMerge executable
//                                                  (or many paths: "path1|path2|path3")
//   -cmd="<exe> /S=C <f1> <f2>"                  - set custom command line for any other compare tool
//                                                  (an example for Total Commander)
//   -save=true                                   - true  - save (already saved, but modified) file before compare
//                                                  false - use temporary files for modified files
//   -temp="%AkelScripts%\temp"                   - path to temporary directory
//   -useTabsOrder=true                           - always compare left tab with right tab

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
	var lng;
	switch(AkelPad.GetLangId(1 /*LANGID_PRIMARY*/)) {
		case 0x19: lng = "ru"; break;
		default:   lng = "en";
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	return _localize(s);
}

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

	if(lpFrame) {
		var statusbar = new Statusbar();
		statusbar.save();
		var statusMsg = _localize("Select tab!");
		statusbar.set(statusMsg);

		var showDelay = 600;
		var hideDelay = 150;
		try {
			var window = new ActiveXObject("htmlfile").parentWindow;
			var shown = true;
			var timer = window.setTimeout(function blink() {
				statusbar.set(shown ? "" : statusMsg);
				timer = window.setTimeout(blink, (shown = !shown) ? showDelay : hideDelay);
			}, showDelay);
		}
		catch(e) {
		}
	}

	if(
		lpFrame
		&& AkelPad.WindowSubClass(
			hMainWnd,
			mainCallback,
			0x416 /*AKDN_FRAME_ACTIVATE*/,
			0x418 /*AKDN_FRAME_DESTROY*/
		)
	) {
		AkelPad.ScriptNoMutex(5 /*ULT_UNLOCKSCRIPTSQUEUE|ULT_LOCKMULTICOPY*/); // Allow other scripts running
		AkelPad.WindowGetMessage(); // Message loop
		AkelPad.WindowUnsubClass(hMainWnd);

		AkelPad.ScriptNoMutex(8 /*ULT_UNLOCKMULTICOPY*/);
		timer && window.clearTimeout(timer);
		statusbar.restore();
		if(lpFrame2)
			compareTabs(lpFrame, lpFrame2);
	}
	else {
		timer && window.clearTimeout(timer);
		statusbar && statusbar.restore();
		AkelPad.MessageBox(hMainWnd, _localize("No tabs!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
	}
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
			_localize("WinMerge not found!") + "\n\n" + getWinMergePaths(),
			WScript.ScriptName,
			48 /*MB_ICONEXCLAMATION*/
		);
		return;
	}

	setRedraw(hMainWnd, false);

	var file  = getFile(lpFrame);
	var file2 = getFile(lpFrame2);

	AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame2);
	setRedraw(hMainWnd, true);
	// Force redraw current edit window
	oSys.Call("user32::InvalidateRect", AkelPad.GetEditWnd(), 0, true);

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
		// If WinMerge are already opened, new process will be immediately closed,
		// so don't delete files too early
		WScript.Sleep(4000);
		for(;;) {
			if(wm.Status != 0) {
				if(file.isTemp)
					fso.DeleteFile(file);
				if(file2.isTemp)
					fso.DeleteFile(file2);
				break;
			}
			WScript.Sleep(1500);
		}
	}
}
function getFile(lpFrame) {
	AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame);
	var hWndEdit = AkelPad.GetEditWnd();
	var origFile = AkelPad.GetEditFile(hWndEdit);
	var file = origFile;
	if(!origFile || AkelPad.SendMessage(hWndEdit, 3086 /*AEM_GETMODIFY*/, 0, 0)) {
		if(origFile && save)
			AkelPad.Command(4105); // IDM_FILE_SAVE
		else {
			var tempFile = file = getTempFile(hWndEdit, origFile);
			if(origFile) {
				var codePage = AkelPad.GetEditCodePage(hWndEdit);
				var hasBOM = AkelPad.GetEditBOM(hWndEdit);
			}
			else {
				// Will use UTF-8 with BOM to correctly save all (most?) new documents
				var codePage = 65001;
				var hasBOM = 1;
			}
			var text = AkelPad.GetTextRange(0, -1);

			AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
			AkelPad.SetSel(0, -1);
			AkelPad.ReplaceSel(text);
			var err = AkelPad.SaveFile(AkelPad.GetEditWnd(), tempFile, codePage, hasBOM);
			if(err) // Allow silently close tab
				AkelPad.SendMessage(AkelPad.GetEditWnd(), 3087 /*AEM_SETMODIFY*/, 0, 0);
			AkelPad.Command(4318 /*IDM_WINDOW_FRAMECLOSE*/);
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
			: rawPath + " => " + path
	}
	return out.join("\n");
}
function getTempFile(hWndEdit, file) {
	var fileName, fileExt;
	var tmp = file && /[^\/\\]+$/.test(file) && RegExp.lastMatch;
	if(tmp) {
		fileExt = /\.[^.]+$/.test(tmp) && RegExp.lastMatch || "";
		fileName = tmp.slice(0, -fileExt.length);
	}
	else {
		fileExt = getCurrentExtension();
		fileName = "akelpad-temp";
	}
	var tmpDir = expandVariables(tempDir);
	if(!fso.FolderExists(tmpDir))
		fso.CreateFolder(tmpDir);
	var i = -1;
	do tmp = tmpDir + "\\" + fileName + (++i ? "-" + i : "") + fileExt;
	while(fso.FileExists(tmp));
	var out = new String(tmp);
	out.isTemp = true;
	return out;
}
function getCurrentExtension() {
	var alias = getCoderAlias();
	if(/\.[^.]+$/.test(alias))
		return RegExp.lastMatch;
	return ".txt";
}
function getCoderAlias() {
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=19363#19363
	var hWndEdit = AkelPad.GetEditWnd();
	var hDocEdit = AkelPad.GetEditDoc();
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
		var val = getRegistryValue(path);
		if(val)
			return val;
		return s;
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

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
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