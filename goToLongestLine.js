// http://akelpad.sourceforge.net/forum/viewtopic.php?p=10403#10403
// http://infocatcher.ucoz.net/js/akelpad_scripts/goToLongestLine.js

// (c) Infocatcher 2010-2011
// version 0.3.9 - 2011-12-20

//===================
// Go to longest line below or above current
// Hotkeys in dialog:
//   PageUp/PageDown            - go to longest line below/above current
//   Ctrl+PageUp/Ctrl+PageDown  - go to start/end of document

// Arguments:
//   -dialog=true        - show dialog
//   -reverse=false      - inverse direction (only without dialog)
//   -timeLimit=400      - time limit (in milliseconds) for very big files
//   -close=true         - force check "close dialog"
//   -focus=true         - force check "focus editor"
//   -autoGo=true        - automatically go to longest line after run with -dialog=true
//   -saveOptions=0      - don't store options
//               =1      - save options after them usage
//               =2      - save options on exit
//   -savePosition=true  - allow store last window position

// Usage:
//   Call("Scripts::Main", 1, "goToLongestLine.js")
//   Call("Scripts::Main", 1, "goToLongestLine.js", "-dialog=false -reverse=false")
//   Call("Scripts::Main", 1, "goToLongestLine.js", "-dialog=true -close=true -saveOptions=0 -savePosition=false")
//===================

