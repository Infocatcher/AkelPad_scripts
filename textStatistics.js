// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#9927
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
		"Shortest line: #": {
			ru: "Самая короткая строка: №"
		},
		"Longest line: #": {
			ru: "Самая длинная строка: №"
		},
		"Length: ": {
			ru: "Длина: "
		},
		"Line: “%S”": {
			ru: "Строка: «%S»"
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
		"Mixed: ": {
			ru: "Смешанные: "
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
	var txt = getText();
	if(!txt)
		return _localize("Text missing!");
	var txtn = txt.replace(/\r\n|\n\r|\n|\r/g, "\n"); // Strange things happens with \r\n
	var cFile = AkelPad.GetEditFile(0);
	var res = cFile ? cFile + ":\n\n" : "";

	res +=          _localize("Lines: ")       + formatNum(countOf(txt, /\r\n|\n\r|\n|\r/g) + 1) + "\n";
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

		if(curLine.indexOf("\t") != -1) {
			var tabWidth, dw;
			for(var j = 0, column = 0, ll = curLen; j < ll; ++j, ++column) {
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

	res +=          _localize("Longest line: #") + formatNum(longestLineNum) + "\n";
	res += "  – " + _localize("Length: ") + formatNum(longestLine) + "\n";
	res += "  – " + _localize("Line: “%S”").replace("%S", formatLine(longestLineText)) + "\n";
	res +=          _localize("Shortest line: #") + formatNum(shortestLineNum) + "\n";
	res += "  – " + _localize("Length: ") + formatNum(shortestLine) + "\n";
	res += "  – " + _localize("Line: “%S”").replace("%S", formatLine(shortestLineText)) + "\n";

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

	var wordsCyr = countOf(txt, /[а-яё]+(-[а-яё]+)*/ig);
	var wordsLat = countOf(txt, /[a-z]+(-[a-z]+)*('[st])?/ig);
	var wordsMix = countOf(txt, /\S*([a-z]\S*[а-яё]|[а-яё]\S*[a-z])\S*/ig);
	res +=          _localize("Words: ")    + formatNum(wordsCyr + wordsLat) + "\n";
	res += "  – " + _localize("Cyrillic: ") + formatNum(wordsCyr) + "\n";
	res += "  – " + _localize("Latin: ")    + formatNum(wordsLat) + "\n";
	res += "  – " + _localize("Mixed: ")    + formatNum(wordsMix) + "\n";

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
	return String(n).replace(/(\d)(?=(\d{3})+(\D|$))/g, "$1 ");
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

function getText() {
	// Get selection or all text
	var newLine = 4 - AkelPad.GetEditNewLine(0);
	return AkelPad.GetSelText(newLine)
		|| AkelPad.GetTextRange(0, -1, newLine);
}