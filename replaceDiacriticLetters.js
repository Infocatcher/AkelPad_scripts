﻿// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11240#11240

// (c) Infocatcher 2008, 2011-2012
// Version: 0.1.2 - 2012-12-11

var map = {
	"à": "a",
	"À": "A",
	"á": "a",
	"Á": "A",
	"â": "a",
	"Â": "A",
	"ã": "a",
	"Ã": "A",
	"ä": "a",
	"Ä": "A",
	"å": "a",
	"Å": "A",
	"æ": "ae",
	"Æ": "AE",
	"ç": "c",
	"Ç": "C",
	"È": "E",
	"è": "e",
	"é": "e",
	"É": "E",
	"ê": "e",
	"Ê": "E",
	"ë": "e",
	"Ë": "E",
	"Ì": "I",
	"ì": "i",
	"í": "i",
	"Í": "I",
	"î": "i",
	"Î": "I",
	"Ï": "I",
	"ï": "i",
	"Ð": "D",
	"ð": "d",
	"ñ": "n",
	"Ñ": "N",
	"Ò": "O",
	"ò": "o",
	"Ó": "O",
	"Ó": "O",
	"ó": "o",
	"ó": "o",
	"ô": "o",
	"Ô": "O",
	"Õ": "O",
	"õ": "o",
	"ö": "o",
	"Ö": "O",
	"ù": "u",
	"Ù": "U",
	"Ú": "U",
	"ú": "u",
	"û": "u",
	"Û": "U",
	"ü": "u",
	"Ü": "U",
	"ý": "y",
	"Ý": "Y",
	"ÿ": "y",
	"Ÿ": "Y",
	"ā": "a",
	"Ā": "A",
	"ă": "a",
	"Ă": "A",
	"Ą": "A",
	"Ą": "A",
	"ą": "a",
	"ą": "a",
	"Ć": "C",
	"ć": "c",
	"Ć": "C",
	"ć": "c",
	"ĉ": "c",
	"Ĉ": "C",
	"Ċ": "C",
	"ċ": "c",
	"č": "c",
	"Č": "C",
	"ď": "d",
	"Ď": "D",
	"Đ": "D",
	"đ": "d",
	"Ē": "E",
	"ē": "e",
	"ĕ": "e",
	"Ĕ": "E",
	"ė": "e",
	"Ė": "E",
	"ę": "e",
	"Ę": "E",
	"Ę": "E",
	"ę": "e",
	"Ě": "E",
	"ě": "e",
	"ĝ": "g",
	"Ĝ": "G",
	"ğ": "g",
	"Ğ": "G",
	"ġ": "g",
	"Ġ": "G",
	"ģ": "g",
	"Ģ": "G",
	"Ĥ": "H",
	"ĥ": "h",
	"ħ": "h",
	"Ħ": "H",
	"ĩ": "i",
	"Ĩ": "I",
	"ī": "i",
	"Ī": "I",
	"Ĭ": "I",
	"ĭ": "i",
	"Į": "I",
	"į": "i",
	"İ": "I",
	"ı": "i",
	"ĳ": "ij",
	"Ĳ": "IJ",
	"ĵ": "j",
	"Ĵ": "J",
	"ķ": "k",
	"Ķ": "K",
	"ĸ": "k",
	"ĺ": "l",
	"Ĺ": "L",
	"Ļ": "L",
	"ļ": "l",
	"Ľ": "L",
	"ľ": "l",
	"Ŀ": "L",
	"ŀ": "l",
	"Ł": "L",
	"ł": "l",
	"Ł": "L",
	"ł": "l",
	"ń": "n",
	"Ń": "N",
	"ń": "n",
	"Ń": "N",
	"ņ": "n",
	"Ņ": "N",
	"ň": "n",
	"Ň": "N",
	"ŉ": "n",
	"Ō": "O",
	"ō": "o",
	"Ŏ": "O",
	"ŏ": "o",
	"ő": "o",
	"Ő": "O",
	"œ": "oe",
	"Œ": "OE",
	"Ŕ": "R",
	"ŕ": "r",
	"ŗ": "r",
	"Ŗ": "R",
	"ř": "r",
	"Ř": "R",
	"Ś": "S",
	"ś": "s",
	"ś": "s",
	"Ś": "S",
	"ŝ": "s",
	"Ŝ": "S",
	"ş": "s",
	"Ş": "S",
	"š": "s",
	"Š": "S",
	"Ţ": "T",
	"ţ": "t",
	"ť": "t",
	"Ť": "T",
	"ŧ": "t",
	"Ŧ": "T",
	"ũ": "u",
	"Ũ": "U",
	"Ū": "U",
	"ū": "u",
	"ŭ": "u",
	"Ŭ": "U",
	"ů": "u",
	"Ů": "U",
	"Ű": "U",
	"ű": "u",
	"Ų": "U",
	"ų": "u",
	"ŵ": "w",
	"Ŵ": "W",
	"ŷ": "Y",
	"Ŷ": "Y",
	"Ź": "Z",
	"Ź": "Z",
	"ź": "z",
	"ź": "z",
	"ż": "z",
	"Ż": "Z",
	"Ż": "Z",
	"ż": "z",
	"ž": "z",
	"Ž": "Z",
	"ƀ": "b",
	"ƈ": "c",
	"Ƈ": "C",
	"ƒ": "f",
	"Ƒ": "F",
	"Ƙ": "K",
	"ƙ": "k",
	"ơ": "o",
	"Ơ": "O",
	"ƥ": "p",
	"Ƥ": "P",
	"ƫ": "t",
	"ƭ": "t",
	"Ƭ": "T",
	"Ư": "U",
	"ư": "u",
	"Ƶ": "Z",
	"ƶ": "z",
	"Ǆ": "DZ",
	"ǅ": "Dz",
	"ǆ": "dz",
	"ǈ": "Lj",
	"Ǉ": "LJ",
	"ǉ": "lj",
	"ǋ": "Nj",
	"ǌ": "nj",
	"Ǌ": "NJ",
	"ǎ": "a",
	"Ǎ": "A",
	"ǐ": "i",
	"Ǐ": "I",
	"Ǒ": "O",
	"ǒ": "o",
	"Ǔ": "U",
	"ǔ": "u",
	"ǖ": "u",
	"Ǖ": "U",
	"ǘ": "u",
	"Ǘ": "U",
	"Ǚ": "U",
	"ǚ": "u",
	"Ǜ": "U",
	"ǜ": "u",
	"ǝ": "e",
	"ǟ": "a",
	"Ǟ": "A",
	"ǡ": "a",
	"Ǡ": "A",
	"ǣ": "ae",
	"Ǣ": "AE",
	"ǥ": "g",
	"Ǥ": "G",
	"ǧ": "g",
	"Ǧ": "G",
	"ǩ": "k",
	"Ǩ": "K",
	"ǫ": "o",
	"Ǫ": "O",
	"ǭ": "o",
	"Ǭ": "O",
	"Ǯ": "Z",
	"ǰ": "J",
	"ǯ": "z",
	"Ǳ": "DZ",
	"ǲ": "Dz",
	"ǳ": "dz",
	"Ǵ": "G",
	"ǵ": "g",
	"Ǻ": "A",
	"ǻ": "a",
	"Ǽ": "AE",
	"ǽ": "ae",
	"Ǿ": "O",
	"ǿ": "o",
	"Ȁ": "A",
	"ȁ": "a",
	"Ȃ": "A",
	"ȃ": "a",
	"Ȅ": "E",
	"ȅ": "e",
	"Ȇ": "E",
	"ȇ": "e",
	"ȉ": "i",
	"Ȉ": "I",
	"Ȋ": "I",
	"ȋ": "i",
	"Ȍ": "O",
	"ȍ": "o",
	"ȏ": "o",
	"Ȏ": "O",
	"Ȑ": "R",
	"ȑ": "r",
	"Ȓ": "R",
	"ȓ": "r",
	"ȕ": "u",
	"Ȕ": "U",
	"ȗ": "u",
	"Ȗ": "U",
	"ɐ": "a",
	"ɑ": "a",
	"ɒ": "a",
	"Ɓ": "B",
	"Ɖ": "D",
	"ɖ": "d",
	"Ɗ": "D",
	"ɗ": "d",
	"ɛ": "e",
	"Ɠ": "G",
	"Ʀ": "R",
	"Ʈ": "T",
	"ʤ": "dz",
	"ʣ": "dz",
	"ʥ": "dz",
	"ʦ": "ts",
	"ʧ": "tf",
	"ΐ": "i",
	"Ά": "A",
	"Έ": "E",
	"Ή": "H",
	"Ί": "I",
	"ϊ": "i",
	"ϋ": "u",
	"Ό": "O",
	"ό": "o",
	"ύ": "u",
	"Ύ": "Y",
	"і": "i",
	"ї": "i",
	"ј": "j",
	"ќ": "k",
	"ў": "y",
	"ӑ": "a",
	"Ӑ": "A",
	"Ӓ": "A",
	"ӓ": "a",
	"ӕ": "ae",
	"Ӕ": "AE",
	"Ӗ": "E",
	"ӗ": "e"
};

function replaceLetters(str) {
	for(var s in map)
		str = str.replace(new RegExp(s, "g"), map[s]);
	return str;
}

var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

if(hMainWnd && !AkelPad.GetEditReadOnly(hWndEdit)) {
	var text = AkelPad.GetSelText();
	if(!text) {
		var selectAll = true;
		text = AkelPad.GetTextRange(0, -1);
	}
	var res = replaceLetters(text);
	if(res != text)
		insertNoScroll(res, selectAll);
}

function insertNoScroll(str, selectAll) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	selectAll && AkelPad.SetSel(0, -1);
	//var ss = AkelPad.GetSelStart();
	AkelPad.ReplaceSel(str, true);
	//if(ss != AkelPad.GetSelStart())
	//	AkelPad.SetSel(ss, ss + str.length);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}