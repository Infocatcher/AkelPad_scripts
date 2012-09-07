// (c) Infocatcher 2008-2009
// version 0.0.3.0+ - 2009-09-24, 2010-07-05

//== Settings
var fixerDash = "\u2013";
var fixerForceUpperCase = true;
// Use
// Call("Scripts::Main", 1, "punctuationFixer.js", "-ignorecase", 0)
// for override this setting
var fixerCommas = ["«", "»"]; // var fixerCommas = null;
var fixerSaveSelPos = true;
//== End of settings

if(WScript.Arguments.length && WScript.Arguments(0) == "-ignorecase")
	fixerForceUpperCase = false;

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

var PunctuationFixer = function(dash, forceUpper, commas) {
	this.dash = dash || "-";
	this.forceUpper = forceUpper;
	this.convCommas = commas instanceof Array;
	if(this.convCommas) {
		this.openComma = commas[0];
		this.closeComma = commas[1];
	}
};
PunctuationFixer.prototype = {
	notConv: [],
	subst: "",
	init: function() { // Get random string for replacing exclusions
		function rnd() { return Math.random().toString().replace(/\./, ""); }
		this.subst = "_" + rnd() + rnd() + "_";
	},
	getSubst: function(n) {
		return this.subst + n + "_";
	},
	convert: function(txt) {
		if(!txt)
			return "";
		this.init();

		var _this = this;

		//== Exclusions:
		var excCnt = -1;
		var subst;
		// URLs like http://example.com/
		this.notConv[++excCnt] = [], subst = this.getSubst(excCnt);
		txt = txt.replace(
			/[a-z]+:\/\/+([^\/\\.\s'"<>]+[.\/])+[^\/\\.\s'"<>]+/ig,
			function() {
				var a = arguments;
				_this.notConv[excCnt].push(a[0]);
				return subst;
			}
		);
		// Time "10:43:01"
		this.notConv[++excCnt] = [], subst = this.getSubst(excCnt);
		txt = txt.replace(
			/(^|\D)([0-2]?\d:[0-6]?\d(:[0-6]?\d)?)(\D|$)/mg,
			function() {
				var a = arguments;
				_this.notConv[excCnt].push(a[2]);
				return a[1] + subst + a[4];
			}
		);
		// Dates "19.03.2009"
		this.notConv[++excCnt] = [], subst = this.getSubst(excCnt);
		txt = txt.replace(
			/(^|\D)([0-3]?\d\.[0-1]\d\.\d\d(\d\d)?|\d\d(\d\d)?\.[0-1]\d\.[0-3]?\d)(\D|$)/mg,
			function() {
				var a = arguments;
				_this.notConv[excCnt].push(a[2]);
				return a[1] + subst + a[5];
			}
		);
		// Numbers like "10.9" or "10,9"
		this.notConv[++excCnt] = [], subst = this.getSubst(excCnt);
		txt = txt.replace(
			/(^|[^\d.,])(\d+[.,]\d+)([^\d.,]|$)/g,
			function() {
				var a = arguments;
				_this.notConv[excCnt].push(a[2]);
				return a[1] + subst + a[3];
			}
		);
		// Smileys like ":)"
		this.notConv[++excCnt] = [], subst = this.getSubst(excCnt);
		txt = txt.replace(
			/[ \t]*(:-?[D\(\)\\\/][\(\)]{0,2})[\(\)]*[ \t]*/g,
			function() {
				var a = arguments;
				_this.notConv[excCnt].push(" " + a[1] + " ");
				return subst;
			}
		);
		// "->", "=>", "<=>"
		this.notConv[++excCnt] = [], subst = this.getSubst(excCnt);
		txt = txt.replace(
			/<?[-=]+>/g,
			function() {
				var a = arguments;
				_this.notConv[excCnt].push(a[0]);
				return subst;
			}
		);
		// Acronyms
		this.notConv[++excCnt] = [], subst = this.getSubst(excCnt);
		txt = txt.replace(
			/([^à-ÿ¸a-z]([à-ÿ¸a-z]\.[ \t]*[à-ÿ¸a-z]\.|[à-ÿ¸a-z]{2}\.))/g,
			function() {
				var a = arguments;
				_this.notConv[excCnt].push(a[1].replace(/[ \t]+/, " "));
				return subst;
			}
		);
		//== End of exclusions

		// Del spaces:
		txt = txt.replace(/(\S)([ \t])[ \t]+/g, "$1$2"); // "\t  " -> "\t", " \t\t" -> " "

		// Fix punctuation:
		txt = txt
			.replace(/((\) ?){1,3})(\) ?)*/g, "$1 ")   // ")))))" -> ")))"
			.replace(/[\t ]*([.?!][^"])/g, "$1 ") // "  !  !  !  " -> "! ! ! "
			.replace(/[\t ]*([:,;])[\t ]*/g, "$1 ") // " , " -> ", "
			.replace(/([,;:]) ?([,;:] ?)+/g, "$1 ")    // ",, ,, " -> ", "
			.replace(
				/(([.?!] *){1,3})([.?!] *)*(.|$)/mg, // "! !! ! " -> "!!! "
				function($0, $1, $2, $3, $4) {
					var noSp = $3 && /\S$/.test($3) && $4 == '"';
					return $1.replace(/\s+/g, "") + (noSp ? "" : " ") + $4;
				}
			)
			.replace(/([\(\{\[<])[\t ]+/, "$1")
			.replace(/[\t ]+([\)\}\]>])/, "$1")
			.replace(/[\t ]*([+=])[\t ]*/g, " $1 ");

		// Fix brackets:
		txt = txt
			.replace(/(\S)[\t ]*\([\t ]*/g, "$1 (")  // text(text -> text (text
			.replace(/[\t ]*\)[\t ]*([^.!?:;,()])/g, ") $1"); // text)text -> text) text

		// Fix lower case letters:
		if(this.forceUpper) // end. begin -> end. Begin
			txt = txt.replace(
				/(^|[^.][.?!] )([à-ÿ¸a-z])/mg,
				function($0, $1, $2) { return $1 + $2.toUpperCase(); }
			);

		// Fix dashes:
		txt = txt // " -", "- " -> " - "
			.replace(/"[\t ]*-[\t ]*/g, "\" - ") // text"-text -> text" - text
			.replace(/([^\s-])[\t ]*-[\t ]*"/g, "$1 - \"") // text-"text -> text - "text
			.replace(/([^\s-])[\t ]*-\([\t ]*/g, "$1 - (") // text-(text -> text - (text
			.replace(/([^\s-])[\t ]*\)-[\t ]*/g, "$1) - ") // text)-text -> text) - text
			.replace(/([^\s-])[\t ]*-[\t ]+/g, "$1 - ")    // text- text -> text - text
			.replace(/([^\s-])[\t ]+-[\t ]*/g, "$1 - ")    // text -text -> text - text
			.replace(/^([\t ]*)-{1,3}[\t ]*/mg, "$1- ") // \n-text -> \n- text
			.replace(/([^\s-])[\t ]*---?[\t ]*/g, "$1 - ")   // text--text -> text - text
			.replace(/ - /g, " " + this.dash + " ");

		// Fix commas:
		if(this.convCommas)
			txt = txt
				.replace(/^[\t ]*"[\t ]*/mg, this.openComma)  // \n" -> \n«
				.replace(/[\t ]*"[\t ]*$/mg, this.closeComma) // "\n -> »\n
				.replace(/([.?!])"(\s)/g, "$1" + this.closeComma + "$2") // 'text!" ' -> 'text!» '
				.replace(/([à-ÿ¸a-z])"([-+\s.?!,;:\)\}\]\>]|$)/img, "$1" + this.closeComma + "$2") // text". -> text».
				.replace(/[\t ]*"[\t ]*([-+.?!,;:\)\}\]\>]|$)/mg, this.closeComma + "$1")          // ' " .' -> '».'
				.replace(/(^|[\s\(\{\[<])"[\t ]*/mg, "$1" + this.openComma)
				.replace(new RegExp(this.openComma + "[\\t ]+", "g"), this.openComma)
				.replace(new RegExp("[\\t ]+" + this.closeComma, "g"), this.closeComma);

		// Fix dashes (end):
		txt = txt.replace(/- /g, this.dash + " ");

		// Replace exclusions:
		while(excCnt > -1) {
			txt = txt.replace(
				new RegExp(this.subst + excCnt + "_", "g"),
				function() { return _this.notConv[excCnt].shift(); }
			);
			excCnt--;
		}

		// Del spaces:
		txt = txt
			.replace(/(\S)([ \t])[ \t]+/g, "$1$2") // "\t  " -> "\t", " \t\t" -> " "
			.replace(/[ \t]+$/mg, ""); // "text  \n" -> "text\n"

		return txt;
	}
};

if(hMainWnd && !AkelPad.GetEditReadOnly(hWndEdit)) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(lpPoint) {
		setRedraw(hWndEdit, false);
		var selParams = getSelParams();
		AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

		// Get selection or all text and save fullTxt flag:
		var txt = AkelPad.GetSelText();
		var fullTxt = !txt;
		if(fullTxt)
			txt = AkelPad.SetSel(0, -1) || AkelPad.GetSelText();

		var selStart = AkelPad.GetSelStart();
		var err;
		try {
			var fixer = new PunctuationFixer(fixerDash, fixerForceUpperCase, fixerCommas);
			txt = fixer.convert(txt);
			AkelPad.ReplaceSel(txt);
			if(!fixerSaveSelPos || !fullTxt)
				selParams = [selStart, selStart + txt.length];
		}
		catch(e) {
			err = e;
		}

		restoreSelParams(selParams);
		AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
		setRedraw(hWndEdit, true);
		AkelPad.MemFree(lpPoint);

		if(err)
			throw err;
	}
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	if(bRedraw)
		oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}
function getSelParams() {
	return [AkelPad.GetSelStart(), AkelPad.GetSelEnd()];
}
function restoreSelParams(selParams) {
	AkelPad.SetSel(selParams[0], selParams[1]);
}