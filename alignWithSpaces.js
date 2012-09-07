// http://akelpad.sourceforge.net/forum/viewtopic.php?p=13096#13096
// http://infocatcher.ucoz.net/js/akelpad_scripts/alignWithSpaces.js

// (c) Infocatcher 2011
// version 0.2.2 - 2011-12-20

//===================
// Align selected code with spaces to user defined string

// Hotkeys:
//   Enter                    - Ok
//   Ctrl+Enter, Shift+Enter  - Align
//   Escape                   - Cancel
//   F1                       - Select next align option
//   F2                       - Select next spaces option
//   Ctrl+Z                   - Undo
//   Ctrl+Shift+Z             - Redo
//   Ctrl+C, Ctrl+Insert      - Copy
//   Ctrl+V, Shift+Insert     - Paste
//   Ctrl+X, Shift+Del        - Cut
//   Delete                   - Delete selection
//   Ctrl+A                   - Select all
//   Ctrl+S                   - Save file

// Argumens:
//   -dialog=true        - show dialog
//   -sepAtStart=false   - -> [separator][text]
//              =true    - [separator] -> [text]
//   -minimize=0         - leave all spaces
//            =1         - leave only one space (if exist)
//            =2         - remove all spaces
//   -sep="="            - don't ask separator
//   -history=10         - set history length
//   -saveOptions=0      - don't store options
//               =1      - (default) save options after them usage
//               =2      - save options on exit
//   -savePosition=true  - allow store last window position

// Usage:
//   Call("Scripts::Main", 1, "alignWithSpaces.js")
//   Call("Scripts::Main", 1, "alignWithSpaces.js", '-dialog=false -sep="=" -sepAtStart=true')
//===================