function _localize(s) {
	var strings = {
		"&Close dialog": {
			ru: "&Закрывать диалог"
		},
		"&Focus editor": {
			ru: "Переводить &фокус на редактор"
		},
		"&Time limit:": {
			ru: "&Ограничение по времени:"
		},
		"ms": {
			ru: "мс"
		},
		"Are you sure to disable time limit?": {
			ru: "Вы уверены, что хотите отключить ограничение по времени?"
		},
		"Time limit is too big (%S min)!\nContinue anyway?": {
			ru: "Ограничение по времени слишком велико (%S мин)\nВсе равно продолжить?"
		},
		"&Line:": {
			ru: "&Строка:"
		},
		"L&ength:": {
			ru: "&Длина:"
		},
		"&Processed:": {
			ru: "&Обработано:"
		},
		"&Down": {
			ru: "В&низ"
		},
		"&Up": {
			ru: "В&верх"
		},
		"Cancel": {
			ru: "Отмена"
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


// Read arguments:
// getArg(argName, defaultValue), getArgOrPref(argAndPrefName, type, defaultValue)
var saveOptions  = getArg("saveOptions", 1);
var savePosition = getArg("savePosition", true);

if(saveOptions || savePosition)
	var prefs = new Prefs();

var dialog       = getArg("dialog", true);
var reverse      = getArg("reverse", false);
var autoGo       = getArg("autoGo", false);
var checkClose   = getArgOrPref("close",     prefs && prefs.DWORD);
var checkFocus   = getArgOrPref("focus",     prefs && prefs.DWORD);
var timeLimit    = getArgOrPref("timeLimit", prefs && prefs.DWORD, 400);

prefs && prefs.end();


var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

Number.prototype._origToFixed = Number.prototype.toFixed;
Number.prototype.toFixed = function(r) {
	if(r >= 0 && this._origToFixed)
		return this._origToFixed(r);
	var n = this;
	var d = Math.pow(10, r);
	n = (Math.round(n*d)/d).toString();
	if(r <= 0)
		return n;
	if(!/\./.test(n))
		n += ".";
	var count = n.match(/\.(.*)$/)[1].length;
	n += new Array(r - count + 1).join("0");
	return n;
};

if(hMainWnd) {
	if(dialog)
		goToLongestLineDialog();
	else
		goToLongestLine(reverse);
}

function goToLongestLine(reverse) {
	var hWndEdit = AkelPad.GetEditWnd();

	var ww = AkelPad.SendMessage(hWndEdit, 3241 /*AEM_GETWORDWRAP*/, 0, 0);
	if(ww) {
		setRedraw(hWndEdit, false);
		AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);
	}

	var longestLine;
	var longestLineLength = -1;
	var line, lineStart, lineLength, lineEnd;
	var indx;
	var linesCount = AkelPad.SendMessage(hWndEdit, 3129 /*AEM_GETLINENUMBER*/, 0 /*AEGL_LINECOUNT*/, 0);
	var count;
	var ss = AkelPad.GetSelStart();
	line = AkelPad.SendMessage(hWndEdit, 1078 /*EM_EXLINEFROMCHAR*/, 0, ss);
	if(reverse) {
		lineStart  = AkelPad.SendMessage(hWndEdit, 187 /*EM_LINEINDEX*/,  line, 0);
		indx       = lineStart - 1;

		count = line;
	}
	else {
		lineStart  = AkelPad.SendMessage(hWndEdit, 187 /*EM_LINEINDEX*/,  line, 0);
		lineLength = AkelPad.SendMessage(hWndEdit, 193 /*EM_LINELENGTH*/, ss, 0);
		lineEnd    = lineStart + lineLength;
		indx       = lineEnd + 1;

		count = linesCount - line - 1;
	}

	if(timeLimit)
		var stopTime = new Date().getTime() + timeLimit;
	var lines = 0;
	var tabStop = AkelPad.SendMessage(AkelPad.GetEditWnd(), 3239 /*AEM_GETTABSTOP*/, 0, 0) || 8;
	for(;;) {
		if(reverse) {
			if(--line == -1)
				break;
			lineStart  = AkelPad.SendMessage(hWndEdit, 187 /*EM_LINEINDEX*/,  line, 0);
			lineEnd    = indx;
			lineLength = lineEnd - lineStart;
		}
		else {
			if(++line == linesCount)
				break;
			lineStart  = indx;
			lineLength = AkelPad.SendMessage(hWndEdit, 193 /*EM_LINELENGTH*/, indx, 0);
			lineEnd    = lineStart + lineLength;
		}
		lines++;

		var lineText = AkelPad.GetTextRange(lineStart, lineEnd);
		if(lineText.indexOf("\t") != -1) {
			for(var i = 0, column = 0, ll = lineLength; i < ll; i++, column++) {
				if(lineText.charAt(i) != "\t")
					continue;
				var tabWidth = tabStop - column % tabStop;
				if(tabWidth <= 1)
					continue;
				var dw = tabWidth - 1;
				lineLength += dw;
				column     += dw;
			}
		}

		if(lineLength > longestLineLength) {
			longestLineLength = lineLength;
			longestLine = line;
		}
		if(timeLimit && new Date().getTime() > stopTime)
			break;
		indx = reverse
			? lineStart - 1
			: lineEnd   + 1;
	}

	if(ww) {
		AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);
		setRedraw(hWndEdit, true);
	}

	if(longestLine != undefined) {
		var gotoStr = (longestLine + 1) + ":" + (longestLineLength + 1);
		AkelPad.SendMessage(hMainWnd, 1206 /*AKD_GOTOW*/, 0x1 /*GT_LINE*/, AkelPad.MemStrPtr(gotoStr));
	}
	return {
		line:        (longestLine == undefined ? line : longestLine) + 1,
		lineLength:  longestLineLength,
		linesCount:  linesCount,
		processed:   lines,
		targetCount: lines ? count : 0
	};
}

function goToLongestLineDialog(modal) {
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

	var disabled = false;
	var disabledTimeout = 150;

	var IDC_STATIC     = -1;
	var IDC_FOCUS      = 1001;
	var IDC_CLOSE      = 1002;
	var IDC_TIME_LIMIT = 1003;
	var IDC_LINE       = 1004;
	var IDC_LENGTH     = 1005;
	var IDC_PROCESSED  = 1006;
	var IDC_UP         = 1007;
	var IDC_DOWN       = 1008;
	var IDC_CANCEL     = 1009;

	var hWndFocus, hWndClose;
	var hWndStatic, hWndTimeLimit, hWndLine, hWndLength, hWndProcessed;
	var hWndDown, hWndUp, hWndCancel;

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 7 /*SM_CXFIXEDFRAME*/) * 2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/) * 2 + oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	// Create dialog
	hWndDialog = oSys.Call(
		"user32::CreateWindowEx" + _TCHAR,
		0,                             //dwExStyle
		dialogClass,                   //lpClassName
		0,                             //lpWindowName
		0x90CA0000,                    //WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX
		scale.x(0),                    //x
		scale.y(0),                    //y
		scale.x(286) + sizeNonClientX, //nWidth
		scale.y(193) + sizeNonClientY, //nHeight
		hMainWnd,                      //hWndParent
		0,                             //ID
		hInstanceDLL,                  //hInstance
		dialogCallback                 //Script function callback. To use it class must be registered by WindowRegisterClass.
	);
	if(!hWndDialog)
		return;

	function dialogCallback(hWnd, uMsg, wParam, lParam) {
		switch(uMsg) {
			case 1: //WM_CREATE
				function setWindowFontAndText(hWnd, hFont, pText) {
					AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
					windowText(hWnd, pText);
				}

				var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);

				// Dialog caption
				windowText(hWnd, dialogTitle);

				// Checkbox: close dialog
				hWndClose = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50010003,    //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					12,            //x
					12,            //y
					270,           //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_CLOSE,     //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndClose, hGuiFont, _localize("&Close dialog"));
				checked(hWndClose, checkClose);

				// Checkbox: focus editor
				hWndFocus = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50010003,    //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					12,            //x
					34,            //y
					270,           //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_FOCUS,     //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndFocus, hGuiFont, _localize("&Focus editor"));
				checked(hWndFocus, checkFocus);

				// Static window: time limit label
				hWndStatic = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					12,           //x
					59,           //y
					134,          //nWidth
					13,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndStatic, hGuiFont, _localize("&Time limit:"));

				// Edit: time limit
				hWndTimeLimit = createWindowEx(
					0x200,          //WS_EX_CLIENTEDGE
					"EDIT",         //lpClassName
					0,              //lpWindowName
					0x50012080,     //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_NUMBER|ES_AUTOHSCROLL
					150,            //x
					56,             //y
					60,             //nWidth
					19,             //nHeight
					hWnd,           //hWndParent
					IDC_TIME_LIMIT, //ID
					hInstanceDLL,   //hInstance
					0               //lpParam
				);
				setWindowFontAndText(hWndTimeLimit, hGuiFont, String(timeLimit));

				// Up/down buttons
				hWndStatic = createWindowEx(
					0,                 //dwExStyle
					"msctls_updown32", //lpClassName
					0,                 //lpWindowName
					0x500000A2,        //WS_VISIBLE|WS_CHILD|UDS_SETBUDDYINT|UDS_ARROWKEYS|UDS_NOTHOUSANDS
					210,               //x
					55,                //y
					16,                //nWidth
					21,                //nHeight
					hWnd,              //hWndParent
					IDC_STATIC,        //ID
					hInstanceDLL,      //hInstance
					0                  //lpParam
				);
				AkelPad.SendMessage(hWndStatic, 0x0400 + 105 /*UDM_SETBUDDY*/, hWndTimeLimit, 0);
				AkelPad.SendMessage(hWndStatic, 0x0400 + 101 /*UDM_SETRANGE*/, 0, ((0 & 0xFFFF) << 16) + (30000 & 0xFFFF));

				// Static window: time limit ms label
				hWndStatic = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					230,          //x
					59,           //y
					58,           //nWidth
					13,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndStatic, hGuiFont, _localize("ms"));

				// Static window: line label
				hWndStatic = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					12,           //x
					89,           //y
					78,           //nWidth
					13,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndStatic, hGuiFont, _localize("&Line:"));

				// Edit: line
				hWndLine = createWindowEx(
					0x200,        //WS_EX_CLIENTEDGE
					"EDIT",       //lpClassName
					0,            //lpWindowName
					0x50010880,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_READONLY
					94,           //x
					86,           //y
					180,          //nWidth
					19,           //nHeight
					hWnd,         //hWndParent
					IDC_LINE,     //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndLine, hGuiFont, "");

				// Static window: length label
				hWndStatic = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					12,           //x
					110,          //y
					78,           //nWidth
					13,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndStatic, hGuiFont, _localize("L&ength:"));

				// Edit: length
				hWndLength = createWindowEx(
					0x200,        //WS_EX_CLIENTEDGE
					"EDIT",       //lpClassName
					0,            //lpWindowName
					0x50010880,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_READONLY
					94,           //x
					107,          //y
					180,          //nWidth
					19,           //nHeight
					hWnd,         //hWndParent
					IDC_LENGTH,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndLength, hGuiFont, "");

				// Static window: processed lines label
				hWndStatic = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					12,           //x
					131,          //y
					78,           //nWidth
					13,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndStatic, hGuiFont, _localize("&Processed:"));

				// Edit: processed lines
				hWndProcessed = createWindowEx(
					0x200,         //WS_EX_CLIENTEDGE
					"EDIT",        //lpClassName
					0,             //lpWindowName
					0x50010880,    //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_READONLY
					94,            //x
					128,           //y
					180,           //nWidth
					19,            //nHeight
					hWnd,          //hWndParent
					IDC_PROCESSED, //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndProcessed, hGuiFont, "");

				// Down button window
				hWndDown = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010001,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					12,           //x
					159,          //y
					80,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_DOWN,     //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndDown, hGuiFont, _localize("&Down"));

				// Up button window
				hWndUp = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					104,          //x
					159,          //y
					80,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_UP,       //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndUp, hGuiFont, _localize("&Up"));

				// Cancel button window
				hWndCancel = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					196,          //x
					159,          //y
					80,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_CANCEL,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));

				oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CLOSE, 0);

				//centerWindow(hWnd);
				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);

				//autoGo && oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, reverse ? IDC_UP : IDC_DOWN, 0);
				if(autoGo) try {
					controlsEnabled(false);
					var document = new ActiveXObject("htmlfile");
					var window = document.parentWindow;
					window.setTimeout(function() {
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, reverse ? IDC_UP : IDC_DOWN, 0);
					}, 0);
				}
				catch(e) {
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, reverse ? IDC_UP : IDC_DOWN, 0);
				}
			break;
			case 7: //WM_SETFOCUS
				focusWindow(hWndDown);
			break;
			case 256: //WM_KEYDOWN
				var ctrl = oSys.Call("user32::GetAsyncKeyState", 162 /*VK_LCONTROL*/)
					|| oSys.Call("user32::GetAsyncKeyState", 163 /*VK_RCONTROL*/);
				var shift = oSys.Call("user32::GetAsyncKeyState", 160 /*VK_LSHIFT*/)
					|| oSys.Call("user32::GetAsyncKeyState", 161 /*VK_RSHIFT*/);

				if(wParam == 27 /*VK_ESCAPE*/)
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
				else if((ctrl || shift) && wParam == 34 /*PageDown*/) {
					AkelPad.SetSel(-1, -1);
					checked(hWndFocus) && focusWindow(AkelPad.GetEditWnd());
				}
				else if((ctrl || shift) && wParam == 33 /*PageUp*/) {
					AkelPad.SetSel(0, 0);
					checked(hWndFocus) && focusWindow(AkelPad.GetEditWnd());
				}
				else if(wParam == 13 /*VK_RETURN*/ || wParam == 34 /*PageDown*/)
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_DOWN, 0);
				else if(wParam == 33 /*PageUp*/)
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_UP, 0);
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_DOWN:
					case IDC_UP:
						if(!readTimeLimit())
							break;

						if(disabled == true || disabled > new Date().getTime())
							break;
						disabled = true;
						var up = idc == IDC_UP;
						var hWndFocused = oSys.Call("user32::GetFocus");
						controlsEnabled(false);
						var stats = goToLongestLine(up);

						windowText(hWndLine, formatNum(stats.line) + " / " + formatNum(stats.linesCount));
						windowText(hWndLength, formatNum(stats.lineLength));
						windowText(
							hWndProcessed,
							stats.processed == stats.targetCount
								? formatNum(stats.processed)
								: formatNum(stats.processed) + " / " + formatNum(stats.targetCount)
								 + " (" + toLocaleNum((stats.processed/stats.targetCount*100).toFixed(2)) + "%)"
						);

						var closeDlg    = checked(hWndClose);
						var focusEditor = checked(hWndFocus);
						if(saveOptions == 1) {
							prefs.set({
								close:     closeDlg,
								focus:     focusEditor,
								timeLimit: timeLimit
							});
							prefs.end();
						}
						if(closeDlg)
							closeDialog();
						else {
							controlsEnabled(true);
							if(focusEditor)
								focusWindow(AkelPad.GetEditWnd());
							else if(!oSys.Call("user32::GetFocus")) // We disable focused window
								focusWindow(hWndFocused);
							disabled = new Date().getTime() + disabledTimeout;
						}
					break;
					case IDC_CANCEL:
						closeDialog();
					break;
					case IDC_CLOSE:
						enabled(hWndFocus, !checked(hWndClose));
				}
			break;
			case 16: //WM_CLOSE
				enabled(hMainWnd, true); // Enable main window
				savePosition && !oSys.Call("user32::IsIconic", hWnd) && saveWindowPosition(hWnd);
				if(saveOptions == 2) {
					prefs.set({
						close:     checked(hWndClose),
						focus:     checked(hWndFocus),
						timeLimit: parseInt(windowText(hWndTimeLimit), 10) || 0
					});
					prefs.end();
				}

				oSys.Call("user32::DestroyWindow", hWnd); // Destroy dialog
			break;
			case 2: //WM_DESTROY
				oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		}
		return 0;
	}
	function saveWindowPosition(hWnd) {
		var rcWnd = getWindowRect(hWnd);
		if(!rcWnd)
			return;
		prefs.set({
			windowLeft: rcWnd.left,
			windowTop:  rcWnd.top
		});
		prefs.end();
	}
	function restoreWindowPosition(hWnd, hWndParent) {
		if(savePosition) {
			var dlgX = prefs.get("windowLeft", prefs.DWORD);
			var dlgY = prefs.get("windowTop",  prefs.DWORD);
			prefs.end();
		}

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
		AkelPad.MemCopy(lpRect,      dlgX,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpRect + 4,  dlgY,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpRect + 8,  dlgX + (rcWnd.right - rcWnd.left), 3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpRect + 12, dlgY + (rcWnd.top - rcWnd.bottom), 3 /*DT_DWORD*/);
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
				var rcWork = parseRect(lpMi + 4 + 16);
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
				oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/)
					+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/)
			);

			var minX = rcWork.left - (rcWnd.right - rcWnd.left) + edge;
			var minY = rcWork.top;
			var maxX = rcWork.right - edge;
			var maxY = rcWork.bottom - edge;

			dlgX = Math.max(minX, Math.min(maxX, dlgX));
			dlgY = Math.max(minY, Math.min(maxY, dlgY));
		}

		oSys.Call("user32::SetWindowPos", hWnd, 0, dlgX, dlgY, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
	}
	function centerWindow(hWnd, hWndParent) {
		var rcWnd = getWindowRect(hWnd);
		var rcWndParent = getWindowRect(hWndParent || oSys.Call("user32::GetDesktopWindow"));
		if(!rcWndParent || !rcWnd)
			return;
		var x = rcWndParent.left + ((rcWndParent.right  - rcWndParent.left) / 2 - (rcWnd.right  - rcWnd.left) / 2);
		var y = rcWndParent.top  + ((rcWndParent.bottom - rcWndParent.top)  / 2 - (rcWnd.bottom - rcWnd.top)  / 2);
		oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
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
			left:   AkelPad.MemRead(lpRect,      3 /*DT_DWORD*/),
			top:    AkelPad.MemRead(lpRect +  4, 3 /*DT_DWORD*/),
			right:  AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/),
			bottom: AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/)
		};
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
	function checked(hWnd, val) {
		return arguments.length == 1
			? AkelPad.SendMessage(hWnd, 240 /*BM_GETCHECK*/, 0, 0)
			: AkelPad.SendMessage(hWnd, 241 /*BM_SETCHECK*/, val ? 1 /*BST_CHECKED*/ : 0, 0);
	}
	function enabled(hWnd, val) {
		oSys.Call("user32::EnableWindow", hWnd, val);
	}
	function focusWindow(hWnd) {
		oSys.Call("user32::SetFocus", hWnd);
	}
	function controlsEnabled(val) {
		enabled(hWndUp,   val);
		enabled(hWndDown, val);
		!modal && enabled(hMainWnd, val);
	}
	function closeDialog() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
	}
	function readTimeLimit() {
		var timeLimitMin  = 0;
		var timeLimitWarn = 15000;
		var timeLimitMax  = 24*60*60*1000;
		var tlOrig = windowText(hWndTimeLimit);
		var tl = Number(
			tlOrig
				.replace(/\D/g, "")
				.replace(/^0+/, "")
		);
		tl = Math.max(timeLimitMin, Math.min(timeLimitMax, tl));

		var confirm = function(ask) {
			if(typeof readTimeLimit._ok != "undefined" && readTimeLimit._ok)
				return true; // Only one confirmation
			return readTimeLimit._ok = AkelPad.MessageBox(
				hWndDialog, ask, dialogTitle, 33 /*MB_OKCANCEL|MB_ICONQUESTION*/
			) == 1 /*IDOK*/;
		};
		if(!tl && !confirm(_localize("Are you sure to disable time limit?"))) {
			focusWindow(hWndTimeLimit);
			AkelPad.SendMessage(hWndTimeLimit, 177 /*EM_SETSEL*/, 0, -1);
			return false;
		}
		if(tl > timeLimitWarn) {
			var secs = Math.round(tl/1000);
			var mins = Math.floor(secs/60);
			secs = Math.floor(secs%60);
			if(secs < 10)
				secs = "0" + secs;
			if(!confirm(_localize("Time limit is too big (%S min)!\nContinue anyway?").replace("%S", mins + ":" + secs))) {
				focusWindow(hWndTimeLimit);
				AkelPad.SendMessage(hWndTimeLimit, 177 /*EM_SETSEL*/, 0, -1);
				return false;
			}
		}

		if(String(tl) != tlOrig)
			windowText(hWndTimeLimit, String(tl));
		timeLimit = tl;
		return true;
	}

	function Scale(hDC, hWnd) {
		var hNewDC = hDC || oSys.Call("user32::GetDC", hWnd);
		if(hNewDC) {
			this._x = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 88 /*LOGPIXELSX*/);
			this._y = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 90 /*LOGPIXELSY*/);

			//Align to 16 pixel
			this._x += this._x % 16;
			this._y += this._y % 16;

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
			dwExStyle,
			lpClassName,
			lpWindowName,
			dwStyle,
			scale.x(x),
			scale.y(y),
			scale.x(w),
			scale.y(h),
			hWndParent,
			id,
			hInstance,
			callback || 0
		);
	}

	modal && enabled(hMainWnd, false); // Disable main window, to make dialog modal

	AkelPad.ScriptNoMutex(); // Allow other scripts running
	AkelPad.WindowGetMessage(); // Message loop

	AkelPad.WindowUnregisterClass(dialogClass);
}

