// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9926#9926
// http://infocatcher.ucoz.net/js/akelpad_scripts/insertEval.js

// (c) Infocatcher 2010-2011
// version 0.1.9 - 2011-12-20

//===================
// Special expressions:
// =someExpression() => "someExpression() = result"

// Usage:
//   Call("Scripts::Main", 1, "insertEval.js")
//===================

function _localize(s) {
	var strings = {
		"Expression:": {
			ru: "Выражение:"
		},
		"Result:": {
			ru: "Результат:"
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
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

var document = new ActiveXObject("htmlfile");
// Initialize document (we can't use something like document.documentElement without this):
document.open();
document.close();
var window = document.parentWindow;

var utils = {
	alert: function(msg, icon, addTitle) {
		AkelPad.MessageBox(hMainWnd, String(msg), dialogTitle + (addTitle ? " :: " + addTitle : ""), icon || 48 /*MB_ICONEXCLAMATION*/);
	},
	prompt: function(msg, defaultVel) {
		var ret = AkelPad.InputBox(hMainWnd, dialogTitle, String(msg), defaultVel);
		return ret == undefined ? null : ret;
	},
	confirm: function(msg) {
		return AkelPad.MessageBox(hMainWnd, String(msg), dialogTitle, 33 /*MB_OKCANCEL|MB_ICONQUESTION*/) == 1 /*IDOK*/;
	},
	setTimeout: function(func, delay) {
		return window.setTimeout(func, delay);
	},
	setInterval: function(func, delay) {
		return window.setInterval(func, delay);
	},
	document: {
		open: function() {},
		write: function(s) {
			utils.alert(s, null, "document.write");
		},
		writeln: function(s) {
			utils.alert(s, null, "document.writeln");
		},
		close: function() {}
	},
	print: function(s) {
		utils.alert(s, null, "print");
	},

	hex: function(n) {
		n = Number(n);
		return (n < 0 ? "-" : "") + "0x" + Math.abs(n).toString(16);
	},
	oct: function(n) {
		return "0" + Number(n).toString(8);
	},
	bin: function(n) {
		return "b" + Number(n).toString(2);
	},
	p: function(n) {
		return String(n).replace(/(\d)(?=(?:\d{3})+(?:\D|$))/g, "$1 ");
	},

	append: function(s) {
		var sep = "\n";
		s = String(s);

		var hWndEdit = AkelPad.GetEditWnd();
		setRedraw(hWndEdit, false);

		var se = AkelPad.GetSelEnd();
		AkelPad.SetSel(se, se);
		AkelPad.ReplaceSel(sep + s);
		se += sep.length;
		AkelPad.SetSel(se, se + s.length);

		setRedraw(hWndEdit, true);
	},

	_logMsgs: [],
	_log: function() {
		for(var i = 0, l = arguments.length; i < l; i++)
			this._logMsgs.push(arguments[i]);
	}
};
utils.window = utils;

function calc(expr, forceAsk) {
	if(!expr || forceAsk)
		expr = utils.prompt(_localize("Expression:"), expr);
	if(!expr)
		return;
	if(/^\s*=\s*/.test(expr)) {
		expr = expr.substr(RegExp.lastMatch.length);
		var extOutput = true;
	}
	var isHex = /^0x[\da-f]/i.test(expr);
	var res;
	try {
		with(Math) with(WScript) with(utils) with(AkelPad)
			res = eval(expr);
	}
	catch(e) {
		utils.alert(e.name + "\n" + e.message, 16 /*MB_ICONERROR*/);
		calc(expr, true);
		return;
	}
	if(isHex && typeof res == "number")
		res = utils.hex(res);
	else
		res = String(res);
	var newExpr = utils.prompt(_localize("Result:"), res);
	if(!newExpr)
		return; // Cancel
	if(newExpr != res) {
		calc(newExpr);
		return;
	}
	if(extOutput)
		res = expr + " = " + res;
	if(res == AkelPad.GetSelText())
		return;
	if(!AkelPad.GetEditReadOnly(AkelPad.GetEditWnd()))
		AkelPad.ReplaceSel(res);
}

if(hMainWnd) {
	calc(AkelPad.GetSelText());
	if(utils._logMsgs.length) {
		AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
		AkelPad.SetSel(0, 0);
		insertNoScroll(utils._logMsgs.join("\n"), true);
	}
}

function insertNoScroll(str, selectAll) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	var hWndEdit = AkelPad.GetEditWnd();
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	selectAll && AkelPad.SetSel(0, -1);
	AkelPad.ReplaceSel(str);
	AkelPad.SetSel(0, 0);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}