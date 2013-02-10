// http://akelpad.sourceforge.net/forum/viewtopic.php?p=18306#18306
// http://infocatcher.ucoz.net/js/akelpad_scripts/adblockPlusChecksum.js

// (c) Infocatcher 2012
// version 0.1.1 - 2012-06-09

// Adds checksum to Adblock Plus subscription
// http://adblockplus.org/en/faq_internal#checksum

// Dependencies:
//   getHash.js   - http://akelpad.sourceforge.net/forum/viewtopic.php?p=11096#11096
//   converter.js - http://akelpad.sourceforge.net/forum/viewtopic.php?p=11095#11095


var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

var hashesArgs = {
	codePage: 65001 // UTF-8 for MD5
};
var convertersArgs = {
	codePageBase64: 28591 // ISO-8859-1 for base64
};

if(
	hMainWnd
	&& hWndEdit
	&& AkelPad.Include("..\\getHash.js")
	&& AkelPad.Include("..\\converter.js")
) {
	if(typeof hashes == "undefined")
		AkelPad.MessageBox(hMainWnd, "Required getHash.js v.0.2.3 and higher", WScript.ScriptName, 16 /*MB_ICONERROR*/);
	else if(typeof converters == "undefined")
		AkelPad.MessageBox(hMainWnd, "Required converter.js v.0.2.3 and higher", WScript.ScriptName, 16 /*MB_ICONERROR*/);
	else
		addChecksum();
}

function _localize(s) {
	var strings = {
		"This is not a Adblock Plus subscription!": {
			ru: "Это не подписка для Adblock Plus!"
		},
		"Checksum already added!": {
			ru: "Контрольная сумма уже добавлена!"
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

function addChecksum() {
	// adblock_plus-2.0.3-sm+tb+fn+fx.xpi\modules\Synchronizer.jsm
	// function readFilters(subscription, text, errorCallback)

	// adblock_plus-2.0.3-sm+tb+fn+fx.xpi\modules\Utils.jsm
	// Checksum is an MD5 checksum (base64-encoded without the trailing "=") of
	// all lines in UTF-8 without the checksum line, joined with "\n".

	var text = AkelPad.GetTextRange(0, -1, 2 /*\n*/);
	if(!/^\[Adblock(\s*Plus\s*([\d\.]+)?)?\]\n/i.test(text)) {
		AkelPad.MessageBox(
			hMainWnd,
			_localize("This is not a Adblock Plus subscription!"),
			WScript.ScriptName,
			48 /*MB_ICONEXCLAMATION*/
		);
		return;
	}
	if(/\n[ \t]*![ \t]*checksum[ \t:-]+([\w+\/=]+)\n/i.test(text)) {
		var oldChecksum = RegExp.$1;
		text = RegExp.leftContext + "\n" + RegExp.rightContext;
		var insPosStart = RegExp.leftContext.length + 1;
		var insPosEnd = RegExp.leftContext.length + RegExp.lastMatch.length - 1;
		var insNoNewLine = true;
	}
	var newChecksum = generateChecksum(text);
	if(oldChecksum && newChecksum == oldChecksum) {
		AkelPad.MessageBox(
			hMainWnd,
			_localize("Checksum already added!"),
			WScript.ScriptName,
			64 /*MB_ICONINFORMATION*/
		);
		return;
	}

	if(!insPosStart && /^[^\n\r]*\n/.test(text))
		insPosStart = insPosEnd = RegExp.lastMatch.length - 1;

	setRedraw(hWndEdit, false);
	AkelPad.SetSel(insPosStart, insPosEnd);
	AkelPad.ReplaceSel((insNoNewLine ? "" : "\n") + "! Checksum: " + newChecksum);
	setRedraw(hWndEdit, true);
}
function generateChecksum(str) {
	str = str.replace(/[\r\n]+/g, "\n");

	// Perl: md5_base64($data)
	// PHP: preg_replace('/=+$/', '', base64_encode(pack('H*',md5($data))));
	var hash = hashes.md5(str);
	var pached = pack(hash);
	var base64 = converters.base64.encode(pached);
	return base64.replace(/=+$/, "");
}

function pack(str) {
	// Based on code from http://phpjs.org/functions/pack:880 (only for pack("H*", str))
	// + String[N] => String.charAt(N)
	var result = "";
	var quantifier = str.length;
	for (var i = 0; i < quantifier; i += 2) {
	    // Always get per 2 bytes...
	    var word = str.charAt(i);
	    if (((i + 1) >= quantifier) || typeof(str.charAt(i + 1)) === 'undefined') {
	        word += '0';
	    } else {
	        word += str.charAt(i + 1);
	    }
	    result += String.fromCharCode(parseInt(word, 16));
	}
	return result;
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}