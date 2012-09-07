// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9924#9924
// http://infocatcher.ucoz.net/js/akelpad_scripts/toggleComments.js

// (c) Infocatcher 2008-2012
// version 0.4.3.1 - 2012-05-11

//===================
// Adds/removes comments

// Arguments:
//   -method=0                     - toggle (default)
//          =1                     - add
//          =2                     - remove
//   -addSpaces=true               - true => code /* comment */ code, false => code/*comment*/code
//   -removeSpaces=true
//   -preferLineComments=false     - true => don't use block comments for multiple lines
//   -lineCommentsAtStart=false
//   -checkBlockComments=0         - don't check block comments inside commented code
//                      =1         - ask user with default OK button
//                      =2         - (default) ask user with default Cancel button
//                      =3         - don't ask and don't add comments
//   -blockCommentsEntireLines=-1  - only if end EOL selected
//                            =0   - only if entire lines selected (with or without end EOL)
//                            =1   - always
//   -searchRegions=true           - allow search regions like <?php ... ?>
//   -checkSyntax=0                - don't check any syntax constructions, fast, but may works incorrect
//               =1                - check simple syntax constructions
//               =2                - (default) check complex syntax constructions (only in *.js for now), may be very slow
//   -saveLastExt=0                - don't save last used extension
//               =1                - save only typed (default)
//               =2                - always save

// For boolean arguments you can use
//   -argName       - true
//   -argName=true
//   -argName=false

// Usage:
//   Call("Scripts::Main", 1, "toggleComments.js")
//   Call("Scripts::Main", 1, "toggleComments.js", "-method=0 -addSpaces=false -preferLineComments=true")
//===================

