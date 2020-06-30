// http://akelpad.sourceforge.net/forum/viewtopic.php?p=17270#17270
// http://infocatcher.ucoz.net/js/akelpad_scripts/moveResizeWindow.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/moveResizeWindow.js

// (c) Infocatcher 2012-2020
// Version: 0.1.2 - 2020-06-30
// Author: Infocatcher

//// Move or/and align AkelPad's main window

// Icons for context menu:
//   http://infocatcher.ucoz.net/js/akelpad_scripts/moveResizeWindow_icons.zip
//   or https://github.com/Infocatcher/AkelPad_menu/tree/master/icons window_*.ico + window.xcf
//   (based on Actual Window Manager's icons: http://www.actualtools.com/windowmanager/)

// Arguments:
//   -resize={width}*{height}
//          =800*600          - resize window to 800 x 600
//          =100%*            - resize window to 100% of work area width
//          =*100%            - resize window to 100% of work area height
//          =100%*100%        - resize window to work area (like maximize)
//   -move={x}*{y}
//        =center*center      - move window to center of work area
//        =left*top           - move window to top left corner of work area
//        =right*top          - move window to top right corner of work area
//        =left*bottom        - move window to bottom left corner of work area
//        =right*bottom       - move window to bottom right corner of work area
//        =left*              - move window to left side of work area
//        =10*150             - move to x=10, y=150
//   -allowRestore=true       - allow save last used size and position and restore them after second call

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd && !AkelPad.IsInclude()) {
	var resize = AkelPad.GetArgValue("resize", "");
	var move   = AkelPad.GetArgValue("move",   "");

	var allowRestore = AkelPad.GetArgValue("allowRestore", true);
	if(allowRestore)
		var pos = getWindowPos(hMainWnd);
	var changed = false;
	if(resize)
		resizeWindow(hMainWnd, resize) && (changed = true);
	if(move)
		moveWindow(hMainWnd, move) && (changed = true);
	if(allowRestore) {
		if(changed)
			saveWindowPos("main", hMainWnd, pos);
		else
			restoreWindowPos("main", hMainWnd);
	}
}

function resizeWindow(hWnd, resize, hWndParent) {
	var tokens = resize.split("*");
	var rsW = tokens[0];
	var rsH = tokens[1];

	var rcWnd = getWindowRect(hWnd);
	var rcWork = hWndParent
		? getWindowRect(hWndParent)
		: getWorkArea(hWnd);
	if(!rcWnd || !rcWork)
		return;

	var ww = rcWork.right - rcWork.left;
	var wh = rcWork.bottom - rcWork.top;

	var w = rcWnd.right - rcWnd.left;
	var h = rcWnd.bottom - rcWnd.top;

	if(rsW.slice(-1) == "%")
		rsW = Math.round(parseFloat(rsW)/100*ww);
	else if(!rsW)
		rsW = w;
	else
		rsW = parseInt(rsW);

	if(rsH.slice(-1) == "%")
		rsH = Math.round(parseFloat(rsH)/100*wh);
	else if(!rsH)
		rsH = h;
	else
		rsH = parseInt(rsH);

	rsW = Math.min(ww, rsW);
	rsH = Math.min(wh, rsH);

	if(rsW == w && rsH == h)
		return false;
	return _resizeWindow(hWnd, rsW, rsH);
}
function moveWindow(hWnd, move, hWndParent) {
	var tokens = move.split("*");
	var mvX = tokens[0];
	var mvY = tokens[1];

	var rcWnd = getWindowRect(hWnd);
	var rcWork = hWndParent
		? getWindowRect(hWndParent)
		: getWorkArea(hWnd);
	if(!rcWnd || !rcWork)
		return;

	var w = rcWnd.right - rcWnd.left;
	var h = rcWnd.bottom - rcWnd.top;

	if     (mvX == "left")   mvX = rcWork.left;
	else if(mvX == "center") mvX = centerX(rcWnd, rcWork);
	else if(mvX == "right")  mvX = rcWork.right - w;
	else if(!mvX)            mvX = rcWnd.left;
	else                     mvX = parseInt(mvX);

	if     (mvY == "top")    mvY = rcWork.top;
	else if(mvY == "center") mvY = centerY(rcWnd, rcWork);
	else if(mvY == "bottom") mvY = rcWork.bottom - h;
	else if(!mvY)            mvY = rcWnd.top;
	else                     mvY = parseInt(mvY);

	mvX = Math.max(rcWork.left, Math.min(rcWork.right - w,  mvX));
	mvY = Math.max(rcWork.top,  Math.min(rcWork.bottom - h, mvY));

	if(mvX == rcWnd.left && mvY == rcWnd.top)
		return false;
	return _moveWindow(hWnd, mvX, mvY);
}
function centerX(rcWnd, rcWndParent) {
	return rcWndParent.left + ((rcWndParent.right - rcWndParent.left)/2 - (rcWnd.right - rcWnd.left)/2);
}
function centerY(rcWnd, rcWndParent) {
	return rcWndParent.top + ((rcWndParent.bottom - rcWndParent.top)/2 - (rcWnd.bottom - rcWnd.top)/2);
}

