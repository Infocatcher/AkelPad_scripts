﻿// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#9927
// http://infocatcher.ucoz.net/js/akelpad_scripts/textStatistics.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/textStatistics.js

// (c) Infocatcher 2008-2011
// Version: 0.3.4 - 2011-12-20
// Author: Infocatcher

//// Provide some statistic for English and Russian texts

// Usage:
//   Call("Scripts::Main", 1, "textStatistics.js")

// Windows XP+ (?)

function _localize(s) {
	var strings = {
		"[selected text]": {
			ru: "[выделенный текст]"
		},
		"Text missing!": {
			ru: "Текст отсутствует!"
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
		"Shortest line: %L": {
			ru: "Самая короткая строка: %L"
		},
		"Longest line: %L": {
			ru: "Самая длинная строка: %L"
		},
		"%N: “%S”": {
			ru: "%N: «%S»"
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
		"Mixed Cyrillic+Latin: ": {
			ru: "Смешанная кириллица с латиницей: "
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
		"Words: ": {
			ru: "Слова: "
		},
		"Cyrillic: ": {
			ru: "Кириллица: "
		},
		"Latin: ": {
			ru: "Латиница: "
		},
		"Numbers: ": {
			ru: "Числа: "
		},
		"Decimal: ": {
			ru: "Десятичные: "
		},
		"Hexadecimal: ": {
			ru: "Шестнадцатеричные: "
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

if(hMainWnd)
	showTextStatistics();

function showTextStatistics() {
	var res = getTextStatistics();
	AkelPad.MessageBox(hMainWnd, res, WScript.ScriptName, 64 /*MB_ICONINFORMATION*/);
}
function getTextStatistics() {
	var newLine = 4 - AkelPad.GetEditNewLine(0);
	var txt = AkelPad.GetSelText(newLine);
	if(txt)
		var selMark = _localize("[selected text]");
	else
		txt = AkelPad.GetTextRange(0, -1, newLine);
	if(!txt)
		return _localize("Text missing!");
	var txtn = txt.replace(/\r\n|\n\r|\n|\r/g, "\n"); // Strange things happens with \r\n
	var cFile = AkelPad.GetEditFile(0);
	var res = cFile
		? cFile + ":\n" + (selMark ? selMark + "\n\n" : "\n")
		: (selMark ? selMark + "\n\n" : "");

	res +=          _localize("Lines: ")       + formatNum(countOf(txtn, /^/mg)) + "\n";
	res += "  – " + _localize("Only spaces: ") + formatNum(countOf(txt, /^[\t ]+$/mg)) + "\n";
	res += "  – " + _localize("Empty: ")       + formatNum(countOf(txtn, /^$/mg)) + "\n";

	res += "\n";

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

	res +=          _localize("Longest line: %L").replace("%L", formatNum(longestLine)) + "\n";
	res += "  – " + _localize("%N: “%S”").replace("%N", longestLineNum).replace("%S", formatLine(longestLineText)) + "\n";
	res +=          _localize("Shortest line: %L").replace("%L", formatNum(shortestLine)) + "\n";
	res += "  – " + _localize("%N: “%S”").replace("%N", shortestLineNum).replace("%S", formatLine(shortestLineText)) + "\n";

	res += "\n";

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

	var wordsCyr = countOf(txt, /(^|\s|[^-а-яёa-z\d])[а-яё]+(-[а-яё]+)*(?=$|\s|[^-а-яёa-z\d])/ig);
	var wordsLat = countOf(txt, /(^|\s|[^-а-яёa-z\d])[a-z]+(-[a-z]+)*('[st])?(?=$|\s|[^-а-яёa-z\d])/ig);
	res +=          _localize("Words: ")    + formatNum(wordsCyr + wordsLat) + "\n";
	res += "  – " + _localize("Cyrillic: ") + formatNum(wordsCyr) + "\n";
	res += "  – " + _localize("Latin: ")    + formatNum(wordsLat) + "\n";

	res += "\n";

	var cyrLatMix = countOf(txt, /\S*([a-z]\S*[а-яё]|[а-яё]\S*[a-z])\S*/ig);
	res += _localize("Mixed Cyrillic+Latin: ") + formatNum(cyrLatMix) + "\n";

	res += "\n";

	var numsDec = countOf(txt, /(^|\W)\d+([.,]\d+)?(?=(\W|$))/g); // Be careful with numbers like "0,2"
	var numsHex = countOf(txt, /(^|\W)0x[\da-f]+(?=(\W|$))/ig);
	res +=          _localize("Numbers: ")     + formatNum(numsDec + numsHex) + "\n";
	res += "  – " + _localize("Decimal: ")     + formatNum(numsDec) + "\n";
	res += "  – " + _localize("Hexadecimal: ") + formatNum(numsHex) + "\n";

	return res;
}
function countOf(txt, regexp) {
	var m = txt.match(regexp);
	return m ? m.length : 0;
}
function formatNum(n) {
	// 1234567 -> 1 234 567
	return ("" + n).replace(/(\d)(?=(\d{3})+(\D|$))/g, "$1\xa0");
}
function formatLine(s) {
	var maxLength = 45;
	var tabWidth = 8;
	var tab = new Array(tabWidth + 1).join(" ");
	var ret = s.substr(0, maxLength);
	while(ret.replace(/\t/g, tab).length > maxLength)
		ret = ret.substr(0, ret.length - 1);
	return ret == s
		? ret
		: ret + "\u2026"; // "..."
}