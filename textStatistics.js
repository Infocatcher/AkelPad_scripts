// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9927#9927
// http://infocatcher.ucoz.net/js/akelpad_scripts/textStatistics.js

// (c) Infocatcher 2008-2011
// version 0.3.4 - 2011-12-20

// Usage:
//   Call("Scripts::Main", 1, "textStatistics.js")

// Windows XP+ (?)

function _localize(s) {
	var strings = {
		"Text missing!": {
			ru: "“екст отсутствует!"
		},
		"Lines: ": {
			ru: "—троки: "
		},
		"Only spaces: ": {
			ru: "“олько пробельные символы: "
		},
		"Empty: ": {
			ru: "ѕустые: "
		},
		"Shortest line: #": {
			ru: "—ама€ коротка€ строка: є"
		},
		"Longest line: #": {
			ru: "—ама€ длинна€ строка: є"
		},
		"Length: ": {
			ru: "ƒлина: "
		},
		"Line: У%SФ": {
			ru: "—трока: Ђ%Sї"
		},
		"Symbols: ": {
			ru: "—имволы: "
		},
		"Cyrillic: ": {
			ru: " ириллица: "
		},
		"Latin: ": {
			ru: "Ћатиница: "
		},
		"Digits: ": {
			ru: "÷ифры: "
		},
		"Space symbols: ": {
			ru: "ѕробельные символы: "
		},
		"Spaces: ": {
			ru: "ѕробелы: "
		},
		"Tabs: ": {
			ru: "“абул€ции: "
		},
		"Carriage returns (\\r): ": {
			ru: "¬озвраты каретки (\\r): "
		},
		"Line feeds (\\n): ": {
			ru: "ѕереводы строки (\\n): "
		},
		"Words: ": {
			ru: "—лова: "
		},
		"Cyrillic: ": {
			ru: " ириллица: "
		},
		"Latin: ": {
			ru: "Ћатиница: "
		},
		"Numbers: ": {
			ru: "„исла: "
		},
		"Decimal: ": {
			ru: "ƒес€тичные: "
		},
		"Hexadecimal: ": {
			ru: "Ўестнадцатеричные: "
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
	var txt = getText();
	if(!txt)
		return _localize("Text missing!");
	var txtn = txt.replace(/\r\n|\n\r|\n|\r/g, "\n"); // Strange things happens with \r\n
	var cFile = AkelPad.GetEditFile(0);
	var res = cFile ? cFile + ":\n\n" : "";

	res +=          _localize("Lines: ")       + formatNum(countOf(txt, /\r\n|\n\r|\n|\r/g) + 1) + "\n";
	res += "  Ц " + _localize("Only spaces: ") + formatNum(countOf(txt, /^[\t ]+$/mg)) + "\n";
	res += "  Ц " + _localize("Empty: ")       + formatNum(countOf(txtn, /^$/mg)) + "\n";

	res += "\n";

	var longestLine  = -1,       longestLineNum,  longestLineText;
	var shortestLine = Infinity, shortestLineNum, shortestLineText;
	var lines = txtn.split("\n");
	var curLine, curLen;
	var tabStop = AkelPad.SendMessage(AkelPad.GetEditWnd(), 3239 /*AEM_GETTABSTOP*/, 0, 0) || 8;
	for(var i = 0, l = lines.length; i < l; i++) {
		curLine = lines[i];
		curLen = curLine.length;

		if(curLine.indexOf("\t") != -1) {
			var tabWidth, dw;
			for(var j = 0, column = 0, ll = curLen; j < ll; j++, column++) {
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
	res += "  Ц " + _localize("Length: ") + formatNum(longestLine) + "\n";
	res += "  Ц " + _localize("Line: У%SФ").replace("%S", formatLine(longestLineText)) + "\n";
	res +=          _localize("Shortest line: #") + formatNum(shortestLineNum) + "\n";
	res += "  Ц " + _localize("Length: ") + formatNum(shortestLine) + "\n";
	res += "  Ц " + _localize("Line: У%SФ").replace("%S", formatLine(shortestLineText)) + "\n";

	res += "\n";

	res +=             _localize("Symbols: ")                + formatNum(txt.length) + "\n";
	res += "  Ц "    + _localize("Cyrillic: ")               + formatNum(countOf(txt, /[а-€Є]/ig)) + "\n";
	res += "  Ц "    + _localize("Latin: ")                  + formatNum(countOf(txt, /[a-z]/ig)) + "\n";
	res += "  Ц "    + _localize("Digits: ")                 + formatNum(countOf(txt, /\d/g)) + "\n";
	res += "  Ц "    + _localize("Space symbols: ")          + formatNum(countOf(txt, /\s/g)) + "\n";
	res += "     = " + _localize("Spaces: ")                 + formatNum(countOf(txt, / /g)) + "\n";
	res += "     = " + _localize("Tabs: ")                   + formatNum(countOf(txt, /\t/g)) + "\n";
	res += "     = " + _localize("Carriage returns (\\r): ") + formatNum(countOf(txt, /\r/g)) + "\n";
	res += "     = " + _localize("Line feeds (\\n): ")       + formatNum(countOf(txt, /\n/g)) + "\n";

	res += "\n";

	var wordsCyr = countOf(txt, /[а-€Є]+(-[а-€Є]+)*/ig);
	var wordsLat = countOf(txt, /[a-z]+(-[a-z]+)*('[st])?/ig);
	res +=          _localize("Words: ")    + formatNum(wordsCyr + wordsLat) + "\n";
	res += "  Ц " + _localize("Cyrillic: ") + formatNum(wordsCyr) + "\n";
	res += "  Ц " + _localize("Latin: ")    + formatNum(wordsLat) + "\n";

	res += "\n";

	var numsDec = countOf(txt, /(^|\W)\d+([.,]\d+)?(?=(\W|$))/g); // Be careful with numbers like "0,2"
	var numsHex = countOf(txt, /(^|\W)0x[\da-f]+(?=(\W|$))/ig);
	res +=          _localize("Numbers: ")     + formatNum(numsDec + numsHex) + "\n";
	res += "  Ц " + _localize("Decimal: ")     + formatNum(numsDec) + "\n";
	res += "  Ц " + _localize("Hexadecimal: ") + formatNum(numsHex) + "\n";

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
	var txt = AkelPad.GetSelText(4 - AkelPad.GetEditNewLine(0));
	if(txt)
		return txt;
	if(typeof AkelPad.GetTextRange != "undefined")
		return AkelPad.GetTextRange(0, -1, 4 - AkelPad.GetEditNewLine(0));
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return "";
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	var columnSel = AkelPad.SendMessage(hWndEdit, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0);
	var ss = AkelPad.GetSelStart();
	var se = AkelPad.GetSelEnd();

	AkelPad.SetSel(0, -1);
	txt = AkelPad.GetSelText(4 - AkelPad.GetEditNewLine(0));

	AkelPad.SetSel(ss, se);
	columnSel && AkelPad.SendMessage(hWndEdit, 3128 /*AEM_UPDATESEL*/, 0x1 /*AESELT_COLUMNON*/, 0);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	AkelPad.MemFree(lpPoint);
	setRedraw(hWndEdit, true);
	return txt;
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}