function formatNum(n) {
	//return Number(n).toLocaleString().replace(/\s*[^\d\s\xa0\u2002\u2003\u2009].*$/, "");
	return String(n).replace(/(\d)(?=(\d{3})+(\D|$))/g, "$1\xa0");
}
function toLocaleNum(n) { // 1.25 -> 1,25
	var localeDelimiter = 1.1.toLocaleString().replace(/^\d+|\d+$/g, "");
	if(!localeDelimiter || /\d/.test(localeDelimiter))
		 localeDelimiter = ".";
	return String(n).replace(/\./, localeDelimiter);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}

function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; i++)
		if(/^[-\/](\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
			args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
	getArg = function(argName, defaultVal) {
		argName = argName.toLowerCase();
		return typeof args[argName] == "undefined" // argName in args
			? defaultVal
			: args[argName];
	};
	return getArg(argName, defaultVal);
}
function getArgOrPref(name, type, defaultVal) {
	var argVal = getArg(name);
	return argVal === undefined
		? saveOptions
			? prefs.get(name, type, defaultVal)
			: defaultVal
		: argVal;
}
function Prefs(ns) {
	if(!ns)
		ns = WScript.ScriptBaseName;
	var oSet = AkelPad.ScriptSettings();
	var state  = 0;
	var READ   = 0x1; //POB_READ
	var SAVE   = 0x2; //POB_SAVE
	var CLEAR  = 0x4; //POB_CLEAR
	var DWORD  = 1;   //PO_DWORD
	var BINARY = 2;   //PO_BINARY
	var STRING = 3;   //PO_STRING
	function get(name, type, defaultVal) {
		if(!(state & READ)) {
			end();
			if(!oSet.Begin(ns, READ))
				return defaultVal;
			state = READ;
		}
		var val = oSet.Read(name, type || DWORD);
		if(val === undefined)
			val = defaultVal;
		//oSet.End();
		return val;
	}
	function set(name, val) {
		if(!(state & SAVE)) {
			end();
			if(!oSet.Begin(ns, SAVE))
				return false;
			state = SAVE;
		}
		var sets;
		if(arguments.length == 1)
			sets = name;
		else {
			sets = {};
			sets[name] = val;
		}
		var ok = true;
		for(var name in sets) {
			var val = sets[name];
			var type = typeof val == "number" || typeof val == "boolean" ? DWORD : STRING;
			if(!oSet.Write(name, type, val))
				ok = false;
		}
		//oSet.End();
		return ok;
	}
	function begin(flags) {
		end();
		var ok = oSet.Begin(ns, flags);
		if(ok)
			state = flags;
		return ok;
	}
	function end() {
		if(!state)
			return true;
		var ok = oSet.End();
		if(ok)
			state = 0;
		return ok;
	}
	this.READ   = READ;
	this.SAVE   = SAVE;
	this.CLEAR  = CLEAR;
	this.DWORD  = DWORD;
	this.BINARY = BINARY;
	this.STRING = STRING;
	this.get    = get;
	this.set    = set;
	this.begin  = begin;
	this.end    = end;
}