function getWindowPos(hWnd) {
	var rcWnd = getWindowRect(hWnd);
	if(!rcWnd)
		return false;
	if(oSys.Call("user32::IsZoomed", hWnd))
		return "maximized";
	return rcWnd.left + "x" + rcWnd.top + "|"
		+ (rcWnd.right - rcWnd.left) + "x" + (rcWnd.bottom - rcWnd.top);
}
function saveWindowPos(windowId, hWnd, pos) {
	if(!pos)
		pos = getWindowPos(hWnd);
	if(!pos)
		return;

	var oSet = AkelPad.ScriptSettings();
	if(!oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
		return false;

	oSet.Write(windowId, 3 /*PO_STRING*/, pos);
	return oSet.End();
}
function restoreWindowPos(windowId, hWnd) {
	var oSet = AkelPad.ScriptSettings();
	if(!oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/))
		return false;

	var pos = oSet.Read(windowId, 3 /*PO_STRING*/, "");
	oSet.End();

	if(pos == "maximized")
		return oSys.Call("user32::ShowWindow", hWnd, 3 /*SW_MAXIMIZE*/);
	if(!/^(\d+)x(\d+)\|(\d+)x(\d+)$/.test(pos))
		return false;

	var x = +RegExp.$1;
	var y = +RegExp.$2;
	var w = +RegExp.$3;
	var h = +RegExp.$4;
	ensureNotMaximized(hWnd);
	return oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, w, h, 0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);
}

function getWorkArea(hWnd) {
	var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
	if(!lpRect)
		return null;
	oSys.Call("user32::GetWindowRect", hWnd, lpRect);

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
	return rcWork;
}
function _moveWindow(hWnd, x, y) {
	ensureNotMaximized(hWnd);
	return oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
}
function _resizeWindow(hWnd, w, h) {
	ensureNotMaximized(hWnd);
	return oSys.Call("user32::SetWindowPos", hWnd, 0, 0, 0, w, h, 0x16 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOMOVE*/);
}
function ensureNotMaximized(hWnd) {
	if(oSys.Call("user32::IsZoomed", hWnd))
		oSys.Call("user32::ShowWindow", hWnd, 9 /*SW_RESTORE*/);
}
function getWindowRect(hWnd, hWndParent) {
	var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
	getRect: if(lpRect) {
		if(!oSys.Call("user32::GetWindowRect", hWnd, lpRect))
			break getRect;
		if(hWndParent && !oSys.Call("user32::ScreenToClient", hWndParent, lpRect))
			break getRect;
		var rcWnd = parseRect(lpRect);
	}
	lpRect && AkelPad.MemFree(lpRect);
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