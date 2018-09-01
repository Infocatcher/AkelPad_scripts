﻿// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9926#9926
// http://infocatcher.ucoz.net/js/akelpad_scripts/insertEval.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/insertEval.js

// (c) Infocatcher 2010-2011
// Version: 0.1.9 - 2011-12-20
// Author: Infocatcher

//// Script like built-in Calculator.js

//===================
// Special expressions:
//   =someExpression()  =>  "someExpression() = result"
//   someExpression()=  =>  "someExpression() = result"
// Example:
//   2+2=  =>  "2+2 = 4"

// Usage:
//   Call("Scripts::Main", 1, "insertEval.js")
//===================

var useLogPlugin = true;

function _localize(s) {
	var strings = {
		"Expression:": {
			ru: "Выражение:"
		},
		"Result:": {
			ru: "Результат:"
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
var oSys = AkelPad.SystemFunction();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

if(
	useLogPlugin
	&& oSys.Call(
		"kernel32::GetFileAttributes" + _TCHAR,
		AkelPad.GetAkelDir(4 /*ADTYPE_PLUGS*/) + "\\Log.dll"
	) == -1
)
	useLogPlugin = false;

var document = new ActiveXObject("htmlfile");
// Initialize document (we can't use something like document.documentElement without this):
document.open();
document.close();
var window = document.parentWindow;

var utils = {
	alert: function(msg, icon, addTitle) {
		AkelPad.MessageBox(hMainWnd, "" + msg, dialogTitle + (addTitle ? " :: " + addTitle : ""), icon || 48 /*MB_ICONEXCLAMATION*/);
	},
	prompt: function(msg, defaultVal) {
		var ret = AkelPad.InputBox(hMainWnd, dialogTitle, "" + msg, defaultVal);
		return ret == undefined ? null : ret;
	},
	confirm: function(msg) {
		return AkelPad.MessageBox(hMainWnd, "" + msg, dialogTitle, 33 /*MB_OKCANCEL|MB_ICONQUESTION*/) == 1 /*IDOK*/;
	},
	setTimeout: function(func, delay) {
		return window.setTimeout(func, delay);
	},
	setInterval: function(func, delay) {
		return window.setInterval(func, delay);
	},
	clearTimeout: function(id) {
		window.clearTimeout(id);
	},
	clearInterval: function(id) {
		window.clearInterval(id);
	},
	document: {
		open: function() {},
		write: function(s) {
			utils._log("document.write():\n" + s);
		},
		writeln: function(s) {
			utils._log("document.writeln():\n" + s);
		},
		close: function() {}
	},
	print: function(s) {
		this._log("print():\n" + s);
	},

	hex: function(n) {
		return "0x" + (+n).toString(16);
	},
	oct: function(n) {
		return "0o" + (+n).toString(8);
	},
	bin: function(n) {
		return "0b" + (+n).toString(2);
	},
	p: function(n) {
		return ("" + n).replace(/(\d)(?=(?:\d{3})+(?:\D|$))/g, "$1 ");
	},

	append: function(s) {
		var sep = "\n";
		s += "";

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
		//for(var i = 0, l = arguments.length; i < l; i++)
		//	this._logMsgs.push(arguments[i]);
		var s = Array.prototype.join.call(arguments, "\n");
		if(useLogPlugin)
			AkelPad.Call("Log::Output", 4, s, s.length, 2, 0, ".js");
		else
			this._logMsgs.push(s);
	},
	_openLog: function() {
		if(!this._logMsgs.length)
			return;
		AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
		var hWndEdit = AkelPad.GetEditWnd();
		setRedraw(hWndEdit, false);
		AkelPad.SetSel(0, -1);
		AkelPad.ReplaceSel(utils._logMsgs.join("\n"));
		AkelPad.SetSel(0, 0);
		isCoderRunning() && AkelPad.Call("Coder::Settings", 1, ".js");
		setRedraw(hWndEdit, true);
	}
};
utils.h = utils.hex;
utils.o = utils.oct;
utils.b = utils.bin;
utils.window = utils;

function calc(expr, forceAsk) {
	if(!expr || forceAsk)
		expr = utils.prompt(_localize("Expression:"), expr);
	if(!expr)
		return;
	if(/^\s*=\s*/.test(expr) || /[ \t]*=\s*$/.test(expr)) { // =2+2 (legacy) or 2+2= (since 2018-08-21)
		expr = RegExp.rightContext || RegExp.leftContext;
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
		res += "";
	utils._openLog();
	var newExpr = utils.prompt(_localize("Result:"), res);
	if(!newExpr)
		return; // Cancel
	if(newExpr != res) {
		if(newExpr == "=")
			extOutput = true;
		else {
			calc(newExpr);
			return;
		}
	}
	if(extOutput)
		res = expr + (/[\r\n]$/.test(expr) ? "= " : " = ") + res;
	if(res == AkelPad.GetSelText())
		return;
	if(!AkelPad.GetEditReadOnly(AkelPad.GetEditWnd()))
		AkelPad.ReplaceSel(res);
	else {
		utils._log(res);
		utils._openLog();
	}
}

hMainWnd && calc(AkelPad.GetSelText());

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}
function isCoderRunning() {
	return AkelPad.IsPluginRunning("Coder::HighLight")
		|| AkelPad.IsPluginRunning("Coder::AutoComplete")
		|| AkelPad.IsPluginRunning("Coder::CodeFold");
}