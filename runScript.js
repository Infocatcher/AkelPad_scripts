// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11863#11863
// http://infocatcher.ucoz.net/js/akelpad_scripts/runScript.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/runScript.js

// (c) Infocatcher 2011, 2013-2014
// Version: 0.2.8 - 2014-08-16
// Author: Infocatcher

//===================
//// Run script from AkelFiles\Plugs\Scripts\ directory

// Hotkeys:
//   Enter                         - Ok
//   Ctrl+Enter (Shift+Enter), F3  - Exec
//   F4, Ctrl+E                    - Edit
//   F2, Ctrl+S                    - Rewrite options (and remove arguments for removed files)
//   F1, Shift+F1                  - Next/previous script
//   F5                            - Refresh scripts list
//   Escape                        - Cancel

// Arguments:
//   -saveOptions=0               - don't save options
//               =1               - save options only for runned scripts (default)
//               =2               - always save options
//   -savePosition=true           - allow store last window position
//   -saveSize=true               - allow store last window size
//   -selectOpenedScript=3        - select currently opened script in the list, sum of flags:
//                                  1 - select on startup, 2 - select on window focus
//   -script="someScript.js"      - select someScript.js in the list

// Usage:
//   Call("Scripts::Main", 1, "runScript.js")
//   Call("Scripts::Main", 1, "runScript.js", `-script="someScript.js" -saveOptions=0 -savePosition=false`)
//===================

