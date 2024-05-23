// https://akelpad.sourceforge.net/forum/viewtopic.php?p=9926#p9926
// https://infocatcher.ucoz.net/js/akelpad_scripts/insertEval.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/insertEval.js

// (c) Infocatcher 2010-2023
// Version: 0.2.0pre5 - 2023-03-18
// Author: Infocatcher

//// Script like built-in Calculator.js

//===================
// Special expression:
//   someExpression()=  =>  "someExpression() = result"
// Example:
//   2+2=    =>  "2+2 = 4"
// Conversions:
//   2*8=b      =>  "2*8 = 0b10000" (or =0b)
//   2*8=o      =>  "2*8 = 0o20"    (or =0o)
//   2*8=x      =>  "2*8 = 0x10"    (or =0x or =h)
//   431=x      =>  "431 = 0x1af"   (in lower case by default, use -hexUpper=true to invert)
//   431=X      =>  "431 = 0x1AF"   (or =0X or =H, in upper case, use -hexUpper=true to invert)
//   1234=p     =>  "1234 = 1 234"
//   1 123+5=   =>  "1 123+5 = 1 128" (with -formatted=1/-formatted=2 + no conversion)
//   1 123+5=r  =>  "1 123+5 = 1128"  (with -formatted=1/-formatted=2 + raw conversion)
// Or type "=", "=b", "=o", "=x" or "=p" in result prompt to force print "expression = result"
// (and optionally apply converter)

// Arguments:
//   -useLogPlugin=true     - (default) use Log plugin to show results of _log() calls and for read-only documents
//                =false    - show results in new document (as in old versions)
//   -useSpaces=true        - (default) 2+2= => "2+2 = 4"
//             =false       -           2+2= => "2+2=4"
//   -formatted=0           - handle js-expressions as is
//             =1           - (default) try handle formatted numbers: 1 234,15 + 1,85 -> 1234.15 + 1.85
//             =2           - try handle formatted numbers + don't show warning in result prompt
//   -fixFloatNumbers=true  - try fix "bugs" with floating point operations like 0.3/0.1 = 2.9999999999999995
//   -hexUpper=true         - use upper case for hex numbers (0x12abf -> 0x12ABF) + lower case with =X/=H
//            =false        - (default) use default lower case for hex numbers + upper case with =X/=H

// Usage:
//   Call("Scripts::Main", 1, "insertEval.js")
//   Call("Scripts::Main", 1, "insertEval.js", "-useLogPlugin=false -useSpaces=false")
//===================

