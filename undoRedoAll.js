// (c) Infocatcher 2010
// version 0.1.0 - 2010-06-25

// AkelPad 4.x.x only

// Arguments:
//   -mode=0       - undo
//   -mode=1       - redo
//   -stopOnSaved

// Usage:
//   Call("Scripts::Main", 1, "undoRedoAll.js", "-mode=0 -stopOnSaved=true")

var AEM_CANUNDO = 3075;
var AEM_CANREDO = 3076;
var AEM_UNDO    = 3077;
var AEM_REDO    = 3078;

var MODE_UNDO = 0;
var MODE_REDO = 1;

// Read arguments:
var args = {};
for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; i++)
	if(/^-(\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
		args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
function getArg(argName, defaultVal) {
	return typeof args[argName] == "undefined" // argName in args
		? defaultVal
		: args[argName];
}

var mode        = getArg("mode",        0);
var stopOnSaved = getArg("stoponsaved", false);

var CAN_ACTION = AEM_CANUNDO;
var ACTION     = AEM_UNDO;
if(mode == MODE_REDO) {
	CAN_ACTION = AEM_CANREDO;
	ACTION     = AEM_REDO;
}

var hEditWnd = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(
	AkelPad.GetMainWnd()
	&& AkelPad.IsAkelEdit()
	&& canAction()
) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(lpPoint) {
		setRedraw(hEditWnd, false);
		AkelPad.SendMessage(hEditWnd, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

		do action();
		while(canAction());

		AkelPad.SendMessage(hEditWnd, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
		setRedraw(hEditWnd, true);
		AkelPad.MemFree(lpPoint);
	}
}
function canAction() {
	return (stopOnSaved ? AkelPad.SendMessage(hEditWnd, 3086 /*AEM_GETMODIFY*/, 0, 0) : true)
		&& AkelPad.SendMessage(hEditWnd, CAN_ACTION, 0, 0);
}
function action() {
	AkelPad.SendMessage(hEditWnd, ACTION, 0, 0);
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	if(bRedraw)
		oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}