function _localize(s) {
	var strings = {
		"&Arguments": {
			ru: "&Аргументы"
		},
		"OK": {
			ru: "ОК"
		},
		"Exec": {
			ru: "Запустить"
		},
		"Edit": {
			ru: "Изменить"
		},
		"Cancel": {
			ru: "Отмена"
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

var hMainWnd = AkelPad.GetMainWnd();
if(!hMainWnd)
	WScript.Quit();

var oSys = AkelPad.SystemFunction();
var oSet = AkelPad.ScriptSettings();
var fso = new ActiveXObject("Scripting.FileSystemObject");
var scriptsDir = AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/);
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

function getPrefName(scriptName) {
	return "/" + scriptName.replace(/=/g, "<equals>");
}

// Read arguments:
var selectScript = AkelPad.GetArgValue("selectOpenedScript", 3);
var scriptName   = AkelPad.GetArgValue("script", "") || selectScript & 1 && getCurScript();
var saveOptions  = AkelPad.GetArgValue("saveOptions", 1);
var savePosition = AkelPad.GetArgValue("savePosition", true);
var saveSize     = AkelPad.GetArgValue("saveSize", true);

selectScriptDialog();

function getCurScript() {
	var filePath = AkelPad.GetEditFile(0);
	if(isScript(filePath) && fso.GetParentFolderName(filePath).toLowerCase() == scriptsDir.toLowerCase())
		return fso.GetFileName(filePath);
	return "";
}
function isScript(path) {
	return /\.(js|vbs)$/i.test(path);
}
function expandArgs(args) {
	var wsh = new ActiveXObject("WScript.Shell");
	expandArgs = function(args) {
		var file = AkelPad.GetEditFile(0);
		return wsh.ExpandEnvironmentStrings(args)
			.replace(/%f/ig, file)
			.replace(/%d/ig, fso.GetParentFolderName(file))
			.replace(/%a/ig, AkelPad.GetAkelDir())
			.replace(/%([^%]|$)/g, "$1")
			.replace(/%%/g, "%");
	};
	return expandArgs(args);
}

function selectScriptDialog(modal) {
	var hInstanceDLL = AkelPad.GetInstanceDll();
	var dialogClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");

	var hWndDialog = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, dialogClass, 0);
	if(hWndDialog) {
		if(oSys.Call("user32::IsIconic", hWndDialog))
			oSys.Call("user32::ShowWindow", hWndDialog, 9 /*SW_RESTORE*/);
		AkelPad.SendMessage(hWndDialog, 7 /*WM_SETFOCUS*/, 0, 0);
		return;
	}

	if(
		!AkelPad.WindowRegisterClass(dialogClass)
		&& ( // Previous script instance crashed
			!AkelPad.WindowUnregisterClass(dialogClass)
			|| !AkelPad.WindowRegisterClass(dialogClass)
		)
	)
		return;

	var curName = scriptName || "";

	var dlgX, dlgY;
	var lastW, lastH;
	if((saveOptions || savePosition || saveSize) && oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/)) {
		if(saveOptions && !curName)
			curName = oSet.Read("lastScript", 3 /*PO_STRING*/, "");
		if(savePosition) {
			dlgX = oSet.Read("windowLeft", 1 /*PO_DWORD*/);
			dlgY = oSet.Read("windowTop",  1 /*PO_DWORD*/);
		}
		if(saveSize) {
			lastW = oSet.Read("windowWidth",  1 /*PO_DWORD*/);
			lastH = oSet.Read("windowHeight", 1 /*PO_DWORD*/);
		}
		oSet.End();
	}
	var _cleanup = {};
	function saveSettings(rewrite) {
		if(!saveOptions && !savePosition && !saveSize)
			return;
		if(!oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/ | (rewrite ? 0x4 /*POB_CLEAR*/ : 0)))
			return;
		if(saveOptions) {
			if(runned || saveOptions == 2)
				oSet.Write("lastScript", 3 /*PO_STRING*/, saveOptions == 2 ? curName : runnedName);
			var names = saveOptions == 2 ? argsObj : runned || {};
			for(var name in names)
				saveArgs(name, argsObj[name]);
			for(var name in _cleanup) {
				oSet.Delete("lastArgs-" + encodeURIComponent(name));
				!names[name] && saveArgs(name, _cleanup[name]);
			}
		}
		if((savePosition || saveSize) && !oSys.Call("user32::IsIconic", hWndDialog)) {
			var rcWnd = getWindowRect(hWndDialog);
			if(rcWnd) {
				if(savePosition) {
					oSet.Write("windowLeft", 1 /*PO_DWORD*/, rcWnd.left);
					oSet.Write("windowTop",  1 /*PO_DWORD*/, rcWnd.top);
				}
				if(saveSize) {
					oSet.Write("windowWidth",  1 /*PO_DWORD*/, Math.round((rcWnd.right - rcWnd.left)/scale.x(10000)*10000) - sizeNonClientX);
					oSet.Write("windowHeight", 1 /*PO_DWORD*/, Math.round((rcWnd.bottom - rcWnd.top)/scale.y(10000)*10000) - sizeNonClientY);
				}
			}
		}
		oSet.End();
	}
	function saveArgs(name, args) {
		var prefName = getPrefName(name);
		if(args)
			oSet.Write(prefName, 3 /*PO_STRING*/, args);
		else
			oSet.Delete(prefName);
	}

	var IDC_STATIC  = -1;
	var IDC_LISTBOX = 1000;
	var IDC_ARGS    = 1001;
	var IDC_OK      = 1002;
	var IDC_EXEC    = 1003;
	var IDC_EDIT    = 1004;
	var IDC_CANCEL  = 1005;

	var selfRun = false;
	var runned, runnedName;
	var argsObj = {};
	var startTime = new Date().getTime();

	var hWndListBox, hWndGroupArgs, hWndArgs;
	var hWndOK, hWndExec, hWndEdit, hWndCancel;

	var lbW = 260;
	var lbH = 320;

	var btnW = 82;
	var btnH = 23;
	var btnSep = 4;

	var gbH = 48;
	var gbW = lbW + 12 + btnW;

	var dlgW = 12 + lbW + 12 + btnW + 12;
	var dlgH = 12 + lbH + 12 + gbH + 12;

	var dlgMinW = dlgW - lbW + 120;
	var dlgMinH = 12 + btnH*4 + btnSep*3 + 12 + gbH + 12;

	if(lastW != undefined)
		lastW = Math.max(dlgMinW, lastW);
	if(lastH != undefined)
		lastH = Math.max(dlgMinH, lastH);

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 32 /*SM_CXSIZEFRAME*/) * 2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 33 /*SM_CYSIZEFRAME*/) * 2 + oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	// Create dialog
	hWndDialog = oSys.Call(
		"user32::CreateWindowEx" + _TCHAR,
		0,                                       //dwExStyle
		dialogClass,                             //lpClassName
		0,                                       //lpWindowName
		0x90CE0000,                              //WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX|WS_THICKFRAME
		scale.x(dlgX || 0),                      //x
		scale.y(dlgY || 0),                      //y
		scale.x(lastW || dlgW) + sizeNonClientX, //nWidth
		scale.y(lastH || dlgH) + sizeNonClientY, //nHeight
		hMainWnd,                                //hWndParent
		0,                                       //ID
		hInstanceDLL,                            //hInstance
		dialogCallback                           //Script function callback. To use it class must be registered by WindowRegisterClass.
	);
	if(!hWndDialog)
		return;

	function dialogCallback(hWnd, uMsg, wParam, lParam) {
		switch(uMsg) {
			case 1: //WM_CREATE
				dlgW = scale.x(dlgW) + sizeNonClientX;
				dlgH = scale.y(dlgH) + sizeNonClientY;
				dlgMinW = scale.x(dlgMinW) + sizeNonClientX;
				dlgMinH = scale.y(dlgMinH) + sizeNonClientY;

				var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);

				// Dialog caption
				oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, dialogTitle);

				//centerWindow(hWnd);
				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);

				hWndListBox = createWindowEx(
					0x204,        //WS_EX_CLIENTEDGE|WS_EX_NOPARENTNOTIFY
					"LISTBOX",    //lpClassName
					0,            //lpWindowName
					0x50210103,   //WS_VISIBLE|WS_CHILD|WS_VSCROLL|WS_TABSTOP|LBS_NOINTEGRALHEIGHT|LBS_SORT|LBS_NOTIFY
					12,           //x
					12,           //y
					lbW,          //nWidth
					lbH,          //nHeight
					hWnd,         //hWndParent
					IDC_LISTBOX,  //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFont(hWndListBox, hGuiFont);

				// GroupBox action
				hWndGroupArgs = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50000007,    //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,            //x
					12 + lbH + 12, //y
					gbW,           //nWidth
					gbH,           //nHeight
					hWnd,          //hWndParent
					IDC_STATIC,    //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndGroupArgs, hGuiFont, _localize("&Arguments"));

				// Edit: arguments
				hWndArgs = createWindowEx(
					0x200,              //WS_EX_CLIENTEDGE
					"EDIT",             //lpClassName
					0,                  //lpWindowName
					0x50010080,         //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL
					12 + 8,             //x
					12 + lbH + 12 + 18, //y
					gbW - 8*2,          //nWidth
					21,                 //nHeight
					hWnd,               //hWndParent
					IDC_ARGS,           //ID
					hInstanceDLL,       //hInstance
					0                   //lpParam
				);
				setWindowFont(hWndArgs, hGuiFont);
				setEditText(hWndArgs, "");

				// OK button window
				hWndOK = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50010001,    //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					12 + lbW + 12, //x
					12,            //y
					btnW,          //nWidth
					btnH,          //nHeight
					hWnd,          //hWndParent
					IDC_OK,        //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndOK, hGuiFont, _localize("OK"));

				// Exec button window
				hWndExec = createWindowEx(
					0,                  //dwExStyle
					"BUTTON",           //lpClassName
					0,                  //lpWindowName
					0x50010000,         //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					12 + lbW + 12,      //x
					12 + btnH + btnSep, //y
					btnW,               //nWidth
					btnH,               //nHeight
					hWnd,               //hWndParent
					IDC_EXEC,           //ID
					hInstanceDLL,       //hInstance
					0                   //lpParam
				);
				setWindowFontAndText(hWndExec, hGuiFont, _localize("Exec"));

				// Edit button window
				hWndEdit = createWindowEx(
					0,                      //dwExStyle
					"BUTTON",               //lpClassName
					0,                      //lpWindowName
					0x50010000,             //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					12 + lbW + 12,          //x
					12 + (btnH + btnSep)*2, //y
					btnW,                   //nWidth
					btnH,                   //nHeight
					hWnd,                   //hWndParent
					IDC_EDIT,               //ID
					hInstanceDLL,           //hInstance
					0                       //lpParam
				);
				setWindowFontAndText(hWndEdit, hGuiFont, _localize("Edit"));

				// Cancel button window
				hWndCancel = createWindowEx(
					0,                      //dwExStyle
					"BUTTON",               //lpClassName
					0,                      //lpWindowName
					0x50010000,             //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					12 + lbW + 12,          //x
					12 + (btnH + btnSep)*3, //y
					btnW,                   //nWidth
					btnH,                   //nHeight
					hWnd,                   //hWndParent
					IDC_CANCEL,             //ID
					hInstanceDLL,           //hInstance
					0                       //lpParam
				);
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));

				if(lastW != undefined || lastH != undefined)
					resizeDialog(hWnd, lastW || dlgW, lastH || dlgH);

				fillListBox(hWnd);
				updArgs();
			break;
			case 7: //WM_SETFOCUS
				var scriptName = selectScript & 2
					&& new Date().getTime() - startTime > 250 // Don't handle twice at startup
					&& getCurScript();
				if(scriptName) {
					var indx = getIndexFromString(scriptName);
					if(indx != undefined) {
						curName = scriptName;
						AkelPad.SendMessage(hWndListBox, 0x186 /*LB_SETCURSEL*/, indx, 0);
						AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_LISTBOX, 0);
					}
				}
				oSys.Call("user32::SetFocus", curName ? hWndArgs : hWndListBox);
			break;
			case 256: //WM_KEYDOWN
				var ctrl = oSys.Call("user32::GetAsyncKeyState", 162 /*VK_LCONTROL*/)
					|| oSys.Call("user32::GetAsyncKeyState", 163 /*VK_RCONTROL*/);
				var shift = oSys.Call("user32::GetAsyncKeyState", 160 /*VK_LSHIFT*/)
					|| oSys.Call("user32::GetAsyncKeyState", 161 /*VK_RSHIFT*/);
				//var alt = oSys.Call("user32::GetAsyncKeyState", 164 /*VK_LMENU*/)
				//	|| oSys.Call("user32::GetAsyncKeyState", 165 /*VK_RMENU*/);
				if(wParam == 27) //VK_ESCAPE
					postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
				else if(wParam == 13) { //VK_RETURN
					if(ctrl || shift) // Ctrl+Enter, Shift+Enter
						postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_EXEC, 0);
					else // Enter
						postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_OK, 0);
				}
				else if(wParam == 114 /*VK_F3*/) // F3
					postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_EXEC, 0);
				else if(wParam == 112 /*VK_F1*/)
					navigate(ctrl || shift);
				else if(wParam == 113 /*VK_F2*/ || ctrl && wParam == 83 /*S*/) { // F2, Ctrl+S
					var so = saveOptions;
					saveOptions = 2;
					saveSettings(true);
					saveOptions = so;
				}
				else if(wParam == 115 /*VK_F4*/ || ctrl && wParam == 69 /*E*/) // F4, Ctrl+E
					postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_EDIT, 0);
				else if(wParam == 116 /*VK_F5*/)
					redrawListbox();
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_OK:
					case IDC_EXEC:
						var isSelf = curName == WScript.ScriptName;
						selfRun = false;
						if(!curName || isSelf && idc == IDC_EXEC)
							break;
						if(!runned)
							runned = {};
						runned[runnedName = curName] = true;
						if(isSelf)
							selfRun = true;
						else
							AkelPad.Call("Scripts::Main", 1, curName, expandArgs(argsObj[curName] || ""));
						if(idc == IDC_OK)
							closeDialog();
						else
							ensureVisibility();
					break;
					case IDC_EDIT:
						curName && AkelPad.Call("Scripts::Main", 3, curName);
					break;
					case IDC_CANCEL:
						closeDialog();
					break;
					case IDC_ARGS:
						argsObj[curName] = windowText(hWndArgs).replace(/^\s+|\s+$/g, "");
					break;
					case IDC_LISTBOX:
						updArgs();
						if((wParam >> 16 & 0xFFFF) == 2 /*LBN_DBLCLK*/)
							postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_EXEC, 0);
				}
			break;
			case 36: //WM_GETMINMAXINFO
				AkelPad.MemCopy(_PtrAdd(lParam, 24), dlgMinW, 3 /*DT_DWORD*/); //ptMinTrackSize.x
				AkelPad.MemCopy(_PtrAdd(lParam, 28), dlgMinH, 3 /*DT_DWORD*/); //ptMinTrackSize.y
			break;
			case 5: //WM_SIZE
				if(oSys.Call("user32::IsIconic", hWnd))
					break;
				var rcWnd = getWindowRect(hWnd);
				var curW = rcWnd.right - rcWnd.left;
				var curH = rcWnd.bottom - rcWnd.top;
				resizeDialog(hWnd, curW, curH);
			break;
			case 15: //WM_PAINT
				// Based on code of SearchReplace.js script
				var ps;
				var hDC;
				var lpGrip;
				var rcGrip;
				if(ps = AkelPad.MemAlloc(_X64 ? 72 : 64 /*sizeof(PAINTSTRUCT)*/)) {
					if(hDC = oSys.Call("user32::BeginPaint", hWnd, ps)) {
						if(lpGrip = AkelPad.MemAlloc(16 /*sizeof(RECT)*/)) {
							if(oSys.Call("user32::GetClientRect", hWnd, lpGrip)) {
								rcGrip = parseRect(lpGrip);
								rcGrip.left = rcGrip.right  - oSys.Call("user32::GetSystemMetrics", 2 /*SM_CXVSCROLL*/);
								rcGrip.top  = rcGrip.bottom - oSys.Call("user32::GetSystemMetrics", 20 /*SM_CYVSCROLL*/);

								AkelPad.MemCopy(_PtrAdd(lpGrip,  0), rcGrip.left,   3 /*DT_DWORD*/);
								AkelPad.MemCopy(_PtrAdd(lpGrip,  4), rcGrip.top,    3 /*DT_DWORD*/);
								AkelPad.MemCopy(_PtrAdd(lpGrip,  8), rcGrip.right,  3 /*DT_DWORD*/);
								AkelPad.MemCopy(_PtrAdd(lpGrip, 12), rcGrip.bottom, 3 /*DT_DWORD*/);

								oSys.Call("user32::DrawFrameControl", hDC, lpGrip, 3 /*DFC_SCROLL*/, 0x8 /*DFCS_SCROLLSIZEGRIP*/);
							}
							AkelPad.MemFree(lpGrip);
						}
						oSys.Call("user32::EndPaint", hWnd, ps);
					}
					AkelPad.MemFree(ps);
				}
			break;
			case 16: //WM_CLOSE
				saveSettings();
				modal && enabled(hMainWnd, true); // Enable main window
				oSys.Call("user32::DestroyWindow", hWnd); // Destroy dialog
			break;
			case 2: //WM_DESTROY
				oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		}
		return 0;
	}

	function fillListBox(hWndDialog) {
		//var t = new Date().getTime();
		var files = [];
		// Foollowing is very slow (especially on slow devices like USB flash):
		//var filesEnum = new Enumerator(fso.GetFolder(scriptsDir).Files);
		//for(; !filesEnum.atEnd(); filesEnum.moveNext()) {
		//	var name = filesEnum.item().Name;
		//	if(isScript(name))
		//		files[files.length] = name;
		//}

		// Based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=12548#12548
		var lpFindData = AkelPad.MemAlloc(592 /*sizeof(WIN32_FIND_DATAW)*/);
		if(!lpFindData)
			return;
		var hSearch = oSys.Call("kernel32::FindFirstFile" + _TCHAR, scriptsDir + "\\*", lpFindData);
		if(!hSearch)
			return;
		do {
			var fName = AkelPad.MemRead(_PtrAdd(lpFindData, 44 /*offsetof(WIN32_FIND_DATAW, cFileName)*/), _TSTR);
			if(fName == "." || fName == "..")
				continue;
			var dwAttributes = AkelPad.MemRead(_PtrAdd(lpFindData, 0) /*offsetof(WIN32_FIND_DATAW, dwAttributes)*/, 3 /*DT_DWORD*/);
			if(dwAttributes & 0x10 /*FILE_ATTRIBUTE_DIRECTORY*/)
				continue;
			if(isScript(fName))
				files[files.length] = fName;
		}
		while(oSys.Call("kernel32::FindNextFile" + _TCHAR, hSearch, lpFindData));
		oSys.Call("kernel32::FindClose", hSearch);
		AkelPad.MemFree(lpFindData);
		//var dt = new Date().getTime() - t;
		//oSys.Call("user32::SetWindowText" + _TCHAR, hWndDialog, dialogTitle + " [" + dt + " ms]");
		//files.sort();

		var lpStr = AkelPad.MemAlloc(256*_TSIZE);
		if(!lpStr)
			return;

		var read = oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/);

		var indx = 0;
		for(var i = 0, l = files.length; i < l; ++i) {
			var name = files[i];

			if(read) {
				var args = oSet.Read(getPrefName(name), 3 /*PO_STRING*/);
				var oldArgs = oSet.Read("lastArgs-" + encodeURIComponent(name), 3 /*PO_STRING*/);
				if(oldArgs != undefined)
					_cleanup[name] = oldArgs;
				argsObj[name] = args || oldArgs || "";
			}

			AkelPad.MemCopy(lpStr, name.substr(0, 255), _TSTR);
			var pos = AkelPad.SendMessage(hWndListBox,  0x180 /*LB_ADDSTRING*/, 0, lpStr);
			if(pos < 0) {
				AkelPad.MessageBox(
					hWndDialog,
					"LB_ADDSTRING failed! Error: " + (({"-1": "LB_ERR", "-2": "LB_ERRSPACE"})[pos] || pos),
					dialogTitle,
					16 /*MB_ICONERROR*/
				);
				break;
			}
		}
		AkelPad.MemFree(lpStr);
		read && oSet.End();

		var indx = getIndexFromString(curName);
		if(indx != undefined)
			AkelPad.SendMessage(hWndListBox,  0x186 /*LB_SETCURSEL*/, indx, 0);
		else
			curName = "";
	}
	function redrawListbox() {
		for(var name in argsObj)
			delete argsObj[name];

		AkelPad.SendMessage(hWndDialog, 11 /*WM_SETREDRAW*/, false, 0);

		AkelPad.SendMessage(hWndListBox,  0x184 /*LB_RESETCONTENT*/, 0, 0);
		fillListBox(hWndDialog);

		AkelPad.SendMessage(hWndDialog, 11 /*WM_SETREDRAW*/, true, 0);
		oSys.Call("user32::InvalidateRect", hWndListBox, 0, true);

		updArgs();
	}
	function updArgs() {
		var str = getStringFromIndex(AkelPad.SendMessage(hWndListBox, 0x188 /*LB_GETCURSEL*/, 0, 0));
		if(!str) {
			enableControls({
				exec: false,
				edit: false,
				ok:   false
			});
			return;
		}
		curName = str;
		setEditText(hWndArgs, argsObj[str] || "");
		enableControls({
			exec: str != WScript.ScriptName,
			edit: true,
			ok:   true
		});
	}
	function enableControls(enable) {
		var hWndFocused = oSys.Call("user32::GetFocus");
		enabled(hWndExec, enable.exec);
		enabled(hWndEdit, enable.edit);
		enabled(hWndOK,   enable.ok);
		if(
			!enable.exec && hWndFocused == hWndExec
			|| !enable.edit && hWndFocused == hWndEdit
			|| !enable.ok && hWndFocused == hWndOK
		)
			oSys.Call("user32::SetFocus", hWndDialog);
	}
	function ensureVisibility() {
		var indx = AkelPad.SendMessage(hWndListBox, 0x188 /*LB_GETCURSEL*/, 0, 0);
		if(indx != -1)
			AkelPad.SendMessage(hWndListBox,  0x186 /*LB_SETCURSEL*/, indx, 0);
	}
	function navigate(up) {
		var i = AkelPad.SendMessage(hWndListBox,  0x188 /*LB_GETCURSEL*/, 0, 0);
		var max = AkelPad.SendMessage(hWndListBox,  0x18B /*LB_GETCOUNT*/, 0, 0) - 1;
		if(up) {
			if(--i < 0)
				i = max;
		}
		else {
			if(++i > max)
				i = 0;
		}
		AkelPad.SendMessage(hWndListBox,  0x186 /*LB_SETCURSEL*/, i, 0);
		postMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_LISTBOX, 0);
	}

	function restoreWindowPosition(hWnd, hWndParent) {
		if(dlgX == undefined || dlgY == undefined) {
			centerWindow(hWnd, hWndParent);
			return;
		}

		var rcWnd = getWindowRect(hWnd);
		if(!rcWnd)
			return;

		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		if(!lpRect)
			return;
		AkelPad.MemCopy(_PtrAdd(lpRect,  0), dlgX,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect,  4), dlgY,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect,  8), dlgX + (rcWnd.right - rcWnd.left), 3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect, 12), dlgY + (rcWnd.top - rcWnd.bottom), 3 /*DT_DWORD*/);
		var hMonitor = oSys.Call("user32::MonitorFromRect", lpRect, 0x2 /*MONITOR_DEFAULTTONEAREST*/);

		if(hMonitor) {
			//typedef struct tagMONITORINFO {
			//  DWORD cbSize;
			//  RECT  rcMonitor;
			//  RECT  rcWork;
			//  DWORD dwFlags;
			//} MONITORINFO, *LPMONITORINFO;
			var sizeofMonitorInfo = 4 + 16 + 16 + 4;
			var lpMi = AkelPad.MemAlloc(sizeofMonitorInfo);
			if(lpMi) {
				AkelPad.MemCopy(lpMi, sizeofMonitorInfo, 3 /*DT_DWORD*/);
				oSys.Call("user32::GetMonitorInfo" + _TCHAR, hMonitor, lpMi);
				var rcWork = parseRect(_PtrAdd(lpMi, 4 + 16));
				AkelPad.MemFree(lpMi);
			}
		}
		else { //?
			oSys.Call("user32::SystemParametersInfo" + _TCHAR, 48 /*SPI_GETWORKAREA*/, 0, lpRect, 0);
			var rcWork = parseRect(lpRect);
		}
		AkelPad.MemFree(lpRect);

		if(rcWork) {
			var edge = Math.max(
				16,
				oSys.Call("user32::GetSystemMetrics", 33 /*SM_CYSIZEFRAME*/)
					+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/)
			);

			var minX = rcWork.left - (rcWnd.right - rcWnd.left) + edge;
			var minY = rcWork.top;
			var maxX = rcWork.right - edge;
			var maxY = rcWork.bottom - edge;

			dlgX = Math.max(minX, Math.min(maxX, dlgX));
			dlgY = Math.max(minY, Math.min(maxY, dlgY));
		}

		moveWindow(hWnd, dlgX, dlgY);
	}
	function centerWindow(hWnd, hWndParent) {
		var rcWnd = getWindowRect(hWnd);
		var rcWndParent = getWindowRect(hWndParent || oSys.Call("user32::GetDesktopWindow"));
		if(!rcWndParent || !rcWnd)
			return;
		var x = rcWndParent.left + ((rcWndParent.right  - rcWndParent.left) / 2 - (rcWnd.right  - rcWnd.left) / 2);
		var y = rcWndParent.top  + ((rcWndParent.bottom - rcWndParent.top)  / 2 - (rcWnd.bottom - rcWnd.top)  / 2);
		moveWindow(hWnd, x, y);
	}
	function moveWindow(hWnd, x, y, hWndParent) {
		if(hWndParent) {
			var rcWnd = getWindowRect(hWnd, hWndParent);
			x += rcWnd.left;
			y += rcWnd.top;
		}
		oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
	}
	function resizeWindow(hWnd, dw, dh) {
		var rcWnd = getWindowRect(hWnd);
		var w = rcWnd.right - rcWnd.left + dw;
		var h = rcWnd.bottom - rcWnd.top + dh;
		oSys.Call("user32::SetWindowPos", hWnd, 0, 0, 0, w, h, 0x16 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOMOVE*/);
	}
	function resizeDialog(hWnd, curW, curH) {
		var dw = curW - dlgW;
		var dh = curH - dlgH;

		resizeWindow(hWndListBox, dw, dh);

		resizeWindow(hWndGroupArgs, dw, 0);
		resizeWindow(hWndArgs,      dw, 0);
		moveWindow(hWndGroupArgs, 0, dh, hWnd);
		moveWindow(hWndArgs,      0, dh, hWnd);

		moveWindow(hWndOK,     dw, 0, hWnd);
		moveWindow(hWndExec,   dw, 0, hWnd);
		moveWindow(hWndEdit,   dw, 0, hWnd);
		moveWindow(hWndCancel, dw, 0, hWnd);

		dlgW = curW;
		dlgH = curH;

		oSys.Call("user32::InvalidateRect", hWnd, 0, true);
	}
	function getWindowRect(hWnd, hWndParent) {
		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		if(!lpRect)
			return null;
		oSys.Call("user32::GetWindowRect", hWnd, lpRect);
		hWndParent && oSys.Call("user32::ScreenToClient", hWndParent, lpRect);
		var rcWnd = parseRect(lpRect);
		AkelPad.MemFree(lpRect);
		return rcWnd;
	}
	function parseRect(lpRect) {
		return {
			left:   AkelPad.MemRead(_PtrAdd(lpRect,  0), 3 /*DT_DWORD*/),
			top:    AkelPad.MemRead(_PtrAdd(lpRect,  4), 3 /*DT_DWORD*/),
			right:  AkelPad.MemRead(_PtrAdd(lpRect,  8), 3 /*DT_DWORD*/),
			bottom: AkelPad.MemRead(_PtrAdd(lpRect, 12), 3 /*DT_DWORD*/)
		};
	}

	function getStringFromIndex(i) {
		if(i == -1 || i == undefined)
			return "";
		var len = AkelPad.SendMessage(hWndListBox, 0x18A /*LB_GETTEXTLEN*/, i, 0);
		var lpString = AkelPad.MemAlloc((len + 1)*_TSIZE);
		if(!lpString)
			return "";
		AkelPad.SendMessage(hWndListBox, 0x189 /*LB_GETTEXT*/, i, lpString);
		var str = AkelPad.MemRead(lpString, _TSTR);
		AkelPad.MemFree(lpString);
		return str;
	}
	function getIndexFromString(str) {
		// Note: not case sensitive!
		return AkelPad.SendMessage(hWndListBox, 0x1A2 /*LB_FINDSTRINGEXACT*/, -1, str);
	}

	function windowText(hWnd, pText) {
		if(arguments.length > 1)
			return oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, pText);
		var len = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWnd);
		var lpText = AkelPad.MemAlloc((len + 1)*_TSIZE);
		if(!lpText)
			return "";
		oSys.Call("user32::GetWindowText" + _TCHAR, hWnd, lpText, len + 1);
		pText = AkelPad.MemRead(lpText, _TSTR);
		AkelPad.MemFree(lpText);
		return pText;
	}
	function setWindowFont(hWnd, hFont) {
		AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
	}
	function setWindowFontAndText(hWnd, hFont, pText) {
		setWindowFont(hWnd, hFont);
		windowText(hWnd, pText);
	}
	function setEditText(hWnd, pText, selectAll) {
		windowText(hWnd, pText);
		pText && AkelPad.SendMessage(hWnd, 177 /*EM_SETSEL*/, selectAll ? 0 : pText.length, -1);
	}
	function enabled(hWnd, val) {
		oSys.Call("user32::EnableWindow", hWnd, val);
	}
	function destroyWindow(hWnd) {
		oSys.Call("user32::DestroyWindow", hWnd);
	}
	function closeDialog() {
		postMessage(hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
	}
	function postMessage(hWnd, msg, wParam, lParam) {
		oSys.Call("user32::PostMessage" + _TCHAR, hWnd, msg, wParam, lParam);
	}
	function Scale(hDC, hWnd) {
		var hNewDC = hDC || oSys.Call("user32::GetDC", hWnd);
		if(hNewDC) {
			this._x = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 88 /*LOGPIXELSX*/);
			this._y = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 90 /*LOGPIXELSY*/);

			//Align to 16 pixel
			this._x += (16 - this._x % 16) % 16;
			this._y += (16 - this._y % 16) % 16;

			!hDC && oSys.Call("user32::ReleaseDC", hWnd, hNewDC);

			this.x = function(x) {
				return oSys.Call("kernel32::MulDiv", x, this._x, 96);
			};
			this.y = function(y) {
				return oSys.Call("kernel32::MulDiv", y, this._y, 96);
			};
		}
		else {
			this.x = this.y = function(n) {
				return n;
			};
		}
	}
	function createWindowEx(
		dwExStyle, lpClassName, lpWindowName, dwStyle,
		x, y, w, h,
		hWndParent, id, hInstance, callback
	) {
		return oSys.Call(
			"user32::CreateWindowEx" + _TCHAR,
			dwExStyle, lpClassName, lpWindowName, dwStyle,
			scale.x(x), scale.y(y),
			scale.x(w), scale.y(h),
			hWndParent, id, hInstance, callback || 0
		);
	}

	modal && enabled(hMainWnd, false); // Disable main window, to make dialog modal

	AkelPad.ScriptNoMutex(); // Allow other scripts running
	AkelPad.WindowGetMessage(); // Message loop

	AkelPad.WindowUnregisterClass(dialogClass);

	selfRun && AkelPad.Call("Scripts::Main", 1, WScript.ScriptName, expandArgs(argsObj[curName] || ""));
}