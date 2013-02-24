// http://akelpad.sourceforge.net/forum/viewtopic.php?p=17271#17271
// http://infocatcher.ucoz.net/js/akelpad_scripts/tileTabs.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/tileTabs.js

// (c) Infocatcher 2012-2013
// version 0.1.2 - 2013-02-24

// Tile current tab with next selected:
// select first tab, call script and then select second tab.
// Required MDI window mode!

// Usage:
//   Call("Scripts::Main", 1, "tileTabs.js")         - tile vertical
//   Call("Scripts::Main", 1, "tileTabs.js", "o")    - tile vertical and preserve tabs order
//   Call("Scripts::Main", 1, "tileTabs.js", "h")    - tile horizontal
//   Call("Scripts::Main", 1, "tileTabs.js", "h o")  - tile horizontal and preserve tabs order

function _localize(s) {
	var strings = {
		"No tabs!": {
			ru: "Отсутствуют вкладки!"
		},
		"MDI window mode required!": {
			ru: "Требуется оконный режим MDI!"
		},
		"Select tab!": {
			ru: "Выберите вкладку!"
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

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

if(
	hMainWnd
	&& AkelPad.IsMDI() == 1 /*WMD_MDI*/
) {
	var hMdiClient = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 12 /*MI_WNDMDICLIENT*/, 0);
	var lpFrame = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
	var lpFrame2;

	if(hMdiClient && lpFrame) {
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
		hMdiClient && lpFrame
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

		timer && window.clearTimeout(timer);
		statusbar.restore();
		if(lpFrame2) {
			var tileHorizontal, useTabsOrder;
			for(var i = 0, l = WScript.Arguments.length; i < l; ++i) {
				switch(WScript.Arguments(i)) {
					case "h": tileHorizontal = true; break;
					case "o": useTabsOrder = true;
				}
			}
			tileTabs(lpFrame, lpFrame2, tileHorizontal, useTabsOrder);
		}
		//AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame);
	}
	else {
		timer && window.clearTimeout(timer);
		statusbar && statusbar.restore();
		AkelPad.MessageBox(hMainWnd, _localize("No tabs!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
	}
}
else {
	AkelPad.MessageBox(hMainWnd, _localize("MDI window mode required!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
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

function tileTabs(lpFrame, lpFrame2, tileHorizontal, useTabsOrder) {
	var lpRect = AkelPad.MemAlloc(16 /*sizeof(RECT)*/);
	if(!lpRect)
		return;
	if(!oSys.Call("user32::GetClientRect", hMdiClient, lpRect))
		return;
	var rcClient = parseRect(lpRect);

	var hWndMdi  = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 1 /*FI_WNDEDITPARENT*/, lpFrame);
	var hWndMdi2 = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 1 /*FI_WNDEDITPARENT*/, lpFrame2);

	AkelPad.SendMessage(hMdiClient, 0x0223 /*WM_MDIRESTORE*/, hWndMdi2, 0);
	AkelPad.SendMessage(hMdiClient, 0x0223 /*WM_MDIRESTORE*/, hWndMdi, 0);
	AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame2);

	var w = rcClient.right - rcClient.left;
	var h = rcClient.bottom - rcClient.top;

	if(useTabsOrder) {
		var pos  = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrame);
		var pos2 = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrame2);
		if(pos2 < pos) {
			var tmp = hWndMdi;
			hWndMdi = hWndMdi2;
			hWndMdi2 = tmp;
		}
	}

	if(tileHorizontal) {
		h /= 2;
		moveMdiWindow(hWndMdi,  rcClient.left, rcClient.top,     w, h);
		moveMdiWindow(hWndMdi2, rcClient.left, rcClient.top + h, w, h);
	}
	else {
		w /= 2;
		moveMdiWindow(hWndMdi,  rcClient.left,     rcClient.top, w, h);
		moveMdiWindow(hWndMdi2, rcClient.left + w, rcClient.top, w, h);
	}
}
function moveMdiWindow(hWndMdi, x, y, w, h) {
	oSys.Call("user32::MoveWindow", hWndMdi, x, y, w, h, true /*bRepaint*/);
}
function parseRect(lpRect) {
	return {
		left:   AkelPad.MemRead(lpRect,      3 /*DT_DWORD*/),
		top:    AkelPad.MemRead(lpRect +  4, 3 /*DT_DWORD*/),
		right:  AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/),
		bottom: AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/)
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