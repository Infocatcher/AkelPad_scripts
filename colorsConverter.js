// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9926#9926
// http://infocatcher.ucoz.net/js/akelpad_scripts/colorsConverter.js

// (c) Infocatcher 2010-2011
// version 0.1.2 - 2011-12-20

function _localize(s) {
	var strings = {
		"Color:": {
			ru: "÷вет:"
		},
		"Color from У%SФ:": {
			ru: "÷вет из Ђ%Sї:"
		},
		"Invalid color format!": {
			ru: "Ќекорректный формат цвета!"
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

if(hMainWnd)
	convColor(AkelPad.GetSelText());

function convColor(color, forceAsk) {
	if(!color || forceAsk)
		color = askColor(_localize("Color:"), color);
	if(!color)
		return;
	var newColor;
	if(/^\W*#?([0-9a-f]{3}|[0-9a-f]{6})\W*$/i.test(color)) // #aaa or #aaaaaa
		newColor = h2d(RegExp.$1);
	else if(/^\D*(\d{1,3}\D+\d{1,3}\D+\d{1,3})\D*$/.test(color)) // rgb(170, 170, 170)
		newColor = d2h.apply(this, RegExp.$1.split(/\D+/));

	if(!newColor) {
		AkelPad.MessageBox(hMainWnd, _localize("Invalid color format!"), WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
		convColor(color, true);
		return;
	}
	newColor = askColor(_localize("Color from У%SФ:").replace("%S", color), newColor);
	newColor && convColor(newColor);
}
function askColor(caption, defaultValue) {
	return AkelPad.InputBox(
		hMainWnd, WScript.ScriptName,
		caption,
		defaultValue || ""
	);
}

function hex(n) {
	var h = (typeof n == "number" ? n : parseInt(n, 10)).toString(16);
	if(h.length > 2)
		return null;
	return "00".substr(h.length) + h;
}
function d2h() {
	var i, h, r = [], l = arguments.length;
	var same = /^([0-9a-f])\1$/i;
	var isSame = true;
	for(i = 0; i < l; i++) {
		h = hex(arguments[i]);
		if(!h)
			return null;
		if(isSame && !same.test(h))
			isSame = false;
		r.push(h);
	}
	if(isSame)
		for(i = 0; i < l; i++)
			r[i] = r[i].charAt(0);
	return /* "#" + */ r.join("");
}
function h2d(h) {
	var l = h.length;
	var s = l == 3 ? 1 : 2;
	var i, r = [], h2;
	for(var i = 0; i < l; i += s) {
		h2 = h.substr(i, s);
		if(s == 1)
			h2 += h2;
		r.push(parseInt(h2, 16));
	}
	return r.join(", ");
}