// https://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#p9927
// https://infocatcher.ucoz.net/js/akelpad_scripts/textStatistics.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/textStatistics.js

// (c) Infocatcher 2008-2022
// Version: 0.4.0pre - 2022-11-19
// Author: Infocatcher

//// Provide some statistic for English and Russian texts

// Arguments:
//   -maxLine=40    - maximum displayed symbols for longest line
//   -maxMixed=5    - maximum displayed words with mixed Cyrillic/Latin symbols
//   -maxWord=40    - maximum displayed symbols for words with mixed Cyrillic/Latin symbols

// Usage:
//   Call("Scripts::Main", 1, "textStatistics.js")
//   Call("Scripts::Main", 1, "textStatistics.js", "-maxLine=60 -maxWord=50 -maxMixed=10")

// Windows XP+ (?)

var maxLine = AkelPad.GetArgValue("maxLine", 40);
var maxMixed = AkelPad.GetArgValue("maxMixed", 5);
var maxWord = AkelPad.GetArgValue("maxWord", 40);

function _localize(s) {
	var strings = {
		"Statistics…": {
			ru: "Статистика…"
		},
		"[selected text]": {
			ru: "[выделенный текст]"
		},
		"Text missing!": {
			ru: "Текст отсутствует!"
		},
		"Lines and spaces…": {
			ru: "Строки и пробелы…"
		},
		"Lines: ": {
			ru: "Строки: "
		},
		"Only spaces: ": {
			ru: "Только пробельные символы: "
		},
		"Empty: ": {
			ru: "Пустые: "
		},
		"Lines length…": {
			ru: "Длина строк…"
		},
		"Shortest line: %L": {
			ru: "Самая короткая строка: %L"
		},
		"Longest line: %L": {
			ru: "Самая длинная строка: %L"
		},
		"%N: “%S”": {
			ru: "%N: «%S»"
		},
		"Symbols…": {
			ru: "Символы…"
		},
		"Symbols: ": {
			ru: "Символы: "
		},
		"Cyrillic: ": {
			ru: "Кириллица: "
		},
		"Latin: ": {
			ru: "Латиница: "
		},
		"Digits: ": {
			ru: "Цифры: "
		},
		"Space symbols: ": {
			ru: "Пробельные символы: "
		},
		"Spaces: ": {
			ru: "Пробелы: "
		},
		"Tabs: ": {
			ru: "Табуляции: "
		},
		"Carriage returns (\\r): ": {
			ru: "Возвраты каретки (\\r): "
		},
		"Line feeds (\\n): ": {
			ru: "Переводы строки (\\n): "
		},
		"Words…": {
			ru: "Слова…"
		},
		"Words: ": {
			ru: "Слова: "
		},
		"Cyrillic: ": {
			ru: "Кириллица: "
		},
		"Latin: ": {
			ru: "Латиница: "
		},
		"Mixed symbols…": {
			ru: "Смешанные символы…"
		},
		"Mixed Cyrillic+Latin: ": {
			ru: "Смешанная кириллица с латиницей: "
		},
		"Numbers…": {
			ru: "Числа…"
		},
		"Numbers: ": {
			ru: "Числа: "
		},
		"Decimal: ": {
			ru: "Десятичные: "
		},
		"Hexadecimal: ": {
			ru: "Шестнадцатеричные: "
		},
		"n/a": {
			ru: "н/д"
		},
		"Warning! Executed with errors:\n%E": {
			ru: "Внимание! Выполнено с ошибками:\n%E"
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

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd)
	showTextStatistics();

function showTextStatistics() {
	var res = getTextStatistics();
	AkelPad.MessageBox(hMainWnd, res, WScript.ScriptName, 64 /*MB_ICONINFORMATION*/);
}
function getTextStatistics() {
	var statusbar = new Statusbar();
	statusbar.save();
	function progress(percent, msg) {
		statusbar.set(percent + "% " + msg);
	}
	progress(0, _localize("Statistics…"));

	var cFile = AkelPad.GetEditFile(0);
	var newLine = 4 - AkelPad.GetEditNewLine(0);
	var txt = AkelPad.GetSelText(newLine);
	if(txt)
		var selMark = _localize("[selected text]");
	else {
		txt = cFile // Prefer ReadFile() to preserve all newline characters as is
			? AkelPad.ReadFile(cFile, 0, AkelPad.GetEditCodePage(0), AkelPad.GetEditBOM(0))
			: AkelPad.GetTextRange(0, -1, newLine);
	}
	if(!txt)
		return _localize("Text missing!");

	progress(10, _localize("Lines and spaces…"));

	var txtn = txt.replace(/\r\n?/g, "\n"); // Strange things happens with \r\n
	var res = cFile
		? cFile + ":\n" + (selMark ? selMark + "\n\n" : "\n")
		: (selMark ? selMark + "\n\n" : "");

	res +=          _localize("Lines: ")       + formatNum(countOf(txtn, /^/mg)) + "\n";
	res += "  – " + _localize("Only spaces: ") + formatNum(countOf(txt, /^[\t ]+$/mg)) + "\n";
	res += "  – " + _localize("Empty: ")       + formatNum(countOf(txtn, /^$/mg)) + "\n";

	res += "\n";
	progress(20, _localize("Lines length…"));

	var longestLine  = -1,       longestLineNum,  longestLineText;
	var shortestLine = Infinity, shortestLineNum, shortestLineText;
	var lines = txtn.split("\n");
	var curLine, curLen;
	var tabStop = AkelPad.SendMessage(AkelPad.GetEditWnd(), 3239 /*AEM_GETTABSTOP*/, 0, 0) || 8;
	for(var i = 0, l = lines.length; i < l; ++i) {
		curLine = lines[i];
		curLen = curLine.length;

		var ti = curLine.indexOf("\t");
		if(ti != -1) {
			var tabWidth, dw;
			for(var j = ti, column = ti, ll = curLen; j < ll; ++j, ++column) {
				if(curLine.charAt(j) != "\t")
					continue;
				tabWidth = tabStop - column % tabStop;
				if(tabWidth <= 1)
					continue;
				dw = tabWidth - 1;
				curLen += dw;
				column += dw;
			}
		}

		if(curLen > longestLine) {
			longestLine = curLen;
			longestLineNum = i + 1;
			longestLineText = curLine;
		}
		if(curLen < shortestLine) {
			shortestLine = curLen;
			shortestLineNum = i + 1;
			shortestLineText = curLine;
		}
	}
	lines = null;

	var dl = ("" + longestLineNum).length - ("" + shortestLineNum).length;
	if(dl > 0)
		shortestLineNum = stringRepeat("0", dl) + shortestLineNum;
	else if(dl < 0)
		longestLineNum = stringRepeat("0", -dl) + longestLineNum;

	res +=          _localize("Longest line: %L").replace("%L", formatNum(longestLine)) + "\n";
	res += "  – " + _localize("%N: “%S”").replace("%N", longestLineNum).replace("%S", formatLine(longestLineText)) + "\n";
	res +=          _localize("Shortest line: %L").replace("%L", formatNum(shortestLine)) + "\n";
	res += "  – " + _localize("%N: “%S”").replace("%N", shortestLineNum).replace("%S", formatLine(shortestLineText)) + "\n";

	res += "\n";
	progress(40, _localize("Symbols…"));

	res +=             _localize("Symbols: ")                + formatNum(txt.length) + "\n";
	res += "  – "    + _localize("Cyrillic: ")               + formatNum(countOf(txt, /[а-яё]/ig)) + "\n";
	res += "  – "    + _localize("Latin: ")                  + formatNum(countOf(txt, /[a-z]/ig)) + "\n";
	res += "  – "    + _localize("Digits: ")                 + formatNum(countOf(txt, /\d/g)) + "\n";
	res += "  – "    + _localize("Space symbols: ")          + formatNum(countOf(txt, /\s/g)) + "\n";
	res += "     = " + _localize("Spaces: ")                 + formatNum(countOf(txt, / /g)) + "\n";
	res += "     = " + _localize("Tabs: ")                   + formatNum(countOf(txt, /\t/g)) + "\n";
	res += "     = " + _localize("Carriage returns (\\r): ") + formatNum(countOf(txt, /\r/g)) + "\n";
	res += "     = " + _localize("Line feeds (\\n): ")       + formatNum(countOf(txt, /\n/g)) + "\n";

	res += "\n";
	progress(50, _localize("Words…"));

	var wordsCyr = countOf(txt, /(^|\s|[^-а-яёa-z\d])[а-яё]+(-[а-яё]+)*(?=$|\s|[^-а-яёa-z\d])/ig);
	var wordsLat = countOf(txt, /(^|\s|[^-а-яёa-z\d])[a-z]+(-[a-z]+)*('[st])?(?=$|\s|[^-а-яёa-z\d])/ig);
	res +=          _localize("Words: ")    + formatNum(wordsCyr + wordsLat) + "\n";
	res += "  – " + _localize("Cyrillic: ") + formatNum(wordsCyr) + "\n";
	res += "  – " + _localize("Latin: ")    + formatNum(wordsLat) + "\n";

	res += "\n";
	progress(60, _localize("Mixed symbols…"));

	try {
		var cyrLatMixM = txt.match(/((\\)?[a-z][-\wа-яё]*[а-яё]|[а-яё][-\wа-яё]*[a-z])/ig);
		var cyrLatMix = cyrLatMixM ? cyrLatMixM.length : 0;

		progress(70, _localize("Mixed symbols…"));
		var filtered = [];
		for(var i = 0; i < cyrLatMix; ++i) {
			var s = cyrLatMixM[i];
			if(
				/^[a-z]+-[а-яё]+$/i.test(s) // Something like "esc-последовательность"
				|| /^\\[rn][а-яёА-ЯЁ]+$/.test(s) // Ignore \n and \r: "…\nНовая строка"
			)
				continue;
			filtered.push(s.replace(/^\\/, ""));
		}
		cyrLatMixM = filtered;
		cyrLatMix = filtered.length;
		filtered = null;
	}
	catch(e) {
		getTextStatistics.__error = e && e.message || ("" + e);
		cyrLatMix = NaN;
	}

	res += _localize("Mixed Cyrillic+Latin: ") + formatNum(cyrLatMix) + "\n";
	for(var i = 0, max = Math.min(maxMixed, cyrLatMix); i < max; ++i)
		res += "  – " + formatWord(cyrLatMixM[i]) + "\n";
	cyrLatMixM = null;
	if(maxMixed && cyrLatMix > maxMixed)
		res += "  …\n";

	res += "\n";
	progress(80, _localize("Numbers…"));

	var numsDec = countOf(txt, /(^|\W)\d+([.,]\d+)?(?=(\W|$))/g); // Be careful with numbers like "0,2"
	var numsHex = countOf(txt, /(^|\W)0x[\da-f]+(?=(\W|$))/ig);
	res +=          _localize("Numbers: ")     + formatNum(numsDec + numsHex) + "\n";
	res += "  – " + _localize("Decimal: ")     + formatNum(numsDec) + "\n";
	res += "  – " + _localize("Hexadecimal: ") + formatNum(numsHex) + "\n";

	if(getTextStatistics.__error) {
		res += "\n" + _localize("Warning! Executed with errors:\n%E")
			.replace("%E", getTextStatistics.__error);
	}

	statusbar.restore();

	return res;
}
function countOf(txt, regexp) {
	try {
		var m = txt.match(regexp);
		return m ? m.length : 0;
	}
	catch(e) {
		getTextStatistics.__error = e && e.message || ("" + e);
		return NaN;
	}
}
function formatNum(n) {
	if(isNaN(n))
		return _localize("n/a");
	// 1234567 -> 1 234 567
	return ("" + n).replace(/(\d)(?=(\d{3})+(\D|$))/g, "$1\xa0");
}
function formatWord(s) {
	var maxLength = maxWord;
	if(s.length > maxLength)
		return s.substr(0, maxLength) + "…";
	return s;
}
function formatLine(s) {
	var maxLength = maxLine;
	var tabWidth = AkelPad.SendMessage(AkelPad.GetEditWnd(), 3239 /*AEM_GETTABSTOP*/, 0, 0) || 8;
	var tab = stringRepeat(" ", tabWidth);
	var ret = s.substr(0, maxLength);
	while(ret.replace(/\t/g, tab).length > maxLength)
		ret = ret.substr(0, ret.length - 1);
	return ret == s
		? ret
		: ret + "…";
}
function stringRepeat(pattern, count) {
	// See https://stackoverflow.com/questions/202605/repeat-string-javascript
	if(count < 1)
		return "";
	var result = "";
	while(count > 1) {
		if(count & 1)
			result += pattern;
		count >>= 1;
		pattern += pattern;
	}
	return result + pattern;
}

function Statusbar() {
	this.get = this.set = this.save = this.restore = this.destroy = function() {};

	// Based on Instructor's code: https://akelpad.sourceforge.net/forum/viewtopic.php?p=13656#p13656
	var hWndStatus = oSys.Call("user32::GetDlgItem", hMainWnd, 10002 /*ID_STATUS*/);
	if(!hWndStatus || !oSys.Call("user32::IsWindowVisible", hWndStatus))
		return;
	var nParts = AkelPad.SendMessage(hWndStatus, 1030 /*SB_GETPARTS*/, 0, 0);
	if(nParts <= 5)
		return;
	var lpTextBuffer = AkelPad.MemAlloc(1024 * _TSIZE);
	if(!lpTextBuffer)
		return;
	var _origStatus, _customStatus;
	this.get = function() {
		AkelPad.SendMessage(hWndStatus, _TSTR ? 1037 /*SB_GETTEXTW*/ : 1026 /*SB_GETTEXTA*/, nParts - 1, lpTextBuffer);
		return AkelPad.MemRead(lpTextBuffer, _TSTR);
	};
	this.set = function(pStatusText) {
		_customStatus = pStatusText;
		AkelPad.MemCopy(lpTextBuffer, pStatusText, _TSTR);
		AkelPad.SendMessage(hWndStatus, _TSTR ? 1035 /*SB_SETTEXTW*/ : 1025 /*SB_SETTEXTA*/, nParts - 1, lpTextBuffer);
	};
	this.save = function() {
		_origStatus = this.get();
	};
	this.restore = function() {
		if(_origStatus != undefined && this.get() == _customStatus)
			this.set(_origStatus);
		this.destroy();
	};
	this.destroy = function() {
		AkelPad.MemFree(lpTextBuffer);
	};
}