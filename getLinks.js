// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9926#9926
// http://infocatcher.ucoz.net/js/akelpad_scripts/getLinks.js

// (c) Infocatcher 2009-2011
// version 0.1.7 - 2011-12-20

//===================
// Tries to extract links from any text

// Usage:
//   Call("Scripts::Main", 1, "getLinks.js")
//===================

function _localize(s) {
	var strings = {
		"Links not found!": {
			ru: "—сылки не найдены!"
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
var oSys = AkelPad.SystemFunction();

if(hMainWnd) {
	var links = getLinks();
	if(links.length) {
		AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
		AkelPad.SetSel(0, 0);
		insertNoScroll(links.join("\n"), true);
	}
	else {
		AkelPad.MessageBox(
			hMainWnd,
			_localize("Links not found!"),
			WScript.ScriptName,
			48 /*MB_ICONEXCLAMATION*/
		);
	}
}

function getLinks() {
	// Get selection or all text
	var txt = AkelPad.GetSelText() || getAllText();

	// [url=http://example.com/]...[/url] => http://example.com/
	txt = txt.replace(/\[(\w+)=(['"]?)([^\[\]]+)\2\].*?\[\/\1\]/g, "\t$3\t");

	var links = txt.match(/[a-z]+:\/\/+([^\/\\.\s<>'":*?|&#\(\)\[\]\{\}]+\.)*[^\/\\.\s<>'":*?|&#\(\)\[\]\{\}]+(:\d+)?(\/[^\s"<>]*)?|mailto:[^@\s\\\/:*?"<>|]+@[^@.\s\\\/:*?"<>|&#]+(\.[^@.\s\\\/:*?"<>|&#]+)+|\\{2,}\w+(\\[^\\\/:*?"<>|\s]+)+\\?/ig);
	if(!links)
		return [];

	var linksObj = {};
	var link;
	for(var i = 0, len = links.length; i < len; i++) {
		link = links[i].replace(/[\(\{\[+,]$/, "");

		if(count(link, /\(/g) == 0 && count(link, /\)/g))
			link = link.replace(/\).*$/, "");
		if(count(link, /\[/g) == 0 && count(link, /\]/g))
			link = link.replace(/\].*$/, "");
		if(count(link, /\{/g) == 0 && count(link, /\}/g))
			link = link.replace(/\}.*$/, "");

		linksObj[decodeHTML(link)] = 1;
	}

	links = [];
	for(var h in linksObj)
		links.push(h);

	return links;
}
function count(s, re) {
	var m = s.match(re);
	return m ? m.length : 0;
}
function decodeHTML(s) {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"');
}

function getAllText() {
	if(typeof AkelPad.GetTextRange != "undefined")
		return AkelPad.GetTextRange(0, -1);
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return "";
	var hWndEdit = AkelPad.GetEditWnd();
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	var columnSel = AkelPad.SendMessage(hWndEdit, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0);
	var ss = AkelPad.GetSelStart();
	var se = AkelPad.GetSelEnd();

	AkelPad.SetSel(0, -1);
	var str = AkelPad.GetSelText();

	AkelPad.SetSel(ss, se);
	columnSel && AkelPad.SendMessage(hWndEdit, 3128 /*AEM_UPDATESEL*/, 0x1 /*AESELT_COLUMNON*/, 0);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	AkelPad.MemFree(lpPoint);
	setRedraw(hWndEdit, true);
	return str;
}
function insertNoScroll(str, selectAll) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	var hWndEdit = AkelPad.GetEditWnd();
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