(function(evalWrapper) {
var useLogPlugin     = AkelPad.GetArgValue("useLogPlugin", true);
var useSpaces        = AkelPad.GetArgValue("useSpaces", true);
var formattedNumbers = AkelPad.GetArgValue("formatted", true);
var fixFloatNumbers  = AkelPad.GetArgValue("fixFloatNumbers", true);
var binOctNumbers    = AkelPad.GetArgValue("binOctNumbers", true);
var showWarnings     = AkelPad.GetArgValue("warnings", true);
var hexUpper         = AkelPad.GetArgValue("hexUpper", false);

function _localize(s) {
	var strings = {
		"Expression:": {
			ru: "Выражение:"
		},
		"Result:": {
			ru: "Результат:"
		},
		"* handled formatted numbers": {
			ru: "* обработаны отформатированные числа"
		},
		"* handled binary and octal numbers": {
			ru: "* обработаны двоичные и восьмеричные числа"
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
var hWndEdit = AkelPad.GetEditWnd();
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
	alert: function(msg) {
		AkelPad.MessageBox(hMainWnd, "" + msg, dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
	},
	prompt: function(msg, defaultVal) {
		var ret = AkelPad.InputBox(hMainWnd, dialogTitle, "" + msg, "" + defaultVal);
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

	hex: function(n, u) {
		var h = (+n).toString(16);
		if(u !== undefined ? u : hexUpper)
			h = h.toUpperCase();
		return "0x" + h;
	},
	HEX: function(n) {
		return this.hex(n, !hexUpper);
	},
	oct: function(n) {
		return "0o" + (+n).toString(8);
	},
	bin: function(n) {
		return "0b" + (+n).toString(2);
	},
	p: function(n) {
		return toLocaleNum(formatNum(n));
	},
	raw: function(n) { // Leave as is, e.g. for raw result of formatted expression
		return n;
	},

	unformat: function(s) {
		// Try ignore comments:
		// Handled data // commented
		var skip;
		var out = s.replace(/^([^\r\n]*?)(\/\/[^\r\n]*)?$/mg, function(s, start, comment) {
			if(
				skip
				|| /\(\d+(,\d+)+\)/.test(start) // Expression like Math.pow(2,10)
				|| /\d+,\d+,\d+/.test(start) // Expression like [1,2,3]
			) {
				skip = true;
				return s;
			}
			return start
				.replace(/(\d+)[ \xa0\u2002\u2003\u2009](?=\d)/g, "$1") // 12 345 -> 12345
				.replace(/(\d+),(\d+)(?!,)/g, "$1.$2") // 1,23 -> 1.23
				+ (comment || "");
		});
		return skip ? s : out;
	},

	append: function(s) {
		var sep = "\n";
		s += "";

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
		setRedraw(hWndEdit, false);
		AkelPad.SetSel(0, -1);
		AkelPad.ReplaceSel(utils._logMsgs.join("\n"));
		AkelPad.SetSel(0, 0);
		isCoderRunning() && AkelPad.Call("Coder::Settings", 1, ".js");
		setRedraw(hWndEdit, true);
	}
};
utils.h = utils.x = utils.hex;
utils.H = utils.X = utils.HEX;
utils.o = utils.oct;
utils.b = utils.bin;
utils.r = utils.raw;
utils.window = utils;

function formatNum(n) {
	// 1234567.1234567 -> 1 234 567.1 234 567
	//return Number(n).toLocaleString().replace(/\s*[^\d\s\xa0\u2002\u2003\u2009].*$/, "");
	return ("" + n).replace(/(\d)(?=(\d{3})+(\D|$))/g, "$1\xa0");
}
function toLocaleNum(n) {
	// Apply locale settings: 1 234 567,1 234 567 (Russian), 1,234,567.1,234,567 (English), etc.
	if(!localeNumbers.delimiter)
		localeNumbers();
	return ("" + n)
		// We may have \xa0 in localeNumbers.delimiter
		.replace(/\./g,   "\0.\0")
		.replace(/\xa0/g, "\0 \0")
		.replace(/\0\.\0/g, localeNumbers.delimiter)
		.replace(/\0 \0/g,  localeNumbers.separator);
}
function localeNumbers() {
	// Detect locale delimiter (e.g. 0.1 -> 0,1)
	if(/(\D+)\d+\D*$/.test((1.1).toLocaleString()))
		var ld = RegExp.$1;
	// Detect locale separator (e.g. 123456 -> 123 456 or 123,456)
	if(/^\D*\d+(\D+)/.test((1234567890123).toLocaleString()))
		var ls = RegExp.$1;
	localeNumbers.delimiter = ld && ls ? ld : ".";
	localeNumbers.separator = ld && ls ? ls : "\xa0";
}
function fixPrecision(n, prec) {
	// Try fix "bugs" with floating point operations
	// E.g. 0.3/0.1 = 2.9999999999999995
	return n.toPrecision(prec || 13)
		.replace(/\.0+(e|$)/, "$1") // 1.000 and 1.000e5 => 1
		.replace(/(\.\d*[^0])0+(e|$)/, "$1$2"); // 1.200 and 1.200e5 => 1.2
}

function calc(expr, forceAsk) {
	if(!expr || forceAsk)
		expr = utils.prompt(_localize("Expression:"), expr);
	if(!expr)
		return;
	var resType = RegExp.$1 = ""; // Force reset
	if(
		// =2+2 (legacy)
		/^\s*=\s*/.test(expr)
		// 2+2= (since 2018-08-21)
		// 2+2=b -> 0b100 (since 2018-09-03)
		|| /\s*=\s*(0?[xob]|oct|bin|h(ex)?|p|r(aw)?)?$/i.test(expr)
	) {
		expr = RegExp.rightContext || RegExp.leftContext;
		resType = getConverter(RegExp.$1);
		var extOutput = true;
	}
	if(!resType && /^\s*0x[\da-f]/i.test(expr))
		resType = "x";
	if(formattedNumbers) {
		var exprRaw = expr;
		expr = utils.unformat(expr);
		if(expr != exprRaw) {
			if(!resType)
				resType = "p";
			var unformatted = true;
		}
	}
	if(binOctNumbers) try {
		eval("0b1");
	}
	catch(e) {
		if(!exprRaw)
			exprRaw = expr;
		var exprBORaw = expr;
		expr = expr
			.replace(/0b([01]+)(?=\D|$)/gi, "parseInt($1, 2)")
			.replace(/0o([0-7]+)(?=\D|$)/gi, "parseInt($1, 8)");
		var hasBinOct = expr != exprBORaw;
		exprBORaw = undefined;
	}
	var res;
	try {
		res = evalWrapper(expr, utils);
	}
	catch(e) {
		var err = e.name + "\n" + e.message;
		if(exprRaw && expr != exprRaw)
			err += "\n\nUnformatted expression:\n" + expr;
		AkelPad.MessageBox(hMainWnd, err, dialogTitle, 16 /*MB_ICONERROR*/);
		calc(expr, true);
		return;
	}
	if(fixFloatNumbers && typeof res == "number" && isFinite(res))
		res = +fixPrecision(res);
	var resRaw = res;
	res = convType(res, resType);
	utils._openLog();
	var msg = _localize("Result:");
	if(showWarnings && unformatted)
		msg += "\n" + _localize("* handled formatted numbers");
	if(showWarnings && hasBinOct)
		msg += "\n" + _localize("* handled binary and octal numbers");
	var newExpr = utils.prompt(msg, res);
	if(!newExpr)
		return; // Cancel
	if(newExpr != res) {
		if(
			/^\s*=\s*(0?[xob]|oct|bin|h(ex)?|p|r(aw)?)?$/i.test(newExpr) // "=", "=p", "=x" & Co
			|| /^\s*(0?[xob]|oct|bin|h(ex)?|p|r(aw)?)$/i.test(newExpr) // "p", "x" & Co (without "=", looks like typo)
		) {
			var rt = getConverter(RegExp.$1);
			if(rt)
				res = convType(resRaw, rt);
			extOutput = true;
		}
		else {
			calc(newExpr);
			return;
		}
	}
	if(extOutput) {
		var sp = useSpaces ? " " : "";
		res = (exprRaw || expr) + (/[\r\n]$/.test(expr) ? "=" : sp + "=") + sp + res;
	}
	if(res == AkelPad.GetSelText())
		return;
	if(!AkelPad.GetEditReadOnly(hWndEdit))
		AkelPad.ReplaceSel(res);
	else {
		utils._log(res);
		utils._openLog();
	}
}

function getConverter(key) {
	key = key.replace(/^0/, "");
	if(typeof utils[key] == "function")
		return key;
	return key.toLowerCase();
}
function convType(res, resType) {
	if(resType && typeof utils[resType] == "function" && typeof res == "number" && isFinite(res))
		return utils[resType](res);
	return res;
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
})(function evalWrapper(expr, utils) {
	with(Math) with(WScript) with(utils) with(AkelPad)
		return eval(expr);
});