//== Settings begin
// You can use toggleComments-options.js file for override or tweak commentsRegions and commentsSets
// Example of toggleComments-options.js file:
//   commentsSets.tpl = [ ["{*"], ["*}"], ["//"] ]; // Add new extension
//   // Change arguments defaults
//   addSpaces = getArg("addSpaces", false);
//   blockCommentsEntireLines = getArg("blockCommentsEntireLines", -1);
var commentsSets = {
	// Example:
	//   extension: [
	//       [blockCommentStart0, blockCommentStart1],
	//       [blockCommentEnd0, blockCommentEnd1],
	//       [lineComment]
	//   ]
	// Or "link" to already defined extension:
	//   otherExtension: "extension"
	// Use "null" (without commas) for unavailable comments type.
	// First string will be used for comments adding (blockCommentStart0 and blockCommentEnd0 in example).
	c: [ ["/*"], ["*/"], ["//"] ],
	cpp:  "c",
	h:    "c",
	js:   "c",
	jsm:  "c",
	java: "c",
	"..php..": [ ["/*"], ["*/"], ["//", "#"] ], // Reserved
	php: "..php..", // In case of -searchRegions=true we use html comments in *.php files and check <?php ... ?>
	dpr: [ ["{", "(*"], ["}", "*)"], ["//"] ],
	//pas: [ ["{", "(*"], ["}", "*)"], null ],
	pas: "dpr",
	html: [ ["<!--"], ["-->"], null ],
	xhtml: "html",
	shtml: "html",
	htm:   "html",
	xml:   "html",
	xsl:   "html",
	xul:   "html",
	xbl:   "html",
	rdf:   "html",
	dtd:   "html",
	css: [ ["/*"], ["*/"], null ],
	asm: [ null, null, [";"] ],
	ini: [ null, null, [";", "#"] ],
	bat: [ null, null, ["::", "rem "] ],
	vbs: [ null, null, ["'", "rem "] ],
	lss: [ ["%REM"], ["%END REM"], ["'"] ],
	manifest: [ null, null, ["#"] ],
	properties: [ null, null, ["#"] ],
	highlight: [ null, null, [";"] ],
	coder: [ null, null, [";"] ],
	sql: [ ["/*"], ["*/"], ["--"] ],
	htaccess: [ null, null, ["#"] ]
};
var commentsRegions = {
	// Example:
	//   extension: {
	//       subExtension0: [[ext0_startMask0, ext0_endMask0], [ext0_startMask1, ext0_endMask1]],
	//       subExtension1: [[ext1_startMask0, ext1_endMask0]]
	//   }
	// Or "link" to already defined extension:
	//   otherExtension: "extension"
	// Masks is case unsensitive.
	html: {
		js: [["<script", "</script>"]],
		css: [["<style", "</style>"]],
		"..php..": [["<?php", "?>"], ["<?", "?>"]]
	},
	xhtml: "html",
	htm:   "html",
	php:   "html",
	xml: {
		css: [["<style", "</style>"]],
		"..php..": [["<?php", "?>"], ["<?", "?>"]],
		js: [
			["<script", "</script>"],
			["<![cdata[", "]]>"],
			["<constructor>", "</constructor>"],
			["<destructor>", "</destructor>"],
			["<getter>", "</getter>"],
			["<setter>", "</setter>"],
			["<field", "</field>"],
			["<method", "</method>"],
			["<handler", "</handler>"]
		]
	},
	xul: "xml",
	xbl: "xml"
};
var commentsExcludes = { // Now used only in delLineComments()
	// Special replacements for all extensions
	"..global..": function(str) {
		return str
			// Escape links like "http://example.com/"
			.replace(/([a-z-]):\/\/((\/*[^\/\s<>"*?&#\(\)\[\]\{\}]+)+)/g, "$1___$2")
			// Escaped slashes like "var re = /\//i;":
			.replace(/\\\//g, "__");
	},
	// Example:
	//   extension: function(str) { /* some operations with str */ return str; }
	// Or "link" to already defined extension:
	//   otherExtension: "extension"
	c: function(str) {
		if(oldRegExp)
			return str;
		// Remove strings ("..." and '...')
		return str
			.replace(/"(\\.|[^"\\\n\r])*"/g, escaper)
			.replace(/'(\\.|[^'\\\n\r])*'/g, escaper);
	},
	js: function(str) {
		if(oldRegExp)
			return str;
		// Remove strings ("..." and '...')
		str = str
			.replace(/"(\\.|[^"\\\n\r])*"/g, escaper)
			.replace(/'(\\.|[^'\\\n\r])*'/g, escaper);

		if(checkSyntax < 2)
			return str;

		// Try remove simple regular expressions like /x*/ and /\/*x/
		// We search for invalid divisions:
		// x = /./;            -> =
		// if(/a/.test(b))     -> (
		// x = [/a/, /b/]      -> [ ,
		// x = a && /b/test(c) -> & |
		// x = a ? /b/ : /c/   -> ? :
		// x = !/a/.test(b)    -> !
		return str.replace(
			/([=(\[,&|?:!]\s*((\/\/[^\n\r]*[\n\r]+|\/\*[\s\S]*?\*\/)\s*)*)\/([^*+?\\\/\n\r]|\\[^\n\r])(\\\/|[^\/\n\r])*\//g,
			// special chars   line comments       block comments         regexp begin                         regexp end
			function(s, prefix) {
				return prefix + escaper(s.substr(prefix.length));
			}
		);
	},
	jsm: "js",
	cpp:  "c",
	h:    "c",
	java: "c",
	php:  "c",
	dpr:  "c"
};
//== Settings end

function _localize(s) {
	var strings = {
		"Type extension of file:": {
			ru: "Введите расширение файла:"
		},
		"Settings for “%S” extension is missing!": {
			ru: "Настройки для расширения «%S» отсутствуют!"
		},
		"Invalid settings for “%S” extension!": {
			ru: "Неправильные настройки для расширения «%S»!"
		},
		" :: Comment": {
			ru: " :: Закомментировать"
		},
		" :: Uncomment": {
			ru: " :: Раскомментировать"
		},
		"Allow block comments inside?": {
			ru: "Разрешить блочные комментарии внутри?"
		},
		" :: Read only": {
			ru: " :: Только чтение"
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
var oSet = AkelPad.ScriptSettings();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

var oldRegExp = "x".replace(/x/, function(s) { return "y" }) != "y";

// Read arguments:
// getArg(argName, defaultValue)
var method                   = getArg("method", 0);
var addSpaces                = getArg("addSpaces", true);
var removeSpaces             = getArg("removeSpaces", true);
var preferLineComments       = getArg("preferLineComments", false);
var lineCommentsAtStart      = getArg("lineCommentsAtStart", false);
var checkBlockComments       = getArg("checkBlockComments", 2);
var blockCommentsEntireLines = getArg("blockCommentsEntireLines", 1);
var searchRegions            = getArg("searchRegions", true);
var checkSyntax              = getArg("checkSyntax", 2);
var saveLastExt              = getArg("saveLastExt", 1);

// Support for old arguments
if(getArg("noSpaces") !== undefined && getArg("addSpaces") === undefined) {
	addSpaces = !getArg("noSpaces");
	if(getArg("removeSpaces") === undefined)
		removeSpaces = addSpaces;
}
if(getArg("multipleEnabled") !== undefined && getArg("searchRegions") === undefined)
	searchRegions = getArg("multipleEnabled");
//if(getArg("ignoreBlockCommentsInSel") !== undefined && getArg("checkBlockComments") === undefined)
//	checkBlockComments = 2;


if(searchRegions)
	commentsSets.php = commentsSets.html;

var optionsPath = WScript.ScriptFullName.replace(/(\.[^.]+)?$/, "-options$&");
if(new ActiveXObject("Scripting.FileSystemObject").FileExists(optionsPath))
	eval(AkelPad.ReadFile(optionsPath));

function Comments(opts) {
	for(var p in opts)
		this[p] = opts[p];
	this.space = this.addSpaces ? " " : "";
	this.init();
	this.defineExt(); // => this.currentExt
	this.initExt();
};
Comments.prototype = {
	toggleComments: function(method) {
		if(!method || method == 2) { // toggle or remove
			var insData = this.delComments();
			if(insData) // Comments deleted
				return insData;
			if(_stopMessages.length)
				return null;
		}
		if(!method || method == 1) // toggle or add
			return this.addComments();
		return null;
	},
	addComments: function() {
		return this.addLineComments()
			|| this.addLinesComments()
			|| this.addBlockComments();
	},
	delComments: function() {
		return this.delLineComments()
			|| this.delLinesComments()
			|| this.delBlockComments();
	},
	init: function() {
		this.selStart = AkelPad.GetSelStart();
		this.selEnd   = AkelPad.GetSelEnd();
		this.selText = AkelPad.GetSelText();

		//AkelPad.SetSel(0, -1);
		//this.fullText = AkelPad.GetSelText();
		this.fullText = AkelPad.GetTextRange(0, -1);
		//this.fullTextLen = this.fullText.length;

		this.startText = this.fullText.substring(0, this.selStart);
		this.endText = this.fullText.substring(this.selEnd);

		this.noSel = this.selStart == this.selEnd;
		this.isMultiline = !this.noSel && /[\n\r]/.test(this.selText);
	},
	defineExt: function() {
		this.currentExt = this.ext;
		if(!this.searchRegions)
			return;
		var mParams = this.getParams(this.cmmRegions, this.ext);
		var startText = this.startText.toLowerCase();
		var selText = this.selText.toLowerCase();
		var endText = this.endText.toLowerCase();
		var start, end;
		var startIndx, endIndx;
		var mParam;
		for(var ext in mParams) {
			mParam = mParams[ext];
			for(var i = 0, len = mParam.length; i < len; i++) {
				start = mParam[i][0];
				end = mParam[i][1];
				startIndx = endText.indexOf(start);
				endIndx = endText.indexOf(end);
				if(
					startText.lastIndexOf(start) > startText.lastIndexOf(end)
					&& (selText.indexOf(start) == -1) && (selText.indexOf(end) == -1)
					&& endIndx != -1
					&& (startIndx == -1 || endIndx < startIndx)
				) {
					this.currentExt = ext;
					return;
				}
			}
		}
	},
	initExt: function(cmmParams) {
		if(this._initialisedExt == this.currentExt)
			return;
		this._initialisedExt = this.currentExt;

		cmmParams = cmmParams || this.getParams(this.cmmSets, this.currentExt);

		this.cmmBlockStart = cmmParams[0];
		this.cmmBlockEnd   = cmmParams[1];
		this.cmmLine       = cmmParams[2];

		var buggyBlockStart = !this.isArray(this.cmmBlockStart);
		var buggyBlockEnd   = !this.isArray(this.cmmBlockEnd);
		var buggyLine       = !this.isArray(this.cmmLine);
		this.noCmmBlock = !this.cmmBlockStart || !this.cmmBlockEnd || buggyBlockStart || buggyBlockEnd;
		this.noCmmLine = !this.cmmLine || buggyLine;
		if(
			(this.cmmBlockStart && buggyBlockStart)
			|| (this.cmmBlockEnd && buggyBlockEnd)
			|| (this.cmmLine && buggyLine)
		)
			_addStopMessage(_localize("Invalid settings for “%S” extension!").replace("%S", this.currentExt));
	},
	getParams: function(sets, key) {
		var params = sets[key];
		if(typeof params == "string")
			params = sets[params];
		return params;
	},
	isArray: function(a) {
		return a instanceof Array;
	},
	exclude: function(str) {
		if(!checkSyntax)
			return str;
		var ex = this.cmmExcludes;
		if(ex["..global.."])
			str = ex["..global.."](str);
		var esc = this.getParams(ex, this.currentExt);
		if(esc)
			str = esc(str);
		return str;
	},
	delLineComments: function() {
		if(this.noCmmLine || this.isMultiline)
			return null;

		for(var i = 0, len = this.cmmLine.length; i < len; i++) {
			var cmmLine = this.cmmLine[i];

			var linePos = this.getBlockByIndex(this.selStart, this.selEnd);
			var lineStart = linePos[0];
			var lineEnd   = linePos[1];
			//AkelPad.SetSel(lineStart, lineEnd);
			//var line = AkelPad.GetSelText();
			var line = this.fullText.substring(lineStart, lineEnd);
			if(!this.noSel && this.selEnd < lineStart + line.indexOf(cmmLine))
				continue; // |     |   //

			var cmmLineIndx = this.exclude(line).indexOf(cmmLine);
			if(
				cmmLineIndx != -1
				&& (
					this.selStart >= lineStart + cmmLineIndx // Caret should be after comment
					|| /^[ \t]*$/.test(this.fullText.substring(lineStart, this.selStart)) // Or only spaces befor
				)
			) {
				var linePart = line.substring(cmmLineIndx);
				//var sp = this.removeSpaces ? "[\\t ]?" : "";
				var sp = this.removeSpaces ? " ?" : "";
				var cmmLinePattern = this.escapeRegExp(cmmLine) + this.fixCmmLineRegExp(cmmLine);
				linePart = linePart.replace(new RegExp("^" + cmmLinePattern + sp), "");
				return {
					str: linePart,
					selBefore: [lineStart + cmmLineIndx, lineEnd],
					selAfter: [lineStart + cmmLineIndx, lineStart + cmmLineIndx + linePart.length]
				};
				//line = line.substring(0, cmmLineIndx) + linePart.replace(cmmLinePattern, "");
				//AkelPad.SetSel(lineStart, lineEnd);
				//AkelPad.ReplaceSel(line);
				//AkelPad.SetSel(lineStart + cmmLineIndx, lineStart + line.length);
			}
			//else
			//	continue;
			//return [lineStart + cmmLineIndx, lineStart + line.length]; //~~~
		}
		return null;
	},
	delLinesComments: function() {
		if(this.noCmmLine || !this.isMultiline)
			return null;

		cmmLoop:
		for(var i = 0, len = this.cmmLine.length; i < len; i++) {
			var cmmLine = this.cmmLine[i];

			var blockPos = this.getBlockByIndex(this.selStart, this.selEnd);

			//AkelPad.SetSel(blockPos[0], blockPos[1]);
			//var block = AkelPad.GetSelText();
			var block = this.fullText.substring(blockPos[0], blockPos[1]);
			var cmmLineEsc = this.escapeRegExp(cmmLine);
			var cmmLineEscFixed = cmmLineEsc + this.fixCmmLineRegExp(cmmLine);

			//if(!cmmLinePattern.test(block))
			//	continue;
			var removeSpaces = this.removeSpaces;
			var removeOnlyOneLevel = true;
			var hasLineCmmPattern = new RegExp("^[\\t ]*(" + cmmLineEscFixed + ")");
			var lines = this.exclude(block).split(/[\r\n]+/);
			var cmmLineLen = cmmLine.length;
			for(var j = 0, l = lines.length; j < l; j++) {
				if(!hasLineCmmPattern.test(lines[j]))
					continue cmmLoop;
				var cmmChrs = RegExp.$1;
				if(removeSpaces && /^\S/.test(RegExp.rightContext))
					removeSpaces = false;
				if(
					removeOnlyOneLevel
					&& cmmChrs.length > cmmLineLen
					&& !hasLineCmmPattern.test(cmmChrs.substr(cmmLineLen))
				)
					removeOnlyOneLevel = false;
			}

			var lineCmmPattern = new RegExp(
				"(^|\\r\\n|\\n|\\r)([\\t ]*)"
					+ (removeOnlyOneLevel ? cmmLineEsc : cmmLineEscFixed)
					//+ this.fixCmmLineRegExp(cmmLine)
					+ (removeSpaces ? " ?" : ""),
				"g"
			);
			block = block.replace(lineCmmPattern, "$1$2");

			//AkelPad.SetSel(blockPos[0], blockPos[1]);
			//AkelPad.ReplaceSel(block);
			//AkelPad.SetSel(blockPos[0], blockPos[0] + block.length);
			//return [blockPos[0], blockPos[0] + block.length];
			return {
				str: block,
				selBefore: [blockPos[0], blockPos[1]],
				selAfter: [blockPos[0], blockPos[0] + block.length]
			};
		}
		return null;
	},
	delBlockComments: function() {
		if(this.noCmmBlock)
			return null;

		for(var i = 0, len = this.cmmBlockStart.length; i < len; i++) {
			var cmmBlockStart = this.cmmBlockStart[i];
			var cmmBlockEnd = this.cmmBlockEnd[i];

			if(!cmmBlockStart || !cmmBlockEnd) {
				_addStopMessage(_localize("Invalid settings for “%S” extension!").replace("%S", this.currentExt));
				continue;
			}

			//       selection
			// 0  /* |       | */
			// 1  /* | */    |
			// 2     |    /* | */
			// 3     | /* */ |

			// noSel && noCmmLine
			// 4  /* */ |
			// 5        | /* */

			var startPos, endPos;

			var cmmLen = Math.max(cmmBlockStart.length, cmmBlockEnd.length);
			var add = cmmLen - 1;

			var fullText = this.exclude(this.fullText);

			var ss = this.selStart;
			var se = this.selEnd;

			var startTextAdd    = fullText.substring(0, ss + add);
			var startSelTextAdd = fullText.substring(0, se + add);
			var selTextAdd      = fullText.substring(ss - add, se + add);
			var selEndTextAdd   = fullText.substring(ss - add);
			var endTextAdd      = fullText.substring(se - add);

			var selOpenIndx  = selTextAdd.indexOf(cmmBlockStart);
			var selCloseLastIndx = selTextAdd.lastIndexOf(cmmBlockEnd);

			if(selOpenIndx == -1 && selCloseLastIndx == -1) { // 0  /* |       | */
				var startOpenLastIndx  = startTextAdd.lastIndexOf(cmmBlockStart); // /* |  |
				var startCloseLastIndx = startTextAdd.lastIndexOf(cmmBlockEnd);   // */ |  |
				var endOpenIndx        = endTextAdd.indexOf(cmmBlockStart);       //    |  | /*
				var endCloseIndx       = endTextAdd.indexOf(cmmBlockEnd);         //    |  | */
				if(Math.max(startOpenLastIndx, startCloseLastIndx, endOpenIndx, endCloseIndx) == -1) // Not found
					continue;
				if(
					startOpenLastIndx != -1 && startOpenLastIndx > startCloseLastIndx // */ /* |  |
					&& endCloseIndx != -1 && (endOpenIndx == -1 || endCloseIndx < endOpenIndx) // |  | */ /*
				) {
					startPos = startOpenLastIndx;
					endPos = Math.max(0, se - add) + endCloseIndx + cmmBlockEnd.length;
				}
				// noSel && noCmmLine
				// 4  /*  */  |
				// 5          |  /*  */
				if(
					startPos == undefined && endPos == undefined
					&& this.noSel && this.noCmmLine
				) {
					// 4  /*  */  |
					var linePos = this.getLineByIndex(ss);
					//var line = fullText.substring(linePos[0], linePos[1]);

					var lineStartAdd = fullText.substring(linePos[0], ss + add);

					var lineStartOpenIndx      = lineStartAdd.indexOf(cmmBlockStart);
					var lineStartOpenLastIndx  = lineStartAdd.lastIndexOf(cmmBlockStart);
					var lineStartCloseIndx     = lineStartAdd.indexOf(cmmBlockEnd);
					var lineStartCloseLastIndx = lineStartAdd.lastIndexOf(cmmBlockEnd);
					if(
						lineStartOpenLastIndx != -1 && lineStartCloseLastIndx != -1
						&& lineStartOpenLastIndx < lineStartCloseLastIndx  // Detect */ /* |
					) {
						var commented = fullText.substring( // Check for /* or */ inside
							linePos[0] + lineStartOpenLastIndx + cmmBlockStart.length,
							linePos[0] + lineStartCloseLastIndx
						);
						if(commented.indexOf(cmmBlockStart) == -1 && commented.indexOf(cmmBlockEnd) == -1) {
							startPos = linePos[0] + lineStartOpenLastIndx;
							endPos   = linePos[0] + lineStartCloseLastIndx + cmmBlockEnd.length;
						}
					}
					if(startPos == undefined && endPos == undefined) {
						// 5          |  /*  */
						var lineEndAdd = fullText.substring(ss - add, linePos[1]);

						var lineEndOpenIndx      = lineEndAdd.indexOf(cmmBlockStart);
						var lineEndOpenLastIndx  = lineEndAdd.lastIndexOf(cmmBlockStart);
						var lineEndCloseIndx     = lineEndAdd.indexOf(cmmBlockEnd);
						var lineEndCloseLastIndx = lineEndAdd.lastIndexOf(cmmBlockEnd);
						if(
							lineEndOpenIndx != -1 && lineEndCloseIndx != -1
							&& lineEndOpenIndx < lineEndCloseIndx // Detect | */ /*
						) {
							var lineEndOffset = Math.max(0, ss - add);
							var commented = fullText.substring( // Check for /* or */ inside
								lineEndOffset + lineEndOpenIndx + cmmBlockStart.length,
								lineEndOffset + lineEndCloseIndx
							);
							if(commented.indexOf(cmmBlockStart) == -1 && commented.indexOf(cmmBlockEnd) == -1) {
								startPos = lineEndOffset + lineEndOpenIndx;
								endPos   = lineEndOffset + lineEndCloseIndx + cmmBlockEnd.length;
							}
						}
					}
				}
			}
			else if(selOpenIndx == -1 && selCloseLastIndx != -1) { // 1  /* | */    |
				var selCloseIndx = selTextAdd.indexOf(cmmBlockEnd); // Check for | */ */ |
				if(selCloseIndx == selCloseLastIndx) {
					var startOpenLastIndx  = startTextAdd.lastIndexOf(cmmBlockStart); // /*    | */ |
					var startCloseLastIndx = startTextAdd.lastIndexOf(cmmBlockEnd);   // /* */ | */ |
					selCloseIndx += Math.max(0, ss - add);
					if(
						startOpenLastIndx != -1
						&& (
							startCloseLastIndx < startOpenLastIndx // */ /* | */ |
							|| selCloseIndx == startCloseLastIndx  // +add => can be same
						)
					) {
						startPos = startOpenLastIndx;
						endPos = selCloseIndx + cmmBlockEnd.length;
					}
				}
			}
			else if(selOpenIndx != -1 && selCloseLastIndx == -1) { // 2     |    /* | */
				var selOpenLastIndx = selTextAdd.lastIndexOf(cmmBlockStart); // Check for | /* /* |
				if(selOpenIndx == selOpenLastIndx) {
					var endCloseIndx = endTextAdd.indexOf(cmmBlockEnd);  // | /* |    */
					var endOpenIndx = endTextAdd.indexOf(cmmBlockStart); // | /* | /* */
					selOpenIndx += Math.max(0, ss - add);
					if(
						endCloseIndx != -1
						&& (
							endOpenIndx == -1 || endCloseIndx < endOpenIndx // /* | */ /*
							|| selOpenIndx == Math.max(0, se - add) + endOpenIndx // +add => can be same
						)
					) {
						startPos = selOpenIndx;
						endPos = Math.max(0, se - add) + endCloseIndx + cmmBlockEnd.length;
					}
				}
			}
			//if(selOpenIndx != -1 && selCloseLastIndx != -1) {
			else { // 3     | /* */ |
				if(!this.noCmmLine && this.isMultiline && this.pLineCmm) {
					// Check for |/* */|
					var tmp = fullText.substring(ss, se)
						.replace(/^\s+|\s+$/g, "");
					if(
						tmp.substr(0, cmmBlockStart.length) != cmmBlockStart
						|| tmp.slice(-cmmBlockEnd.length) != cmmBlockEnd
					)
						continue;
				}

				// Allow remove any selected comments: | /* ... */ |
				var selCloseIndx    = selTextAdd.indexOf(cmmBlockEnd);       // | */ /* */    |
				var selOpenLastIndx = selTextAdd.lastIndexOf(cmmBlockStart); // |    /* */ /* |
				if(
					(selCloseIndx == -1 || selOpenIndx < selCloseIndx)
					&& selCloseLastIndx > selOpenLastIndx
				) {
					var selOffset = Math.max(0, ss - add);
					startPos = selOffset + selOpenIndx;
					endPos   = selOffset + selCloseLastIndx + cmmBlockEnd.length;
				}
			}

			if(startPos == undefined || endPos == undefined)
				continue;

			//WScript.Echo(startPos +"\n"+ endPos);
			//AkelPad.SetSel(startPos, endPos);
			//return [startPos, endPos];

			var startPosIns = startPos;
			var endPosIns   = endPos;

			var openPattern = this.escapeRegExp(cmmBlockStart) + this.fixCmmBlockStartRegExp(cmmBlockStart);
			var closePattern = this.fixCmmBlockEndRegExp(cmmBlockEnd) + this.escapeRegExp(cmmBlockEnd);
			var spPattern = this.removeSpaces ? " ?" : "";

			var startLinePos = this.getLineByIndex(startPos);
			var endLinePos   = this.getLineByIndex(endPos, startLinePos[0]);
			var startLine = this.fullText.substring(startLinePos[0], startLinePos[1]);
			var endLine   = this.fullText.substring(endLinePos[0], endLinePos[1]);
			if(new RegExp("^[ \\t]*" + openPattern + "[ \\t]*$").test(startLine)) { // Only /* in line
				startPosIns = startLinePos[0];
				openPattern = "[ \\t]*" + openPattern + "[ \\t]*(\\n\\r?|\\r\\n?)";
			}
			else
				openPattern += spPattern;
			if(new RegExp("^[ \\t]*" + closePattern + "[ \\t]*$").test(endLine)) { // Only */ in line
				endPosIns = endLinePos[1];
				closePattern = "(\\n\\r?|\\r\\n?)[ \\t]*" + closePattern + "[ \\t]*";
			}
			else
				closePattern = spPattern + closePattern;

			var ins = this.fullText.substring(startPosIns, endPosIns)
				.replace(new RegExp("^" + openPattern + closePattern + "$"), "") // Simple way to remove /****/
				.replace(new RegExp("^" + openPattern), "")
				.replace(new RegExp(closePattern + "$"), "");

			if(!this.checkBlockComments(ins, cmmBlockStart, cmmBlockEnd, false))
				continue;

			this.getBlockByIndex(ss, se); // Set this._hasEmptyLine

			return {
				str: ins,
				selBefore: [startPosIns, endPosIns],
				selAfter: [startPosIns, startPosIns + ins.length]
			};
		}
		return null;
	},
	addLineComments: function() {
		if(this.noCmmLine || (!this.noSel && !this.noCmmBlock) || this.isMultiline)
			return null;

		var cmmLine = this.cmmLine[0];

		var linePos = this.getLineByIndex(this.selStart);
		var line = this.fullText.substring(linePos[0], linePos[1]);
		var startPos = this.noSel
			? linePos[0] + line.match(/^[\t ]*/)[0].length
			: this.selStart;
		//AkelPad.SetSel(startPos, linePos[1]);
		//var endText = AkelPad.GetSelText();
		var endText = this.fullText.substring(startPos, linePos[1]);
		var cmm = (
			this.noSel
				? ""
				: /[ \t]/.test(this.fullText.charAt(startPos - 1))
					? ""
					: this.space
			)
			+ cmmLine
			+ (/ $/.test(cmmLine) ? "" : this.space);
		var ins = cmm + endText;
		//AkelPad.SetSel(startPos, linePos[1]);
		//AkelPad.ReplaceSel(ins);

		var startAdd = 0;
		var posAdd = 0;
		if(!endText)
			startAdd = cmm.length;
		else
			posAdd = ins.length;
		//AkelPad.SetSel(startPos, startPos + posAdd);
		//return [startPos, startPos + posAdd];
		return {
			str: ins,
			selBefore: [startPos, linePos[1]],
			selAfter: [startPos + startAdd, startPos + startAdd + posAdd]
		};
	},
	addLinesComments: function() {
		if(this.noCmmLine || !this.isMultiline || (!this.pLineCmm && !this.noCmmBlock))
			return null;

		var blockPos = this.getBlockByIndex(this.selStart, this.selEnd);
		if(
			!this.noCmmBlock
			&& this.blockCmmsEntireLines < 1
			&& (
				blockPos[0] != this.selStart
				|| !(
					blockPos[1] == this.selEnd
					|| blockPos[1] == this.selEnd - 1 && this._getLineByIndex(this.selEnd)[0] == this.selEnd
				)
			)
		)
			return null;

		var cmmLine = this.cmmLine[0];

		//AkelPad.SetSel(blockPos[0], blockPos[1]);
		//var block = AkelPad.GetSelText();
		var block = this.fullText.substring(blockPos[0], blockPos[1]);

		var lines = block.split("\r");
		var linesCnt = lines.length;
		var spacePrefix = "";
		var spacePrefixLen;

		//var hasLineCmmPattern = new RegExp("(^|\\r\\n|\\n|\\r)([\\t ]*)" + this.escapeRegExp(cmmLine));
		//var atStart = hasLineCmmPattern.test(this.exclude(block))
		//	? true
		//	: this.lineCmmAtStart;

		if(!this.lineCmmAtStart) {
			var minSpLen = Infinity;
			for(var i = 0; i < linesCnt; i++) {
				var line = lines[i];
				if(/^[ \t]*$/.test(line))
					continue;
				if(!/^[ \t]+/.test(line)) {
					spacePrefix = "";
					break;
				}
				var sp = RegExp.lastMatch;
				if(sp.length < minSpLen) {
					minSpLen = sp.length;
					spacePrefix = sp;
				}
			}
			if(spacePrefix) {
				spacePrefixLen = spacePrefix.length;
				for(var i = 0; i < linesCnt; i++) {
					var line = lines[i];
					if(!line)
						continue;
					if(
						/^[ \t]+$/.test(line) && line.length < spacePrefixLen
							? spacePrefix.substr(0, line.length) != line
							: line.substr(0, spacePrefixLen) != spacePrefix
					) {
						spacePrefix = "";
						break;
					}
				}
			}
		}

		spacePrefixLen = spacePrefix.length;
		var cmmAdd = cmmLine + (/ $/.test(cmmLine) ? "" : this.space);

		for(var i = 0; i < linesCnt; i++)
			lines[i] = spacePrefix + cmmAdd + lines[i].substr(spacePrefixLen);

		block = lines.join("\n");

		//AkelPad.SetSel(blockPos[0], blockPos[1]);
		//AkelPad.ReplaceSel(block);
		//AkelPad.SetSel(blockPos[0], blockPos[0] + block.length);
		//return [blockPos[0], blockPos[0] + block.length];
		return {
			str: block,
			selBefore: [blockPos[0], blockPos[1]],
			selAfter: [blockPos[0], blockPos[0] + block.length]
		};
	},
	addBlockComments: function() {
		if(this.noCmmBlock)
			return null;

		var cmmBlockStart = this.cmmBlockStart[0];
		var cmmBlockEnd = this.cmmBlockEnd[0];

		var startLinePos = this.getLineByIndex(this.selStart);

		if(!this.isMultiline && this.noSel && this.noCmmLine) { // Comment current line
			var line = this.fullText.substring(startLinePos[0], startLinePos[1]);
			var start = line.search(/\S/);
			if(start == -1) // empty line
				start = this.selStart - startLinePos[0];
			line = line.replace(/^\s+|\s+$/g, "");
			var startPos = startLinePos[0] + start;
			//AkelPad.SetSel(startPos, startPos + line.length);

			var cmmStart = cmmBlockStart + this.space;
			var cmmEnd = this.space + cmmBlockEnd;

			if(!this.checkBlockComments(line, cmmBlockStart, cmmBlockEnd, true))
				return null;
			var ins = cmmStart + line + cmmEnd;
			//AkelPad.ReplaceSel(ins);

			var startAdd = 0;
			var posAdd = 0;
			if(!line) // " /*  */ "
				startAdd = cmmStart.length;
			else
				posAdd = ins.length;
			//AkelPad.SetSel(startPos, startPos + posAdd);
			//return [startPos, startPos + posAdd];
			return {
				str: ins,
				selBefore: [startPos, startPos + line.length],
				selAfter: [startPos + startAdd, startPos + startAdd + posAdd]
			};
		}

		var endLinePos = this.getLineByIndex(this.selEnd, startLinePos[0]);

		if(this.blockCmmsEntireLines < 1)
			var entireLinesSelected = startLinePos[0] == this.selStart
				&& (
					this.blockCmmsEntireLines == 0 && endLinePos[1] == this.selEnd
					|| endLinePos[1] == this.selEnd - 1 && this.getLineByIndex(this.selEnd)[0] == this.selEnd
				);

		if(!this.isMultiline || this.blockCmmsEntireLines < 1 && !entireLinesSelected) {
			var _startText = this.fullText.substring(startLinePos[0], this.selStart);
			var _endText = this.fullText.substring(this.selEnd, endLinePos[1]);
			var cmmStart = (/[\t ]$|^$/.test(_startText) ? "" : this.space)
				+ cmmBlockStart
				+ (/^[\t ]|^$/.test(this.selText) ? "" : this.space);
			var cmmEnd = (/[\t ]$|^$/.test(this.selText) ? "" : this.space)
				+ cmmBlockEnd
				+ (/^[\t ]|^$/.test(_endText) ? "" : this.space);
			if(!this.checkBlockComments(this.selText, cmmBlockStart, cmmBlockEnd, true))
				return null;
			var _text = cmmStart + this.selText + cmmEnd;
			//AkelPad.SetSel(startLinePos[0], startLinePos[1]);
			//AkelPad.ReplaceSel(_startText + _text + _endText);
			//AkelPad.SetSel(this.selStart, this.selEnd);
			//AkelPad.ReplaceSel(_text);
			//AkelPad.SetSel(this.selStart, this.selStart + _text.length);
			//return [this.selStart, this.selStart + _text.length];
			return {
				str: _text,
				selBefore: [this.selStart, this.selEnd],
				selAfter: [this.selStart, this.selStart + _text.length]
			};
		}

		var _startLine = this.fullText.substring(startLinePos[0], startLinePos[1]);
		var _endLine = this.fullText.substring(endLinePos[0], endLinePos[1]);
		var _startLineSp = _startLine.match(/^[\t ]*/)[0];
		var _endLineSp = _endLine.match(/^[\t ]*/)[0];
		var sp = _startLineSp.length < _endLineSp.length ? _startLineSp : _endLineSp;

		//AkelPad.SetSel(startLinePos[0], endLinePos[1]);
		//var block = AkelPad.GetSelText();
		var block = this.fullText.substring(startLinePos[0], endLinePos[1]);
		if(!this.checkBlockComments(block, cmmBlockStart, cmmBlockEnd, true))
			return null;
		block = sp + cmmBlockStart + "\n"
			+ block
			+ "\n" + sp + cmmBlockEnd;
		//AkelPad.ReplaceSel(block);
		//AkelPad.SetSel(startLinePos[0], startLinePos[0] + block.length);
		//return [startLinePos[0], startLinePos[0] + block.length];
		return {
			str: block,
			selBefore: [startLinePos[0], endLinePos[1]],
			selAfter: [startLinePos[0], startLinePos[0] + block.length]
		};
	},
	checkBlockComments: function(str, cmmBlockStart, cmmBlockEnd, add) {
		if(!this.checkBlockCmms)
			return true;
		str = this.exclude(str);
		if(str.indexOf(cmmBlockStart) != -1 || str.indexOf(cmmBlockEnd) != -1) {
			if(this.checkBlockCmms == 1 || this.checkBlockCmms == 2)
				return AkelPad.MessageBox(
					hMainWnd,
					_localize("Allow block comments inside?"),
					dialogTitle + _localize(add ? " :: Comment" : " :: Uncomment"),
					33 /*MB_OKCANCEL|MB_ICONQUESTION*/
						| (this.checkBlockCmms == 1 ? 0 /*MB_DEFBUTTON1*/ : 256 /*MB_DEFBUTTON2*/)
				) == 1 /*IDOK*/;
			return false;
		}
		return true;
	},
	/***
	getBlockByIndex: function(startIndx, endIndx) {
		var middleLen = endIndx - startIndx;
		var start = this.fullText.substring(0, startIndx);
		var lineStart = start.search(/(^|\r\n|\n|\r)[^\n\r]*$/);
		lineStart += RegExp.$1.length;
		var end = this.fullText.substring(endIndx);
		var lineEnd = start.length + middleLen + end.search(/\r|\n|$/);
		return [lineStart, lineEnd];
	},
	***/
	getBlockByIndex: function(startIndx, endIndx) {
		// Based on Instructor's code
		// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11382#11382
		var line1Start = this.getOffset(hWndEdit, 18 /*AEGI_WRAPLINEBEGIN*/, startIndx);
		var line2Start = this.getOffset(hWndEdit, 18 /*AEGI_WRAPLINEBEGIN*/, endIndx);
		var line2End   = this.getOffset(hWndEdit, 19 /*AEGI_WRAPLINEEND*/,   endIndx);
		if(line2Start != line1Start && line2Start == endIndx) {
			line2End = line2Start - 1;
			var hasEmptyLine = true;
		}
		this._hasEmptyLine = hasEmptyLine;
		return [line1Start, line2End];
	},
	getLineByIndex: function(indx, prevLineStart, ignoreEmptyLine) {
		// Based on Instructor's code
		// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11382#11382
		//return this.getBlockByIndex(indx, indx);
		var lineStart = this.getOffset(hWndEdit, 18 /*AEGI_WRAPLINEBEGIN*/, indx);
		if(prevLineStart != undefined && lineStart != prevLineStart && lineStart == indx) {
			lineStart = this.getOffset(hWndEdit, 18 /*AEGI_WRAPLINEBEGIN*/, --indx);
			var hasEmptyLine = true;
		}
		if(!ignoreEmptyLine)
			this._hasEmptyLine = hasEmptyLine;
		var lineEnd = this.getOffset(hWndEdit, 19 /*AEGI_WRAPLINEEND*/, indx);
		return [lineStart, lineEnd];
	},
	_getLineByIndex: function(indx, prevLineStart) {
		return this.getLineByIndex(indx, prevLineStart, true);
	},
	getOffset: function(hWndEdit, nType /*AEGI_*/, nOffset) {
		// Based on Instructor's code
		// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11382#11382
		var lpIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
		if(!lpIndex)
			return 0;
		if(nOffset != -1)
			AkelPad.SendMessage(hWndEdit, 3137 /*AEM_RICHOFFSETTOINDEX*/, nOffset, lpIndex);
		AkelPad.SendMessage(hWndEdit, 3130 /*AEM_GETINDEX*/, nType, lpIndex);
		nOffset = AkelPad.SendMessage(hWndEdit, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
		AkelPad.MemFree(lpIndex);
		return nOffset;
	},
	escapeRegExp: function(str) {
		return str.replace(/[\\.^$+*?|()\[\]{}]/g, "\\$&");
	},
	fixCmmLineRegExp: function(cmmLine) {
		if(cmmLine == "//")
			return "/*[~=]*";
		return this.escapeRegExp(cmmLine.charAt(cmmLine.length - 1)) + "*";
	},
	fixCmmBlockStartRegExp: function(cmmBlockStart) {
		return this.escapeRegExp(cmmBlockStart.charAt(cmmBlockStart.length - 1)) + "*";
	},
	fixCmmBlockEndRegExp: function(cmmBlockEnd) {
		return this.escapeRegExp(cmmBlockEnd.charAt(0)) + "*";
	}
};

var _stopMessages = [];
function _addStopMessage(msg) {
	_stopMessages[_stopMessages.length] = msg;
}

if(hMainWnd) {
	parseContent(method);
	if(_stopMessages.length)
		AkelPad.MessageBox(hMainWnd, _stopMessages.join("\n\n"), dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
}

function parseContent(method) {
	var params = getCurrentExt();
	if(!params)
		return;
	var ext = params[0];
	var cmmParams = params[1];
	if(!cmmParams)
		return;
	var comments = new Comments({
		ext:                  ext,
		cmmSets:              commentsSets,
		cmmRegions:           commentsRegions,
		cmmExcludes:          commentsExcludes,
		//selParams:            selParams,
		addSpaces:            addSpaces,
		removeSpaces:         removeSpaces,
		searchRegions:        searchRegions,
		checkBlockCmms:       checkBlockComments,
		blockCmmsEntireLines: blockCommentsEntireLines,
		pLineCmm:             preferLineComments,
		lineCmmAtStart:       lineCommentsAtStart
	});
	var insData = comments.toggleComments(method);
	if(!insData)
		return;
	if(comments._hasEmptyLine) {
		insData.selBefore[1] += 1;
		insData.selAfter[1] += 1;
		// Here should be "\n", but following code is safer
		insData.str += AkelPad.GetTextRange(insData.selBefore[1] - 1, insData.selBefore[1]);
	}
	var ro = AkelPad.GetEditReadOnly(hWndEdit);
	insertNoScroll(insData.str, insData.selBefore, ro ? null : insData.selAfter);
	ro && AkelPad.MessageBox(hMainWnd, insData.str, dialogTitle + _localize(" :: Read only"), 64 /*MB_ICONINFORMATION*/);
}
function insertNoScroll(str, selBefore, selAfter) {
	//~ todo: save horizontal scroll?
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	selBefore && AkelPad.SetSel(selBefore[0], selBefore[1]);
	AkelPad.ReplaceSel(str);
	selAfter && AkelPad.SetSel(selAfter[0], selAfter[1]);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}

function getCurrentExt() {
	var ext;
	var cFile = AkelPad.GetEditFile(0);
	if(cFile && /\.([^.]+)$/i.test(cFile)) {
		ext = RegExp.$1.toLowerCase(); // js, css, etc.
		if(ext && !commentsSets[ext])
			ext = null;
	}
	var read, write;
	if(saveLastExt && (read = oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/))) {
		var extCacheId = "processId:" + oSys.Call("kernel32::GetCurrentProcessId")
			+ "|hMainWnd:" + hMainWnd
			+ "|hInstanceDll:" + AkelPad.GetInstanceDll()
			+ "|hInstanceExe:" + AkelPad.GetInstanceExe();
		var extCacheExpired = oSet.Read("extCacheToken", 3 /*PO_STRING*/) != extCacheId;
	}
	if(!ext) {
		if(saveLastExt && read && !extCacheExpired) {
			var extCache = oSet.Read("extCache", 3 /*PO_STRING*/) || "";
			if(extCache && new RegExp("(^|\|)" + hWndEdit + "=([^|]+)").test(extCache))
				ext = RegExp.$2;
		}
		if(!ext) {
			var extTyped = true;
			ext = AkelPad.InputBox(
				hMainWnd,
				dialogTitle,
				_localize("Type extension of file:"),
				saveLastExt
					&& (read || (read = oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/)))
					&& oSet.Read("lastExt", 3 /*PO_STRING*/)
					|| ""
			);
		}
	}
	read && oSet.End();
	if(!ext)
		return null;
	ext = ext.toLowerCase();
	var cmmSet = commentsSets[ext];
	if(typeof cmmSet == "string")
		cmmSet = commentsSets[cmmSet];
	if(!cmmSet)
		_addStopMessage(_localize("Settings for “%S” extension is missing!").replace("%S", ext));
	else if(saveLastExt) {
		if((extTyped || saveLastExt == 2) && (write = oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/)))
			oSet.Write("lastExt", 3 /*PO_STRING*/, ext);
		if(extTyped && (write || (write = oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/)))) {
			extCache = (extCache || "").split("|");
			while(extCache.length > 99)
				extCache.shift();
			extCache = extCache.join("|");
			extCache += (extCache ? "|" : "") + hWndEdit + "=" + ext;
			oSet.Write("extCache", 3 /*PO_STRING*/, extCache);
			oSet.Write("extCacheToken", 3 /*PO_STRING*/, extCacheId);
			var saved = true;
		}
	}
	if(extCacheExpired && !saved && (write || (write = oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/)))) {
		oSet.Delete("extCache");
		oSet.Delete("extCacheToken");
	}
	write && oSet.End();
	return [ext, cmmSet];
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}
function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; i++)
		if(/^[-\/](\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
			args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
	getArg = function(argName, defaultVal) {
		argName = argName.toLowerCase();
		return typeof args[argName] == "undefined" // argName in args
			? defaultVal
			: args[argName];
	};
	return getArg(argName, defaultVal);
}
function escaper(str) {
	return new Array(str.length + 1).join("_");
}