function _localize(s) {
	var strings = {
		"No text selected!": {
			ru: "Отсутствует выделенный текст!"
		},
		"Only one line selected!": {
			ru: "Выделена только одна строка!"
		},
		"Invalid regular expression!": {
			ru: "Неверное регулярное выражение!"
		},
		"Separator “%S” not found!": {
			ru: "Разделитель «%S» не найден!"
		},
		"Found only one separator “%S”!": {
			ru: "Найден только один разделитель «%S»!"
		},

		"&Separator:": {
			ru: "&Разделитель:"
		},

		"&Alignement": {
			ru: "&Выравнивание"
		},
		"-> [separator][text]": {
			ru: "-> [разделитель][текст]"
		},
		"[separator] -> [text]": {
			ru: "[разделитель] -> [текст]"
		},

		"&Spaces": {
			ru: "&Пробелы"
		},
		"Leave all": {
			ru: "Оставить все"
		},
		"Leave only one": {
			ru: "Оставить только один"
		},
		"Remove all": {
			ru: "Удалить все"
		},

		"OK": {
			ru: "ОК"
		},
		"Align": {
			ru: "Выровнять"
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
// getArg(argName, defaultValue)
var dialog        = getArg("dialog", true);
var sepAtStart    = getArg("sepAtStart", false);
var minimize      = getArg("minimize", 0);
var separator     = getArg("sep");
var historyLength = getArg("history", 10);
var saveOptions   = getArg("saveOptions", 1);
var savePosition  = getArg("savePosition", true);

var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();
var oSet = AkelPad.ScriptSettings();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

if(hMainWnd) {
	if(dialog || !separator)
		alignWithSpacesDialog();
	else
		alignWithSpaces(separator);
}

function alignWithSpaces(sep, hWnd) {
	if(AkelPad.GetEditReadOnly(hWndEdit))
		return false;
	var sel = AkelPad.GetSelText();
	if(!sel) {
		AkelPad.MessageBox(hWnd || hMainWnd, _localize("No text selected!"), dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
		return false;
	}
	var lines = sel.split("\r");
	var linesCnt = lines.length;
	if(linesCnt == 1) {
		AkelPad.MessageBox(hWnd || hMainWnd, _localize("Only one line selected!"), dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
		return false;
	}
	if(!sep) {
		if(!hWnd)
			alignWithSpacesDialog();
		return false;
	}
	var pattern;
	var isRegExp = false;
	if(/^\/(.+)\/(i?)$/.test(sep)) { // /RegExp/ and /RegExp/i
		try {
			pattern = new RegExp(RegExp.$1, RegExp.$2);
			isRegExp = true;
		}
		catch(e) {
			AkelPad.MessageBox(
				hWnd || hMainWnd,
				_localize("Invalid regular expression!")
					+ "\n" + e.name + "\n" + e.message,
				dialogTitle,
				16 /*MB_ICONERROR*/
			);
			if(!hWnd) {
				separator = sep;
				alignWithSpacesDialog();
			}
			return false;
		}
	}
	//else if(/^("|')(.+)\1$/.test(sep))
	else {
		pattern = new RegExp(escapeRegExp(sep));
	}
	var maxPos = -1;
	var indexes = [];
	var startOffset = 0;
	var found = 0;
	for(var i = 0; i < linesCnt; ++i) {
		var line = lines[i];
		var indx = line.search(pattern);
		indexes[i] = indx;
		if(indx == -1)
			continue;
		++found;
		//~ todo: calculate real tab width
		if(sepAtStart) {
			indx += RegExp.lastMatch.length;
			var lineEnd = line.substr(indx);
			if(minimize) {
				var lineEnd = lineEnd.replace(/^[ \t]+/, minimize == 1 ? " " : "");
				line = lines[i] = line.substr(0, indx) + lineEnd;
			}
			indx += lineEnd.match(/^[ \t]*/)[0].length;
			indexes[i] = indx;
		}
		else if(minimize) {
			var lineStart = line.substr(0, indx);
			var lineEnd = line.substr(indx);
			var lineStartNew = lineStart.replace(/[ \t]+$/, minimize == 1 ? " " : "");
			indx = indexes[i] = lineStartNew.length;
			line = lines[i] = lineStartNew + lineEnd;
		}
		if(i == 0 && !AkelPad.SendMessage(hWndEdit, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0)) {
			var ss = AkelPad.GetSelStart();
			var lineStart = getOffset(hWndEdit, 18 /*AEGI_WRAPLINEBEGIN*/, ss);
			startOffset = ss - lineStart;
			indx += startOffset;
		}
		if(indx > maxPos)
			maxPos = indx;
	}
	if(found <= 1) {
		AkelPad.MessageBox(
			hWnd || hMainWnd,
			_localize(found ? "Found only one separator “%S”!" : "Separator “%S” not found!")
				.replace("%S", isRegExp ? pattern : sep),
			dialogTitle,
			48 /*MB_ICONEXCLAMATION*/
		);
		if(!hWnd) {
			separator = sep;
			alignWithSpacesDialog();
		}
		return false;
	}
	for(var i = 0; i < linesCnt; ++i) {
		var line = lines[i];
		var indx = indexes[i];
		if(indx == -1/* || indx == maxPos*/)
			continue;
		var spaces = new Array(maxPos - indx - (i == 0 ? startOffset : 0) + 1).join(" ");
		var lineStart = line.substr(0, indx);
		lineStart = lineStart.replace(/[\t ]*$/, "") + new Array(RegExp.lastMatch.length + 1).join(" ");
		var lineEnd = line.substr(indx);
		lineEnd = lineEnd.replace(/^[\t ]*/, "") + new Array(RegExp.lastMatch.length + 1).join(" ");
		lines[i] = lineStart + spaces + lineEnd;
	}
	var res = lines.join("\r");
	if(res != sel)
		insertNoScroll(res);
	return true;
}

function alignWithSpacesDialog(modal) {
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

	var optionsUsed = false;
	var lastSeps = [];
	var savedSepsCount = 0;
	var dlgX, dlgY;
	if((saveOptions || savePosition) && oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/)) {
		if(saveOptions) {
			for(var i = 0; ; ++i) {
				var s = oSet.Read("lastSeparator" + i, 3 /*PO_STRING*/, "");
				if(!s)
					break;
				if(i < historyLength)
					lastSeps[lastSeps.length] = s;
			}
			savedSepsCount = i;
			if(getArg("sepAtStart") === undefined)
				sepAtStart = oSet.Read("sepAtStart", 1 /*PO_DWORD*/) || 0;
			if(getArg("minimize") === undefined)
				minimize = oSet.Read("minimize", 1 /*PO_DWORD*/) || 0;
		}
		if(savePosition) {
			dlgX = oSet.Read("windowLeft", 1 /*PO_DWORD*/);
			dlgY = oSet.Read("windowTop",  1 /*PO_DWORD*/);
		}
		oSet.End();
	}
	function saveSettings(rewrite) {
		if(!saveOptions && !savePosition)
			return;
		if(!oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
			return;
		if(saveOptions && (saveOptions == 2 || optionsUsed)) {
			if(readControlsState()) {
				oSet.Write("sepAtStart", 1 /*PO_DWORD*/, sepAtStart);
				oSet.Write("minimize",   1 /*PO_DWORD*/, minimize);
			}
			var histLen = Math.min(historyLength, lastSeps.length);
			for(var i = 0, l = Math.max(historyLength, savedSepsCount); i < l; ++i) {
				if(i < histLen)
					oSet.Write("lastSeparator" + i, 3 /*PO_STRING*/, lastSeps[i]);
				else
					oSet.Delete("lastSeparator" + i);
			}
		}
		if(savePosition && !oSys.Call("user32::IsIconic", hWndDialog)) {
			var rcWnd = getWindowRect(hWndDialog);
			if(rcWnd) {
				oSet.Write("windowLeft", 1 /*PO_DWORD*/, rcWnd.left);
				oSet.Write("windowTop",  1 /*PO_DWORD*/, rcWnd.top);
			}
		}
		oSet.End();
	}

	var IDC_STATIC         = -1;
	var IDC_COMBOBOX_LABEL = 1000;
	var IDC_COMBOBOX       = 1001;
	var IDC_SEP_AT_END     = 1002;
	var IDC_SEP_AT_START   = 1003;
	var IDC_SP_LEAVE       = 1004;
	var IDC_SP_LEAVE_ONE   = 1005;
	var IDC_SP_REMOVE      = 1006;
	var IDC_OK             = 1007;
	var IDC_ALIGN          = 1008;
	var IDC_CANCEL         = 1009;

	var hWndStatic;
	var hWndComboboxLabel, hWndCombobox;
	var hWndSepAtEnd, hWndSepAtStart;
	var hWndSpLeave, hWndSpLeaveOne, hWndSpRemove;
	var hWndOK, hWndAlign, hWndCancel;

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 7 /*SM_CXFIXEDFRAME*/)*2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/)*2
		+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	// Create dialog
	hWndDialog = oSys.Call(
		"user32::CreateWindowEx" + _TCHAR,
		0,                             //dwExStyle
		dialogClass,                   //lpClassName
		0,                             //lpWindowName
		0x90CA0000,                    //WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX
		scale.x(0),                    //x
		scale.y(0),                    //y
		scale.x(446) + sizeNonClientX, //nWidth
		scale.y(122) + sizeNonClientY, //nHeight
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
				var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
				function setWindowFontAndText(hWnd, hFont, pText) {
					AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
					windowText(hWnd, pText);
				}

				// Dialog caption
				oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, dialogTitle);

				// Static window: combobox label
				hWndComboboxLabel = createWindowEx(
					0,                  //dwExStyle
					"STATIC",           //lpClassName
					0,                  //lpWindowName
					0x50000100,         //WS_VISIBLE|WS_CHILD|SS_NOTIFY
					12,                 //x
					15,                 //y
					78,                 //nWidth
					13,                 //nHeight
					hWnd,               //hWndParent
					IDC_COMBOBOX_LABEL, //ID
					hInstanceDLL,       //hInstance
					0                   //lpParam
				);
				setWindowFontAndText(hWndComboboxLabel, hGuiFont, _localize("&Separator:"));

				hWndCombobox = createWindowEx(
					0,            //dwExStyle
					"COMBOBOX",   //lpClassName
					0,            //lpWindowName
					0x50210042,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWN|CBS_AUTOHSCROLL
					90,           //x
					12,           //y
					254,          //nWidth
					160,          //nHeight
					hWnd,         //hWndParent
					IDC_COMBOBOX, //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				for(var i = 0, l = lastSeps.length; i < l; ++i) {
					//AkelPad.MemCopy(lpBuffer, lastSeps[i], _TSTR);
					//AkelPad.SendMessage(hWndCombobox, 0x143 /*CB_ADDSTRING*/, 0, lpBuffer);
					oSys.Call("user32::SendMessage" + _TCHAR, hWndCombobox, 0x143 /*CB_ADDSTRING*/, 0, lastSeps[i]);
				}
				setWindowFontAndText(hWndCombobox, hGuiFont, separator || "");
				!separator && AkelPad.SendMessage(hWndCombobox, 0x14E /*CB_SETCURSEL*/, 0, 0);

				// GroupBox alignement
				hWndStatic = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,           //x
					38,           //y
					160,          //nWidth
					56,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndStatic, hGuiFont, _localize("&Alignement"));

				// Radiobutton separator at end
				hWndSepAtEnd = createWindowEx(
					0,              //dwExStyle
					"BUTTON",       //lpClassName
					0,              //lpWindowName
					0x50000004,     //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					20,             //x
					54,             //y
					144,            //nWidth
					16,             //nHeight
					hWnd,           //hWndParent
					IDC_SEP_AT_END, //ID
					hInstanceDLL,   //hInstance
					0               //lpParam
				);
				setWindowFontAndText(hWndSepAtEnd, hGuiFont, _localize("-> [separator][text]"));
				checked(hWndSepAtEnd, !sepAtStart);

				// Radiobutton separator at start
				hWndSepAtStart = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50000004,       //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					20,               //x
					72,               //y
					144,              //nWidth
					16,               //nHeight
					hWnd,             //hWndParent
					IDC_SEP_AT_START, //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndSepAtStart, hGuiFont, _localize("[separator] -> [text]"));
				checked(hWndSepAtStart, sepAtStart);


				// GroupBox spaces
				hWndStatic = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					184,          //x
					38,           //y
					160,          //nWidth
					72,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndStatic, hGuiFont, _localize("&Spaces"));

				// Radiobutton leave all spaces
				hWndSpLeave = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					192,          //x
					54,           //y
					144,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_SP_LEAVE, //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndSpLeave, hGuiFont, _localize("Leave all"));
				checked(hWndSpLeave, minimize == 0);

				// Radiobutton leave only one space
				hWndSpLeaveOne = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50000004,       //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					192,              //x
					71,               //y
					144,              //nWidth
					16,               //nHeight
					hWnd,             //hWndParent
					IDC_SP_LEAVE_ONE, //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndSpLeaveOne, hGuiFont, _localize("Leave only one"));
				checked(hWndSpLeaveOne, minimize == 1);

				// Radiobutton remove all spaces
				hWndSpRemove = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50000004,    //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					192,           //x
					88,            //y
					144,           //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_SP_REMOVE, //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndSpRemove, hGuiFont, _localize("Remove all"));
				checked(hWndSpRemove, minimize == 2);


				// OK button window
				hWndOK = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010001,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					355,          //x
					11,           //y
					80,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_OK,       //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndOK, hGuiFont, _localize("OK"));

				// Apply button window
				hWndAlign = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					355,          //x
					38,           //y
					80,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_ALIGN,    //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndAlign, hGuiFont, _localize("Align"));

				// Cancel button window
				hWndCancel = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					355,          //x
					65,           //y
					80,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_CANCEL,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));

				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);
			break;
			case 7: //WM_SETFOCUS
				oSys.Call("user32::SetFocus", hWndCombobox);
			break;
			case 256: //WM_KEYDOWN
				var ctrl = oSys.Call("user32::GetAsyncKeyState", 162 /*VK_LCONTROL*/)
					|| oSys.Call("user32::GetAsyncKeyState", 163 /*VK_RCONTROL*/);
				var shift = oSys.Call("user32::GetAsyncKeyState", 160 /*VK_LSHIFT*/)
					|| oSys.Call("user32::GetAsyncKeyState", 161 /*VK_RSHIFT*/);
				if(wParam == 27 /*VK_ESCAPE*/)
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
				else if(wParam == 13 /*VK_RETURN*/) {
					if(ctrl || shift) // Ctrl+Enter, Shift+Enter
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_ALIGN, 0);
					else // Enter
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_OK, 0);
				}
				else if(wParam == 112 /*VK_F1*/) // F1
					navigate(hWndSepAtEnd, hWndSepAtStart);
				else if(wParam == 113 /*VK_F2*/) // F2
					navigate(hWndSpLeave, hWndSpLeaveOne, hWndSpRemove);
				else if(wParam == 90 /*Z*/) {
					if(ctrl && shift) // Ctrl+Shift+Z
						!comboboxFocused() && AkelPad.Command(4152); //IDM_EDIT_REDO
					else if(ctrl) // Ctrl+Z
						!comboboxFocused() && AkelPad.Command(4151); //IDM_EDIT_UNDO
				}
				else if(ctrl && wParam == 67 /*C*/ || ctrl && wParam == 45 /*VK_INSERT*/) // Ctrl+C, Ctrl+Insert
					!comboboxFocused() && AkelPad.Command(4154); //IDM_EDIT_COPY
				else if(ctrl && wParam == 86 /*V*/ || shift && wParam == 45 /*VK_INSERT*/) // Ctrl+V, Shift+Insert
					!comboboxFocused() && noScroll(function() {
						AkelPad.Command(4155); //IDM_EDIT_PASTE
					});
				else if(ctrl && wParam == 88 /*X*/ || shift && wParam == 46 /*VK_DELETE*/) // Ctrl+X, Shift+Del
					!comboboxFocused() && AkelPad.Command(4153); //IDM_EDIT_CUT
				else if(wParam == 46 /*VK_DELETE*/) // Delete
					!comboboxFocused() && AkelPad.Command(4156); //IDM_EDIT_CLEAR
				else if(ctrl && wParam == 65 /*A*/) // Ctrl+A
					!comboboxFocused() && noScroll(function() {
						AkelPad.Command(4157); //IDM_EDIT_SELECTALL
					});
				else if(ctrl && wParam == 83 /*S*/) // Ctrl+S
					AkelPad.Command(4105); // IDM_FILE_SAVE

				//else if(wParam != 16 /*VK_SHIFT*/ && wParam != 17 /*VK_CONTROL*/ && wParam != 18 /*VK_MENU*/)
				//	AkelPad.MessageBox(hWnd, wParam, dialogTitle, 0 /*MB_OK*/);
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_OK:
					case IDC_ALIGN:
						if(!readControlsState())
							break;
						var curSep = windowText(hWndCombobox);
						if(!curSep)
							break;
						hWndEdit = AkelPad.GetEditWnd();
						if(!alignWithSpaces(curSep, hWnd))
							break;
						addToHistory(curSep);
						optionsUsed = true;
						if(idc == IDC_OK)
							closeDialog();
					break;
					case IDC_CANCEL:
						closeDialog();
					break;
					case IDC_COMBOBOX_LABEL:
						oSys.Call("user32::SetFocus", hWndCombobox);
					break;
					case IDC_COMBOBOX:
						var ok = false;
						if(wParam >> 16 == 1 /*CBN_SELCHANGE*/) {
							var i = AkelPad.SendMessage(hWndCombobox, 0x147 /*CB_GETCURSEL*/, 0, 0);
							ok = AkelPad.SendMessage(hWndCombobox, 0x149 /*CB_GETLBTEXTLEN*/, i, 0) > 0;
						}
						else {
							ok = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndCombobox) > 0;
						}
						enabled(hWndAlign, ok);
						enabled(hWndOK,    ok);
					break;
					case IDC_SEP_AT_END:
					case IDC_SEP_AT_START:
						checked(hWndSepAtEnd,   idc == IDC_SEP_AT_END);
						checked(hWndSepAtStart, idc == IDC_SEP_AT_START);
						if((wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/)
							oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_ALIGN, 0);
					break;
					case IDC_SP_LEAVE:
					case IDC_SP_LEAVE_ONE:
					case IDC_SP_REMOVE:
						checked(hWndSpLeave,    idc == IDC_SP_LEAVE);
						checked(hWndSpLeaveOne, idc == IDC_SP_LEAVE_ONE);
						checked(hWndSpRemove,   idc == IDC_SP_REMOVE);
						if((wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/)
							oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_ALIGN, 0);
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

	function comboboxFocused() {
		//typedef struct tagCOMBOBOXINFO {
		//  DWORD cbSize;
		//  RECT  rcItem;
		//  RECT  rcButton;
		//  DWORD stateButton;
		//  HWND  hwndCombo;
		//  HWND  hwndItem;
		//  HWND  hwndList;
		//} COMBOBOXINFO, *PCOMBOBOXINFO, *LPCOMBOBOXINFO;
		var sizeofCBI = 4 + 16*2 + 4*4;
		var pcbi = AkelPad.MemAlloc(sizeofCBI);
		if(!pcbi)
			return false;
		AkelPad.MemCopy(pcbi, sizeofCBI, 3 /*DT_DWORD*/);
		if(!oSys.Call("user32::GetComboBoxInfo", hWndCombobox, pcbi))
			return false;
		var hWndComboboxEdit = AkelPad.MemRead(pcbi + 4 + 16*2 + 4*2, 3 /*DT_DWORD*/);
		comboboxFocused = function() {
			return oSys.Call("user32::GetFocus") == hWndComboboxEdit;
		};
		return comboboxFocused();
	}
	function readControlsState() {
		if(checked(hWndSepAtStart))
			sepAtStart = true;
		else if(checked(hWndSepAtEnd))
			sepAtStart = false;
		else
			return false;

		if(checked(hWndSpLeave))
			minimize = 0;
		else if(checked(hWndSpLeaveOne))
			minimize = 1;
		else if(checked(hWndSpRemove))
			minimize = 2;
		else
			return false;

		return true;
	}
	function navigate() {
		for(var i = 0, len = arguments.length; i < len; ++i) {
			var hWndRadio = arguments[i];
			if(!checked(hWndRadio))
				continue;
			checked(hWndRadio, false);
			checked(arguments[i == len - 1 ? 0 : i + 1], true);
			break;
		}
	}
	function addToHistory(str) {
		var histLen = lastSeps.length;
		for(var i = 0; i < histLen;) {
			if(lastSeps[i] != str) {
				++i;
				continue;
			}
			AkelPad.SendMessage(hWndCombobox, 0x144 /*CB_DELETESTRING*/, i, 0);
			if(lastSeps.splice)
				lastSeps.splice(i, 1);
			else {
				for(var j = i + 1; j < histLen; ++j)
					lastSeps[j - 1] = lastSeps[j];
				lastSeps.length--;
			}
			histLen--;
		}
		//AkelPad.SendMessage(hWndCombobox, 0x14A /*CB_INSERTSTRING*/, 0, lpBuffer);
		oSys.Call("user32::SendMessage" + _TCHAR, hWndCombobox, 0x14A /*CB_INSERTSTRING*/, 0, str);
		AkelPad.SendMessage(hWndCombobox, 0x14E /*CB_SETCURSEL*/, 0, 0);
		if(lastSeps.unshift)
			lastSeps.unshift(str);
		else {
			for(var j = histLen; j > 0; j--)
				lastSeps[j] = lastSeps[j - 1];
			lastSeps[0] = str;
		}
		if(lastSeps.length > historyLength) {
			AkelPad.SendMessage(hWndCombobox, 0x144 /*CB_DELETESTRING*/, histLen - 1, 0);
			lastSeps.length = historyLength;
		}
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
	function closeDialog() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
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

function escapeRegExp(str) {
	return str.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&");
}

function insertNoScroll(str, selectAll) {
	noScroll(function() {
		selectAll && AkelPad.SetSel(0, -1);
		//var ss = AkelPad.GetSelStart();
		AkelPad.ReplaceSel(str, true);
		//if(ss != AkelPad.GetSelStart())
		//	AkelPad.SetSel(ss, ss + str.length);
	});
}
function noScroll(func, hWndEdit) {
	if(!hWndEdit)
		hWndEdit = AkelPad.GetEditWnd();
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	func();

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}

function getOffset(hWndEdit, nType /*AEGI_*/, nOffset) {
	// Based on Instructor's code
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11382#11382
	var lpIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
	if(!lpIndex)
		return 0;
	if(nOffset != -1)
		AkelPad.SendMessage(hWndEdit, 3137 /*AEM_RICHOFFSETTOINDEX*/, nOffset, lpIndex);
	AkelPad.SendMessage(hWndEdit, 3130 /*AEM_GETINDEX*/, nType, lpIndex);
	nOffset = AkelPad.SendMessage(hWndEdit, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
	AkelPad.MemFree(lpIndex);
	return nOffset;
}

function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; ++i)
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