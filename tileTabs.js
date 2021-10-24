// http://akelpad.sourceforge.net/forum/viewtopic.php?p=17271#17271
// http://infocatcher.ucoz.net/js/akelpad_scripts/tileTabs.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/tileTabs.js

// (c) Infocatcher 2012-2020
// Version: 0.1.4 - 2020-06-20
// Author: Infocatcher

//// Tile current tab with next selected
// select first tab, call script and then select second tab.
// Required MDI window mode and timer.js library!
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/Include/timer.js
// (or use -noBlink=true argument to work without timer.js)

// Arguments:
//   h                      - tile horizontal
//   o                      - preserve tabs order
//   -noBlink=true          - disable blink in status bar (and just show "Select tab!" text)
//   -item="%m:%i"          - check toolbar button or menu item

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
if(hScript && AkelPad.ScriptHandle(hScript, 13 /*SH_GETMESSAGELOOP*/)) {
	// Script is running, second call close it
	AkelPad.ScriptHandle(hScript, 33 /*SH_CLOSESCRIPT*/);
	WScript.Quit();
}

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

if(
	hMainWnd
	&& AkelPad.IsMDI() == 1 /*WMD_MDI*/
) {
	var hMdiClient = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 12 /*MI_WNDMDICLIENT*/, 0);
	if(!hMdiClient) {
		AkelPad.MessageBox(hMainWnd, "Can't get hMdiClient!", WScript.ScriptName, 16 /*MB_ICONERROR*/);
		WScript.Quit();
	}
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
	}
	else {
		stopTimers && stopTimers();
		statusbar && statusbar.restore();
		AkelPad.MessageBox(hMainWnd, "AkelPad.WindowSubClass(WSC_MAINPROC) failed!", WScript.ScriptName, 16 /*MB_ICONERROR*/);
	}
	item.check(false);
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

function tileTabs(lpFrame, lpFrame2, tileHorizontal, useTabsOrder, _again) {
	var lpRect = AkelPad.MemAlloc(16 /*sizeof(RECT)*/);
	if(!lpRect)
		return;
	var rcClient = oSys.Call("user32::GetClientRect", hMdiClient, lpRect)
		&& parseRect(lpRect);
	AkelPad.MemFree(lpRect);
	if(!rcClient)
		return;

	var w = rcClient.right - rcClient.left;
	var h = rcClient.bottom - rcClient.top;

	var hWndMdi  = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 1 /*FI_WNDEDITPARENT*/, lpFrame);
	var hWndMdi2 = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 1 /*FI_WNDEDITPARENT*/, lpFrame2);

	if(useTabsOrder) {
		var pos  = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrame);
		var pos2 = AkelPad.SendMessage(hMainWnd, 1294 /*AKD_FRAMEINDEX*/, 0, lpFrame2);
		if(pos2 < pos) {
			var tmp = hWndMdi;
			hWndMdi = hWndMdi2;
			hWndMdi2 = tmp;
		}
	}

	AkelPad.SendMessage(hMdiClient, 0x0223 /*WM_MDIRESTORE*/, hWndMdi2, 0);
	AkelPad.SendMessage(hMdiClient, 0x0223 /*WM_MDIRESTORE*/, hWndMdi, 0);

	var scroll = getScrollSizes(hMdiClient);
	w -= scroll.w;
	h -= scroll.h;

	if(h < 2)
		h = 2;
	if(w < 2)
		w = 2;

	if(tileHorizontal) {
		var h1 = Math.floor(h/2);
		var h2 = h - h1;
		moveMdiWindow(hWndMdi,  rcClient.left, rcClient.top,      w, h1);
		moveMdiWindow(hWndMdi2, rcClient.left, rcClient.top + h1, w, h2);
	}
	else {
		var w1 = Math.floor(w/2);
		var w2 = w - w1;
		moveMdiWindow(hWndMdi,  rcClient.left,      rcClient.top, w1, h);
		moveMdiWindow(hWndMdi2, rcClient.left + w1, rcClient.top, w2, h);
	}

	if((scroll.w || scroll.h) && !_again) {
		WScript.Sleep(70); // Wait for changes...
		var scroll2 = getScrollSizes(hMdiClient);
		if(scroll.w && !scroll2.w || scroll.h && !scroll2.h)
			tileTabs(lpFrame, lpFrame2, tileHorizontal, useTabsOrder, true);
	}
}
function moveMdiWindow(hWndMdi, x, y, w, h) {
	oSys.Call("user32::MoveWindow", hWndMdi, x, y, w, h, true /*bRepaint*/);
}
function parseRect(lpRect) {
	return {
		left:   AkelPad.MemRead(_PtrAdd(lpRect,  0), 3 /*DT_DWORD*/),
		top:    AkelPad.MemRead(_PtrAdd(lpRect,  4), 3 /*DT_DWORD*/),
		right:  AkelPad.MemRead(_PtrAdd(lpRect,  8), 3 /*DT_DWORD*/),
		bottom: AkelPad.MemRead(_PtrAdd(lpRect, 12), 3 /*DT_DWORD*/)
	};
}
function getScrollSizes(hWnd) {
	var nStyle = oSys.Call("User32::GetWindowLong" + _TCHAR, hWnd, -16 /*GWL_STYLE*/);
	return {
		w: nStyle & 0x000200000 /*WS_VSCROLL*/ ? oSys.Call("user32::GetSystemMetrics", 2 /*SM_CXVSCROLL*/) || 16 : 0,
		h: nStyle & 0x000100000 /*WS_HSCROLL*/ ? oSys.Call("user32::GetSystemMetrics", 3 /*SM_CYHSCROLL*/) || 16 : 0
	};
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