// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11246#11246
// http://infocatcher.ucoz.net/js/akelpad_scripts/jsBeautifier.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/jsBeautifier.js

// (c) Infocatcher 2011-2014
// version 0.2.7pre - 2014-09-19
// Based on scripts from http://jsbeautifier.org/
// [built from https://github.com/beautify-web/js-beautify/tree/master 2014-10-17 19:38:27 UTC]

//===================
// JavaScript unpacker and beautifier

// Arguments:
//   -onlySelected=true           - use only selected text
//   -action=1                    - 0 - insert (default), 1 - insert to new document, 2 - copy, 3 - show
//   -restoreCaretPos=true        - restore caret position (works only without selection)
//   -setSyntax=0                 - don't change syntax theme (Coder plugin)
//             =1                 - set syntax theme only in documents without theme
//             =2                 - (default) don't change syntax "type" (e.g. don't change "xml" to "html")
//             =3                 - always set
//   -indentSize=1                - indent with a tab character
//              =4                - indent with 4 spaces
//   -preserveNewlines=true       - whether existing line breaks should be preserved
//   -maxPreserveNewlines=2       - maximum number of line breaks to be preserved in one chunk
//   -braceStyle="collapse"       - braces with control statement
//              ="expand"         - braces on own line
//              ="end-expand"     - end braces on own line
//              ="none"           - attempt to keep braces where they are
//   -keepArrayIndentation=true   - keep array indentation
//   -breakChainedMethods=false   - break lines on chained methods
//   -spaceInParen=true           - add padding spaces within paren, i.e. f( a, b )
//   -spaceInEmptyParen=true      - add a single space inside empty paren, i.e. f( )
//   -jsLintHappy=true            - use "function ()" instead of "function()"
//   -spaceBeforeConditional=true - space before conditional: "if(x)" / "if (x)"
//   -indentScripts="keep"        - HTML <style>, <script> formatting: keep indent level of the tag
//                 ="normal"      - add one indent level
//                 ="separate"    - separate indentation
//   -unescapeStrings=true        - unescape printable \xNN characters in strings ("example" vs "\x65\x78\x61\x6d\x70\x6c\x65")
//   -wrapLineLength=70           - lines should wrap at next opportunity after this number of characters
//   -e4x=true                    - handle E4X XML literals
//   -endWithNewline=false        - end output with a newline
//   -maxChar=70                  - maximum amount of characters per line (only for HTML), deprecated, use -wrapLineLength instead
//   -unformattedTags=["a"]       - list of tags, that shouldn't be reformatted (only for HTML)
//   -indentInnerHTML=true        - indent <head> and <body> sections (only for HTML)
//   -detectPackers=true          - detect packers
//   -css=true                    - force beautify CSS (just automatically wrap code into <style>...</style>)
//   -update=1                    - update source from https://github.com/beautify-web/js-beautify/
//          =2                    - update source from https://github.com/beautify-web/js-beautify/tree/gh-pages
//   -forceNoCache                - prevent caching during update
//   -test                        - force run the tests

// You also can pass any arguments to js_beautify()/html_beautify() using "_raw_" prefix, example:
//   -_raw_indent_handlebars=true - add "indent_handlebars: true" to options object

// Usage:
//   Call("Scripts::Main", 1, "jsBeautifier.js")
//   Call("Scripts::Main", 1, "jsBeautifier.js", "-css=true")
//   Call("Scripts::Main", 1, "jsBeautifier.js", "-indentSize=1 -keepArrayIndentation=false -braceStyle='expand'")
//   Call("Scripts::Main", 1, "jsBeautifier.js", "-action=1")
//   Call("Scripts::Main", 1, "jsBeautifier.js", `-unformattedTags=["a","sub","sup","b","i","u"]`)
//===================


function _localize(s) {
	var strings = {
		"All %S tests passed.": {
			ru: "Все %S тестов пройдены."
		},
		"Download errors:\n": {
			ru: "Ошибки скачивания:\n"
		},
		"Not found:\n": {
			ru: "Не найдено:\n"
		},
		"Already updated!": {
			ru: "Уже обновлено!"
		},
		"No real changes, only updated header information": {
			ru: "Нет реальных изменений, только обновлена информация в заголовке"
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

var ACT_INSERT         = 0;
var ACT_INSERT_NEW_DOC = 1;
var ACT_COPY           = 2;
var ACT_SHOW           = 3;

// Read arguments:
// getArg(argName, defaultValue)
var onlySelected           = getArg("onlySelected", false);
var action                 = getArg("action", ACT_INSERT);
var restoreCaretPos        = getArg("restoreCaretPos", true);
var setSyntaxMode          = getArg("setSyntax", 2);
var indentSize             = getArg("indentSize", 1);
var preserveNewlines       = getArg("preserveNewlines", true);
var maxPreserveNewlines    = getArg("maxPreserveNewlines", 2);
var braceStyle             = getArg("braceStyle", "end-expand");
var keepArrayIndentation   = getArg("keepArrayIndentation", true);
var breakChainedMethods    = getArg("breakChainedMethods", false);
var spaceInParen           = getArg("spaceInParen", false);
var spaceInEmptyParen      = getArg("spaceInEmptyParen", false);
var jsLintHappy            = getArg("jsLintHappy", false);
var spaceBeforeConditional = getArg("spaceBeforeConditional", false);
var indentScripts          = getArg("indentScripts", "normal");
var unescapeStrings        = getArg("unescapeStrings"); // Will use jsBeautifier defaults
var wrapLineLength         = getArg("wrapLineLength");
var e4x                    = getArg("e4x");
var endWithNewline         = getArg("endWithNewline");
var maxChar                = getArg("maxChar"); // Will use jsBeautifier defaults
var unformattedTags        = getArg("unformattedTags"); // Will use jsBeautifier defaults
var indentInnerHTML        = getArg("indentInnerHTML"); // Will use jsBeautifier defaults
var detectPackers          = getArg("detectPackers", true);
var beautifyCSS            = getArg("css", false);
var test                   = getArg("test", false);
var update                 = getArg("update", 0);
var forceNoCache           = getArg("forceNoCache", true);

// Deprecated arguments:
if(getArg("bracesOnOwnLine") !== undefined && getArg("braceStyle") === undefined)
	braceStyle = getArg("bracesOnOwnLine") ? "expand" : "collapse";
if(getArg("spaceAfterAnonFunc") !== undefined && getArg("jsLintHappy") === undefined)
	jsLintHappy = getArg("spaceAfterAnonFunc");

var indentChar = indentSize == 1
	? "\t"
	: " ";

function getRawArgs() {
	var rawArgs = {};
	var args = getArg._args;
	for(var arg in args)
		if(arg.substr(0, 5) == "_raw_")
			rawArgs[arg.substr(5)] = args[arg];
	return rawArgs;
}

// Limitations with JScript in WSH:
// 1) string[number] doesn't work - string.charAt(number) should be used instead
// 2) Strange things with string.split(regexp):
//   "\n\n\n|".split(/\n/).length // 1
//   "\n\n\n|".split("\n").length // 4 (correct)
//   Solution: string.replace(regexp, someString).split(someString)
// 3) "abcde".substr(-1) doesn't work - use "abcde".slice(-1) instead

var window = {}; // Fake window object to import things from beautify.js

//== index.html
// When update this section, replace all document.getElementById() calls with above options
// And leave beautify(source, syntax) and runTests() entry points

function beautify(source, syntax) { // Based on beautify function
	if(beautify.inProgress)
		return "";
	beautify.inProgress = true;

	var opts = {
		indent_size:              indentSize,
		indent_char:              indentChar,
		preserve_newlines:        preserveNewlines,
		max_preserve_newlines:    maxPreserveNewlines,
		brace_style:              braceStyle,
		keep_array_indentation:   keepArrayIndentation,
		break_chained_methods:    breakChainedMethods,
		space_in_paren:           spaceInParen,
		space_in_empty_paren:     spaceInEmptyParen,
		jslint_happy:             jsLintHappy,
		space_before_conditional: spaceBeforeConditional,
		indent_scripts:           indentScripts,
		unescape_strings:         unescapeStrings,
		wrap_line_length:         wrapLineLength,
		e4x:                      e4x,
		end_with_newline:         endWithNewline,
		// for style_html():
		max_char:                 maxChar,
		unformatted:              unformattedTags,
		indent_inner_html:        indentInnerHTML
	};
	var rawArgs = getRawArgs();
	for(var rawArg in rawArgs)
		if(opts[rawArg] === undefined)
			opts[rawArg] = rawArgs[rawArg];

	var res = "";
	if(looks_like_html(source)) {
		if(syntax)
			syntax.value = detectXMLType(source);
		res = html_beautify(source, opts);
	}
	else {
		if(syntax)
			syntax.value = "js";
		if(detectPackers)
			source = unpacker_filter(source);
		res = js_beautify(source, opts);
	}
	beautify.inProgress = false;
	return res;
}
function jsBeautify() { // For backward compatibility, deprecated
	return beautify.apply(this, arguments);
}
function runTests() { // Based on run_tests function
	var st = new SanityTest();
	run_javascript_tests(st, Urlencoded, js_beautify, html_beautify, css_beautify);
	run_css_tests(st, Urlencoded, js_beautify, html_beautify, css_beautify);
	run_html_tests(st, Urlencoded, js_beautify, html_beautify, css_beautify);
	JavascriptObfuscator.run_tests(st);
	P_A_C_K_E_R.run_tests(st);
	Urlencoded.run_tests(st);
	MyObfuscate.run_tests(st);

	//return st.results();
	return st.results_raw();
}
function looks_like_html(source)
{
    // <foo> - looks like html
    // <!--\nalert('foo!');\n--> - doesn't look like html

    var trimmed = source.replace(/^[ \t\n\r]+/, '');
    var comment_mark = '<!-' + '-';
    return (trimmed && (trimmed.substring(0, 1) === '<' && trimmed.substring(0, 4) !== comment_mark));
}
function unpacker_filter(source) {
    var trailing_comments = '';
    var comment = '';
    var found = false;

    do {
        found = false;
        if (/^\s*\/\*/.test(source)) {
            found = true;
            comment = source.substr(0, source.indexOf('*/') + 2);
            source = source.substr(comment.length).replace(/^\s+/, '');
            trailing_comments += comment + "\n";
        } else if (/^\s*\/\//.test(source)) {
            found = true;
            comment = source.match(/^\s*\/\/.*/)[0];
            source = source.substr(comment.length).replace(/^\s+/, '');
            trailing_comments += comment + "\n";
        }
    } while (found);

    if (P_A_C_K_E_R.detect(source)) {
        // P.A.C.K.E.R unpacking may fail, even though it is detected
        var unpacked = P_A_C_K_E_R.unpack(source);
        if (unpacked != source) {
            source = unpacker_filter(unpacked);
        }
    }
    if (Urlencoded.detect(source)) {
        source = unpacker_filter(Urlencoded.unpack(source))
    }
    if (JavascriptObfuscator.detect(source)) {
        source = unpacker_filter(JavascriptObfuscator.unpack(source))
    }
    if (MyObfuscate.detect(source)) {
        source = unpacker_filter(MyObfuscate.unpack(source))
    }

    return trailing_comments + source;
}
function detectXMLType(str) {
	if(str.indexOf("<?xml") == -1)
		return "html";
	if(hasNS("http://www.mozilla.org/xbl") && /<bindings[\s>]/.test(str))
		return "xbl";
	if(hasNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"))
		return "xul";
	if(hasNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#"))
		return "rdf";
	if(hasNS("http://www.w3.org/1999/XSL/Transform"))
		return "xsl";
	if(hasNS("http://www.w3.org/2000/svg"))
		return "svg";
	if(/<!ENTITY\s[^<>]+>/.test(str))
		return "dtd";
	return "xml";

	function hasNS(ns) {
		return new RegExp(
			"\\sxmlns\\s*=\\s*(\"|')"
			+ ns.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&")
			+ "\\1[\\s>]"
		).test(str);
	}
}
//== index.html end


//== js/lib/beautify.js
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2013 Einar Lielmanis and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

 JS Beautifier
---------------


  Written by Einar Lielmanis, <einar@jsbeautifier.org>
      http://jsbeautifier.org/

  Originally converted to javascript by Vital, <vital76@gmail.com>
  "End braces on own line" added by Chris J. Shull, <chrisjshull@gmail.com>
  Parsing improvements for brace-less statements by Liam Newman <bitwiseman@gmail.com>


  Usage:
    js_beautify(js_source_text);
    js_beautify(js_source_text, options);

  The options are:
    indent_size (default 4)          - indentation size,
    indent_char (default space)      - character to indent with,
    preserve_newlines (default true) - whether existing line breaks should be preserved,
    max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk,

    jslint_happy (default false) - if true, then jslint-stricter mode is enforced.

            jslint_happy        !jslint_happy
            ---------------------------------
            function ()         function()

            switch () {         switch() {
            case 1:               case 1:
              break;                break;
            }                   }

    space_after_anon_function (default false) - should the space before an anonymous function's parens be added, "function()" vs "function ()",
          NOTE: This option is overriden by jslint_happy (i.e. if jslint_happy is true, space_after_anon_function is true by design)

    brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "none"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line, or attempt to keep them where they are.

    space_before_conditional (default true) - should the space before conditional statement be added, "if(true)" vs "if (true)",

    unescape_strings (default false) - should printable characters in strings encoded in \xNN notation be unescaped, "example" vs "\x65\x78\x61\x6d\x70\x6c\x65"

    wrap_line_length (default unlimited) - lines should wrap at next opportunity after this number of characters.
          NOTE: This is not a hard limit. Lines will continue until a point where a newline would
                be preserved if it were present.

    end_with_newline (default false)  - end output with a newline


    e.g

    js_beautify(js_source_text, {
      'indent_size': 1,
      'indent_char': '\t'
    });

*/

(function() {

    var acorn = {};
    (function (exports) {
      // This section of code is taken from acorn.
      //
      // Acorn was written by Marijn Haverbeke and released under an MIT
      // license. The Unicode regexps (for identifiers and whitespace) were
      // taken from [Esprima](http://esprima.org) by Ariya Hidayat.
      //
      // Git repositories for Acorn are available at
      //
      //     http://marijnhaverbeke.nl/git/acorn
      //     https://github.com/marijnh/acorn.git

      // ## Character categories

      // Big ugly regular expressions that match characters in the
      // whitespace, identifier, and identifier-start categories. These
      // are only applied when a character is found to actually have a
      // code point above 128.

      var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
      var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
      var nonASCIIidentifierChars = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
      var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
      var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

      // Whether a single character denotes a newline.

      var newline = exports.newline = /[\n\r\u2028\u2029]/;

      // Matches a whole line break (where CRLF is considered a single
      // line break). Used to count lines.

      var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

      // Test whether a given character code starts an identifier.

      var isIdentifierStart = exports.isIdentifierStart = function(code) {
        if (code < 65) return code === 36;
        if (code < 91) return true;
        if (code < 97) return code === 95;
        if (code < 123)return true;
        return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
      };

      // Test whether a given character is part of an identifier.

      var isIdentifierChar = exports.isIdentifierChar = function(code) {
        if (code < 48) return code === 36;
        if (code < 58) return true;
        if (code < 65) return false;
        if (code < 91) return true;
        if (code < 97) return code === 95;
        if (code < 123)return true;
        return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
      };
    })(acorn);

    function in_array(what, arr) {
        for (var i = 0; i < arr.length; i += 1) {
            if (arr[i] === what) {
                return true;
            }
        }
        return false;
    }

    function trim(s) {
        return s.replace(/^\s+|\s+$/g, '');
    }

    function js_beautify(js_source_text, options) {
        "use strict";
        var beautifier = new Beautifier(js_source_text, options);
        return beautifier.beautify();
    }

    var MODE = {
            BlockStatement: 'BlockStatement', // 'BLOCK'
            Statement: 'Statement', // 'STATEMENT'
            ObjectLiteral: 'ObjectLiteral', // 'OBJECT',
            ArrayLiteral: 'ArrayLiteral', //'[EXPRESSION]',
            ForInitializer: 'ForInitializer', //'(FOR-EXPRESSION)',
            Conditional: 'Conditional', //'(COND-EXPRESSION)',
            Expression: 'Expression' //'(EXPRESSION)'
        };

    function Beautifier(js_source_text, options) {
        "use strict";
        var output
        var tokens = [], token_pos;
        var Tokenizer;
        var current_token;
        var last_type, last_last_text, indent_string;
        var flags, previous_flags, flag_store;
        var prefix;

        var handlers, opt;
        var baseIndentString = '';

        handlers = {
            'TK_START_EXPR': handle_start_expr,
            'TK_END_EXPR': handle_end_expr,
            'TK_START_BLOCK': handle_start_block,
            'TK_END_BLOCK': handle_end_block,
            'TK_WORD': handle_word,
            'TK_RESERVED': handle_word,
            'TK_SEMICOLON': handle_semicolon,
            'TK_STRING': handle_string,
            'TK_EQUALS': handle_equals,
            'TK_OPERATOR': handle_operator,
            'TK_COMMA': handle_comma,
            'TK_BLOCK_COMMENT': handle_block_comment,
            'TK_INLINE_COMMENT': handle_inline_comment,
            'TK_COMMENT': handle_comment,
            'TK_DOT': handle_dot,
            'TK_UNKNOWN': handle_unknown,
            'TK_EOF': handle_eof
        };

        function create_flags(flags_base, mode) {
            var next_indent_level = 0;
            if (flags_base) {
                next_indent_level = flags_base.indentation_level;
                if (!output.just_added_newline() &&
                    flags_base.line_indent_level > next_indent_level) {
                    next_indent_level = flags_base.line_indent_level;
                }
            }

            var next_flags = {
                mode: mode,
                parent: flags_base,
                last_text: flags_base ? flags_base.last_text : '', // last token text
                last_word: flags_base ? flags_base.last_word : '', // last 'TK_WORD' passed
                declaration_statement: false,
                declaration_assignment: false,
                multiline_frame: false,
                if_block: false,
                else_block: false,
                do_block: false,
                do_while: false,
                in_case_statement: false, // switch(..){ INSIDE HERE }
                in_case: false, // we're on the exact line with "case 0:"
                case_body: false, // the indented case-action block
                indentation_level: next_indent_level,
                line_indent_level: flags_base ? flags_base.line_indent_level : next_indent_level,
                start_line_index: output.get_line_number(),
                ternary_depth: 0
            };
            return next_flags;
        }

        // Some interpreters have unexpected results with foo = baz || bar;
        options = options ? options : {};
        opt = {};

        // compatibility
        if (options.braces_on_own_line !== undefined) { //graceful handling of deprecated option
            opt.brace_style = options.braces_on_own_line ? "expand" : "collapse";
        }
        opt.brace_style = options.brace_style ? options.brace_style : (opt.brace_style ? opt.brace_style : "collapse");

        // graceful handling of deprecated option
        if (opt.brace_style === "expand-strict") {
            opt.brace_style = "expand";
        }


        opt.indent_size = options.indent_size ? parseInt(options.indent_size, 10) : 4;
        opt.indent_char = options.indent_char ? options.indent_char : ' ';
        opt.preserve_newlines = (options.preserve_newlines === undefined) ? true : options.preserve_newlines;
        opt.break_chained_methods = (options.break_chained_methods === undefined) ? false : options.break_chained_methods;
        opt.max_preserve_newlines = (options.max_preserve_newlines === undefined) ? 0 : parseInt(options.max_preserve_newlines, 10);
        opt.space_in_paren = (options.space_in_paren === undefined) ? false : options.space_in_paren;
        opt.space_in_empty_paren = (options.space_in_empty_paren === undefined) ? false : options.space_in_empty_paren;
        opt.jslint_happy = (options.jslint_happy === undefined) ? false : options.jslint_happy;
        opt.space_after_anon_function = (options.space_after_anon_function === undefined) ? false : options.space_after_anon_function;
        opt.keep_array_indentation = (options.keep_array_indentation === undefined) ? false : options.keep_array_indentation;
        opt.space_before_conditional = (options.space_before_conditional === undefined) ? true : options.space_before_conditional;
        opt.unescape_strings = (options.unescape_strings === undefined) ? false : options.unescape_strings;
        opt.wrap_line_length = (options.wrap_line_length === undefined) ? 0 : parseInt(options.wrap_line_length, 10);
        opt.e4x = (options.e4x === undefined) ? false : options.e4x;
        opt.end_with_newline = (options.end_with_newline === undefined) ? false : options.end_with_newline;


        // force opt.space_after_anon_function to true if opt.jslint_happy
        if(opt.jslint_happy) {
            opt.space_after_anon_function = true;
        }

        if(options.indent_with_tabs){
            opt.indent_char = '\t';
            opt.indent_size = 1;
        }

        //----------------------------------
        indent_string = '';
        while (opt.indent_size > 0) {
            indent_string += opt.indent_char;
            opt.indent_size -= 1;
        }

        var preindent_index = 0;
        if(js_source_text && js_source_text.length) {
            while ( (js_source_text.charAt(preindent_index) === ' ' ||
                    js_source_text.charAt(preindent_index) === '\t')) {
                baseIndentString += js_source_text.charAt(preindent_index);
                preindent_index += 1;
            }
            js_source_text = js_source_text.substring(preindent_index);
        }

        last_type = 'TK_START_BLOCK'; // last token type
        last_last_text = ''; // pre-last token text
        output = new Output(indent_string, baseIndentString);


        // Stack of parsing/formatting states, including MODE.
        // We tokenize, parse, and output in an almost purely a forward-only stream of token input
        // and formatted output.  This makes the beautifier less accurate than full parsers
        // but also far more tolerant of syntax errors.
        //
        // For example, the default mode is MODE.BlockStatement. If we see a '{' we push a new frame of type
        // MODE.BlockStatement on the the stack, even though it could be object literal.  If we later
        // encounter a ":", we'll switch to to MODE.ObjectLiteral.  If we then see a ";",
        // most full parsers would die, but the beautifier gracefully falls back to
        // MODE.BlockStatement and continues on.
        flag_store = [];
        set_mode(MODE.BlockStatement);

        this.beautify = function() {

            /*jshint onevar:true */
            var local_token, sweet_code;
            Tokenizer = new tokenizer(js_source_text, opt, indent_string);
            tokens = Tokenizer.tokenize();
            token_pos = 0;

            while (local_token = get_token()) {
                for(var i = 0; i < local_token.comments_before.length; i++) {
                    // The cleanest handling of inline comments is to treat them as though they aren't there.
                    // Just continue formatting and the behavior should be logical.
                    // Also ignore unknown tokens.  Again, this should result in better behavior.
                    handle_token(local_token.comments_before[i]);
                }
                handle_token(local_token);

                last_last_text = flags.last_text;
                last_type = local_token.type;
                flags.last_text = local_token.text;

                token_pos += 1;
            }

            sweet_code = output.get_code();
            if (opt.end_with_newline) {
                sweet_code += '\n';
            }

            return sweet_code;
        };

        function handle_token(local_token) {
            var newlines = local_token.newlines;
            var keep_whitespace = opt.keep_array_indentation && is_array(flags.mode);

            if (keep_whitespace) {
                for (i = 0; i < newlines; i += 1) {
                    print_newline(i > 0);
                }
            } else {
                if (opt.max_preserve_newlines && newlines > opt.max_preserve_newlines) {
                    newlines = opt.max_preserve_newlines;
                }

                if (opt.preserve_newlines) {
                    if (local_token.newlines > 1) {
                        print_newline();
                        for (var i = 1; i < newlines; i += 1) {
                            print_newline(true);
                        }
                    }
                }
            }

            current_token = local_token;
            handlers[current_token.type]();
        }

        // we could use just string.split, but
        // IE doesn't like returning empty strings

        function split_newlines(s) {
            //return s.split(/\x0d\x0a|\x0a/);

            s = s.replace(/\x0d/g, '');
            var out = [],
                idx = s.indexOf("\n");
            while (idx !== -1) {
                out.push(s.substring(0, idx));
                s = s.substring(idx + 1);
                idx = s.indexOf("\n");
            }
            if (s.length) {
                out.push(s);
            }
            return out;
        }

        function allow_wrap_or_preserved_newline(force_linewrap) {
            force_linewrap = (force_linewrap === undefined) ? false : force_linewrap;

            // Never wrap the first token on a line
            if (output.just_added_newline()) {
                return
            }

            if ((opt.preserve_newlines && current_token.wanted_newline) || force_linewrap) {
                print_newline(false, true);
            } else if (opt.wrap_line_length) {
                var proposed_line_length = output.current_line.get_character_count() + current_token.text.length +
                    (output.space_before_token ? 1 : 0);
                if (proposed_line_length >= opt.wrap_line_length) {
                    print_newline(false, true);
                }
            }
        }

        function print_newline(force_newline, preserve_statement_flags) {
            if (!preserve_statement_flags) {
                if (flags.last_text !== ';' && flags.last_text !== ',' && flags.last_text !== '=' && last_type !== 'TK_OPERATOR') {
                    while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
                        restore_mode();
                    }
                }
            }

            if (output.add_new_line(force_newline)) {
                flags.multiline_frame = true;
            }
        }

        function print_token_line_indentation() {
            if (output.just_added_newline()) {
                if (opt.keep_array_indentation && is_array(flags.mode) && current_token.wanted_newline) {
                    output.current_line.push(current_token.whitespace_before);
                    output.space_before_token = false;
                } else if (output.set_indent(flags.indentation_level)) {
                    flags.line_indent_level = flags.indentation_level;
                }
            }
        }

        function print_token(printable_token) {
            printable_token = printable_token || current_token.text;
            print_token_line_indentation();
            output.add_token(printable_token);
        }

        function indent() {
            flags.indentation_level += 1;
        }

        function deindent() {
            if (flags.indentation_level > 0 &&
                ((!flags.parent) || flags.indentation_level > flags.parent.indentation_level))
                flags.indentation_level -= 1;
        }

        function set_mode(mode) {
            if (flags) {
                flag_store.push(flags);
                previous_flags = flags;
            } else {
                previous_flags = create_flags(null, mode);
            }

            flags = create_flags(previous_flags, mode);
        }

        function is_array(mode) {
            return mode === MODE.ArrayLiteral;
        }

        function is_expression(mode) {
            return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
        }

        function restore_mode() {
            if (flag_store.length > 0) {
                previous_flags = flags;
                flags = flag_store.pop();
                if (previous_flags.mode === MODE.Statement) {
                    output.remove_redundant_indentation(previous_flags);
                }
            }
        }

        function start_of_object_property() {
            return flags.parent.mode === MODE.ObjectLiteral && flags.mode === MODE.Statement && (
                (flags.last_text === ':' && flags.ternary_depth === 0) || (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set'])));
        }

        function start_of_statement() {
            if (
                    (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && current_token.type === 'TK_WORD') ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'do') ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'return' && !current_token.wanted_newline) ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'else' && !(current_token.type === 'TK_RESERVED' && current_token.text === 'if')) ||
                    (last_type === 'TK_END_EXPR' && (previous_flags.mode === MODE.ForInitializer || previous_flags.mode === MODE.Conditional)) ||
                    (last_type === 'TK_WORD' && flags.mode === MODE.BlockStatement
                        && !flags.in_case
                        && !(current_token.text === '--' || current_token.text === '++')
                        && current_token.type !== 'TK_WORD' && current_token.type !== 'TK_RESERVED') ||
                    (flags.mode === MODE.ObjectLiteral && (
                        (flags.last_text === ':' && flags.ternary_depth === 0) || (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set']))))
                ) {

                set_mode(MODE.Statement);
                indent();

                if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && current_token.type === 'TK_WORD') {
                    flags.declaration_statement = true;
                }

                // Issue #276:
                // If starting a new statement with [if, for, while, do], push to a new line.
                // if (a) if (b) if(c) d(); else e(); else f();
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline(
                        current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['do', 'for', 'if', 'while']));
                }

                return true;
            }
            return false;
        }

        function all_lines_start_with(lines, c) {
            for (var i = 0; i < lines.length; i++) {
                var line = trim(lines[i]);
                if (line.charAt(0) !== c) {
                    return false;
                }
            }
            return true;
        }

        function each_line_matches_indent(lines, indent) {
            var i = 0,
                len = lines.length,
                line;
            for (; i < len; i++) {
                line = lines[i];
                // allow empty lines to pass through
                if (line && line.indexOf(indent) !== 0) {
                    return false;
                }
            }
            return true;
        }

        function is_special_word(word) {
            return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
        }

        function get_token(offset) {
            var index = token_pos + (offset || 0);
            return (index < 0 || index >= tokens.length) ? null : tokens[index];
        }

        function handle_start_expr() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            }

            var next_mode = MODE.Expression;
            if (current_token.text === '[') {

                if (last_type === 'TK_WORD' || flags.last_text === ')') {
                    // this is array index specifier, break immediately
                    // a[x], fn()[x]
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, Tokenizer.line_starters)) {
                        output.space_before_token = true;
                    }
                    set_mode(next_mode);
                    print_token();
                    indent();
                    if (opt.space_in_paren) {
                        output.space_before_token = true;
                    }
                    return;
                }

                next_mode = MODE.ArrayLiteral;
                if (is_array(flags.mode)) {
                    if (flags.last_text === '[' ||
                        (flags.last_text === ',' && (last_last_text === ']' || last_last_text === '}'))) {
                        // ], [ goes to new line
                        // }, [ goes to new line
                        if (!opt.keep_array_indentation) {
                            print_newline();
                        }
                    }
                }

            } else {
                if (last_type === 'TK_RESERVED' && flags.last_text === 'for') {
                    next_mode = MODE.ForInitializer;
                } else if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['if', 'while'])) {
                    next_mode = MODE.Conditional;
                } else {
                    // next_mode = MODE.Expression;
                }
            }

            if (flags.last_text === ';' || last_type === 'TK_START_BLOCK') {
                print_newline();
            } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || flags.last_text === '.') {
                // TODO: Consider whether forcing this is required.  Review failing tests when removed.
                allow_wrap_or_preserved_newline(current_token.wanted_newline);
                // do nothing on (( and )( and ][ and ]( and .(
            } else if (!(last_type === 'TK_RESERVED' && current_token.text === '(') && last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                output.space_before_token = true;
            } else if ((last_type === 'TK_RESERVED' && (flags.last_word === 'function' || flags.last_word === 'typeof')) ||
                (flags.last_text === '*' && last_last_text === 'function')) {
                // function() vs function ()
                if (opt.space_after_anon_function) {
                    output.space_before_token = true;
                }
            } else if (last_type === 'TK_RESERVED' && (in_array(flags.last_text, Tokenizer.line_starters) || flags.last_text === 'catch')) {
                if (opt.space_before_conditional) {
                    output.space_before_token = true;
                }
            }

            // Support of this kind of newline preservation.
            // a = (b &&
            //     (c || d));
            if (current_token.text === '(') {
                if (last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                    if (!start_of_object_property()) {
                        allow_wrap_or_preserved_newline();
                    }
                }
            }

            set_mode(next_mode);
            print_token();
            if (opt.space_in_paren) {
                output.space_before_token = true;
            }

            // In all cases, if we newline while inside an expression it should be indented.
            indent();
        }

        function handle_end_expr() {
            // statements inside expressions are not valid syntax, but...
            // statements must all be closed when their container closes
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }

            if (flags.multiline_frame) {
                allow_wrap_or_preserved_newline(current_token.text === ']' && is_array(flags.mode) && !opt.keep_array_indentation);
            }

            if (opt.space_in_paren) {
                if (last_type === 'TK_START_EXPR' && ! opt.space_in_empty_paren) {
                    // () [] no inner space in empty parens like these, ever, ref #320
                    output.trim();
                    output.space_before_token = false;
                } else {
                    output.space_before_token = true;
                }
            }
            if (current_token.text === ']' && opt.keep_array_indentation) {
                print_token();
                restore_mode();
            } else {
                restore_mode();
                print_token();
            }
            output.remove_redundant_indentation(previous_flags);

            // do {} while () // no statement required after
            if (flags.do_while && previous_flags.mode === MODE.Conditional) {
                previous_flags.mode = MODE.Expression;
                flags.do_block = false;
                flags.do_while = false;

            }
        }

        function handle_start_block() {
            // Check if this is should be treated as a ObjectLiteral
            var next_token = get_token(1)
            var second_token = get_token(2)
            if (second_token && (
                    (second_token.text === ':' && in_array(next_token.type, ['TK_STRING', 'TK_WORD', 'TK_RESERVED']))
                    || (in_array(next_token.text, ['get', 'set']) && in_array(second_token.type, ['TK_WORD', 'TK_RESERVED']))
                )) {
                // We don't support TypeScript,but we didn't break it for a very long time.
                // We'll try to keep not breaking it.
                if (!in_array(last_last_text, ['class','interface'])) {
                    set_mode(MODE.ObjectLiteral);
                } else {
                    set_mode(MODE.BlockStatement);
                }
            } else {
                set_mode(MODE.BlockStatement);
            }

            var empty_braces = !next_token.comments_before.length &&  next_token.text === '}';
            var empty_anonymous_function = empty_braces && flags.last_word === 'function' &&
                last_type === 'TK_END_EXPR';

            if (opt.brace_style === "expand" ||
                (opt.brace_style === "none" && current_token.wanted_newline)) {
                if (last_type !== 'TK_OPERATOR' &&
                    (empty_anonymous_function ||
                        last_type === 'TK_EQUALS' ||
                        (last_type === 'TK_RESERVED' && is_special_word(flags.last_text) && flags.last_text !== 'else'))) {
                    output.space_before_token = true;
                } else {
                    print_newline(false, true);
                }
            } else { // collapse
                if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                    if (last_type === 'TK_START_BLOCK') {
                        print_newline();
                    } else {
                        output.space_before_token = true;
                    }
                } else {
                    // if TK_OPERATOR or TK_START_EXPR
                    if (is_array(previous_flags.mode) && flags.last_text === ',') {
                        if (last_last_text === '}') {
                            // }, { in array context
                            output.space_before_token = true;
                        } else {
                            print_newline(); // [a, b, c, {
                        }
                    }
                }
            }
            print_token();
            indent();
        }

        function handle_end_block() {
            // statements must all be closed when their container closes
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }
            var empty_braces = last_type === 'TK_START_BLOCK';

            if (opt.brace_style === "expand") {
                if (!empty_braces) {
                    print_newline();
                }
            } else {
                // skip {}
                if (!empty_braces) {
                    if (is_array(flags.mode) && opt.keep_array_indentation) {
                        // we REALLY need a newline here, but newliner would skip that
                        opt.keep_array_indentation = false;
                        print_newline();
                        opt.keep_array_indentation = true;

                    } else {
                        print_newline();
                    }
                }
            }
            restore_mode();
            print_token();
        }

        function handle_word() {
            if (current_token.type === 'TK_RESERVED' && flags.mode !== MODE.ObjectLiteral &&
                in_array(current_token.text, ['set', 'get'])) {
                current_token.type = 'TK_WORD';
            }

            if (current_token.type === 'TK_RESERVED' && flags.mode === MODE.ObjectLiteral) {
                var next_token = get_token(1);
                if (next_token.text == ':') {
                    current_token.type = 'TK_WORD';
                }
            }

            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            } else if (current_token.wanted_newline && !is_expression(flags.mode) &&
                (last_type !== 'TK_OPERATOR' || (flags.last_text === '--' || flags.last_text === '++')) &&
                last_type !== 'TK_EQUALS' &&
                (opt.preserve_newlines || !(last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const', 'set', 'get'])))) {

                print_newline();
            }

            if (flags.do_block && !flags.do_while) {
                if (current_token.type === 'TK_RESERVED' && current_token.text === 'while') {
                    // do {} ## while ()
                    output.space_before_token = true;
                    print_token();
                    output.space_before_token = true;
                    flags.do_while = true;
                    return;
                } else {
                    // do {} should always have while as the next word.
                    // if we don't see the expected while, recover
                    print_newline();
                    flags.do_block = false;
                }
            }

            // if may be followed by else, or not
            // Bare/inline ifs are tricky
            // Need to unwind the modes correctly: if (a) if (b) c(); else d(); else e();
            if (flags.if_block) {
                if (!flags.else_block && (current_token.type === 'TK_RESERVED' && current_token.text === 'else')) {
                    flags.else_block = true;
                } else {
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }
                    flags.if_block = false;
                    flags.else_block = false;
                }
            }

            if (current_token.type === 'TK_RESERVED' && (current_token.text === 'case' || (current_token.text === 'default' && flags.in_case_statement))) {
                print_newline();
                if (flags.case_body || opt.jslint_happy) {
                    // switch cases following one another
                    deindent();
                    flags.case_body = false;
                }
                print_token();
                flags.in_case = true;
                flags.in_case_statement = true;
                return;
            }

            if (current_token.type === 'TK_RESERVED' && current_token.text === 'function') {
                if (in_array(flags.last_text, ['}', ';']) || (output.just_added_newline() && ! in_array(flags.last_text, ['[', '{', ':', '=', ',']))) {
                    // make sure there is a nice clean space of at least one blank line
                    // before a new function definition
                    if ( !output.just_added_blankline() && !current_token.comments_before.length) {
                        print_newline();
                        print_newline(true);
                    }
                }
                if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set', 'new', 'return', 'export'])) {
                        output.space_before_token = true;
                    } else if (last_type === 'TK_RESERVED' && flags.last_text === 'default' && last_last_text === 'export') {
                        output.space_before_token = true;
                    } else {
                        print_newline();
                    }
                } else if (last_type === 'TK_OPERATOR' || flags.last_text === '=') {
                    // foo = function
                    output.space_before_token = true;
                } else if (!flags.multiline_frame && (is_expression(flags.mode) || is_array(flags.mode))) {
                    // (function
                } else {
                    print_newline();
                }
            }

            if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline();
                }
            }

            if (current_token.type === 'TK_RESERVED' &&  in_array(current_token.text, ['function', 'get', 'set'])) {
                print_token();
                flags.last_word = current_token.text;
                return;
            }

            prefix = 'NONE';

            if (last_type === 'TK_END_BLOCK') {
                if (!(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally']))) {
                    prefix = 'NEWLINE';
                } else {
                    if (opt.brace_style === "expand" ||
                        opt.brace_style === "end-expand" ||
                        (opt.brace_style === "none" && current_token.wanted_newline)) {
                        prefix = 'NEWLINE';
                    } else {
                        prefix = 'SPACE';
                        output.space_before_token = true;
                    }
                }
            } else if (last_type === 'TK_SEMICOLON' && flags.mode === MODE.BlockStatement) {
                // TODO: Should this be for STATEMENT as well?
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
                prefix = 'SPACE';
            } else if (last_type === 'TK_STRING') {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD' ||
                (flags.last_text === '*' && last_last_text === 'function')) {
                prefix = 'SPACE';
            } else if (last_type === 'TK_START_BLOCK') {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_END_EXPR') {
                output.space_before_token = true;
                prefix = 'NEWLINE';
            }

            if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
                if (flags.last_text === 'else' || flags.last_text === 'export') {
                    prefix = 'SPACE';
                } else {
                    prefix = 'NEWLINE';
                }

            }

            if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally'])) {
                if (last_type !== 'TK_END_BLOCK' ||
                    opt.brace_style === "expand" ||
                    opt.brace_style === "end-expand" ||
                    (opt.brace_style === "none" && current_token.wanted_newline)) {
                    print_newline();
                } else {
                    output.trim(true);
                    var line = output.current_line;
                    // If we trimmed and there's something other than a close block before us
                    // put a newline back in.  Handles '} // comment' scenario.
                    if (line.last() !== '}') {
                        print_newline();
                    }
                    output.space_before_token = true;
                }
            } else if (prefix === 'NEWLINE') {
                if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                    // no newline between 'return nnn'
                    output.space_before_token = true;
                } else if (last_type !== 'TK_END_EXPR') {
                    if ((last_type !== 'TK_START_EXPR' || !(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['var', 'let', 'const']))) && flags.last_text !== ':') {
                        // no need to force newline on 'var': for (var x = 0...)
                        if (current_token.type === 'TK_RESERVED' && current_token.text === 'if' && flags.last_text === 'else') {
                            // no newline for } else if {
                            output.space_before_token = true;
                        } else {
                            print_newline();
                        }
                    }
                } else if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
                    print_newline();
                }
            } else if (flags.multiline_frame && is_array(flags.mode) && flags.last_text === ',' && last_last_text === '}') {
                print_newline(); // }, in lists get a newline treatment
            } else if (prefix === 'SPACE') {
                output.space_before_token = true;
            }
            print_token();
            flags.last_word = current_token.text;

            if (current_token.type === 'TK_RESERVED' && current_token.text === 'do') {
                flags.do_block = true;
            }

            if (current_token.type === 'TK_RESERVED' && current_token.text === 'if') {
                flags.if_block = true;
            }
        }

        function handle_semicolon() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
                // Semicolon can be the start (and end) of a statement
                output.space_before_token = false;
            }
            while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
                restore_mode();
            }
            print_token();
        }

        function handle_string() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
                // One difference - strings want at least a space before
                output.space_before_token = true;
            } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                output.space_before_token = true;
            } else if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline();
                }
            } else {
                print_newline();
            }
            print_token();
        }

        function handle_equals() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            }

            if (flags.declaration_statement) {
                // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
                flags.declaration_assignment = true;
            }
            output.space_before_token = true;
            print_token();
            output.space_before_token = true;
        }

        function handle_comma() {
            if (flags.declaration_statement) {
                if (is_expression(flags.parent.mode)) {
                    // do not break on comma, for(var a = 1, b = 2)
                    flags.declaration_assignment = false;
                }

                print_token();

                if (flags.declaration_assignment) {
                    flags.declaration_assignment = false;
                    print_newline(false, true);
                } else {
                    output.space_before_token = true;
                }
                return;
            }

            print_token();
            if (flags.mode === MODE.ObjectLiteral ||
                (flags.mode === MODE.Statement && flags.parent.mode === MODE.ObjectLiteral)) {
                if (flags.mode === MODE.Statement) {
                    restore_mode();
                }
                print_newline();
            } else {
                // EXPR or DO_BLOCK
                output.space_before_token = true;
            }

        }

        function handle_operator() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            }

            if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                // "return" had a special handling in TK_WORD. Now we need to return the favor
                output.space_before_token = true;
                print_token();
                return;
            }

            // hack for actionscript's import .*;
            if (current_token.text === '*' && last_type === 'TK_DOT') {
                print_token();
                return;
            }

            if (current_token.text === ':' && flags.in_case) {
                flags.case_body = true;
                indent();
                print_token();
                print_newline();
                flags.in_case = false;
                return;
            }

            if (current_token.text === '::') {
                // no spaces around exotic namespacing syntax operator
                print_token();
                return;
            }

            // http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
            // if there is a newline between -- or ++ and anything else we should preserve it.
            if (current_token.wanted_newline && (current_token.text === '--' || current_token.text === '++')) {
                print_newline(false, true);
            }

            // Allow line wrapping between operators
            if (last_type === 'TK_OPERATOR') {
                allow_wrap_or_preserved_newline();
            }

            var space_before = true;
            var space_after = true;

            if (in_array(current_token.text, ['--', '++', '!', '~']) || (in_array(current_token.text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array(flags.last_text, Tokenizer.line_starters) || flags.last_text === ','))) {
                // unary operators (and binary +/- pretending to be unary) special cases

                space_before = false;
                space_after = false;

                if (flags.last_text === ';' && is_expression(flags.mode)) {
                    // for (;; ++i)
                    //        ^^^
                    space_before = true;
                }

                if (last_type === 'TK_RESERVED' || last_type === 'TK_END_EXPR') {
                    space_before = true;
                } else if (last_type === 'TK_OPERATOR') {
                    space_before =
                        (in_array(current_token.text, ['--', '-']) && in_array(flags.last_text, ['--', '-'])) ||
                        (in_array(current_token.text, ['++', '+']) && in_array(flags.last_text, ['++', '+']));
                }

                if ((flags.mode === MODE.BlockStatement || flags.mode === MODE.Statement) && (flags.last_text === '{' || flags.last_text === ';')) {
                    // { foo; --i }
                    // foo(); --bar;
                    print_newline();
                }
            } else if (current_token.text === ':') {
                if (flags.ternary_depth === 0) {
                    // Colon is invalid javascript outside of ternary and object, but do our best to guess what was meant.
                    space_before = false;
                } else {
                    flags.ternary_depth -= 1;
                }
            } else if (current_token.text === '?') {
                flags.ternary_depth += 1;
            } else if (current_token.text === '*' && last_type === 'TK_RESERVED' && flags.last_text === 'function') {
                space_before = false;
                space_after = false;
            }
            output.space_before_token = output.space_before_token || space_before;
            print_token();
            output.space_before_token = space_after;
        }

        function handle_block_comment() {
            var lines = split_newlines(current_token.text);
            var j; // iterator for this case
            var javadoc = false;
            var starless = false;
            var lastIndent = current_token.whitespace_before;
            var lastIndentLength = lastIndent.length;

            // block comment starts with a new line
            print_newline(false, true);
            if (lines.length > 1) {
                if (all_lines_start_with(lines.slice(1), '*')) {
                    javadoc = true;
                }
                else if (each_line_matches_indent(lines.slice(1), lastIndent)) {
                    starless = true;
                }
            }

            // first line always indented
            print_token(lines[0]);
            for (j = 1; j < lines.length; j++) {
                print_newline(false, true);
                if (javadoc) {
                    // javadoc: reformat and re-indent
                    print_token(' ' + trim(lines[j]));
                } else if (starless && lines[j].length > lastIndentLength) {
                    // starless: re-indent non-empty content, avoiding trim
                    print_token(lines[j].substring(lastIndentLength));
                } else {
                    // normal comments output raw
                    output.add_token(lines[j]);
                }
            }

            // for comments of more than one line, make sure there's a new line after
            print_newline(false, true);
        }

        function handle_inline_comment() {
            output.space_before_token = true;
            print_token();
            output.space_before_token = true;
        }

        function handle_comment() {
            if (current_token.wanted_newline) {
                print_newline(false, true);
            } else {
                output.trim(true);
            }

            output.space_before_token = true;
            print_token();
            print_newline(false, true);
        }

        function handle_dot() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            }

            if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                output.space_before_token = true;
            } else {
                // allow preserved newlines before dots in general
                // force newlines on dots after close paren when break_chained - for bar().baz()
                allow_wrap_or_preserved_newline(flags.last_text === ')' && opt.break_chained_methods);
            }

            print_token();
        }

        function handle_unknown() {
            print_token();

            if (current_token.text[current_token.text.length - 1] === '\n') {
                print_newline();
            }
        }

        function handle_eof() {
            // Unwind any open statements
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }
        }
    }


    function OutputLine(parent) {
        var _character_count = 0;
        // use indent_count as a marker for lines that have preserved indentation
        var _indent_count = -1;

        var _items = [];
        var _empty = true;

        this.set_indent = function(level) {
            _character_count = parent.baseIndentLength + level * parent.indent_length
            _indent_count = level;
        }

        this.get_character_count = function() {
            return _character_count;
        }

        this.is_empty = function() {
            return _empty;
        }

        this.last = function() {
            if (!this._empty) {
              return _items[_items.length - 1];
            } else {
              return null;
            }
        }

        this.push = function(input) {
            _items.push(input);
            _character_count += input.length;
            _empty = false;
        }

        this.remove_indent = function() {
            if (_indent_count > 0) {
                _indent_count -= 1;
                _character_count -= parent.indent_length
            }
        }

        this.trim = function() {
            while (this.last() === ' ') {
                var item = _items.pop();
                _character_count -= 1;
            }
            _empty = _items.length === 0;
        }

        this.toString = function() {
            var result = '';
            if (!this._empty) {
                if (_indent_count >= 0) {
                    result = parent.indent_cache[_indent_count];
                }
                result += _items.join('')
            }
            return result;
        }
    }

    function Output(indent_string, baseIndentString) {
        baseIndentString = baseIndentString || '';
        this.indent_cache = [ baseIndentString ];
        this.baseIndentLength = baseIndentString.length;
        this.indent_length = indent_string.length;

        var lines =[];
        this.baseIndentString = baseIndentString;
        this.indent_string = indent_string;
        this.current_line = null;
        this.space_before_token = false;

        this.get_line_number = function() {
            return lines.length;
        }

        // Using object instead of string to allow for later expansion of info about each line
        this.add_new_line = function(force_newline) {
            if (this.get_line_number() === 1 && this.just_added_newline()) {
                return false; // no newline on start of file
            }

            if (force_newline || !this.just_added_newline()) {
                this.current_line = new OutputLine(this);
                lines.push(this.current_line);
                return true;
            }

            return false;
        }

        // initialize
        this.add_new_line(true);

        this.get_code = function() {
            var sweet_code = lines.join('\n').replace(/[\r\n\t ]+$/, '');
            return sweet_code;
        }

        this.set_indent = function(level) {
            // Never indent your first output indent at the start of the file
            if (lines.length > 1) {
                while(level >= this.indent_cache.length) {
                    this.indent_cache.push(this.indent_cache[this.indent_cache.length - 1] + this.indent_string);
                }

                this.current_line.set_indent(level);
                return true;
            }
            this.current_line.set_indent(0);
            return false;
        }

        this.add_token = function(printable_token) {
            this.add_space_before_token();
            this.current_line.push(printable_token);
        }

        this.add_space_before_token = function() {
            if (this.space_before_token && !this.just_added_newline()) {
                this.current_line.push(' ');
            }
            this.space_before_token = false;
        }

        this.remove_redundant_indentation = function (frame) {
            // This implementation is effective but has some issues:
            //     - can cause line wrap to happen too soon due to indent removal
            //           after wrap points are calculated
            // These issues are minor compared to ugly indentation.

            if (frame.multiline_frame ||
                frame.mode === MODE.ForInitializer ||
                frame.mode === MODE.Conditional) {
                return;
            }

            // remove one indent from each line inside this section
            var index = frame.start_line_index;
            var line;

            var output_length = lines.length;
            while (index < output_length) {
                lines[index].remove_indent();
                index++;
            }
        }

        this.trim = function(eat_newlines) {
            eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;

            this.current_line.trim(indent_string, baseIndentString);

            while (eat_newlines && lines.length > 1 &&
                this.current_line.is_empty()) {
                lines.pop();
                this.current_line = lines[lines.length - 1]
                this.current_line.trim();
            }
        }

        this.just_added_newline = function() {
            return this.current_line.is_empty();
        }

        this.just_added_blankline = function() {
            if (this.just_added_newline()) {
                if (lines.length === 1) {
                    return true; // start of the file and newline = blank
                }

                var line = lines[lines.length - 2];
                return line.is_empty();
            }
            return false;
        }
    }


    var Token = function(type, text, newlines, whitespace_before, mode, parent) {
        this.type = type;
        this.text = text;
        this.comments_before = [];
        this.newlines = newlines || 0;
        this.wanted_newline = newlines > 0;
        this.whitespace_before = whitespace_before || '';
        this.parent = null;
    }

    function tokenizer(input, opts, indent_string) {

        var whitespace = "\n\r\t ".split('');
        var digit = /[0-9]/;

        var punct = ('+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! ~ , : ? ^ ^= |= :: =>'
                +' <%= <% %> <?= <? ?>').split(' '); // try to be a good boy and try not to break the markup language identifiers

        // words which should always start on new line.
        this.line_starters = 'continue,try,throw,return,var,let,const,if,switch,case,default,for,while,break,function,yield,import,export'.split(',');
        var reserved_words = this.line_starters.concat(['do', 'in', 'else', 'get', 'set', 'new', 'catch', 'finally', 'typeof']);

        var n_newlines, whitespace_before_token, in_html_comment, tokens, parser_pos;
        var input_length;

        this.tokenize = function() {
            // cache the source's length.
            input_length = input.length
            parser_pos = 0;
            in_html_comment = false
            tokens = [];

            var next, last;
            var token_values;
            var open = null;
            var open_stack = [];
            var comments = [];

            while (!(last && last.type === 'TK_EOF')) {
                token_values = tokenize_next();
                next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);
                while(next.type === 'TK_INLINE_COMMENT' || next.type === 'TK_COMMENT' ||
                    next.type === 'TK_BLOCK_COMMENT' || next.type === 'TK_UNKNOWN') {
                    comments.push(next);
                    token_values = tokenize_next();
                    next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);
                }

                if (comments.length) {
                    next.comments_before = comments;
                    comments = [];
                }

                if (next.type === 'TK_START_BLOCK' || next.type === 'TK_START_EXPR') {
                    next.parent = last;
                    open = next;
                    open_stack.push(next);
                }  else if ((next.type === 'TK_END_BLOCK' || next.type === 'TK_END_EXPR') &&
                    (open && (
                        (next.text === ']' && open.text === '[') ||
                        (next.text === ')' && open.text === '(') ||
                        (next.text === '}' && open.text === '}')))) {
                    next.parent = open.parent;
                    open = open_stack.pop();
                }

                tokens.push(next);
                last = next;
            }

            return tokens;
        }

        function tokenize_next() {
            var i, resulting_string;
            var whitespace_on_this_line = [];

            n_newlines = 0;
            whitespace_before_token = '';

            if (parser_pos >= input_length) {
                return ['', 'TK_EOF'];
            }

            var last_token;
            if (tokens.length) {
                last_token = tokens[tokens.length-1];
            } else {
                // For the sake of tokenizing we can pretend that there was on open brace to start
                last_token = new Token('TK_START_BLOCK', '{');
            }


            var c = input.charAt(parser_pos);
            parser_pos += 1;

            while (in_array(c, whitespace)) {

                if (c === '\n') {
                    n_newlines += 1;
                    whitespace_on_this_line = [];
                } else if (n_newlines) {
                    if (c === indent_string) {
                        whitespace_on_this_line.push(indent_string);
                    } else if (c !== '\r') {
                        whitespace_on_this_line.push(' ');
                    }
                }

                if (parser_pos >= input_length) {
                    return ['', 'TK_EOF'];
                }

                c = input.charAt(parser_pos);
                parser_pos += 1;
            }

            if(whitespace_on_this_line.length) {
                whitespace_before_token = whitespace_on_this_line.join('');
            }

            if (digit.test(c)) {
                var allow_decimal = true;
                var allow_e = true;
                var local_digit = digit;

                if (c === '0' && parser_pos < input_length && /[Xx]/.test(input.charAt(parser_pos))) {
                    // switch to hex number, no decimal or e, just hex digits
                    allow_decimal = false;
                    allow_e = false;
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    local_digit = /[0123456789abcdefABCDEF]/
                } else {
                    // we know this first loop will run.  It keeps the logic simpler.
                    c = '';
                    parser_pos -= 1
                }

                // Add the digits
                while (parser_pos < input_length && local_digit.test(input.charAt(parser_pos))) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;

                    if (allow_decimal && parser_pos < input_length && input.charAt(parser_pos) === '.') {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        allow_decimal = false;
                    }

                    if (allow_e && parser_pos < input_length && /[Ee]/.test(input.charAt(parser_pos))) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;

                        if (parser_pos < input_length && /[+-]/.test(input.charAt(parser_pos))) {
                            c += input.charAt(parser_pos);
                            parser_pos += 1;
                        }

                        allow_e = false;
                        allow_decimal = false;
                    }
                }

                return [c, 'TK_WORD'];
            }

            if (acorn.isIdentifierStart(input.charCodeAt(parser_pos-1))) {
                if (parser_pos < input_length) {
                    while (acorn.isIdentifierChar(input.charCodeAt(parser_pos))) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos === input_length) {
                            break;
                        }
                    }
                }

                if (!(last_token.type === 'TK_DOT' ||
                        (last_token.type === 'TK_RESERVED' && in_array(last_token.text, ['set', 'get'])))
                    && in_array(c, reserved_words)) {
                    if (c === 'in') { // hack for 'in' operator
                        return [c, 'TK_OPERATOR'];
                    }
                    return [c, 'TK_RESERVED'];
                }

                return [c, 'TK_WORD'];
            }

            if (c === '(' || c === '[') {
                return [c, 'TK_START_EXPR'];
            }

            if (c === ')' || c === ']') {
                return [c, 'TK_END_EXPR'];
            }

            if (c === '{') {
                return [c, 'TK_START_BLOCK'];
            }

            if (c === '}') {
                return [c, 'TK_END_BLOCK'];
            }

            if (c === ';') {
                return [c, 'TK_SEMICOLON'];
            }

            if (c === '/') {
                var comment = '';
                // peek for comment /* ... */
                var inline_comment = true;
                if (input.charAt(parser_pos) === '*') {
                    parser_pos += 1;
                    if (parser_pos < input_length) {
                        while (parser_pos < input_length && !(input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/')) {
                            c = input.charAt(parser_pos);
                            comment += c;
                            if (c === "\n" || c === "\r") {
                                inline_comment = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                break;
                            }
                        }
                    }
                    parser_pos += 2;
                    if (inline_comment && n_newlines === 0) {
                        return ['/*' + comment + '*/', 'TK_INLINE_COMMENT'];
                    } else {
                        return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
                    }
                }
                // peek for comment // ...
                if (input.charAt(parser_pos) === '/') {
                    comment = c;
                    while (input.charAt(parser_pos) !== '\r' && input.charAt(parser_pos) !== '\n') {
                        comment += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos >= input_length) {
                            break;
                        }
                    }
                    return [comment, 'TK_COMMENT'];
                }

            }

            if (c === '`' || c === "'" || c === '"' || // string
                (
                    (c === '/') || // regexp
                    (opts.e4x && c === "<" && input.slice(parser_pos - 1).match(/^<([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])\s*([-a-zA-Z:0-9_.]+=('[^']*'|"[^"]*"|{[^{}]*})\s*)*\/?\s*>/)) // xml
                ) && ( // regex and xml can only appear in specific locations during parsing
                    (last_token.type === 'TK_RESERVED' && in_array(last_token.text , ['return', 'case', 'throw', 'else', 'do', 'typeof', 'yield'])) ||
                    (last_token.type === 'TK_END_EXPR' && last_token.text === ')' &&
                        last_token.parent && last_token.parent.type === 'TK_RESERVED' && in_array(last_token.parent.text, ['if', 'while', 'for'])) ||
                    (in_array(last_token.type, ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK',
                        'TK_END_BLOCK', 'TK_OPERATOR', 'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON', 'TK_COMMA'
                    ]))
                )) {

                var sep = c,
                    esc = false,
                    has_char_escapes = false;

                resulting_string = c;

                if (sep === '/') {
                    //
                    // handle regexp
                    //
                    var in_char_class = false;
                    while (parser_pos < input_length &&
                            ((esc || in_char_class || input.charAt(parser_pos) !== sep) &&
                            !acorn.newline.test(input.charAt(parser_pos)))) {
                        resulting_string += input.charAt(parser_pos);
                        if (!esc) {
                            esc = input.charAt(parser_pos) === '\\';
                            if (input.charAt(parser_pos) === '[') {
                                in_char_class = true;
                            } else if (input.charAt(parser_pos) === ']') {
                                in_char_class = false;
                            }
                        } else {
                            esc = false;
                        }
                        parser_pos += 1;
                    }
                } else if (opts.e4x && sep === '<') {
                    //
                    // handle e4x xml literals
                    //
                    var xmlRegExp = /<(\/?)([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])\s*([-a-zA-Z:0-9_.]+=('[^']*'|"[^"]*"|{[^{}]*})\s*)*(\/?)\s*>/g;
                    var xmlStr = input.slice(parser_pos - 1);
                    var match = xmlRegExp.exec(xmlStr);
                    if (match && match.index === 0) {
                        var rootTag = match[2];
                        var depth = 0;
                        while (match) {
                            var isEndTag = !! match[1];
                            var tagName = match[2];
                            var isSingletonTag = ( !! match[match.length - 1]) || (tagName.slice(0, 8) === "![CDATA[");
                            if (tagName === rootTag && !isSingletonTag) {
                                if (isEndTag) {
                                    --depth;
                                } else {
                                    ++depth;
                                }
                            }
                            if (depth <= 0) {
                                break;
                            }
                            match = xmlRegExp.exec(xmlStr);
                        }
                        var xmlLength = match ? match.index + match[0].length : xmlStr.length;
                        parser_pos += xmlLength - 1;
                        return [xmlStr.slice(0, xmlLength), "TK_STRING"];
                    }
                } else {
                    //
                    // handle string
                    //
                    // Template strings can travers lines without escape characters.
                    // Other strings cannot
                    while (parser_pos < input_length &&
                            (esc || (input.charAt(parser_pos) !== sep &&
                            (sep === '`' || !acorn.newline.test(input.charAt(parser_pos)))))) {
                        resulting_string += input.charAt(parser_pos);
                        if (esc) {
                            if (input.charAt(parser_pos) === 'x' || input.charAt(parser_pos) === 'u') {
                                has_char_escapes = true;
                            }
                            esc = false;
                        } else {
                            esc = input.charAt(parser_pos) === '\\';
                        }
                        parser_pos += 1;
                    }

                }

                if (has_char_escapes && opts.unescape_strings) {
                    resulting_string = unescape_string(resulting_string);
                }

                if (parser_pos < input_length && input.charAt(parser_pos) === sep) {
                    resulting_string += sep;
                    parser_pos += 1;

                    if (sep === '/') {
                        // regexps may have modifiers /regexp/MOD , so fetch those, too
                        // Only [gim] are valid, but if the user puts in garbage, do what we can to take it.
                        while (parser_pos < input_length && acorn.isIdentifierStart(input.charCodeAt(parser_pos))) {
                            resulting_string += input.charAt(parser_pos);
                            parser_pos += 1;
                        }
                    }
                }
                return [resulting_string, 'TK_STRING'];
            }

            if (c === '#') {

                if (tokens.length === 0 && input.charAt(parser_pos) === '!') {
                    // shebang
                    resulting_string = c;
                    while (parser_pos < input_length && c !== '\n') {
                        c = input.charAt(parser_pos);
                        resulting_string += c;
                        parser_pos += 1;
                    }
                    return [trim(resulting_string) + '\n', 'TK_UNKNOWN'];
                }



                // Spidermonkey-specific sharp variables for circular references
                // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
                // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935
                var sharp = '#';
                if (parser_pos < input_length && digit.test(input.charAt(parser_pos))) {
                    do {
                        c = input.charAt(parser_pos);
                        sharp += c;
                        parser_pos += 1;
                    } while (parser_pos < input_length && c !== '#' && c !== '=');
                    if (c === '#') {
                        //
                    } else if (input.charAt(parser_pos) === '[' && input.charAt(parser_pos + 1) === ']') {
                        sharp += '[]';
                        parser_pos += 2;
                    } else if (input.charAt(parser_pos) === '{' && input.charAt(parser_pos + 1) === '}') {
                        sharp += '{}';
                        parser_pos += 2;
                    }
                    return [sharp, 'TK_WORD'];
                }
            }

            if (c === '<' && input.substring(parser_pos - 1, parser_pos + 3) === '<!--') {
                parser_pos += 3;
                c = '<!--';
                while (input.charAt(parser_pos) !== '\n' && parser_pos < input_length) {
                    c += input.charAt(parser_pos);
                    parser_pos++;
                }
                in_html_comment = true;
                return [c, 'TK_COMMENT'];
            }

            if (c === '-' && in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
                in_html_comment = false;
                parser_pos += 2;
                return ['-->', 'TK_COMMENT'];
            }

            if (c === '.') {
                return [c, 'TK_DOT'];
            }

            if (in_array(c, punct)) {
                while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos >= input_length) {
                        break;
                    }
                }

                if (c === ',') {
                    return [c, 'TK_COMMA'];
                } else if (c === '=') {
                    return [c, 'TK_EQUALS'];
                } else {
                    return [c, 'TK_OPERATOR'];
                }
            }

            return [c, 'TK_UNKNOWN'];
        }


        function unescape_string(s) {
            var esc = false,
                out = '',
                pos = 0,
                s_hex = '',
                escaped = 0,
                c;

            while (esc || pos < s.length) {

                c = s.charAt(pos);
                pos++;

                if (esc) {
                    esc = false;
                    if (c === 'x') {
                        // simple hex-escape \x24
                        s_hex = s.substr(pos, 2);
                        pos += 2;
                    } else if (c === 'u') {
                        // unicode-escape, \u2134
                        s_hex = s.substr(pos, 4);
                        pos += 4;
                    } else {
                        // some common escape, e.g \n
                        out += '\\' + c;
                        continue;
                    }
                    if (!s_hex.match(/^[0123456789abcdefABCDEF]+$/)) {
                        // some weird escaping, bail out,
                        // leaving whole string intact
                        return s;
                    }

                    escaped = parseInt(s_hex, 16);

                    if (escaped >= 0x00 && escaped < 0x20) {
                        // leave 0x00...0x1f escaped
                        if (c === 'x') {
                            out += '\\x' + s_hex;
                        } else {
                            out += '\\u' + s_hex;
                        }
                        continue;
                    } else if (escaped === 0x22 || escaped === 0x27 || escaped === 0x5c) {
                        // single-quote, apostrophe, backslash - escape these
                        out += '\\' + String.fromCharCode(escaped);
                    } else if (c === 'x' && escaped > 0x7e && escaped <= 0xff) {
                        // we bail out on \x7f..\xff,
                        // leaving whole string escaped,
                        // as it's probably completely binary
                        return s;
                    } else {
                        out += String.fromCharCode(escaped);
                    }
                } else if (c === '\\') {
                    esc = true;
                } else {
                    out += c;
                }
            }
            return out;
        }

    }


    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define([], function() {
            return { js_beautify: js_beautify };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var js_beautify = require("beautify").js_beautify`.
        exports.js_beautify = js_beautify;
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.js_beautify = js_beautify;
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.js_beautify = js_beautify;
    }

}());
//== js/lib/beautify.js end


//== js/lib/beautify-css.js
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2013 Einar Lielmanis and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.


 CSS Beautifier
---------------

    Written by Harutyun Amirjanyan, (amirjanyan@gmail.com)

    Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
        http://jsbeautifier.org/

    Usage:
        css_beautify(source_text);
        css_beautify(source_text, options);

    The options are (default in brackets):
        indent_size (4)                   — indentation size,
        indent_char (space)               — character to indent with,
        selector_separator_newline (true) - separate selectors with newline or
                                            not (e.g. "a,\nbr" or "a, br")
        end_with_newline (false)          - end with a newline

    e.g

    css_beautify(css_source_text, {
      'indent_size': 1,
      'indent_char': '\t',
      'selector_separator': ' ',
      'end_with_newline': false,
    });
*/

// http://www.w3.org/TR/CSS21/syndata.html#tokenization
// http://www.w3.org/TR/css3-syntax/

(function() {
    function css_beautify(source_text, options) {
        options = options || {};
        var indentSize = options.indent_size || 4;
        var indentCharacter = options.indent_char || ' ';
        var selectorSeparatorNewline = (options.selector_separator_newline === undefined) ? true : options.selector_separator_newline;
        var end_with_newline = (options.end_with_newline === undefined) ? false : options.end_with_newline;

        // compatibility
        if (typeof indentSize === "string") {
            indentSize = parseInt(indentSize, 10);
        }


        // tokenizer
        var whiteRe = /^\s+$/;
        var wordRe = /[\w$\-_]/;

        var pos = -1,
            ch;

        function next() {
            ch = source_text.charAt(++pos);
            return ch || '';
        }

        function peek(skipWhitespace) {
            var prev_pos = pos;
            if (skipWhitespace) {
                eatWhitespace();
            }
            result = source_text.charAt(pos + 1) || '';
            pos = prev_pos - 1;
            next();
            return result;
        }

        function eatString(endChars) {
            var start = pos;
            while (next()) {
                if (ch === "\\") {
                    next();
                } else if (endChars.indexOf(ch) !== -1) {
                    break;
                } else if (ch === "\n") {
                    break;
                }
            }
            return source_text.substring(start, pos + 1);
        }

        function peekString(endChar) {
            var prev_pos = pos;
            var str = eatString(endChar);
            pos = prev_pos - 1;
            next();
            return str;
        }

        function eatWhitespace() {
            var result = '';
            while (whiteRe.test(peek())) {
                next()
                result += ch;
            }
            return result;
        }

        function skipWhitespace() {
            var result = '';
            if (ch && whiteRe.test(ch)) {
                result = ch;
            }
            while (whiteRe.test(next())) {
                result += ch
            }
            return result;
        }

        function eatComment(singleLine) {
            var start = pos;
            var singleLine = peek() === "/";
            next();
            while (next()) {
                if (!singleLine && ch === "*" && peek() === "/") {
                    next();
                    break;
                } else if (singleLine && ch === "\n") {
                    return source_text.substring(start, pos);
                }
            }

            return source_text.substring(start, pos) + ch;
        }


        function lookBack(str) {
            return source_text.substring(pos - str.length, pos).toLowerCase() ===
                str;
        }

        // Nested pseudo-class if we are insideRule
        // and the next special character found opens
        // a new block
        function foundNestedPseudoClass() {
            for (var i = pos + 1; i < source_text.length; i++){
                var ch = source_text.charAt(i);
                if (ch === "{"){
                    return true;
                } else if (ch === ";" || ch === "}" || ch === ")") {
                    return false;
                }
            }
            return false;
        }

        // printer
        var basebaseIndentString = source_text.match(/^[\t ]*/)[0];
        var singleIndent = new Array(indentSize + 1).join(indentCharacter);
        var indentLevel = 0;
        var nestedLevel = 0;

        function indent() {
            indentLevel++;
            basebaseIndentString += singleIndent;
        }

        function outdent() {
            indentLevel--;
            basebaseIndentString = basebaseIndentString.slice(0, -indentSize);
        }

        var print = {};
        print["{"] = function(ch) {
            print.singleSpace();
            output.push(ch);
            print.newLine();
        };
        print["}"] = function(ch) {
            print.newLine();
            output.push(ch);
            print.newLine();
        };

        print._lastCharWhitespace = function() {
            return whiteRe.test(output[output.length - 1]);
        };

        print.newLine = function(keepWhitespace) {
            if (!keepWhitespace) {
                print.trim();
            }

            if (output.length) {
                output.push('\n');
            }
            if (basebaseIndentString) {
                output.push(basebaseIndentString);
            }
        };
        print.singleSpace = function() {
            if (output.length && !print._lastCharWhitespace()) {
                output.push(' ');
            }
        };

        print.trim = function() {
            while (print._lastCharWhitespace()) {
                output.pop();
            }
        };


        var output = [];
        if (basebaseIndentString) {
            output.push(basebaseIndentString);
        }
        /*_____________________--------------------_____________________*/

        var insideRule = false;
        var enteringConditionalGroup = false;
        var top_ch = '';
        var last_top_ch = '';

        while (true) {
            var whitespace = skipWhitespace();
            var isAfterSpace = whitespace !== '';
            var isAfterNewline = whitespace.indexOf('\n') !== -1;
            var last_top_ch = top_ch;
            var top_ch = ch;

            if (!ch) {
                break;
            } else if (ch === '/' && peek() === '*') { /* css comment */
                var header = lookBack("");
                print.newLine();
                output.push(eatComment());
                print.newLine();
                if (header) {
                    print.newLine(true);
                }
            } else if (ch === '/' && peek() === '/') { // single line comment
                if (!isAfterNewline && last_top_ch !== '{') {
                    print.trim();
                }
                print.singleSpace();
                output.push(eatComment());
                print.newLine();
            } else if (ch === '@') {
                // pass along the space we found as a separate item
                if (isAfterSpace) {
                    print.singleSpace();
                }
                output.push(ch);

                // strip trailing space, if present, for hash property checks
                var variableOrRule = peekString(": ,;{}()[]/='\"").replace(/\s$/, '');

                // might be a nesting at-rule
                if (variableOrRule in css_beautify.NESTED_AT_RULE) {
                    nestedLevel += 1;
                    if (variableOrRule in css_beautify.CONDITIONAL_GROUP_RULE) {
                        enteringConditionalGroup = true;
                    }
                } else if (': '.indexOf(variableOrRule.charAt(variableOrRule.length - 1)) >= 0) {
                    //we have a variable, add it and insert one space before continuing
                    next();
                    variableOrRule = eatString(": ").replace(/\s$/, '');
                    output.push(variableOrRule);
                    print.singleSpace();
                }
            } else if (ch === '{') {
                if (peek(true) === '}') {
                    eatWhitespace();
                    next();
                    print.singleSpace();
                    output.push("{}");
                } else {
                    indent();
                    print["{"](ch);
                    // when entering conditional groups, only rulesets are allowed
                    if (enteringConditionalGroup) {
                        enteringConditionalGroup = false;
                        insideRule = (indentLevel > nestedLevel);
                    } else {
                        // otherwise, declarations are also allowed
                        insideRule = (indentLevel >= nestedLevel);
                    }
                }
            } else if (ch === '}') {
                outdent();
                print["}"](ch);
                insideRule = false;
                if (nestedLevel) {
                    nestedLevel--;
                }
            } else if (ch === ":") {
                eatWhitespace();
                if ((insideRule || enteringConditionalGroup) &&
                        !(lookBack("&") || foundNestedPseudoClass())) {
                    // 'property: value' delimiter
                    // which could be in a conditional group query
                    output.push(':');
                    print.singleSpace();
                } else {
                    // sass/less parent reference don't use a space
                    // sass nested pseudo-class don't use a space
                    if (peek() === ":") {
                        // pseudo-element
                        next();
                        output.push("::");
                    } else {
                        // pseudo-class
                        output.push(':');
                    }
                }
            } else if (ch === '"' || ch === '\'') {
                if (isAfterSpace) {
                    print.singleSpace();
                }
                output.push(eatString(ch));
            } else if (ch === ';') {
                output.push(ch);
                print.newLine();
            } else if (ch === '(') { // may be a url
                if (lookBack("url")) {
                    output.push(ch);
                    eatWhitespace();
                    if (next()) {
                        if (ch !== ')' && ch !== '"' && ch !== '\'') {
                            output.push(eatString(')'));
                        } else {
                            pos--;
                        }
                    }
                } else {
                    if (isAfterSpace) {
                        print.singleSpace();
                    }
                    output.push(ch);
                    eatWhitespace();
                }
            } else if (ch === ')') {
                output.push(ch);
            } else if (ch === ',') {
                output.push(ch);
                eatWhitespace();
                if (!insideRule && selectorSeparatorNewline) {
                    print.newLine();
                } else {
                    print.singleSpace();
                }
            } else if (ch === ']') {
                output.push(ch);
            } else if (ch === '[') {
                if (isAfterSpace) {
                    print.singleSpace();
                }
                output.push(ch);
            } else if (ch === '=') { // no whitespace before or after
                eatWhitespace();
                output.push(ch);
            } else {
                if (isAfterSpace) {
                    print.singleSpace();
                }

                output.push(ch);
            }
        }


        var sweetCode = output.join('').replace(/[\r\n\t ]+$/, '');

        // establish end_with_newline
        if (end_with_newline) {
            sweetCode += "\n";
        }

        return sweetCode;
    }

    // https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
    css_beautify.NESTED_AT_RULE = {
        "@page": true,
        "@font-face": true,
        "@keyframes": true,
        // also in CONDITIONAL_GROUP_RULE below
        "@media": true,
        "@supports": true,
        "@document": true
    };
    css_beautify.CONDITIONAL_GROUP_RULE = {
        "@media": true,
        "@supports": true,
        "@document": true
    };

    /*global define */
    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define([], function() {
            return {
                css_beautify: css_beautify
            };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var html_beautify = require("beautify").html_beautify`.
        exports.css_beautify = css_beautify;
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.css_beautify = css_beautify;
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.css_beautify = css_beautify;
    }

}());
//== js/lib/beautify-css.js end


//== js/lib/beautify-html.js
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2013 Einar Lielmanis and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.


 Style HTML
---------------

  Written by Nochum Sossonko, (nsossonko@hotmail.com)

  Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
    http://jsbeautifier.org/

  Usage:
    style_html(html_source);

    style_html(html_source, options);

  The options are:
    indent_inner_html (default false)  — indent <head> and <body> sections,
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    wrap_line_length (default 250)            -  maximum amount of characters per line (0 = disable)
    brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "none"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line, or attempt to keep them where they are.
    unformatted (defaults to inline tags) - list of tags, that shouldn't be reformatted
    indent_scripts (default normal)  - "keep"|"separate"|"normal"
    preserve_newlines (default true) - whether existing line breaks before elements should be preserved
                                        Only works before elements, not inside tags or for text.
    max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk
    indent_handlebars (default false) - format and indent {{#foo}} and {{/foo}}
    end_with_newline (false)          - end with a newline


    e.g.

    style_html(html_source, {
      'indent_inner_html': false,
      'indent_size': 2,
      'indent_char': ' ',
      'wrap_line_length': 78,
      'brace_style': 'expand',
      'unformatted': ['a', 'sub', 'sup', 'b', 'i', 'u'],
      'preserve_newlines': true,
      'max_preserve_newlines': 5,
      'indent_handlebars': false
    });
*/

(function() {

    function trim(s) {
        return s.replace(/^\s+|\s+$/g, '');
    }

    function ltrim(s) {
        return s.replace(/^\s+/g, '');
    }

    function rtrim(s) {
        return s.replace(/\s+$/g,'');
    }

    function style_html(html_source, options, js_beautify, css_beautify) {
        //Wrapper function to invoke all the necessary constructors and deal with the output.

        var multi_parser,
            indent_inner_html,
            indent_size,
            indent_character,
            wrap_line_length,
            brace_style,
            unformatted,
            preserve_newlines,
            max_preserve_newlines,
            indent_handlebars,
            end_with_newline;

        options = options || {};

        // backwards compatibility to 1.3.4
        if ((options.wrap_line_length === undefined || parseInt(options.wrap_line_length, 10) === 0) &&
                (options.max_char !== undefined && parseInt(options.max_char, 10) !== 0)) {
            options.wrap_line_length = options.max_char;
        }

        indent_inner_html = (options.indent_inner_html === undefined) ? false : options.indent_inner_html;
        indent_size = (options.indent_size === undefined) ? 4 : parseInt(options.indent_size, 10);
        indent_character = (options.indent_char === undefined) ? ' ' : options.indent_char;
        brace_style = (options.brace_style === undefined) ? 'collapse' : options.brace_style;
        wrap_line_length =  parseInt(options.wrap_line_length, 10) === 0 ? 32786 : parseInt(options.wrap_line_length || 250, 10);
        unformatted = options.unformatted || ['a', 'span', 'img', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike', 'font', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        preserve_newlines = (options.preserve_newlines === undefined) ? true : options.preserve_newlines;
        max_preserve_newlines = preserve_newlines ?
            (isNaN(parseInt(options.max_preserve_newlines, 10)) ? 32786 : parseInt(options.max_preserve_newlines, 10))
            : 0;
        indent_handlebars = (options.indent_handlebars === undefined) ? false : options.indent_handlebars;
        end_with_newline = (options.end_with_newline === undefined) ? false : options.end_with_newline;

        function Parser() {

            this.pos = 0; //Parser position
            this.token = '';
            this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
            this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
                parent: 'parent1',
                parentcount: 1,
                parent1: ''
            };
            this.tag_type = '';
            this.token_text = this.last_token = this.last_text = this.token_type = '';
            this.newlines = 0;
            this.indent_content = indent_inner_html;

            this.Utils = { //Uilities made available to the various functions
                whitespace: "\n\r\t ".split(''),
                single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed,?php,?,?='.split(','), //all the single tags for HTML
                extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
                in_array: function(what, arr) {
                    for (var i = 0; i < arr.length; i++) {
                        if (what === arr[i]) {
                            return true;
                        }
                    }
                    return false;
                }
            };

            // Return true iff the given text is composed entirely of
            // whitespace.
            this.is_whitespace = function(text) {
                for (var n = 0; n < text.length; text++) {
                    if (!this.Utils.in_array(text.charAt(n), this.Utils.whitespace)) {
                        return false;
                    }
                }
                return true;
            }

            this.traverse_whitespace = function() {
                var input_char = '';

                input_char = this.input.charAt(this.pos);
                if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                    this.newlines = 0;
                    while (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (preserve_newlines && input_char === '\n' && this.newlines <= max_preserve_newlines) {
                            this.newlines += 1;
                        }

                        this.pos++;
                        input_char = this.input.charAt(this.pos);
                    }
                    return true;
                }
                return false;
            };

            // Append a space to the given content (string array) or, if we are
            // at the wrap_line_length, append a newline/indentation.
            this.space_or_wrap = function(content) {
                if (this.line_char_count >= this.wrap_line_length) { //insert a line when the wrap_line_length is reached
                    this.print_newline(false, content);
                    this.print_indentation(content);
                } else {
                    this.line_char_count++;
                    content.push(' ');
                }
            };

            this.get_content = function() { //function to capture regular content between tags
                var input_char = '',
                    content = [],
                    space = false; //if a space is needed

                while (this.input.charAt(this.pos) !== '<') {
                    if (this.pos >= this.input.length) {
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }

                    if (this.traverse_whitespace()) {
                        this.space_or_wrap(content);
                        continue;
                    }

                    if (indent_handlebars) {
                        // Handlebars parsing is complicated.
                        // {{#foo}} and {{/foo}} are formatted tags.
                        // {{something}} should get treated as content, except:
                        // {{else}} specifically behaves like {{#if}} and {{/if}}
                        var peek3 = this.input.substr(this.pos, 3);
                        if (peek3 === '{{#' || peek3 === '{{/') {
                            // These are tags and not content.
                            break;
                        } else if (this.input.substr(this.pos, 2) === '{{') {
                            if (this.get_tag(true) === '{{else}}') {
                                break;
                            }
                        }
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                    this.line_char_count++;
                    content.push(input_char); //letter at-a-time (or string) inserted to an array
                }
                return content.length ? content.join('') : '';
            };

            this.get_contents_to = function(name) { //get the full content of a script or style to pass to js_beautify
                if (this.pos === this.input.length) {
                    return ['', 'TK_EOF'];
                }
                var input_char = '';
                var content = '';
                var reg_match = new RegExp('</' + name + '\\s*>', 'igm');
                reg_match.lastIndex = this.pos;
                var reg_array = reg_match.exec(this.input);
                var end_script = reg_array ? reg_array.index : this.input.length; //absolute end of script
                if (this.pos < end_script) { //get everything in between the script tags
                    content = this.input.substring(this.pos, end_script);
                    this.pos = end_script;
                }
                return content;
            };

            this.record_tag = function(tag) { //function to record a tag and its parent in this.tags Object
                if (this.tags[tag + 'count']) { //check for the existence of this tag type
                    this.tags[tag + 'count']++;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                } else { //otherwise initialize this tag type
                    this.tags[tag + 'count'] = 1;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                }
                this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
                this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
            };

            this.retrieve_tag = function(tag) { //function to retrieve the opening tag to the corresponding closer
                if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
                    var temp_parent = this.tags.parent; //check to see if it's a closable tag.
                    while (temp_parent) { //till we reach '' (the initial value);
                        if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
                            break;
                        }
                        temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
                    }
                    if (temp_parent) { //if we caught something
                        this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
                        this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
                    }
                    delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
                    delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
                    if (this.tags[tag + 'count'] === 1) {
                        delete this.tags[tag + 'count'];
                    } else {
                        this.tags[tag + 'count']--;
                    }
                }
            };

            this.indent_to_tag = function(tag) {
                // Match the indentation level to the last use of this tag, but don't remove it.
                if (!this.tags[tag + 'count']) {
                    return;
                }
                var temp_parent = this.tags.parent;
                while (temp_parent) {
                    if (tag + this.tags[tag + 'count'] === temp_parent) {
                        break;
                    }
                    temp_parent = this.tags[temp_parent + 'parent'];
                }
                if (temp_parent) {
                    this.indent_level = this.tags[tag + this.tags[tag + 'count']];
                }
            };

            this.get_tag = function(peek) { //function to get a full tag and parse its type
                var input_char = '',
                    content = [],
                    comment = '',
                    space = false,
                    tag_start, tag_end,
                    tag_start_char,
                    orig_pos = this.pos,
                    orig_line_char_count = this.line_char_count;

                peek = peek !== undefined ? peek : false;

                do {
                    if (this.pos >= this.input.length) {
                        if (peek) {
                            this.pos = orig_pos;
                            this.line_char_count = orig_line_char_count;
                        }
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;

                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
                        space = true;
                        continue;
                    }

                    if (input_char === "'" || input_char === '"') {
                        input_char += this.get_unformatted(input_char);
                        space = true;

                    }

                    if (input_char === '=') { //no space before =
                        space = false;
                    }

                    if (content.length && content[content.length - 1] !== '=' && input_char !== '>' && space) {
                        //no space after = or before >
                        this.space_or_wrap(content);
                        space = false;
                    }

                    if (indent_handlebars && tag_start_char === '<') {
                        // When inside an angle-bracket tag, put spaces around
                        // handlebars not inside of strings.
                        if ((input_char + this.input.charAt(this.pos)) === '{{') {
                            input_char += this.get_unformatted('}}');
                            if (content.length && content[content.length - 1] !== ' ' && content[content.length - 1] !== '<') {
                                input_char = ' ' + input_char;
                            }
                            space = true;
                        }
                    }

                    if (input_char === '<' && !tag_start_char) {
                        tag_start = this.pos - 1;
                        tag_start_char = '<';
                    }

                    if (indent_handlebars && !tag_start_char) {
                        if (content.length >= 2 && content[content.length - 1] === '{' && content[content.length - 2] == '{') {
                            if (input_char === '#' || input_char === '/') {
                                tag_start = this.pos - 3;
                            } else {
                                tag_start = this.pos - 2;
                            }
                            tag_start_char = '{';
                        }
                    }

                    this.line_char_count++;
                    content.push(input_char); //inserts character at-a-time (or string)

                    if (content[1] && content[1] === '!') { //if we're in a comment, do something special
                        // We treat all comments as literals, even more than preformatted tags
                        // we just look for the appropriate close tag
                        content = [this.get_comment(tag_start)];
                        break;
                    }

                    if (indent_handlebars && tag_start_char === '{' && content.length > 2 && content[content.length - 2] === '}' && content[content.length - 1] === '}') {
                        break;
                    }
                } while (input_char !== '>');

                var tag_complete = content.join('');
                var tag_index;
                var tag_offset;

                if (tag_complete.indexOf(' ') !== -1) { //if there's whitespace, thats where the tag name ends
                    tag_index = tag_complete.indexOf(' ');
                } else if (tag_complete.charAt(0) === '{') {
                    tag_index = tag_complete.indexOf('}');
                } else { //otherwise go with the tag ending
                    tag_index = tag_complete.indexOf('>');
                }
                if (tag_complete.charAt(0) === '<' || !indent_handlebars) {
                    tag_offset = 1;
                } else {
                    tag_offset = tag_complete.charAt(2) === '#' ? 3 : 2;
                }
                var tag_check = tag_complete.substring(tag_offset, tag_index).toLowerCase();
                if (tag_complete.charAt(tag_complete.length - 2) === '/' ||
                    this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
                    if (!peek) {
                        this.tag_type = 'SINGLE';
                    }
                } else if (indent_handlebars && tag_complete.charAt(0) === '{' && tag_check === 'else') {
                    if (!peek) {
                        this.indent_to_tag('if');
                        this.tag_type = 'HANDLEBARS_ELSE';
                        this.indent_content = true;
                        this.traverse_whitespace();
                    }
                } else if (this.is_unformatted(tag_check, unformatted)) { // do not reformat the "unformatted" tags
                    comment = this.get_unformatted('</' + tag_check + '>', tag_complete); //...delegate to get_unformatted function
                    content.push(comment);
                    tag_end = this.pos - 1;
                    this.tag_type = 'SINGLE';
                } else if (tag_check === 'script' &&
                    (tag_complete.search('type') === -1 ||
                    (tag_complete.search('type') > -1 &&
                    tag_complete.search(/\b(text|application)\/(x-)?(javascript|ecmascript|jscript|livescript)/) > -1))) {
                    if (!peek) {
                        this.record_tag(tag_check);
                        this.tag_type = 'SCRIPT';
                    }
                } else if (tag_check === 'style' &&
                    (tag_complete.search('type') === -1 ||
                    (tag_complete.search('type') > -1 && tag_complete.search('text/css') > -1))) {
                    if (!peek) {
                        this.record_tag(tag_check);
                        this.tag_type = 'STYLE';
                    }
                } else if (tag_check.charAt(0) === '!') { //peek for <! comment
                    // for comments content is already correct.
                    if (!peek) {
                        this.tag_type = 'SINGLE';
                        this.traverse_whitespace();
                    }
                } else if (!peek) {
                    if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
                        this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
                        this.tag_type = 'END';
                    } else { //otherwise it's a start-tag
                        this.record_tag(tag_check); //push it on the tag stack
                        if (tag_check.toLowerCase() !== 'html') {
                            this.indent_content = true;
                        }
                        this.tag_type = 'START';
                    }

                    // Allow preserving of newlines after a start or end tag
                    if (this.traverse_whitespace()) {
                        this.space_or_wrap(content);
                    }

                    if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
                        this.print_newline(false, this.output);
                        if (this.output.length && this.output[this.output.length - 2] !== '\n') {
                            this.print_newline(true, this.output);
                        }
                    }
                }

                if (peek) {
                    this.pos = orig_pos;
                    this.line_char_count = orig_line_char_count;
                }

                return content.join(''); //returns fully formatted tag
            };

            this.get_comment = function(start_pos) { //function to return comment content in its entirety
                // this is will have very poor perf, but will work for now.
                var comment = '',
                    delimiter = '>',
                    matched = false;

                this.pos = start_pos;
                input_char = this.input.charAt(this.pos);
                this.pos++;

                while (this.pos <= this.input.length) {
                    comment += input_char;

                    // only need to check for the delimiter if the last chars match
                    if (comment.charAt(comment.length - 1) === delimiter.charAt(delimiter.length - 1) &&
                        comment.indexOf(delimiter) !== -1) {
                        break;
                    }

                    // only need to search for custom delimiter for the first few characters
                    if (!matched && comment.length < 10) {
                        if (comment.indexOf('<![if') === 0) { //peek for <![if conditional comment
                            delimiter = '<![endif]>';
                            matched = true;
                        } else if (comment.indexOf('<![cdata[') === 0) { //if it's a <[cdata[ comment...
                            delimiter = ']]>';
                            matched = true;
                        } else if (comment.indexOf('<![') === 0) { // some other ![ comment? ...
                            delimiter = ']>';
                            matched = true;
                        } else if (comment.indexOf('<!--') === 0) { // <!-- comment ...
                            delimiter = '-->';
                            matched = true;
                        }
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                }

                return comment;
            };

            this.get_unformatted = function(delimiter, orig_tag) { //function to return unformatted content in its entirety

                if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) !== -1) {
                    return '';
                }
                var input_char = '';
                var content = '';
                var min_index = 0;
                var space = true;
                do {

                    if (this.pos >= this.input.length) {
                        return content;
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;

                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (!space) {
                            this.line_char_count--;
                            continue;
                        }
                        if (input_char === '\n' || input_char === '\r') {
                            content += '\n';
                            /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
                for (var i=0; i<this.indent_level; i++) {
                  content += this.indent_string;
                }
                space = false; //...and make sure other indentation is erased
                */
                            this.line_char_count = 0;
                            continue;
                        }
                    }
                    content += input_char;
                    this.line_char_count++;
                    space = true;

                    if (indent_handlebars && input_char === '{' && content.length && content.charAt(content.length - 2) === '{') {
                        // Handlebars expressions in strings should also be unformatted.
                        content += this.get_unformatted('}}');
                        // These expressions are opaque.  Ignore delimiters found in them.
                        min_index = content.length;
                    }
                } while (content.toLowerCase().indexOf(delimiter, min_index) === -1);
                return content;
            };

            this.get_token = function() { //initial handler for token-retrieval
                var token;

                if (this.last_token === 'TK_TAG_SCRIPT' || this.last_token === 'TK_TAG_STYLE') { //check if we need to format javascript
                    var type = this.last_token.substr(7);
                    token = this.get_contents_to(type);
                    if (typeof token !== 'string') {
                        return token;
                    }
                    return [token, 'TK_' + type];
                }
                if (this.current_mode === 'CONTENT') {
                    token = this.get_content();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        return [token, 'TK_CONTENT'];
                    }
                }

                if (this.current_mode === 'TAG') {
                    token = this.get_tag();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        var tag_name_type = 'TK_TAG_' + this.tag_type;
                        return [token, tag_name_type];
                    }
                }
            };

            this.get_full_indent = function(level) {
                level = this.indent_level + level || 0;
                if (level < 1) {
                    return '';
                }

                return Array(level + 1).join(this.indent_string);
            };

            this.is_unformatted = function(tag_check, unformatted) {
                //is this an HTML5 block-level link?
                if (!this.Utils.in_array(tag_check, unformatted)) {
                    return false;
                }

                if (tag_check.toLowerCase() !== 'a' || !this.Utils.in_array('a', unformatted)) {
                    return true;
                }

                //at this point we have an  tag; is its first child something we want to remain
                //unformatted?
                var next_tag = this.get_tag(true /* peek. */ );

                // test next_tag to see if it is just html tag (no external content)
                var tag = (next_tag || "").match(/^\s*<\s*\/?([a-z]*)\s*[^>]*>\s*$/);

                // if next_tag comes back but is not an isolated tag, then
                // let's treat the 'a' tag as having content
                // and respect the unformatted option
                if (!tag || this.Utils.in_array(tag, unformatted)) {
                    return true;
                } else {
                    return false;
                }
            };

            this.printer = function(js_source, indent_character, indent_size, wrap_line_length, brace_style) { //handles input/output and some other printing functions

                this.input = js_source || ''; //gets the input for the Parser
                this.output = [];
                this.indent_character = indent_character;
                this.indent_string = '';
                this.indent_size = indent_size;
                this.brace_style = brace_style;
                this.indent_level = 0;
                this.wrap_line_length = wrap_line_length;
                this.line_char_count = 0; //count to see if wrap_line_length was exceeded

                for (var i = 0; i < this.indent_size; i++) {
                    this.indent_string += this.indent_character;
                }

                this.print_newline = function(force, arr) {
                    this.line_char_count = 0;
                    if (!arr || !arr.length) {
                        return;
                    }
                    if (force || (arr[arr.length - 1] !== '\n')) { //we might want the extra line
                        if ((arr[arr.length - 1] !== '\n')) {
                            arr[arr.length - 1] = rtrim(arr[arr.length - 1]);
                        }
                        arr.push('\n');
                    }
                };

                this.print_indentation = function(arr) {
                    for (var i = 0; i < this.indent_level; i++) {
                        arr.push(this.indent_string);
                        this.line_char_count += this.indent_string.length;
                    }
                };

                this.print_token = function(text) {
                    // Avoid printing initial whitespace.
                    if (this.is_whitespace(text) && !this.output.length) {
                        return;
                    }
                    if (text || text !== '') {
                        if (this.output.length && this.output[this.output.length - 1] === '\n') {
                            this.print_indentation(this.output);
                            text = ltrim(text);
                        }
                    }
                    this.print_token_raw(text);
                };

                this.print_token_raw = function(text) {
                    // If we are going to print newlines, truncate trailing
                    // whitespace, as the newlines will represent the space.
                    if (this.newlines > 0) {
                        text = rtrim(text);
                    }

                    if (text && text !== '') {
                        if (text.length > 1 && text.charAt(text.length - 1) === '\n') {
                            // unformatted tags can grab newlines as their last character
                            this.output.push(text.slice(0, -1));
                            this.print_newline(false, this.output);
                        } else {
                            this.output.push(text);
                        }
                    }

                    for (var n = 0; n < this.newlines; n++) {
                        this.print_newline(n > 0, this.output);
                    }
                    this.newlines = 0;
                };

                this.indent = function() {
                    this.indent_level++;
                };

                this.unindent = function() {
                    if (this.indent_level > 0) {
                        this.indent_level--;
                    }
                };
            };
            return this;
        }

        /*_____________________--------------------_____________________*/

        multi_parser = new Parser(); //wrapping functions Parser
        multi_parser.printer(html_source, indent_character, indent_size, wrap_line_length, brace_style); //initialize starting values

        while (true) {
            var t = multi_parser.get_token();
            multi_parser.token_text = t[0];
            multi_parser.token_type = t[1];

            if (multi_parser.token_type === 'TK_EOF') {
                break;
            }

            switch (multi_parser.token_type) {
                case 'TK_TAG_START':
                    multi_parser.print_newline(false, multi_parser.output);
                    multi_parser.print_token(multi_parser.token_text);
                    if (multi_parser.indent_content) {
                        multi_parser.indent();
                        multi_parser.indent_content = false;
                    }
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_STYLE':
                case 'TK_TAG_SCRIPT':
                    multi_parser.print_newline(false, multi_parser.output);
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_END':
                    //Print new line only if the tag has no content and has child
                    if (multi_parser.last_token === 'TK_CONTENT' && multi_parser.last_text === '') {
                        var tag_name = multi_parser.token_text.match(/\w+/)[0];
                        var tag_extracted_from_last_output = null;
                        if (multi_parser.output.length) {
                            tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length - 1].match(/(?:<|{{#)\s*(\w+)/);
                        }
                        if (tag_extracted_from_last_output === null ||
                            tag_extracted_from_last_output[1] !== tag_name) {
                            multi_parser.print_newline(false, multi_parser.output);
                        }
                    }
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_SINGLE':
                    // Don't add a newline before elements that should remain unformatted.
                    var tag_check = multi_parser.token_text.match(/^\s*<([a-z-]+)/i);
                    if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)) {
                        multi_parser.print_newline(false, multi_parser.output);
                    }
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_HANDLEBARS_ELSE':
                    multi_parser.print_token(multi_parser.token_text);
                    if (multi_parser.indent_content) {
                        multi_parser.indent();
                        multi_parser.indent_content = false;
                    }
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_CONTENT':
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'TAG';
                    break;
                case 'TK_STYLE':
                case 'TK_SCRIPT':
                    if (multi_parser.token_text !== '') {
                        multi_parser.print_newline(false, multi_parser.output);
                        var text = multi_parser.token_text,
                            _beautifier,
                            script_indent_level = 1;
                        if (multi_parser.token_type === 'TK_SCRIPT') {
                            _beautifier = typeof js_beautify === 'function' && js_beautify;
                        } else if (multi_parser.token_type === 'TK_STYLE') {
                            _beautifier = typeof css_beautify === 'function' && css_beautify;
                        }

                        if (options.indent_scripts === "keep") {
                            script_indent_level = 0;
                        } else if (options.indent_scripts === "separate") {
                            script_indent_level = -multi_parser.indent_level;
                        }

                        var indentation = multi_parser.get_full_indent(script_indent_level);
                        if (_beautifier) {
                            // call the Beautifier if avaliable
                            text = _beautifier(text.replace(/^\s*/, indentation), options);
                        } else {
                            // simply indent the string otherwise
                            var white = text.match(/^\s*/)[0];
                            var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;
                            var reindent = multi_parser.get_full_indent(script_indent_level - _level);
                            text = text.replace(/^\s*/, indentation)
                                .replace(/\r\n|\r|\n/g, '\n' + reindent)
                                .replace(/\s+$/, '');
                        }
                        if (text) {
                            multi_parser.print_token_raw(text);
                            multi_parser.print_newline(true, multi_parser.output);
                        }
                    }
                    multi_parser.current_mode = 'TAG';
                    break;
                default:
                    // We should not be getting here but we don't want to drop input on the floor
                    // Just output the text and move on
                    if (multi_parser.token_text !== '') {
                        multi_parser.print_token(multi_parser.token_text);
                    }
                    break;
            }
            multi_parser.last_token = multi_parser.token_type;
            multi_parser.last_text = multi_parser.token_text;
        }
        var sweet_code = multi_parser.output.join('').replace(/[\r\n\t ]+$/, '');
        if (end_with_newline) {
            sweet_code += '\n';
        }
        return sweet_code;
    }

    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define(["require", "./beautify", "./beautify-css"], function(requireamd) {
            var js_beautify =  requireamd("./beautify");
            var css_beautify =  requireamd("./beautify-css");

            return {
              html_beautify: function(html_source, options) {
                return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
              }
            };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var html_beautify = require("beautify").html_beautify`.
        var js_beautify = require('./beautify.js');
        var css_beautify = require('./beautify-css.js');

        exports.html_beautify = function(html_source, options) {
            return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
        };
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.html_beautify = function(html_source, options) {
            return style_html(html_source, options, window.js_beautify, window.css_beautify);
        };
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.html_beautify = function(html_source, options) {
            return style_html(html_source, options, global.js_beautify, global.css_beautify);
        };
    }

}());
//== js/lib/beautify-html.js end


//== js/lib/unpackers/javascriptobfuscator_unpacker.js
//
// simple unpacker/deobfuscator for scripts messed up with javascriptobfuscator.com
// written by Einar Lielmanis <einar@jsbeautifier.org>
//
// usage:
//
// if (JavascriptObfuscator.detect(some_string)) {
//     var unpacked = JavascriptObfuscator.unpack(some_string);
// }
//
//

var JavascriptObfuscator = {
    detect: function (str) {
        return /^var _0x[a-f0-9]+ ?\= ?\[/.test(str);
    },

    unpack: function (str) {
        if (JavascriptObfuscator.detect(str)) {
            var matches = /var (_0x[a-f\d]+) ?\= ?\[(.*?)\];/.exec(str);
            if (matches) {
                var var_name = matches[1];
                var strings = JavascriptObfuscator._smart_split(matches[2]);
                str = str.substring(matches[0].length);
                for (var k in strings) {
                    str = str.replace(new RegExp(var_name + '\\[' + k + '\\]', 'g'),
                        JavascriptObfuscator._fix_quotes(JavascriptObfuscator._unescape(strings[k])));
                }
            }
        }
        return str;
    },

    _fix_quotes: function(str) {
        var matches = /^"(.*)"$/.exec(str);
        if (matches) {
            str = matches[1];
            str = "'" + str.replace(/'/g, "\\'") + "'";
        }
        return str;
    },

    _smart_split: function(str) {
        var strings = [];
        var pos = 0;
        while (pos < str.length) {
            if (str.charAt(pos) == '"') {
                // new word
                var word = '';
                pos += 1;
                while (pos < str.length) {
                    if (str.charAt(pos) == '"') {
                        break;
                    }
                    if (str.charAt(pos) == '\\') {
                        word += '\\';
                        pos++;
                    }
                    word += str.charAt(pos);
                    pos++;
                }
                strings.push('"' + word + '"');
            }
            pos += 1;
        }
        return strings;
    },


    _unescape: function (str) {
        // inefficient if used repeatedly or on small strings, but wonderful on single large chunk of text
        for (var i = 32; i < 128; i++) {
            str = str.replace(new RegExp('\\\\x' + i.toString(16), 'ig'), String.fromCharCode(i));
        }
        str = str.replace(/\\x09/g, "\t");
        return str;
    },

    run_tests: function (sanity_test) {
        var t = sanity_test || new SanityTest();

        t.test_function(JavascriptObfuscator._smart_split, "JavascriptObfuscator._smart_split");
        t.expect('', []);
        t.expect('"a", "b"', ['"a"', '"b"']);
        t.expect('"aaa","bbbb"', ['"aaa"', '"bbbb"']);
        t.expect('"a", "b\\\""', ['"a"', '"b\\\""']);
        t.test_function(JavascriptObfuscator._unescape, 'JavascriptObfuscator._unescape');
        t.expect('\\x40', '@');
        t.expect('\\x10', '\\x10');
        t.expect('\\x1', '\\x1');
        t.expect("\\x61\\x62\\x22\\x63\\x64", 'ab"cd');
        t.test_function(JavascriptObfuscator.detect, 'JavascriptObfuscator.detect');
        t.expect('', false);
        t.expect('abcd', false);
        t.expect('var _0xaaaa', false);
        t.expect('var _0xaaaa = ["a", "b"]', true);
        t.expect('var _0xaaaa=["a", "b"]', true);
        t.expect('var _0x1234=["a","b"]', true);
        return t;
    }


};
//== js/lib/unpackers/javascriptobfuscator_unpacker.js end


//== js/lib/unpackers/myobfuscate_unpacker.js
//
// simple unpacker/deobfuscator for scripts messed up with myobfuscate.com
// You really don't want to obfuscate your scripts there: they're tracking
// your unpackings, your script gets turned into something like this,
// as of 2011-04-25:
/*

    var _escape = 'your_script_escaped';
    var _111 = document.createElement('script');
    _111.src = 'http://api.www.myobfuscate.com/?getsrc=ok' +
        '&ref=' + encodeURIComponent(document.referrer) +
        '&url=' + encodeURIComponent(document.URL);
    var 000 = document.getElementsByTagName('head')[0];
    000.appendChild(_111);
    document.write(unescape(_escape));

*/
//
// written by Einar Lielmanis <einar@jsbeautifier.org>
//
// usage:
//
// if (MyObfuscate.detect(some_string)) {
//     var unpacked = MyObfuscate.unpack(some_string);
// }
//
//

var MyObfuscate = {
    detect: function (str) {
        if (/^var _?[0O1lI]{3}\=('|\[).*\)\)\);/.test(str)) {
            return true;
        }
        if (/^function _?[0O1lI]{3}\(_/.test(str) && /eval\(/.test(str)) {
            return true;
        }
        return false;
    },

    unpack: function (str) {
        if (MyObfuscate.detect(str)) {
            var __eval = eval;
            try {
                eval = function (unpacked) {
                    if (MyObfuscate.starts_with(unpacked, 'var _escape')) {
                        // fetch the urlencoded stuff from the script,
                        var matches = /'([^']*)'/.exec(unpacked);
                        var unescaped = unescape(matches[1]);
                        if (MyObfuscate.starts_with(unescaped, '<script>')) {
                            unescaped = unescaped.substr(8, unescaped.length - 8);
                        }
                        if (MyObfuscate.ends_with(unescaped, '</script>')) {
                            unescaped = unescaped.substr(0, unescaped.length - 9);
                        }
                        unpacked = unescaped;
                    }
                    // throw to terminate the script
                    unpacked =  "// Unpacker warning: be careful when using myobfuscate.com for your projects:\n" +
                        "// scripts obfuscated by the free online version may call back home.\n" +
                        "\n//\n" + unpacked;
                    throw unpacked;
                };
                __eval(str); // should throw
            } catch (e) {
                // well, it failed. we'll just return the original, instead of crashing on user.
                if (typeof e === "string") {
                    str = e;
                }
            }
            eval = __eval;
        }
        return str;
    },

    starts_with: function (str, what) {
        return str.substr(0, what.length) === what;
    },

    ends_with: function (str, what) {
        return str.substr(str.length - what.length, what.length) === what;
    },

    run_tests: function (sanity_test) {
        var t = sanity_test || new SanityTest();

        return t;
    }


};
//== js/lib/unpackers/myobfuscate_unpacker.js end


//== js/lib/unpackers/p_a_c_k_e_r_unpacker.js
//
// Unpacker for Dean Edward's p.a.c.k.e.r, a part of javascript beautifier
// written by Einar Lielmanis <einar@jsbeautifier.org>
//
// Coincidentally, it can defeat a couple of other eval-based compressors.
//
// usage:
//
// if (P_A_C_K_E_R.detect(some_string)) {
//     var unpacked = P_A_C_K_E_R.unpack(some_string);
// }
//
//

var P_A_C_K_E_R = {
    detect: function (str) {
        return (P_A_C_K_E_R.get_chunks(str).length > 0);
    },

    get_chunks: function(str) {
        var chunks = str.match(/eval\(\(?function\(.*?(,0,\{\}\)\)|split\('\|'\)\)\))($|\n)/g);
        return chunks ? chunks : [];
    },

    unpack: function (str) {
        var chunks = P_A_C_K_E_R.get_chunks(str),
            chunk;
        for(var i = 0; i < chunks.length; i++) {
            chunk = chunks[i].replace(/\n$/, '');
            str = str.split(chunk).join( P_A_C_K_E_R.unpack_chunk(chunk) );
        }
        return str;
    },

    unpack_chunk: function (str) {
        var unpacked_source = '';
        var __eval = eval;
        if (P_A_C_K_E_R.detect(str)) {
            try {
                eval = function (s) { unpacked_source += s; return unpacked_source; };
                __eval(str);
                if (typeof unpacked_source == 'string' && unpacked_source) {
                    str = unpacked_source;
                }
            } catch (e) {
                // well, it failed. we'll just return the original, instead of crashing on user.
            }
        }
        eval = __eval;
        return str;
    },

    run_tests: function (sanity_test) {
        var t = sanity_test || new SanityTest(),

        pk1 = "eval(function(p,a,c,k,e,r){e=String;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1',3,3,'var||a'.split('|'),0,{}))",
        unpk1 = 'var a=1',
        pk2 = "eval(function(p,a,c,k,e,r){e=String;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1',3,3,'foo||b'.split('|'),0,{}))",
        unpk2 = 'foo b=1',
        pk_broken =  "eval(function(p,a,c,k,e,r){BORKBORK;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1',3,3,'var||a'.split('|'),0,{}))";
        pk3 = "eval(function(p,a,c,k,e,r){e=String;if(!''.replace(/^/,String)){while(c--)r[c]=k[c]||c;k=[function(e){return r[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('0 2=1{}))',3,3,'var||a'.split('|'),0,{}))",
        unpk3 = 'var a=1{}))',

        t.test_function(P_A_C_K_E_R.detect, "P_A_C_K_E_R.detect");
        t.expect('', false);
        t.expect('var a = b', false);
        t.test_function(P_A_C_K_E_R.unpack, "P_A_C_K_E_R.unpack");
        t.expect(pk_broken, pk_broken);
        t.expect(pk1, unpk1);
        t.expect(pk2, unpk2);
        t.expect(pk3, unpk3);

        var filler = '\nfiller\n';
        t.expect(filler + pk1 + "\n" + pk_broken + filler + pk2 + filler, filler + unpk1 + "\n" + pk_broken + filler + unpk2 + filler);

        return t;
    }


};
//== js/lib/unpackers/p_a_c_k_e_r_unpacker.js end


//== js/lib/unpackers/urlencode_unpacker.js
/*global unescape */
/*jshint curly: false, scripturl: true */
//
// trivial bookmarklet/escaped script detector for the javascript beautifier
// written by Einar Lielmanis <einar@jsbeautifier.org>
//
// usage:
//
// if (Urlencoded.detect(some_string)) {
//     var unpacked = Urlencoded.unpack(some_string);
// }
//
//

var isNode = (typeof module !== 'undefined' && module.exports);
if (isNode) {
    var SanityTest = require(__dirname + '/../../test/sanitytest');
}

var Urlencoded = {
    detect: function (str) {
        // the fact that script doesn't contain any space, but has %20 instead
        // should be sufficient check for now.
        if (str.indexOf(' ') == -1) {
            if (str.indexOf('%2') != -1) return true;
            if (str.replace(/[^%]+/g, '').length > 3) return true;
        }
        return false;
    },

    unpack: function (str) {
        if (Urlencoded.detect(str)) {
            if (str.indexOf('%2B') != -1 || str.indexOf('%2b') != -1) {
                // "+" escaped as "%2B"
                return unescape(str.replace(/\+/g, '%20'));
            } else {
                return unescape(str);
            }
        }
        return str;
    },



    run_tests: function (sanity_test) {
        var t = sanity_test || new SanityTest();
        t.test_function(Urlencoded.detect, "Urlencoded.detect");
        t.expect('', false);
        t.expect('var a = b', false);
        t.expect('var%20a+=+b', true);
        t.expect('var%20a=b', true);
        t.expect('var%20%21%22', true);
        t.expect('javascript:(function(){var%20whatever={init:function(){alert(%22a%22+%22b%22)}};whatever.init()})();', true);
        t.test_function(Urlencoded.unpack, 'Urlencoded.unpack');

        t.expect('javascript:(function(){var%20whatever={init:function(){alert(%22a%22+%22b%22)}};whatever.init()})();',
            'javascript:(function(){var whatever={init:function(){alert("a"+"b")}};whatever.init()})();'
        );
        t.expect('', '');
        t.expect('abcd', 'abcd');
        t.expect('var a = b', 'var a = b');
        t.expect('var%20a=b', 'var a=b');
        t.expect('var%20a=b+1', 'var a=b+1');
        t.expect('var%20a=b%2b1', 'var a=b+1');
        return t;
    }


};

if (isNode) {
    module.exports = Urlencoded;
}
//== js/lib/unpackers/urlencode_unpacker.js end


//== js/test/beautify-javascript-tests.js
/*global js_beautify: true */

function run_javascript_tests(test_obj, Urlencoded, js_beautify, html_beautify, css_beautify)
{

    var opts = {
        indent_size: 4,
        indent_char: ' ',
        preserve_newlines: true,
        jslint_happy: false,
        keep_array_indentation: false,
        brace_style: 'collapse',
        space_before_conditional: true,
        break_chained_methods: false,
        selector_separator: '\n',
        end_with_newline: false
    };

    function test_js_beautifier(input)
    {
        return js_beautify(input, opts);
    }

    function test_html_beautifier(input)
    {
        return html_beautify(input, opts);
    }

    var sanitytest;

    // test the input on beautifier with the current flag settings
    // does not check the indentation / surroundings as bt() does
    function test_fragment(input, expected)
    {
        expected = expected || expected === '' ? expected : input;
        sanitytest.expect(input, expected);
        // if the expected is different from input, run it again
        // expected output should be unchanged when run twice.
        if (expected !== input) {
            sanitytest.expect(expected, expected);
        }
    }



    // test the input on beautifier with the current flag settings
    // test both the input as well as { input } wrapping
    function bt(input, expectation)
    {
        var wrapped_input, wrapped_expectation;

        expectation = expectation || expectation === '' ? expectation : input;
        sanitytest.test_function(test_js_beautifier, 'js_beautify');
        test_fragment(input, expectation);

        // test also the returned indentation
        // e.g if input = "asdf();"
        // then test that this remains properly formatted as well:
        // {
        //     asdf();
        //     indent;
        // }

        if (opts.indent_size === 4 && input) {
            wrapped_input = '{\n' + input.replace(/^(.+)$/mg, '    $1') + '\n    foo = bar;\n}';
            wrapped_expectation = '{\n' + expectation.replace(/^(.+)$/mg, '    $1') + '\n    foo = bar;\n}';
            test_fragment(wrapped_input, wrapped_expectation);
        }

    }

    // run all tests for the given brace style ("collapse", "expand", "end-expand", or "none").
    // uses various whitespace combinations before and after opening and closing braces,
    // respectively, for most of the tests' inputs.
    function beautify_brace_tests(brace_style) {

        var ex_brace_style = opts.brace_style,
            indent_on_wrap_str = '    '; // could use Array(opts.indent_size + 1).join(' '); if we wanted to replace _all_ of the hardcoded 4-space in the test and expectation strings

        function permute_brace_tests(expect_open_white, expect_close_white) {

            // run the tests that need permutation against a specific combination of
            // pre-opening-brace and pre-closing-brace whitespace
            function run_brace_permutation(test_open_white, test_close_white) {
                var to = test_open_white,
                    tc = test_close_white,
                    eo = expect_open_white ? expect_open_white : to === '' ? ' ' : to,
                    ec = expect_close_white ? expect_close_white : tc === '' ? ' ' : tc,
                    i = eo === '\n' ? indent_on_wrap_str: '';

                bt( '//case 1\nif (a == 1)' + to + '{}\n//case 2\nelse if (a == 2)' + to + '{}',
                    '//case 1\nif (a == 1)' + eo + '{}\n//case 2\nelse if (a == 2)' + eo + '{}');
                bt( 'if(1)' + to + '{2}' + tc + 'else' + to + '{3}',
                    'if (1)' + eo + '{\n    2\n}' + ec + 'else' + eo + '{\n    3\n}');
                bt( 'try' + to + '{a();}' + tc +
                    'catch(b)' + to + '{c();}' + tc +
                    'catch(d)' + to + '{}' + tc +
                    'finally' + to + '{e();}',
                    // expected
                    'try' + eo + '{\n    a();\n}' + ec +
                    'catch (b)' + eo + '{\n    c();\n}' + ec +
                    'catch (d)' + eo + '{}' + ec +
                    'finally' + eo + '{\n    e();\n}');
                bt( 'if(a)' + to + '{b();}' + tc + 'else if(c) foo();',
                    'if (a)' + eo + '{\n    b();\n}' + ec + 'else if (c) foo();');
                // if/else statement with empty body
                bt( 'if (a)' + to + '{\n// comment\n}' + tc + 'else' + to + '{\n// comment\n}',
                    'if (a)' + eo + '{\n    // comment\n}' + ec + 'else' + eo + '{\n    // comment\n}');
                bt( 'if (x)' + to + '{y}' + tc + 'else' + to + '{ if (x)' + to + '{y}}',
                    'if (x)' + eo + '{\n    y\n}' + ec + 'else' + eo + '{\n    if (x)' + eo + i + '{\n        y\n    }\n}');
                bt( 'if (a)' + to + '{\nb;\n}' + tc + 'else' + to + '{\nc;\n}',
                    'if (a)' + eo + '{\n    b;\n}' + ec + 'else' + eo + '{\n    c;\n}');
                test_fragment('    /*\n* xx\n*/\n// xx\nif (foo)' + to + '{\n    bar();\n}',
                              '    /*\n     * xx\n     */\n    // xx\n    if (foo)' + eo + i + '{\n        bar();\n    }');
                bt( 'if (foo)' + to + '{}' + tc + 'else /regex/.test();',
                    'if (foo)' + eo + '{}' + ec + 'else /regex/.test();');
                test_fragment('if (foo)' + to + '{', 'if (foo)' + eo + '{');
                test_fragment('foo' + to + '{', 'foo' + eo + '{');
                test_fragment('return;' + to + '{', 'return;' + eo + '{');
                bt( 'function x()' + to + '{\n    foo();\n}zzz', 'function x()' + eo +'{\n    foo();\n}\nzzz');
                bt( 'var a = new function a()' + to + '{};', 'var a = new function a()' + eo + '{};');
                bt( 'var a = new function a()' + to + '    {},\n    b = new function b()' + to + '    {};',
                    'var a = new function a()' + eo + i + '{},\n    b = new function b()' + eo + i + '{};');
                bt("foo(" + to + "{\n    'a': 1\n},\n10);",
                   "foo(" + (eo === ' ' ? '' : eo) + i + "{\n        'a': 1\n    },\n    10);"); // "foo( {..." is a weird case
                bt('(["foo","bar"]).each(function(i)' + to + '{return i;});',
                   '(["foo", "bar"]).each(function(i)' + eo + '{\n    return i;\n});');
                bt('(function(i)' + to + '{return i;})();', '(function(i)' + eo + '{\n    return i;\n})();');

                bt( "test( /*Argument 1*/" + to + "{\n" +
                    "    'Value1': '1'\n" +
                    "}, /*Argument 2\n" +
                    " */ {\n" +
                    "    'Value2': '2'\n" +
                    "});",
                    // expected
                    "test( /*Argument 1*/" + eo + i + "{\n" +
                    "        'Value1': '1'\n" +
                    "    },\n" +
                    "    /*Argument 2\n" +
                    "     */\n" +
                    "    {\n" +
                    "        'Value2': '2'\n" +
                    "    });");

                bt( "test( /*Argument 1*/" + to + "{\n" +
                    "    'Value1': '1'\n" +
                    "}, /*Argument 2\n" +
                    " */\n" +
                    "{\n" +
                    "    'Value2': '2'\n" +
                    "});",
                    // expected
                    "test( /*Argument 1*/" + eo + i + "{\n" +
                    "        'Value1': '1'\n" +
                    "    },\n" +
                    "    /*Argument 2\n" +
                    "     */\n" +
                    "    {\n" +
                    "        'Value2': '2'\n" +
                    "    });");
            }

            run_brace_permutation('\n', '\n');
            run_brace_permutation('\n', ' ');
            run_brace_permutation(' ', ' ');
            run_brace_permutation(' ', '\n');
            run_brace_permutation('','');

            // brace tests that don't make sense to permutate
            test_fragment('return {'); // return needs the brace.
            test_fragment('return /* inline */ {');
            bt('throw {}');
            bt('throw {\n    foo;\n}');
            bt( 'var foo = {}');
            test_fragment('a: do {} while (); xxx', 'a: do {} while ();\nxxx');
            bt( '{a: do {} while (); xxx}', '{\n    a: do {} while ();xxx\n}');
            bt( 'var a = new function() {};');
            bt( 'var a = new function()\n{};', 'var a = new function() {};');
            bt( "test(\n" +
                "/*Argument 1*/ {\n" +
                "    'Value1': '1'\n" +
                "},\n" +
                "/*Argument 2\n" +
                " */ {\n" +
                "    'Value2': '2'\n" +
                "});",
                // expected
                "test(\n" +
                "    /*Argument 1*/\n" +
                "    {\n" +
                "        'Value1': '1'\n" +
                "    },\n" +
                "    /*Argument 2\n" +
                "     */\n" +
                "    {\n" +
                "        'Value2': '2'\n" +
                "    });");
        }

        opts.brace_style = brace_style;

        switch(opts.brace_style) {
        case 'collapse':
            permute_brace_tests(' ', ' ');
            break;
        case 'expand':
            permute_brace_tests('\n', '\n');
            break;
        case 'end-expand':
            permute_brace_tests(' ', '\n');
            break;
        case 'none':
            permute_brace_tests();
            break;
        }

        opts.brace_style = ex_brace_style;
    }

    function unicode_char(value) {
        return String.fromCharCode(value)
    }

    function beautifier_tests()
    {
        sanitytest = test_obj;

        opts.indent_size = 4;
        opts.indent_char = ' ';
        opts.preserve_newlines = true;
        opts.jslint_happy = false;
        opts.keep_array_indentation = false;
        opts.brace_style = 'collapse';

        // Unicode Support
        bt('var ' + unicode_char(3232) + '_' + unicode_char(3232) + ' = "hi";');
        bt(
            'var ' + unicode_char(228) + 'x = {\n' +
            '    ' + unicode_char(228) + 'rgerlich: true\n' +
            '};');

        // End With Newline - (eof = "\n")
        opts.end_with_newline = true;
        test_fragment('', '\n');
        test_fragment('   return .5', '   return .5\n');
        test_fragment('   \n\nreturn .5\n\n\n\n', '   return .5\n');
        test_fragment('\n');

        // End With Newline - (eof = "")
        opts.end_with_newline = false;
        test_fragment('');
        test_fragment('   return .5');
        test_fragment('   \n\nreturn .5\n\n\n\n', '   return .5');
        test_fragment('\n', '');

        // New Test Suite

        // Old tests
        bt('');
        test_fragment('   return .5');
        test_fragment('   return .5;\n   a();');
        test_fragment('    return .5;\n    a();');
        test_fragment('     return .5;\n     a();');
        test_fragment('   < div');
        bt('a        =          1', 'a = 1');
        bt('a=1', 'a = 1');
        bt('(3) / 2');
        bt('["a", "b"].join("")');
        bt('a();\n\nb();');
        bt('var a = 1 var b = 2', 'var a = 1\nvar b = 2');
        bt('var a=1, b=c[d], e=6;', 'var a = 1,\n    b = c[d],\n    e = 6;');
        bt('var a,\n    b,\n    c;');
        bt('let a = 1 let b = 2', 'let a = 1\nlet b = 2');
        bt('let a=1, b=c[d], e=6;', 'let a = 1,\n    b = c[d],\n    e = 6;');
        bt('let a,\n    b,\n    c;');
        bt('const a = 1 const b = 2', 'const a = 1\nconst b = 2');
        bt('const a=1, b=c[d], e=6;', 'const a = 1,\n    b = c[d],\n    e = 6;');
        bt('const a,\n    b,\n    c;');
        bt('a = " 12345 "');
        bt('a = \' 12345 \'');
        bt('if (a == 1) b = 2;');
        bt('if(1){2}else{3}', 'if (1) {\n    2\n} else {\n    3\n}');
        bt('if(1||2);', 'if (1 || 2);');
        bt('(a==1)||(b==2)', '(a == 1) || (b == 2)');
        bt('var a = 1 if (2) 3;', 'var a = 1\nif (2) 3;');
        bt('a = a + 1');
        bt('a = a == 1');
        bt('/12345[^678]*9+/.match(a)');
        bt('a /= 5');
        bt('a = 0.5 * 3');
        bt('a *= 10.55');
        bt('a < .5');
        bt('a <= .5');
        bt('a<.5', 'a < .5');
        bt('a<=.5', 'a <= .5');
        bt('a = 0xff;');
        bt('a=0xff+4', 'a = 0xff + 4');
        bt('a = [1, 2, 3, 4]');
        bt('F*(g/=f)*g+b', 'F * (g /= f) * g + b');
        bt('a.b({c:d})', 'a.b({\n    c: d\n})');
        bt('a.b\n(\n{\nc:\nd\n}\n)', 'a.b({\n    c: d\n})');
        bt('a.b({c:"d"})', 'a.b({\n    c: "d"\n})');
        bt('a.b\n(\n{\nc:\n"d"\n}\n)', 'a.b({\n    c: "d"\n})');
        bt('a=!b', 'a = !b');
        bt('a=!!b', 'a = !!b');
        bt('a?b:c', 'a ? b : c');
        bt('a?1:2', 'a ? 1 : 2');
        bt('a?(b):c', 'a ? (b) : c');
        bt('x={a:1,b:w=="foo"?x:y,c:z}', 'x = {\n    a: 1,\n    b: w == "foo" ? x : y,\n    c: z\n}');
        bt('x=a?b?c?d:e:f:g;', 'x = a ? b ? c ? d : e : f : g;');
        bt('x=a?b?c?d:{e1:1,e2:2}:f:g;', 'x = a ? b ? c ? d : {\n    e1: 1,\n    e2: 2\n} : f : g;');
        bt('function void(void) {}');
        bt('if(!a)foo();', 'if (!a) foo();');
        bt('a=~a', 'a = ~a');
        bt('a;/*comment*/b;', 'a; /*comment*/\nb;');
        bt('a;/* comment */b;', 'a; /* comment */\nb;');

        // simple comments don't get touched at all
        test_fragment('a;/*\ncomment\n*/b;', 'a;\n/*\ncomment\n*/\nb;');
        bt('a;/**\n* javadoc\n*/b;', 'a;\n/**\n * javadoc\n */\nb;');
        test_fragment('a;/**\n\nno javadoc\n*/b;', 'a;\n/**\n\nno javadoc\n*/\nb;');

        // comment blocks detected and reindented even w/o javadoc starter
        bt('a;/*\n* javadoc\n*/b;', 'a;\n/*\n * javadoc\n */\nb;');
        bt('if(a)break;', 'if (a) break;');
        bt('if(a){break}', 'if (a) {\n    break\n}');
        bt('if((a))foo();', 'if ((a)) foo();');
        bt('for(var i=0;;) a', 'for (var i = 0;;) a');
        bt('for(var i=0;;)\na', 'for (var i = 0;;)\n    a');
        bt('a++;');
        bt('for(;;i++)a()', 'for (;; i++) a()');
        bt('for(;;i++)\na()', 'for (;; i++)\n    a()');
        bt('for(;;++i)a', 'for (;; ++i) a');
        bt('return(1)', 'return (1)');
        bt('try{a();}catch(b){c();}finally{d();}', 'try {\n    a();\n} catch (b) {\n    c();\n} finally {\n    d();\n}');

        //  magic function call
        bt('(xx)()');

        // another magic function call
        bt('a[1]()');
        bt('if(a){b();}else if(c) foo();', 'if (a) {\n    b();\n} else if (c) foo();');
        bt('switch(x) {case 0: case 1: a(); break; default: break}', 'switch (x) {\n    case 0:\n    case 1:\n        a();\n        break;\n    default:\n        break\n}');
        bt('switch(x){case -1:break;case !y:break;}', 'switch (x) {\n    case -1:\n        break;\n    case !y:\n        break;\n}');
        bt('a !== b');
        bt('if (a) b(); else c();', 'if (a) b();\nelse c();');

        // typical greasemonkey start
        bt('// comment\n(function something() {})');

        // duplicating newlines
        bt('{\n\n    x();\n\n}');
        bt('if (a in b) foo();');
        bt('if(X)if(Y)a();else b();else c();', 'if (X)\n    if (Y) a();\n    else b();\nelse c();');
        bt('if (foo) bar();\nelse break');
        bt('var a, b;');
        bt('var a = new function();');
        test_fragment('new function');
        bt('var a, b');
        bt('{a:1, b:2}', '{\n    a: 1,\n    b: 2\n}');
        bt('a={1:[-1],2:[+1]}', 'a = {\n    1: [-1],\n    2: [+1]\n}');
        bt('var l = {\'a\':\'1\', \'b\':\'2\'}', 'var l = {\n    \'a\': \'1\',\n    \'b\': \'2\'\n}');
        bt('if (template.user[n] in bk) foo();');
        bt('return 45');
        bt('return this.prevObject ||\n\n    this.constructor(null);');
        bt('If[1]');
        bt('Then[1]');
        bt('a = 1e10');
        bt('a = 1.3e10');
        bt('a = 1.3e-10');
        bt('a = -1.3e-10');
        bt('a = 1e-10');
        bt('a = e - 10');
        bt('a = 11-10', 'a = 11 - 10');
        bt('a = 1;// comment', 'a = 1; // comment');
        bt('a = 1; // comment');
        bt('a = 1;\n // comment', 'a = 1;\n// comment');
        bt('a = [-1, -1, -1]');

        // The exact formatting these should have is open for discussion, but they are at least reasonable
        bt('a = [ // comment\n    -1, -1, -1\n]');
        bt('var a = [ // comment\n    -1, -1, -1\n]');
        bt('a = [ // comment\n    -1, // comment\n    -1, -1\n]');
        bt('var a = [ // comment\n    -1, // comment\n    -1, -1\n]');
        bt('o = [{a:b},{c:d}]', 'o = [{\n    a: b\n}, {\n    c: d\n}]');

        // was: extra space appended
        bt('if (a) {\n    do();\n}');

        // if/else statement with empty body
        bt('if (a) {\n// comment\n}else{\n// comment\n}', 'if (a) {\n    // comment\n} else {\n    // comment\n}');

        // multiple comments indentation
        bt('if (a) {\n// comment\n// comment\n}', 'if (a) {\n    // comment\n    // comment\n}');
        bt('if (a) b() else c();', 'if (a) b()\nelse c();');
        bt('if (a) b() else if c() d();', 'if (a) b()\nelse if c() d();');
        bt('{}');
        bt('{\n\n}');
        bt('do { a(); } while ( 1 );', 'do {\n    a();\n} while (1);');
        bt('do {} while (1);');
        bt('do {\n} while (1);', 'do {} while (1);');
        bt('do {\n\n} while (1);');
        bt('var a = x(a, b, c)');
        bt('delete x if (a) b();', 'delete x\nif (a) b();');
        bt('delete x[x] if (a) b();', 'delete x[x]\nif (a) b();');
        bt('for(var a=1,b=2)d', 'for (var a = 1, b = 2) d');
        bt('for(var a=1,b=2,c=3) d', 'for (var a = 1, b = 2, c = 3) d');
        bt('for(var a=1,b=2,c=3;d<3;d++)\ne', 'for (var a = 1, b = 2, c = 3; d < 3; d++)\n    e');
        bt('function x(){(a||b).c()}', 'function x() {\n    (a || b).c()\n}');
        bt('function x(){return - 1}', 'function x() {\n    return -1\n}');
        bt('function x(){return ! a}', 'function x() {\n    return !a\n}');
        bt('x => x');
        bt('(x) => x');
        bt('x => { x }', 'x => {\n    x\n}');
        bt('(x) => { x }', '(x) => {\n    x\n}');

        // a common snippet in jQuery plugins
        bt('settings = $.extend({},defaults,settings);', 'settings = $.extend({}, defaults, settings);');
        bt('$http().then().finally().default()');
        bt('$http()\n.then()\n.finally()\n.default()', '$http()\n    .then()\n    .finally()\n    .default()');
        bt('$http().when.in.new.catch().throw()');
        bt('$http()\n.when\n.in\n.new\n.catch()\n.throw()', '$http()\n    .when\n    .in\n    .new\n    .catch()\n    .throw()');
        bt('{xxx;}()', '{\n    xxx;\n}()');
        bt('a = \'a\'\nb = \'b\'');
        bt('a = /reg/exp');
        bt('a = /reg/');
        bt('/abc/.test()');
        bt('/abc/i.test()');
        bt('{/abc/i.test()}', '{\n    /abc/i.test()\n}');
        bt('var x=(a)/a;', 'var x = (a) / a;');
        bt('x != -1');
        bt('for (; s-->0;)t', 'for (; s-- > 0;) t');
        bt('for (; s++>0;)u', 'for (; s++ > 0;) u');
        bt('a = s++>s--;', 'a = s++ > s--;');
        bt('a = s++>--s;', 'a = s++ > --s;');
        bt('{x=#1=[]}', '{\n    x = #1=[]\n}');
        bt('{a:#1={}}', '{\n    a: #1={}\n}');
        bt('{a:#1#}', '{\n    a: #1#\n}');
        test_fragment('"incomplete-string');
        test_fragment('\'incomplete-string');
        test_fragment('/incomplete-regex');
        test_fragment('`incomplete-template-string');
        test_fragment('{a:1},{a:2}', '{\n    a: 1\n}, {\n    a: 2\n}');
        test_fragment('var ary=[{a:1}, {a:2}];', 'var ary = [{\n    a: 1\n}, {\n    a: 2\n}];');

        // incomplete
        test_fragment('{a:#1', '{\n    a: #1');

        // incomplete
        test_fragment('{a:#', '{\n    a: #');

        // incomplete
        test_fragment('}}}', '}\n}\n}');
        test_fragment('<!--\nvoid();\n// -->');

        // incomplete regexp
        test_fragment('a=/regexp', 'a = /regexp');
        bt('{a:#1=[],b:#1#,c:#999999#}', '{\n    a: #1=[],\n    b: #1#,\n    c: #999999#\n}');
        bt('a = 1e+2');
        bt('a = 1e-2');
        bt('do{x()}while(a>1)', 'do {\n    x()\n} while (a > 1)');
        bt('x(); /reg/exp.match(something)', 'x();\n/reg/exp.match(something)');
        test_fragment('something();(', 'something();\n(');
        test_fragment('#!she/bangs, she bangs\nf=1', '#!she/bangs, she bangs\n\nf = 1');
        test_fragment('#!she/bangs, she bangs\n\nf=1', '#!she/bangs, she bangs\n\nf = 1');
        test_fragment('#!she/bangs, she bangs\n\n/* comment */');
        test_fragment('#!she/bangs, she bangs\n\n\n/* comment */');
        test_fragment('#');
        test_fragment('#!');
        bt('function namespace::something()');
        test_fragment('<!--\nsomething();\n-->');
        test_fragment('<!--\nif(i<0){bla();}\n-->', '<!--\nif (i < 0) {\n    bla();\n}\n-->');
        bt('{foo();--bar;}', '{\n    foo();\n    --bar;\n}');
        bt('{foo();++bar;}', '{\n    foo();\n    ++bar;\n}');
        bt('{--bar;}', '{\n    --bar;\n}');
        bt('{++bar;}', '{\n    ++bar;\n}');
        bt('if(true)++a;', 'if (true) ++a;');
        bt('if(true)\n++a;', 'if (true)\n    ++a;');
        bt('if(true)--a;', 'if (true) --a;');
        bt('if(true)\n--a;', 'if (true)\n    --a;');

        // Handling of newlines around unary ++ and -- operators
        bt('{foo\n++bar;}', '{\n    foo\n    ++bar;\n}');
        bt('{foo++\nbar;}', '{\n    foo++\n    bar;\n}');

        // This is invalid, but harder to guard against. Issue #203.
        bt('{foo\n++\nbar;}', '{\n    foo\n    ++\n    bar;\n}');

        // regexps
        bt('a(/abc\\/\\/def/);b()', 'a(/abc\\/\\/def/);\nb()');
        bt('a(/a[b\\[\\]c]d/);b()', 'a(/a[b\\[\\]c]d/);\nb()');

        // incomplete char class
        test_fragment('a(/a[b\\[');

        // allow unescaped / in char classes
        bt('a(/[a/b]/);b()', 'a(/[a/b]/);\nb()');
        bt('typeof /foo\\//;');
        bt('yield /foo\\//;');
        bt('throw /foo\\//;');
        bt('do /foo\\//;');
        bt('return /foo\\//;');
        bt('switch (a) {\n    case /foo\\//:\n        b\n}');
        bt('if (a) /foo\\//\nelse /foo\\//;');
        bt('if (foo) /regex/.test();');
        bt('function foo() {\n    return [\n        "one",\n        "two"\n    ];\n}');
        bt('a=[[1,2],[4,5],[7,8]]', 'a = [\n    [1, 2],\n    [4, 5],\n    [7, 8]\n]');
        bt('a=[[1,2],[4,5],function(){},[7,8]]', 'a = [\n    [1, 2],\n    [4, 5],\n    function() {},\n    [7, 8]\n]');
        bt('a=[[1,2],[4,5],function(){},function(){},[7,8]]', 'a = [\n    [1, 2],\n    [4, 5],\n    function() {},\n    function() {},\n    [7, 8]\n]');
        bt('a=[[1,2],[4,5],function(){},[7,8]]', 'a = [\n    [1, 2],\n    [4, 5],\n    function() {},\n    [7, 8]\n]');
        bt('a=[b,c,function(){},function(){},d]', 'a = [b, c, function() {}, function() {}, d]');
        bt('a=[b,c,\nfunction(){},function(){},d]', 'a = [b, c,\n    function() {},\n    function() {},\n    d\n]');
        bt('a=[a[1],b[4],c[d[7]]]', 'a = [a[1], b[4], c[d[7]]]');
        bt('[1,2,[3,4,[5,6],7],8]', '[1, 2, [3, 4, [5, 6], 7], 8]');
        bt('[[["1","2"],["3","4"]],[["5","6","7"],["8","9","0"]],[["1","2","3"],["4","5","6","7"],["8","9","0"]]]', '[\n    [\n        ["1", "2"],\n        ["3", "4"]\n    ],\n    [\n        ["5", "6", "7"],\n        ["8", "9", "0"]\n    ],\n    [\n        ["1", "2", "3"],\n        ["4", "5", "6", "7"],\n        ["8", "9", "0"]\n    ]\n]');
        bt('{[x()[0]];indent;}', '{\n    [x()[0]];\n    indent;\n}');

        bt('{{}/z/}', "{\n    {}\n    /z/\n}");

        bt('return ++i', 'return ++i');
        bt('return !!x', 'return !!x');
        bt('return !x', 'return !x');
        bt('return [1,2]', 'return [1, 2]');
        bt('return;', 'return;');
        bt('return\nfunc', 'return\nfunc');
        bt('catch(e)', 'catch (e)');
        bt('yield [1, 2]');


        bt('var a=1,b={foo:2,bar:3},{baz:4,wham:5},c=4;',
            'var a = 1,\n    b = {\n        foo: 2,\n        bar: 3\n    },\n    {\n        baz: 4,\n        wham: 5\n    }, c = 4;');
        bt('var a=1,b={foo:2,bar:3},{baz:4,wham:5},\nc=4;',
            'var a = 1,\n    b = {\n        foo: 2,\n        bar: 3\n    },\n    {\n        baz: 4,\n        wham: 5\n    },\n    c = 4;');


        // inline comment
        bt('function x(/*int*/ start, /*string*/ foo)', 'function x( /*int*/ start, /*string*/ foo)');

        // javadoc comment
        bt('/**\n* foo\n*/', '/**\n * foo\n */');
        bt('{\n/**\n* foo\n*/\n}', '{\n    /**\n     * foo\n     */\n}');

        // starless block comment
        bt('/**\nfoo\n*/');
        bt('/**\nfoo\n**/');
        bt('/**\nfoo\nbar\n**/');
        bt('/**\nfoo\n\nbar\n**/');
        bt('/**\nfoo\n    bar\n**/');
        bt('{\n/**\nfoo\n*/\n}', '{\n    /**\n    foo\n    */\n}');
        bt('{\n/**\nfoo\n**/\n}', '{\n    /**\n    foo\n    **/\n}');
        bt('{\n/**\nfoo\nbar\n**/\n}', '{\n    /**\n    foo\n    bar\n    **/\n}');
        bt('{\n/**\nfoo\n\nbar\n**/\n}', '{\n    /**\n    foo\n\n    bar\n    **/\n}');
        bt('{\n/**\nfoo\n    bar\n**/\n}', '{\n    /**\n    foo\n        bar\n    **/\n}');
        bt('{\n    /**\n    foo\nbar\n    **/\n}');

        bt('var a,b,c=1,d,e,f=2;', 'var a, b, c = 1,\n    d, e, f = 2;');
        bt('var a,b,c=[],d,e,f=2;', 'var a, b, c = [],\n    d, e, f = 2;');
        bt('function() {\n    var a, b, c, d, e = [],\n        f;\n}');

        bt('do/regexp/;\nwhile(1);', 'do /regexp/;\nwhile (1);'); // hmmm

        bt('var a = a,\na;\nb = {\nb\n}', 'var a = a,\n    a;\nb = {\n    b\n}');

        bt('var a = a,\n    /* c */\n    b;');
        bt('var a = a,\n    // c\n    b;');

        bt('foo.("bar");'); // weird element referencing


        bt('if (a) a()\nelse b()\nnewline()');
        bt('if (a) a()\nnewline()');
        bt('a=typeof(x)', 'a = typeof(x)');

        bt('var a = function() {\n        return null;\n    },\n    b = false;');

        bt('var a = function() {\n    func1()\n}');
        bt('var a = function() {\n    func1()\n}\nvar b = function() {\n    func2()\n}');

        // code with and without semicolons
        bt( 'var whatever = require("whatever");\nfunction() {\n    a = 6;\n}',
            'var whatever = require("whatever");\n\nfunction() {\n    a = 6;\n}');
        bt( 'var whatever = require("whatever")\nfunction() {\n    a = 6\n}',
            'var whatever = require("whatever")\n\nfunction() {\n    a = 6\n}');


        opts.space_after_anon_function = true;

        bt('switch(x) {case 0: case 1: a(); break; default: break}',
            "switch (x) {\n    case 0:\n    case 1:\n        a();\n        break;\n    default:\n        break\n}");
        bt('switch(x){case -1:break;case !y:break;}',
            'switch (x) {\n    case -1:\n        break;\n    case !y:\n        break;\n}');
        bt('a=typeof(x)', 'a = typeof (x)');
        bt('x();\n\nfunction(){}', 'x();\n\nfunction () {}');
        bt('function () {\n    var a, b, c, d, e = [],\n        f;\n}');
        test_fragment("// comment 1\n(function()", "// comment 1\n(function ()"); // typical greasemonkey start
        bt('var o1=$.extend(a);function(){alert(x);}', 'var o1 = $.extend(a);\n\nfunction () {\n    alert(x);\n}');
        bt('function* () {\n    yield 1;\n}');

        opts.space_after_anon_function = false;

        opts.jslint_happy = true;

        bt('a=typeof(x)', 'a = typeof (x)');
        bt('x();\n\nfunction(){}', 'x();\n\nfunction () {}');
        bt('function () {\n    var a, b, c, d, e = [],\n        f;\n}');
        bt('switch(x) {case 0: case 1: a(); break; default: break}',
            "switch (x) {\ncase 0:\ncase 1:\n    a();\n    break;\ndefault:\n    break\n}");
        bt('switch(x){case -1:break;case !y:break;}',
            'switch (x) {\ncase -1:\n    break;\ncase !y:\n    break;\n}');
        test_fragment("// comment 1\n(function()", "// comment 1\n(function ()"); // typical greasemonkey start
        bt('var o1=$.extend(a);function(){alert(x);}', 'var o1 = $.extend(a);\n\nfunction () {\n    alert(x);\n}');
        bt('function* () {\n    yield 1;\n}');

        opts.jslint_happy = false;

        bt('switch(x) {case 0: case 1: a(); break; default: break}',
            "switch (x) {\n    case 0:\n    case 1:\n        a();\n        break;\n    default:\n        break\n}");
        bt('switch(x){case -1:break;case !y:break;}',
            'switch (x) {\n    case -1:\n        break;\n    case !y:\n        break;\n}');
        test_fragment("// comment 2\n(function()", "// comment 2\n(function()"); // typical greasemonkey start
        bt("var a2, b2, c2, d2 = 0, c = function() {}, d = '';", "var a2, b2, c2, d2 = 0,\n    c = function() {},\n    d = '';");
        bt("var a2, b2, c2, d2 = 0, c = function() {},\nd = '';", "var a2, b2, c2, d2 = 0,\n    c = function() {},\n    d = '';");
        bt('var o2=$.extend(a);function(){alert(x);}', 'var o2 = $.extend(a);\n\nfunction() {\n    alert(x);\n}');
        bt('function*() {\n    yield 1;\n}');

        bt('function* x() {\n    yield 1;\n}');

        bt('{"x":[{"a":1,"b":3},\n7,8,8,8,8,{"b":99},{"a":11}]}', '{\n    "x": [{\n            "a": 1,\n            "b": 3\n        },\n        7, 8, 8, 8, 8, {\n            "b": 99\n        }, {\n            "a": 11\n        }\n    ]\n}');
        bt('{"x":[{"a":1,"b":3},7,8,8,8,8,{"b":99},{"a":11}]}', '{\n    "x": [{\n        "a": 1,\n        "b": 3\n    }, 7, 8, 8, 8, 8, {\n        "b": 99\n    }, {\n        "a": 11\n    }]\n}');

        bt('{"1":{"1a":"1b"},"2"}', '{\n    "1": {\n        "1a": "1b"\n    },\n    "2"\n}');
        bt('{a:{a:b},c}', '{\n    a: {\n        a: b\n    },\n    c\n}');

        bt('{[y[a]];keep_indent;}', '{\n    [y[a]];\n    keep_indent;\n}');

        bt('if (x) {y} else { if (x) {y}}', 'if (x) {\n    y\n} else {\n    if (x) {\n        y\n    }\n}');

        bt('if (foo) one()\ntwo()\nthree()');
        bt('if (1 + foo() && bar(baz()) / 2) one()\ntwo()\nthree()');
        bt('if (1 + foo() && bar(baz()) / 2) one();\ntwo();\nthree();');

        opts.indent_size = 1;
        opts.indent_char = ' ';
        bt('{ one_char() }', "{\n one_char()\n}");

        bt('var a,b=1,c=2', 'var a, b = 1,\n c = 2');

        opts.indent_size = 4;
        opts.indent_char = ' ';
        bt('{ one_char() }', "{\n    one_char()\n}");

        opts.indent_size = 1;
        opts.indent_char = "\t";
        bt('{ one_char() }', "{\n\tone_char()\n}");
        bt('x = a ? b : c; x;', 'x = a ? b : c;\nx;');

        //set to something else than it should change to, but with tabs on, should override
        opts.indent_size = 5;
        opts.indent_char = ' ';
        opts.indent_with_tabs = true;

        bt('{ one_char() }', "{\n\tone_char()\n}");
        bt('x = a ? b : c; x;', 'x = a ? b : c;\nx;');

        opts.indent_size = 4;
        opts.indent_char = ' ';
        opts.indent_with_tabs = false;

        opts.preserve_newlines = false;

        bt('var\na=dont_preserve_newlines;', 'var a = dont_preserve_newlines;');

        // make sure the blank line between function definitions stays
        // even when preserve_newlines = false
        bt('function foo() {\n    return 1;\n}\n\nfunction foo() {\n    return 1;\n}');
        bt('function foo() {\n    return 1;\n}\nfunction foo() {\n    return 1;\n}',
           'function foo() {\n    return 1;\n}\n\nfunction foo() {\n    return 1;\n}'
          );
        bt('function foo() {\n    return 1;\n}\n\n\nfunction foo() {\n    return 1;\n}',
           'function foo() {\n    return 1;\n}\n\nfunction foo() {\n    return 1;\n}'
          );

        opts.preserve_newlines = true;
        bt('var\na=do_preserve_newlines;', 'var\n    a = do_preserve_newlines;');
        bt('// a\n// b\n\n// c\n// d');
        bt('if (foo) //  comment\n{\n    bar();\n}');


        opts.keep_array_indentation = false;
        bt("a = ['a', 'b', 'c',\n   'd', 'e', 'f']",
            "a = ['a', 'b', 'c',\n    'd', 'e', 'f'\n]");
        bt("a = ['a', 'b', 'c',\n   'd', 'e', 'f',\n        'g', 'h', 'i']",
            "a = ['a', 'b', 'c',\n    'd', 'e', 'f',\n    'g', 'h', 'i'\n]");
        bt("a = ['a', 'b', 'c',\n       'd', 'e', 'f',\n            'g', 'h', 'i']",
            "a = ['a', 'b', 'c',\n    'd', 'e', 'f',\n    'g', 'h', 'i'\n]");
        bt('var x = [{}\n]', 'var x = [{}]');
        bt('var x = [{foo:bar}\n]', 'var x = [{\n    foo: bar\n}]');
        bt("a = ['something',\n    'completely',\n    'different'];\nif (x);",
            "a = ['something',\n    'completely',\n    'different'\n];\nif (x);");
        bt("a = ['a','b','c']", "a = ['a', 'b', 'c']");

        bt("a = ['a',   'b','c']", "a = ['a', 'b', 'c']");
        bt("x = [{'a':0}]",
            "x = [{\n    'a': 0\n}]");
        bt('{a([[a1]], {b;});}',
            '{\n    a([\n        [a1]\n    ], {\n        b;\n    });\n}');
        bt("a();\n   [\n   ['sdfsdfsd'],\n        ['sdfsdfsdf']\n   ].toString();",
            "a();\n[\n    ['sdfsdfsd'],\n    ['sdfsdfsdf']\n].toString();");
        bt("a();\na = [\n   ['sdfsdfsd'],\n        ['sdfsdfsdf']\n   ].toString();",
            "a();\na = [\n    ['sdfsdfsd'],\n    ['sdfsdfsdf']\n].toString();");
        bt("function() {\n    Foo([\n        ['sdfsdfsd'],\n        ['sdfsdfsdf']\n    ]);\n}",
            "function() {\n    Foo([\n        ['sdfsdfsd'],\n        ['sdfsdfsdf']\n    ]);\n}");
        bt('function foo() {\n    return [\n        "one",\n        "two"\n    ];\n}');
        // 4 spaces per indent input, processed with 4-spaces per indent
        bt( "function foo() {\n" +
            "    return [\n" +
            "        {\n" +
            "            one: 'x',\n" +
            "            two: [\n" +
            "                {\n" +
            "                    id: 'a',\n" +
            "                    name: 'apple'\n" +
            "                }, {\n" +
            "                    id: 'b',\n" +
            "                    name: 'banana'\n" +
            "                }\n" +
            "            ]\n" +
            "        }\n" +
            "    ];\n" +
            "}",
            "function foo() {\n" +
            "    return [{\n" +
            "        one: 'x',\n" +
            "        two: [{\n" +
            "            id: 'a',\n" +
            "            name: 'apple'\n" +
            "        }, {\n" +
            "            id: 'b',\n" +
            "            name: 'banana'\n" +
            "        }]\n" +
            "    }];\n" +
            "}");
        // 3 spaces per indent input, processed with 4-spaces per indent
        bt( "function foo() {\n" +
            "   return [\n" +
            "      {\n" +
            "         one: 'x',\n" +
            "         two: [\n" +
            "            {\n" +
            "               id: 'a',\n" +
            "               name: 'apple'\n" +
            "            }, {\n" +
            "               id: 'b',\n" +
            "               name: 'banana'\n" +
            "            }\n" +
            "         ]\n" +
            "      }\n" +
            "   ];\n" +
            "}",
            "function foo() {\n" +
            "    return [{\n" +
            "        one: 'x',\n" +
            "        two: [{\n" +
            "            id: 'a',\n" +
            "            name: 'apple'\n" +
            "        }, {\n" +
            "            id: 'b',\n" +
            "            name: 'banana'\n" +
            "        }]\n" +
            "    }];\n" +
            "}");

        opts.keep_array_indentation = true;
        bt("a = ['a', 'b', 'c',\n   'd', 'e', 'f']");
        bt("a = ['a', 'b', 'c',\n   'd', 'e', 'f',\n        'g', 'h', 'i']");
        bt("a = ['a', 'b', 'c',\n       'd', 'e', 'f',\n            'g', 'h', 'i']");
        bt('var x = [{}\n]', 'var x = [{}\n]');
        bt('var x = [{foo:bar}\n]', 'var x = [{\n        foo: bar\n    }\n]');
        bt("a = ['something',\n    'completely',\n    'different'];\nif (x);");
        bt("a = ['a','b','c']", "a = ['a', 'b', 'c']");
        bt("a = ['a',   'b','c']", "a = ['a', 'b', 'c']");
        bt("x = [{'a':0}]",
            "x = [{\n    'a': 0\n}]");
        bt('{a([[a1]], {b;});}',
            '{\n    a([[a1]], {\n        b;\n    });\n}');
        bt("a();\n   [\n   ['sdfsdfsd'],\n        ['sdfsdfsdf']\n   ].toString();",
            "a();\n   [\n   ['sdfsdfsd'],\n        ['sdfsdfsdf']\n   ].toString();");
        bt("a();\na = [\n   ['sdfsdfsd'],\n        ['sdfsdfsdf']\n   ].toString();",
            "a();\na = [\n   ['sdfsdfsd'],\n        ['sdfsdfsdf']\n   ].toString();");
        bt("function() {\n    Foo([\n        ['sdfsdfsd'],\n        ['sdfsdfsdf']\n    ]);\n}",
            "function() {\n    Foo([\n        ['sdfsdfsd'],\n        ['sdfsdfsdf']\n    ]);\n}");
        bt('function foo() {\n    return [\n        "one",\n        "two"\n    ];\n}');
        // 4 spaces per indent input, processed with 4-spaces per indent
        bt( "function foo() {\n" +
            "    return [\n" +
            "        {\n" +
            "            one: 'x',\n" +
            "            two: [\n" +
            "                {\n" +
            "                    id: 'a',\n" +
            "                    name: 'apple'\n" +
            "                }, {\n" +
            "                    id: 'b',\n" +
            "                    name: 'banana'\n" +
            "                }\n" +
            "            ]\n" +
            "        }\n" +
            "    ];\n" +
            "}");
        // 3 spaces per indent input, processed with 4-spaces per indent
        // Should be unchanged, but is not - #445
//         bt( "function foo() {\n" +
//             "   return [\n" +
//             "      {\n" +
//             "         one: 'x',\n" +
//             "         two: [\n" +
//             "            {\n" +
//             "               id: 'a',\n" +
//             "               name: 'apple'\n" +
//             "            }, {\n" +
//             "               id: 'b',\n" +
//             "               name: 'banana'\n" +
//             "            }\n" +
//             "         ]\n" +
//             "      }\n" +
//             "   ];\n" +
//             "}");


        opts.keep_array_indentation = false;


        bt('a = //comment\n    /regex/;');

        test_fragment('/*\n * X\n */');
        test_fragment('/*\r\n * X\r\n */', '/*\n * X\n */');

        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}', 'if (a) {\n    b;\n} else {\n    c;\n}');

        // tests for brace positioning
        beautify_brace_tests('expand');
        beautify_brace_tests('collapse');
        beautify_brace_tests('end-expand');
        beautify_brace_tests('none');

        bt('a = <?= external() ?> ;'); // not the most perfect thing in the world, but you're the weirdo beaufifying php mix-ins with javascript beautifier
        bt('a = <%= external() %> ;');

        bt('// func-comment\n\nfunction foo() {}\n\n// end-func-comment');

        test_fragment('roo = {\n    /*\n    ****\n      FOO\n    ****\n    */\n    BAR: 0\n};');

        bt('"foo""bar""baz"', '"foo"\n"bar"\n"baz"');
        bt("'foo''bar''baz'", "'foo'\n'bar'\n'baz'");


        test_fragment("if (zz) {\n    // ....\n}\n(function");

        bt("{\n    get foo() {}\n}");
        bt("{\n    var a = get\n    foo();\n}");
        bt("{\n    set foo() {}\n}");
        bt("{\n    var a = set\n    foo();\n}");
        bt("var x = {\n    get function()\n}");
        bt("var x = {\n    set function()\n}");

        // According to my current research get/set have no special meaning outside of an object literal
        bt("var x = set\n\na() {}", "var x = set\n\na() {}");
        bt("var x = set\n\nfunction() {}", "var x = set\n\nfunction() {}");

        bt('<!-- foo\nbar();\n-->');
        bt('<!-- dont crash'); // -->
        bt('for () /abc/.test()');
        bt('if (k) /aaa/m.test(v) && l();');
        bt('switch (true) {\n    case /swf/i.test(foo):\n        bar();\n}');
        bt('createdAt = {\n    type: Date,\n    default: Date.now\n}');
        bt('switch (createdAt) {\n    case a:\n        Date,\n    default:\n        Date.now\n}');
        opts.space_before_conditional = false;
        bt('if(a) b()');
        opts.space_before_conditional = true;


        opts.preserve_newlines = true;
        bt('var a = 42; // foo\n\nvar b;');
        bt('var a = 42; // foo\n\n\nvar b;');
        bt("var a = 'foo' +\n    'bar';");
        bt("var a = \"foo\" +\n    \"bar\";");
        bt('this.oa = new OAuth(\n' +
           '    _requestToken,\n' +
           '    _accessToken,\n' +
           '    consumer_key\n' +
           ');');


        opts.unescape_strings = false;
        test_fragment('"\\x22\\x27", \'\\x22\\x27\', "\\x5c", \'\\x5c\', "\\xff and \\xzz", "unicode \\u0000 \\u0022 \\u0027 \\u005c \\uffff \\uzzzz"');
        opts.unescape_strings = true;
        test_fragment('"\\x20\\x40\\x4a"', '" @J"');
        test_fragment('"\\xff\\x40\\x4a"');
        test_fragment('"\\u0072\\u016B\\u0137\\u012B\\u0074\\u0069\\u0073"', '"rūķītis"');
        test_fragment('"Google Chrome est\\u00E1 actualizado."', '"Google Chrome está actualizado."');
        /*
        bt('"\\x22\\x27",\'\\x22\\x27\',"\\x5c",\'\\x5c\',"\\xff and \\xzz","unicode \\u0000 \\u0022 \\u0027 \\u005c \\uffff \\uzzzz"',
           '"\\"\'", \'"\\\'\', "\\\\", \'\\\\\', "\\xff and \\xzz", "unicode \\u0000 \\" \' \\\\ \\uffff \\uzzzz"');
        */
        opts.unescape_strings = false;

        bt('return function();');
        bt('var a = function();');
        bt('var a = 5 + function();');

        bt('3.*7;', '3. * 7;');
        bt('a = 1.e-64 * 0.5e+4 / 6e-23;');
        bt('import foo.*;', 'import foo.*;'); // actionscript's import
        test_fragment('function f(a: a, b: b)'); // actionscript

        bt('{\n    foo // something\n    ,\n    bar // something\n    baz\n}');
        bt('function a(a) {} function b(b) {} function c(c) {}', 'function a(a) {}\n\nfunction b(b) {}\n\nfunction c(c) {}');
        bt('foo(a, function() {})');

        bt('foo(a, /regex/)');

        bt('/* foo */\n"x"');

        opts.break_chained_methods = false;
        opts.preserve_newlines = false;
        bt('foo\n.bar()\n.baz().cucumber(fat)', 'foo.bar().baz().cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat); foo.bar().baz().cucumber(fat)', 'foo.bar().baz().cucumber(fat);\nfoo.bar().baz().cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat)\n foo.bar().baz().cucumber(fat)', 'foo.bar().baz().cucumber(fat)\nfoo.bar().baz().cucumber(fat)');
        bt('this\n.something = foo.bar()\n.baz().cucumber(fat)', 'this.something = foo.bar().baz().cucumber(fat)');
        bt('this.something.xxx = foo.moo.bar()');
        bt('this\n.something\n.xxx = foo.moo\n.bar()', 'this.something.xxx = foo.moo.bar()');

        opts.break_chained_methods = false;
        opts.preserve_newlines = true;
        bt('foo\n.bar()\n.baz().cucumber(fat)', 'foo\n    .bar()\n    .baz().cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat); foo.bar().baz().cucumber(fat)', 'foo\n    .bar()\n    .baz().cucumber(fat);\nfoo.bar().baz().cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat)\n foo.bar().baz().cucumber(fat)', 'foo\n    .bar()\n    .baz().cucumber(fat)\nfoo.bar().baz().cucumber(fat)');
        bt('this\n.something = foo.bar()\n.baz().cucumber(fat)', 'this\n    .something = foo.bar()\n    .baz().cucumber(fat)');
        bt('this.something.xxx = foo.moo.bar()');
        bt('this\n.something\n.xxx = foo.moo\n.bar()', 'this\n    .something\n    .xxx = foo.moo\n    .bar()');

        opts.break_chained_methods = true;
        opts.preserve_newlines = false;
        bt('foo\n.bar()\n.baz().cucumber(fat)', 'foo.bar()\n    .baz()\n    .cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat); foo.bar().baz().cucumber(fat)', 'foo.bar()\n    .baz()\n    .cucumber(fat);\nfoo.bar()\n    .baz()\n    .cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat)\n foo.bar().baz().cucumber(fat)', 'foo.bar()\n    .baz()\n    .cucumber(fat)\nfoo.bar()\n    .baz()\n    .cucumber(fat)');
        bt('this\n.something = foo.bar()\n.baz().cucumber(fat)', 'this.something = foo.bar()\n    .baz()\n    .cucumber(fat)');
        bt('this.something.xxx = foo.moo.bar()');
        bt('this\n.something\n.xxx = foo.moo\n.bar()', 'this.something.xxx = foo.moo.bar()');

        opts.break_chained_methods = true;
        opts.preserve_newlines = true;
        bt('foo\n.bar()\n.baz().cucumber(fat)', 'foo\n    .bar()\n    .baz()\n    .cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat); foo.bar().baz().cucumber(fat)', 'foo\n    .bar()\n    .baz()\n    .cucumber(fat);\nfoo.bar()\n    .baz()\n    .cucumber(fat)');
        bt('foo\n.bar()\n.baz().cucumber(fat)\n foo.bar().baz().cucumber(fat)', 'foo\n    .bar()\n    .baz()\n    .cucumber(fat)\nfoo.bar()\n    .baz()\n    .cucumber(fat)');
        bt('this\n.something = foo.bar()\n.baz().cucumber(fat)', 'this\n    .something = foo.bar()\n    .baz()\n    .cucumber(fat)');
        bt('this.something.xxx = foo.moo.bar()');
        bt('this\n.something\n.xxx = foo.moo\n.bar()', 'this\n    .something\n    .xxx = foo.moo\n    .bar()');

        opts.break_chained_methods = false;

        // Line wrap test intputs
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        wrap_input_1=('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token + 12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap + but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap + !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" + "but_this_can"\n' +
                      '}');

        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        wrap_input_2=('{\n' +
                      '    foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      '    Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      '    if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();\n' +
                      '    object_literal = {\n' +
                      '        propertx: first_token + 12345678.99999E-6,\n' +
                      '        property: first_token_should_never_wrap + but_this_can,\n' +
                      '        propertz: first_token_should_never_wrap + !but_this_can,\n' +
                      '        proper: "first_token_should_never_wrap" + "but_this_can"\n' +
                      '    }' +
                      '}');

        opts.preserve_newlines = false;
        opts.wrap_line_length = 0;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_.okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token + 12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap + but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap + !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" + "but_this_can"\n' +
                      '}');

        opts.wrap_line_length = 70;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_.okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token + 12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap + but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap + !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" + "but_this_can"\n' +
                      '}');

        opts.wrap_line_length = 40;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat &&\n' +
                      '    "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_.okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token +\n' +
                      '        12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap +\n' +
                      '        but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap +\n' +
                      '        !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" +\n' +
                      '        "but_this_can"\n' +
                      '}');

        opts.wrap_line_length = 41;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '    (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_.okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token +\n' +
                      '        12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap +\n' +
                      '        but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap +\n' +
                      '        !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" +\n' +
                      '        "but_this_can"\n' +
                      '}');

        opts.wrap_line_length = 45;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_2,
                      /* expected */
                      '{\n' +
                      '    foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '        (leans && mean));\n' +
                      '    Test_very_long_variable_name_this_should_never_wrap\n' +
                      '        .but_this_can\n' +
                      '    if (wraps_can_occur &&\n' +
                      '        inside_an_if_block) that_is_.okay();\n' +
                      '    object_literal = {\n' +
                      '        propertx: first_token +\n' +
                      '            12345678.99999E-6,\n' +
                      '        property: first_token_should_never_wrap +\n' +
                      '            but_this_can,\n' +
                      '        propertz: first_token_should_never_wrap +\n' +
                      '            !but_this_can,\n' +
                      '        proper: "first_token_should_never_wrap" +\n' +
                      '            "but_this_can"\n' +
                      '    }\n'+
                      '}');

        opts.preserve_newlines = true;
        opts.wrap_line_length = 0;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n' +
                      '    .okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token + 12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap + but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap + !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" + "but_this_can"\n' +
                      '}');

        opts.wrap_line_length = 70;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n' +
                      '    .okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token + 12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap + but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap + !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" + "but_this_can"\n' +
                      '}');


        opts.wrap_line_length = 40;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat &&\n' +
                      '    "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_\n' +
                      '    .okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token +\n' +
                      '        12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap +\n' +
                      '        but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap +\n' +
                      '        !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" +\n' +
                      '        "but_this_can"\n' +
                      '}');

        opts.wrap_line_length = 41;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_1,
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '    (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_\n' +
                      '    .okay();\n' +
                      'object_literal = {\n' +
                      '    propertx: first_token +\n' +
                      '        12345678.99999E-6,\n' +
                      '    property: first_token_should_never_wrap +\n' +
                      '        but_this_can,\n' +
                      '    propertz: first_token_should_never_wrap +\n' +
                      '        !but_this_can,\n' +
                      '    proper: "first_token_should_never_wrap" +\n' +
                      '        "but_this_can"\n' +
                      '}');

        opts.wrap_line_length = 45;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment(wrap_input_2,
                      /* expected */
                      '{\n' +
                      '    foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '        (leans && mean));\n' +
                      '    Test_very_long_variable_name_this_should_never_wrap\n' +
                      '        .but_this_can\n' +
                      '    if (wraps_can_occur &&\n' +
                      '        inside_an_if_block) that_is_\n' +
                      '        .okay();\n' +
                      '    object_literal = {\n' +
                      '        propertx: first_token +\n' +
                      '            12345678.99999E-6,\n' +
                      '        property: first_token_should_never_wrap +\n' +
                      '            but_this_can,\n' +
                      '        propertz: first_token_should_never_wrap +\n' +
                      '            !but_this_can,\n' +
                      '        proper: "first_token_should_never_wrap" +\n' +
                      '            "but_this_can"\n' +
                      '    }\n'+
                      '}');

        opts.wrap_line_length = 0;

        opts.preserve_newlines = false;
        bt('if (foo) // comment\n    bar();');
        bt('if (foo) // comment\n    (bar());');
        bt('if (foo) // comment\n    (bar());');
        bt('if (foo) // comment\n    /asdf/;');
        bt('this.oa = new OAuth(\n' +
           '    _requestToken,\n' +
           '    _accessToken,\n' +
           '    consumer_key\n' +
           ');',
           'this.oa = new OAuth(_requestToken, _accessToken, consumer_key);');
        bt('foo = {\n    x: y, // #44\n    w: z // #44\n}');
        bt('switch (x) {\n    case "a":\n        // comment on newline\n        break;\n    case "b": // comment on same line\n        break;\n}');
        bt('this.type =\n    this.options =\n    // comment\n    this.enabled null;',
           'this.type = this.options =\n    // comment\n    this.enabled null;');
        bt('someObj\n    .someFunc1()\n    // This comment should not break the indent\n    .someFunc2();',
           'someObj.someFunc1()\n    // This comment should not break the indent\n    .someFunc2();');

        bt('if (true ||\n!true) return;', 'if (true || !true) return;');

        // these aren't ready yet.
        //bt('if (foo) // comment\n    bar() /*i*/ + baz() /*j\n*/ + asdf();');
        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\na();',
            'if (foo)\n    if (bar)\n        if (baz) whee();\na();');
        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\nelse\na();',
            'if (foo)\n    if (bar)\n        if (baz) whee();\n        else a();');
        bt('if (foo)\nbar();\nelse\ncar();',
            'if (foo) bar();\nelse car();');

        bt('if (foo) if (bar) if (baz);\na();',
            'if (foo)\n    if (bar)\n        if (baz);\na();');
        bt('if (foo) if (bar) if (baz) whee();\na();',
            'if (foo)\n    if (bar)\n        if (baz) whee();\na();');
        bt('if (foo) a()\nif (bar) if (baz) whee();\na();',
            'if (foo) a()\nif (bar)\n    if (baz) whee();\na();');
        bt('if (foo);\nif (bar) if (baz) whee();\na();',
            'if (foo);\nif (bar)\n    if (baz) whee();\na();');
        bt('if (options)\n' +
           '    for (var p in options)\n' +
           '        this[p] = options[p];',
           'if (options)\n'+
           '    for (var p in options) this[p] = options[p];');
        bt('if (options) for (var p in options) this[p] = options[p];',
           'if (options)\n    for (var p in options) this[p] = options[p];');

        bt('if (options) do q(); while (b());',
           'if (options)\n    do q(); while (b());');
        bt('if (options) while (b()) q();',
           'if (options)\n    while (b()) q();');
        bt('if (options) do while (b()) q(); while (a());',
           'if (options)\n    do\n        while (b()) q(); while (a());');

        bt('function f(a, b, c,\nd, e) {}',
            'function f(a, b, c, d, e) {}');

        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\n\nfunction g(a, b) {\n    if (!a) b()\n}');
        bt('function f(a,b) {if(a) b()}\n\n\n\nfunction g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\n\nfunction g(a, b) {\n    if (!a) b()\n}');

        // This is not valid syntax, but still want to behave reasonably and not side-effect
        bt('(if(a) b())(if(a) b())',
            '(\n    if (a) b())(\n    if (a) b())');
        bt('(if(a) b())\n\n\n(if(a) b())',
            '(\n    if (a) b())\n(\n    if (a) b())');



        bt("if\n(a)\nb();", "if (a) b();");
        bt('var a =\nfoo', 'var a = foo');
        bt('var a = {\n"a":1,\n"b":2}', "var a = {\n    \"a\": 1,\n    \"b\": 2\n}");
        bt("var a = {\n'a':1,\n'b':2}", "var a = {\n    'a': 1,\n    'b': 2\n}");
        bt('var a = /*i*/ "b";');
        bt('var a = /*i*/\n"b";', 'var a = /*i*/ "b";');
        bt('var a = /*i*/\nb;', 'var a = /*i*/ b;');
        bt('{\n\n\n"x"\n}', '{\n    "x"\n}');
        bt('if(a &&\nb\n||\nc\n||d\n&&\ne) e = f', 'if (a && b || c || d && e) e = f');
        bt('if(a &&\n(b\n||\nc\n||d)\n&&\ne) e = f', 'if (a && (b || c || d) && e) e = f');
        test_fragment('\n\n"x"', '"x"');
        bt('a = 1;\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nb = 2;',
                'a = 1;\nb = 2;');

        opts.preserve_newlines = true;
        bt('if (foo) // comment\n    bar();');
        bt('if (foo) // comment\n    (bar());');
        bt('if (foo) // comment\n    (bar());');
        bt('if (foo) // comment\n    /asdf/;');
        bt('foo = {\n    x: y, // #44\n    w: z // #44\n}');
        bt('switch (x) {\n    case "a":\n        // comment on newline\n        break;\n    case "b": // comment on same line\n        break;\n}');
        bt('this.type =\n    this.options =\n    // comment\n    this.enabled null;');
        bt('someObj\n    .someFunc1()\n    // This comment should not break the indent\n    .someFunc2();');

        bt('if (true ||\n!true) return;', 'if (true ||\n    !true) return;');

        // these aren't ready yet.
        // bt('if (foo) // comment\n    bar() /*i*/ + baz() /*j\n*/ + asdf();');
        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\na();',
            'if (foo)\n    if (bar)\n        if (baz)\n            whee();\na();');
        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\nelse\na();',
            'if (foo)\n    if (bar)\n        if (baz)\n            whee();\n        else\n            a();');
        bt('if (foo) bar();\nelse\ncar();',
            'if (foo) bar();\nelse\n    car();');

        bt('if (foo) if (bar) if (baz);\na();',
            'if (foo)\n    if (bar)\n        if (baz);\na();');
        bt('if (foo) if (bar) if (baz) whee();\na();',
            'if (foo)\n    if (bar)\n        if (baz) whee();\na();');
        bt('if (foo) a()\nif (bar) if (baz) whee();\na();',
            'if (foo) a()\nif (bar)\n    if (baz) whee();\na();');
        bt('if (foo);\nif (bar) if (baz) whee();\na();',
            'if (foo);\nif (bar)\n    if (baz) whee();\na();');
        bt('if (options)\n' +
           '    for (var p in options)\n' +
           '        this[p] = options[p];');
        bt('if (options) for (var p in options) this[p] = options[p];',
           'if (options)\n    for (var p in options) this[p] = options[p];');

        bt('if (options) do q(); while (b());',
           'if (options)\n    do q(); while (b());');
        bt('if (options) do; while (b());',
           'if (options)\n    do; while (b());');
        bt('if (options) while (b()) q();',
           'if (options)\n    while (b()) q();');
        bt('if (options) do while (b()) q(); while (a());',
           'if (options)\n    do\n        while (b()) q(); while (a());');

        bt('function f(a, b, c,\nd, e) {}',
            'function f(a, b, c,\n    d, e) {}');

        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\n\nfunction g(a, b) {\n    if (!a) b()\n}');
        bt('function f(a,b) {if(a) b()}\n\n\n\nfunction g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\n\n\n\nfunction g(a, b) {\n    if (!a) b()\n}');
        // This is not valid syntax, but still want to behave reasonably and not side-effect
        bt('(if(a) b())(if(a) b())',
            '(\n    if (a) b())(\n    if (a) b())');
        bt('(if(a) b())\n\n\n(if(a) b())',
            '(\n    if (a) b())\n\n\n(\n    if (a) b())');

        // space between functions
        bt('/*\n * foo\n */\nfunction foo() {}');
        bt('// a nice function\nfunction foo() {}');
        bt('function foo() {}\nfunction foo() {}',
            'function foo() {}\n\nfunction foo() {}'
        );

        bt('[\n    function() {}\n]');



        bt("if\n(a)\nb();", "if (a)\n    b();");
        bt('var a =\nfoo', 'var a =\n    foo');
        bt('var a = {\n"a":1,\n"b":2}', "var a = {\n    \"a\": 1,\n    \"b\": 2\n}");
        bt("var a = {\n'a':1,\n'b':2}", "var a = {\n    'a': 1,\n    'b': 2\n}");
        bt('var a = /*i*/ "b";');
        bt('var a = /*i*/\n"b";', 'var a = /*i*/\n    "b";');
        bt('var a = /*i*/\nb;', 'var a = /*i*/\n    b;');
        bt('{\n\n\n"x"\n}', '{\n\n\n    "x"\n}');
        bt('if(a &&\nb\n||\nc\n||d\n&&\ne) e = f', 'if (a &&\n    b ||\n    c || d &&\n    e) e = f');
        bt('if(a &&\n(b\n||\nc\n||d)\n&&\ne) e = f', 'if (a &&\n    (b ||\n        c || d) &&\n    e) e = f');
        test_fragment('\n\n"x"', '"x"');

        // this beavior differs between js and python, defaults to unlimited in js, 10 in python
        bt('a = 1;\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nb = 2;',
            'a = 1;\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nb = 2;');
        opts.max_preserve_newlines = 8;
        bt('a = 1;\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nb = 2;',
            'a = 1;\n\n\n\n\n\n\n\nb = 2;');

        // Test the option to have spaces within parens
        opts.space_in_paren = false;
        bt('if(p) foo(a,b)', 'if (p) foo(a, b)');
        bt('try{while(true){willThrow()}}catch(result)switch(result){case 1:++result }',
           'try {\n    while (true) {\n        willThrow()\n    }\n} catch (result) switch (result) {\n    case 1:\n        ++result\n}');
        bt('((e/((a+(b)*c)-d))^2)*5;', '((e / ((a + (b) * c) - d)) ^ 2) * 5;');
        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\n\nfunction g(a, b) {\n    if (!a) b()\n}');
        bt('a=[];',
            'a = [];');
        bt('a=[b,c,d];',
            'a = [b, c, d];');
        bt('a= f[b];',
            'a = f[b];');
        opts.space_in_paren = true;
        bt('if(p) foo(a,b)', 'if ( p ) foo( a, b )');
        bt('try{while(true){willThrow()}}catch(result)switch(result){case 1:++result }',
           'try {\n    while ( true ) {\n        willThrow()\n    }\n} catch ( result ) switch ( result ) {\n    case 1:\n        ++result\n}');
        bt('((e/((a+(b)*c)-d))^2)*5;', '( ( e / ( ( a + ( b ) * c ) - d ) ) ^ 2 ) * 5;');
        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f( a, b ) {\n    if ( a ) b()\n}\n\nfunction g( a, b ) {\n    if ( !a ) b()\n}');
        bt('a=[];',
            'a = [];');
        bt('a=[b,c,d];',
            'a = [ b, c, d ];');
        bt('a= f[b];',
            'a = f[ b ];');
        opts.space_in_empty_paren = true;
        bt('if(p) foo(a,b)', 'if ( p ) foo( a, b )');
        bt('try{while(true){willThrow()}}catch(result)switch(result){case 1:++result }',
           'try {\n    while ( true ) {\n        willThrow( )\n    }\n} catch ( result ) switch ( result ) {\n    case 1:\n        ++result\n}');
        bt('((e/((a+(b)*c)-d))^2)*5;', '( ( e / ( ( a + ( b ) * c ) - d ) ) ^ 2 ) * 5;');
        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f( a, b ) {\n    if ( a ) b( )\n}\n\nfunction g( a, b ) {\n    if ( !a ) b( )\n}');
        bt('a=[];',
            'a = [ ];');
        bt('a=[b,c,d];',
            'a = [ b, c, d ];');
        bt('a= f[b];',
            'a = f[ b ];');
        opts.space_in_empty_paren = false;
        opts.space_in_paren = false;

        // Test template strings
        bt('`This is a ${template} string.`', '`This is a ${template} string.`');
        bt('`This\n  is\n  a\n  ${template}\n  string.`', '`This\n  is\n  a\n  ${template}\n  string.`');

        // Test that e4x literals passed through when e4x-option is enabled
        bt('xml=<a b="c"><d/><e>\n foo</e>x</a>;', 'xml = < a b = "c" > < d / > < e >\n    foo < /e>x</a > ;');
        opts.e4x = true;
        bt('xml=<a b="c"><d/><e>\n foo</e>x</a>;', 'xml = <a b="c"><d/><e>\n foo</e>x</a>;');
        bt('<a b=\'This is a quoted "c".\'/>', '<a b=\'This is a quoted "c".\'/>');
        bt('<a b="This is a quoted \'c\'."/>', '<a b="This is a quoted \'c\'."/>');
        bt('<a b="A quote \' inside string."/>', '<a b="A quote \' inside string."/>');
        bt('<a b=\'A quote " inside string.\'/>', '<a b=\'A quote " inside string.\'/>');
        bt('<a b=\'Some """ quotes ""  inside string.\'/>', '<a b=\'Some """ quotes ""  inside string.\'/>');
        // Handles inline expressions
        bt('xml=<{a} b="c"><d/><e v={z}>\n foo</e>x</{a}>;', 'xml = <{a} b="c"><d/><e v={z}>\n foo</e>x</{a}>;');
        // xml literals with special characters in elem names
        // see http://www.w3.org/TR/REC-xml/#NT-NameChar
        bt('xml = <_:.valid.xml- _:.valid.xml-="123"/>;', 'xml = <_:.valid.xml- _:.valid.xml-="123"/>;');
        // Handles CDATA
        bt('xml=<![CDATA[ b="c"><d/><e v={z}>\n foo</e>x/]]>;', 'xml = <![CDATA[ b="c"><d/><e v={z}>\n foo</e>x/]]>;');
        bt('xml=<![CDATA[]]>;', 'xml = <![CDATA[]]>;');
        bt('xml=<a b="c"><![CDATA[d/></a></{}]]></a>;', 'xml = <a b="c"><![CDATA[d/></a></{}]]></a>;');

        // Handles messed up tags, as long as it isn't the same name
        // as the root tag. Also handles tags of same name as root tag
        // as long as nesting matches.
        bt('xml=<a x="jn"><c></b></f><a><d jnj="jnn"><f></a ></nj></a>;',
         'xml = <a x="jn"><c></b></f><a><d jnj="jnn"><f></a ></nj></a>;');
        // If xml is not terminated, the remainder of the file is treated
        // as part of the xml-literal (passed through unaltered)
        test_fragment('xml=<a></b>\nc<b;', 'xml = <a></b>\nc<b;');
        opts.e4x = false;

        // START tests for issue 241
        bt('obj\n' +
           '    .last({\n' +
           '        foo: 1,\n' +
           '        bar: 2\n' +
           '    });\n' +
           'var test = 1;');

        bt('obj\n' +
           '    .last(a, function() {\n' +
           '        var test;\n' +
           '    });\n' +
           'var test = 1;');

        bt('obj.first()\n' +
           '    .second()\n' +
           '    .last(function(err, response) {\n' +
           '        console.log(err);\n' +
           '    });');

        // END tests for issue 241


        // START tests for issue 268 and 275
        bt('obj.last(a, function() {\n' +
           '    var test;\n' +
           '});\n' +
           'var test = 1;');
        bt('obj.last(a,\n' +
           '    function() {\n' +
           '        var test;\n' +
           '    });\n' +
           'var test = 1;');

        bt('(function() {if (!window.FOO) window.FOO || (window.FOO = function() {var b = {bar: "zort"};});})();',
           '(function() {\n' +
           '    if (!window.FOO) window.FOO || (window.FOO = function() {\n' +
           '        var b = {\n' +
           '            bar: "zort"\n' +
           '        };\n' +
           '    });\n' +
           '})();');
        // END tests for issue 268 and 275

        // START tests for issue 281
        bt('define(["dojo/_base/declare", "my/Employee", "dijit/form/Button",\n' +
           '    "dojo/_base/lang", "dojo/Deferred"\n' +
           '], function(declare, Employee, Button, lang, Deferred) {\n' +
           '    return declare(Employee, {\n' +
           '        constructor: function() {\n' +
           '            new Button({\n' +
           '                onClick: lang.hitch(this, function() {\n' +
           '                    new Deferred().then(lang.hitch(this, function() {\n' +
           '                        this.salary * 0.25;\n' +
           '                    }));\n' +
           '                })\n' +
           '            });\n' +
           '        }\n' +
           '    });\n' +
           '});');

        bt('define(["dojo/_base/declare", "my/Employee", "dijit/form/Button",\n' +
           '        "dojo/_base/lang", "dojo/Deferred"\n' +
           '    ],\n' +
           '    function(declare, Employee, Button, lang, Deferred) {\n' +
           '        return declare(Employee, {\n' +
           '            constructor: function() {\n' +
           '                new Button({\n' +
           '                    onClick: lang.hitch(this, function() {\n' +
           '                        new Deferred().then(lang.hitch(this, function() {\n' +
           '                            this.salary * 0.25;\n' +
           '                        }));\n' +
           '                    })\n' +
           '                });\n' +
           '            }\n' +
           '        });\n' +
           '    });');
        // END tests for issue 281

        // START tests for issue 459
        bt( '(function() {\n' +
            '    return {\n' +
            '        foo: function() {\n' +
            '            return "bar";\n' +
            '        },\n' +
            '        bar: ["bar"]\n' +
            '    };\n' +
            '}());');
        // END tests for issue 459

        // START tests for issue 505
        // strings should end at newline unless continued by backslash
        bt( 'var name = "a;\n' +
            'name = "b";');
        bt( 'var name = "a; \\\n' +
            '    name = b";');
        // END tests for issue 505

        // START tests for issue 514
        // some operators require spaces to distinguish them
        bt('var c = "_ACTION_TO_NATIVEAPI_" + ++g++ + +new Date;');
        bt('var c = "_ACTION_TO_NATIVEAPI_" - --g-- - -new Date;');
        // END tests for issue 514

        // START tests for issue 440
        // reserved words can be used as object property names
        bt( 'a = {\n' +
            '    function: {},\n' +
            '    "function": {},\n' +
            '    throw: {},\n' +
            '    "throw": {},\n' +
            '    var: {},\n' +
            '    "var": {},\n' +
            '    set: {},\n' +
            '    "set": {},\n' +
            '    get: {},\n' +
            '    "get": {},\n' +
            '    if: {},\n' +
            '    "if": {},\n' +
            '    then: {},\n' +
            '    "then": {},\n' +
            '    else: {},\n' +
            '    "else": {},\n' +
            '    yay: {}\n' +
            '};');
        // END tests for issue 440

        // START tests for issue 311
        // if-else with braces edge case
        bt('if(x){a();}else{b();}if(y){c();}',
            'if (x) {\n' +
            '    a();\n' +
            '} else {\n' +
            '    b();\n' +
            '}\n' +
            'if (y) {\n' +
            '    c();\n' +
            '}');
        // END tests for issue 311

        // START tests for issue 485
        // ensure function declarations behave the same in arrays as elsewhere
        bt( 'var v = ["a",\n' +
            '    function() {\n' +
            '        return;\n' +
            '    }, {\n' +
            '        id: 1\n' +
            '    }\n' +
            '];');
        bt( 'var v = ["a", function() {\n' +
            '    return;\n' +
            '}, {\n' +
            '    id: 1\n' +
            '}];');
        // END tests for issue 485

        // START tests for issue 382
        // initial totally cursor support for es6 module export
        bt( 'module "Even" {\n' +
            '    import odd from "Odd";\n' +
            '    export function sum(x, y) {\n' +
            '        return x + y;\n' +
            '    }\n' +
            '    export var pi = 3.141593;\n' +
            '    export default moduleName;\n' +
            '}');
        bt( 'module "Even" {\n' +
            '    export default function div(x, y) {}\n' +
            '}');
        // END tests for issue 382

        // START tests for issue 508
        bt('set["name"]');
        bt('get["name"]');
        test_fragment(
            'a = {\n' +
            '    set b(x) {},\n' +
            '    c: 1,\n' +
            '    d: function() {}\n' +
            '};');
        test_fragment(
            'a = {\n' +
            '    get b() {\n' +
            '        retun 0;\n' +
            '    },\n' +
            '    c: 1,\n' +
            '    d: function() {}\n' +
            '};');
        // END tests for issue 508

        // START tests for issue 298
        // do not under indent if/while/for condtionals experesions
        bt("'use strict';\n" +
            "if ([].some(function() {\n" +
            "        return false;\n" +
            "    })) {\n" +
            "    console.log('hello');\n" +
            "}");
        // END tests for issue 298

        // START tests for issue 552
        // Typescript?  Okay... we didn't break it before try not to now.
        bt( "class Test {\n" +
            "    blah: string[];\n" +
            "    foo(): number {\n" +
            "        return 0;\n" +
            "    }\n" +
            "    bar(): number {\n" +
            "        return 0;\n" +
            "    }\n" +
            "}");
        bt( "interface Test {\n" +
            "    blah: string[];\n" +
            "    foo(): number {\n" +
            "        return 0;\n" +
            "    }\n" +
            "    bar(): number {\n" +
            "        return 0;\n" +
            "    }\n" +
            "}");
        // END tests for issue 552


        bt('var a=1,b={bang:2},c=3;',
            'var a = 1,\n    b = {\n        bang: 2\n    },\n    c = 3;');
        bt('var a={bing:1},b=2,c=3;',
            'var a = {\n        bing: 1\n    },\n    b = 2,\n    c = 3;');
        Urlencoded.run_tests(sanitytest);
    }

    beautifier_tests();
}

if (typeof exports !== "undefined") {
    exports.run_javascript_tests = run_javascript_tests;
}
//== js/test/beautify-javascript-tests.js end


//== js/test/beautify-css-tests.js
/*global js_beautify: true */

function run_css_tests(test_obj, Urlencoded, js_beautify, html_beautify, css_beautify)
{

    var opts = {
        indent_size: 4,
        indent_char: ' ',
        preserve_newlines: true,
        jslint_happy: false,
        keep_array_indentation: false,
        brace_style: 'collapse',
        space_before_conditional: true,
        break_chained_methods: false,
        selector_separator: '\n',
        end_with_newline: false
    };

    function test_css_beautifier(input)
    {
        return css_beautify(input, opts);
    }

    var sanitytest;

    // test the input on beautifier with the current flag settings
    // does not check the indentation / surroundings as bt() does
    function test_fragment(input, expected)
    {
        expected = expected || expected === '' ? expected : input;
        sanitytest.expect(input, expected);
        // if the expected is different from input, run it again
        // expected output should be unchanged when run twice.
        if (expected !== input) {
            sanitytest.expect(expected, expected);
        }
    }

    // test css
    function t(input, expectation)
    {
        var wrapped_input, wrapped_expectation;

        expectation = expectation || expectation === '' ? expectation : input;
        sanitytest.test_function(test_css_beautifier, 'css_beautify');
        test_fragment(input, expectation);
    }

    function unicode_char(value) {
        return String.fromCharCode(value)
    }

    function beautifier_tests()
    {
        sanitytest = test_obj;

        t(".tabs {}");

        opts.indent_size = 1;
        opts.indent_char = '\t';
        opts.selector_separator_newline = true;
        opts.end_with_newline = false;

        // End With Newline - (eof = "\n")
        opts.end_with_newline = true;
        test_fragment('', '\n');
        test_fragment('   .tabs{}', '   .tabs {}\n');
        test_fragment('   \n\n.tabs{}\n\n\n\n', '   .tabs {}\n');
        test_fragment('\n');

        // End With Newline - (eof = "")
        opts.end_with_newline = false;
        test_fragment('');
        test_fragment('   .tabs{}', '   .tabs {}');
        test_fragment('   \n\n.tabs{}\n\n\n\n', '   .tabs {}');
        test_fragment('\n', '');

        // Empty braces
        t('.tabs{}', '.tabs {}');
        t('.tabs { }', '.tabs {}');
        t('.tabs    {    }', '.tabs {}');
        t('.tabs    \n{\n    \n  }', '.tabs {}');

        //

        // test basic css beautifier
        t(".tabs {}");
        t(".tabs{color:red;}", ".tabs {\n\tcolor: red;\n}");
        t(".tabs{color:rgb(255, 255, 0)}", ".tabs {\n\tcolor: rgb(255, 255, 0)\n}");
        t(".tabs{background:url('back.jpg')}", ".tabs {\n\tbackground: url('back.jpg')\n}");
        t("#bla, #foo{color:red}", "#bla,\n#foo {\n\tcolor: red\n}");
        t("@media print {.tab{}}", "@media print {\n\t.tab {}\n}");
        t("@media print {.tab{background-image:url(foo@2x.png)}}", "@media print {\n\t.tab {\n\t\tbackground-image: url(foo@2x.png)\n\t}\n}");

        t("a:before {\n" +
            "\tcontent: 'a{color:black;}\"\"\\'\\'\"\\n\\n\\na{color:black}\';\n" +
            "}");

        //lead-in whitespace determines base-indent.
        // lead-in newlines are stripped.
        t("\n\na, img {padding: 0.2px}", "a,\nimg {\n\tpadding: 0.2px\n}");
        t("   a, img {padding: 0.2px}", "   a,\n   img {\n   \tpadding: 0.2px\n   }");
        t(" \t \na, img {padding: 0.2px}", " \t a,\n \t img {\n \t \tpadding: 0.2px\n \t }");
        t("\n\n     a, img {padding: 0.2px}", "a,\nimg {\n\tpadding: 0.2px\n}");

        // comments
        t("/* test */", "/* test */");
        t(".tabs{/* test */}", ".tabs {\n\t/* test */\n}");
        t("/* header */.tabs {}", "/* header */\n\n.tabs {}");
        t("/* header", "/* header");
        t("// comment", "// comment");
        t(".selector1 {\n\tmargin: 0; /* This is a comment including an url http://domain.com/path/to/file.ext */\n}",
            ".selector1 {\n\tmargin: 0;\n\t/* This is a comment including an url http://domain.com/path/to/file.ext */\n}")

        //single line comment support (less/sass)
        t(".tabs{\n// comment\nwidth:10px;\n}", ".tabs {\n\t// comment\n\twidth: 10px;\n}");
        t(".tabs{// comment\nwidth:10px;\n}", ".tabs {\n\t// comment\n\twidth: 10px;\n}");
        t("//comment\n.tabs{width:10px;}", "//comment\n.tabs {\n\twidth: 10px;\n}");
        t(".tabs{//comment\n//2nd single line comment\nwidth:10px;}", ".tabs {\n\t//comment\n\t//2nd single line comment\n\twidth: 10px;\n}");
        t(".tabs{width:10px;//end of line comment\n}", ".tabs {\n\twidth: 10px; //end of line comment\n}");
        t(".tabs{width:10px;//end of line comment\nheight:10px;}", ".tabs {\n\twidth: 10px; //end of line comment\n\theight: 10px;\n}");
        t(".tabs{width:10px;//end of line comment\nheight:10px;//another\n}", ".tabs {\n\twidth: 10px; //end of line comment\n\theight: 10px; //another\n}");

        // separate selectors
        t("#bla, #foo{color:red}", "#bla,\n#foo {\n\tcolor: red\n}");
        t("a, img {padding: 0.2px}", "a,\nimg {\n\tpadding: 0.2px\n}");

        // block nesting
        t("#foo {\n\tbackground-image: url(foo@2x.png);\n\t@font-face {\n\t\tfont-family: 'Bitstream Vera Serif Bold';\n\t\tsrc: url('http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf');\n\t}\n}");
        t("@media screen {\n\t#foo:hover {\n\t\tbackground-image: url(foo@2x.png);\n\t}\n\t@font-face {\n\t\tfont-family: 'Bitstream Vera Serif Bold';\n\t\tsrc: url('http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf');\n\t}\n}");
/*
@font-face {
    font-family: 'Bitstream Vera Serif Bold';
    src: url('http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf');
}
@media screen {
    #foo:hover {
        background-image: url(foo.png);
    }
    @media screen and (min-device-pixel-ratio: 2) {
        @font-face {
            font-family: 'Helvetica Neue'
        }
        #foo:hover {
            background-image: url(foo@2x.png);
        }
    }
}
*/
        t("@font-face {\n\tfont-family: 'Bitstream Vera Serif Bold';\n\tsrc: url('http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf');\n}\n@media screen {\n\t#foo:hover {\n\t\tbackground-image: url(foo.png);\n\t}\n\t@media screen and (min-device-pixel-ratio: 2) {\n\t\t@font-face {\n\t\t\tfont-family: 'Helvetica Neue'\n\t\t}\n\t\t#foo:hover {\n\t\t\tbackground-image: url(foo@2x.png);\n\t\t}\n\t}\n}");

        // less-css cases
        t('.well{@well-bg:@bg-color;@well-fg:@fg-color;}','.well {\n\t@well-bg: @bg-color;\n\t@well-fg: @fg-color;\n}');
        t('.well {&.active {\nbox-shadow: 0 1px 1px @border-color, 1px 0 1px @border-color;}}',
            '.well {\n' +
            '\t&.active {\n' +
            '\t\tbox-shadow: 0 1px 1px @border-color, 1px 0 1px @border-color;\n' +
            '\t}\n' +
            '}');
        t('a {\n' +
            '\tcolor: blue;\n' +
            '\t&:hover {\n' +
            '\t\tcolor: green;\n' +
            '\t}\n' +
            '\t& & &&&.active {\n' +
            '\t\tcolor: green;\n' +
            '\t}\n' +
            '}');

        // Not sure if this is sensible
        // but I believe it is correct to not remove the space in "&: hover".
        t('a {\n' +
            '\t&: hover {\n' +
            '\t\tcolor: green;\n' +
            '\t}\n' +
            '}');

        // import
        t('@import "test";');

        // don't break nested pseudo-classes
        t("a:first-child{color:red;div:first-child{color:black;}}",
            "a:first-child {\n\tcolor: red;\n\tdiv:first-child {\n\t\tcolor: black;\n\t}\n}");

        t("a:first-child,a:first-child{color:red;div:first-child,div:hover{color:black;}}",
            "a:first-child,\na:first-child {\n\tcolor: red;\n\tdiv:first-child, div:hover {\n\t\tcolor: black;\n\t}\n}");

        // handle SASS/LESS parent reference
        t("div{&:first-letter {text-transform: uppercase;}}",
            "div {\n\t&:first-letter {\n\t\ttext-transform: uppercase;\n\t}\n}");

        //nested modifiers (&:hover etc)
        t(".tabs{&:hover{width:10px;}}", ".tabs {\n\t&:hover {\n\t\twidth: 10px;\n\t}\n}");
        t(".tabs{&.big{width:10px;}}", ".tabs {\n\t&.big {\n\t\twidth: 10px;\n\t}\n}");
        t(".tabs{&>big{width:10px;}}", ".tabs {\n\t&>big {\n\t\twidth: 10px;\n\t}\n}");
        t(".tabs{&+.big{width:10px;}}", ".tabs {\n\t&+.big {\n\t\twidth: 10px;\n\t}\n}");

        //nested rules
        t(".tabs{.child{width:10px;}}", ".tabs {\n\t.child {\n\t\twidth: 10px;\n\t}\n}");

        //variables
        t("@myvar:10px;.tabs{width:10px;}", "@myvar: 10px;\n.tabs {\n\twidth: 10px;\n}");
        t("@myvar:10px; .tabs{width:10px;}", "@myvar: 10px;\n.tabs {\n\twidth: 10px;\n}");

        // test options
        opts.indent_size = 2;
        opts.indent_char = ' ';
        opts.selector_separator_newline = false;

        t("#bla, #foo{color:green}", "#bla, #foo {\n  color: green\n}");
        t("@media print {.tab{}}", "@media print {\n  .tab {}\n}");
        t("@media print {.tab,.bat{}}", "@media print {\n  .tab, .bat {}\n}");
        t("#bla, #foo{color:black}", "#bla, #foo {\n  color: black\n}");

        // pseudo-classes and pseudo-elements
        t("#foo:hover {\n  background-image: url(foo@2x.png)\n}");
        t("#foo *:hover {\n  color: purple\n}");
        t("::selection {\n  color: #ff0000;\n}");

        // TODO: don't break nested pseduo-classes
        t("@media screen {.tab,.bat:hover {color:red}}", "@media screen {\n  .tab, .bat:hover {\n    color: red\n  }\n}");

        // particular edge case with braces and semicolons inside tags that allows custom text
        t("a:not(\"foobar\\\";{}omg\"){\ncontent: 'example\\';{} text';\ncontent: \"example\\\";{} text\";}",
            "a:not(\"foobar\\\";{}omg\") {\n  content: 'example\\';{} text';\n  content: \"example\\\";{} text\";\n}");

        // may not eat the space before "["
        t('html.js [data-custom="123"] {\n  opacity: 1.00;\n}');
        t('html.js *[data-custom="123"] {\n  opacity: 1.00;\n}');
    }

    beautifier_tests();
}

if (typeof exports !== "undefined") {
    exports.run_css_tests = run_css_tests;
}
//== js/test/beautify-css-tests.js end


//== js/test/beautify-html-tests.js
/*global js_beautify: true */

function run_html_tests(test_obj, Urlencoded, js_beautify, html_beautify, css_beautify)
{

    var opts = {
        indent_size: 4,
        indent_char: ' ',
        preserve_newlines: true,
        jslint_happy: false,
        keep_array_indentation: false,
        brace_style: 'collapse',
        space_before_conditional: true,
        break_chained_methods: false,
        selector_separator: '\n',
        end_with_newline: false
    };

    function test_html_beautifier(input)
    {
        return html_beautify(input, opts);
    }

    var sanitytest;

    // test the input on beautifier with the current flag settings
    // does not check the indentation / surroundings as bt() does
    function test_fragment(input, expected)
    {
        expected = expected || expected === '' ? expected : input;
        sanitytest.expect(input, expected);
        // if the expected is different from input, run it again
        // expected output should be unchanged when run twice.
        if (expected !== input) {
            sanitytest.expect(expected, expected);
        }
    }

    // test html
    function bth(input, expectation)
    {
        var wrapped_input, wrapped_expectation, field_input, field_expectation;

        expectation = expectation || expectation === '' ? expectation : input;
        sanitytest.test_function(test_html_beautifier, 'html_beautify');
        test_fragment(input, expectation);

        if (opts.indent_size === 4 && input) {
            wrapped_input = '<div>\n' + input.replace(/^(.+)$/mg, '    $1') + '\n    <span>inline</span>\n</div>';
            wrapped_expectation = '<div>\n' + expectation.replace(/^(.+)$/mg, '    $1') + '\n    <span>inline</span>\n</div>';
            if (opts.end_with_newline) {
                wrapped_expectation += '\n';
            }
            test_fragment(wrapped_input, wrapped_expectation);
        }

        // Test that handlebars non-block {{}} tags act as content and do not
        // get any spacing or line breaks.
        if (input.indexOf('content') != -1) {
            // Just {{field}}
            field_input = input.replace(/content/g, '{{field}}');
            field_expectation = expectation.replace(/content/g, '{{field}}');
            test_fragment(field_input, field_expectation);

            // handlebars comment
            field_input = input.replace(/content/g, '{{! comment}}');
            field_expectation = expectation.replace(/content/g, '{{! comment}}');
            test_fragment(field_input, field_expectation);

            // mixed {{field}} and content
            field_input = input.replace(/content/g, 'pre{{field1}} {{field2}} {{field3}}post');
            field_expectation = expectation.replace(/content/g, 'pre{{field1}} {{field2}} {{field3}}post');
            test_fragment(field_input, field_expectation);
        }
    }

    function unicode_char(value) {
        return String.fromCharCode(value)
    }

    function beautifier_tests()
    {
        sanitytest = test_obj;

        bth('');

        opts.indent_size = 4;
        opts.indent_char = ' ';
        opts.preserve_newlines = true;
        opts.jslint_happy = false;
        opts.keep_array_indentation = false;
        opts.brace_style = 'collapse';

        // End With Newline - (eof = "\n")
        opts.end_with_newline = true;
        test_fragment('', '\n');
        test_fragment('<div></div>', '<div></div>\n');
        test_fragment('\n');

        // End With Newline - (eof = "")
        opts.end_with_newline = false;
        test_fragment('');
        test_fragment('<div></div>');
        test_fragment('\n', '');

        // New Test Suite

        opts.end_with_newline = true;
        test_fragment('', '\n');
        test_fragment('<div></div>\n');
        test_fragment('<div></div>\n\n\n', '<div></div>\n');
        test_fragment('<head>\n' +
            '    <script>\n' +
            '        mocha.setup("bdd");\n' +
            '\n' +
            '    </script>\n' +
            '</head>\n');


        opts.end_with_newline = false;
        // error cases need love too
        bth('<img title="Bad food!" src="foo.jpg" alt="Evil" ">');
        bth("<!-- don't blow up if a comment is not complete"); // -->

        test_fragment(
            '<head>\n' +
            '    <script>\n' +
            '        mocha.setup("bdd");\n' +
            '    </script>\n' +
            '</head>');

        test_fragment('<div></div>\n', '<div></div>');
        bth('<div></div>');
        bth('<div>content</div>');
        bth('<div><div></div></div>',
            '<div>\n' +
            '    <div></div>\n' +
            '</div>');
        bth('<div><div>content</div></div>',
            '<div>\n' +
            '    <div>content</div>\n' +
            '</div>');
        bth('<div>\n' +
            '    <span>content</span>\n' +
            '</div>');
        bth('<div>\n' +
            '</div>');
        bth('<div>\n' +
            '    content\n' +
            '</div>');
        bth('<div>\n' +
            '    </div>',
            '<div>\n' +
            '</div>');
        bth('    <div>\n' +
            '    </div>',
            '<div>\n' +
            '</div>');
        bth('<div>\n' +
            '</div>\n' +
            '    <div>\n' +
            '    </div>',
            '<div>\n' +
            '</div>\n' +
            '<div>\n' +
            '</div>');
        bth('    <div>\n' +
            '</div>',
            '<div>\n' +
            '</div>');
        bth('<div        >content</div>',
            '<div>content</div>');
        bth('<div     thinger="preserve  space  here"   ></div  >',
            '<div thinger="preserve  space  here"></div>');
        bth('content\n' +
            '    <div>\n' +
            '    </div>\n' +
            'content',
            'content\n' +
            '<div>\n' +
            '</div>\n' +
            'content');
        bth('<li>\n' +
            '    <div>\n' +
            '    </div>\n' +
            '</li>');
        bth('<li>\n' +
            '<div>\n' +
            '</div>\n' +
            '</li>',
            '<li>\n' +
            '    <div>\n' +
            '    </div>\n' +
            '</li>');
        bth('<li>\n' +
            '    content\n' +
            '</li>\n' +
            '<li>\n' +
            '    content\n' +
            '</li>');

        bth('<img>content');
        bth('<img> content');
        bth('<img>   content', '<img> content');

        bth('<img><img>content');
        bth('<img> <img>content');
        bth('<img>   <img>content', '<img> <img>content');

        bth('<img><b>content</b>');
        bth('<img> <b>content</b>');
        bth('<img>   <b>content</b>', '<img> <b>content</b>');

        bth('<div>content<img>content</div>');
        bth('<div> content <img> content</div>');
        bth('<div>    content <img>    content </div>',
            '<div> content <img> content </div>');
        bth('Text <a href="#">Link</a> Text');


        // START tests for issue 453
        bth('<script type="text/unknown"><div></div></script>',
            '<script type="text/unknown">\n' +
            '    <div></div>\n' +
            '</script>');
        bth('<script type="text/javascript"><div></div></script>',
            '<script type="text/javascript">\n' +
            '    < div > < /div>\n' +
            '</script>');
        bth('<script><div></div></script>',
            '<script>\n' +
            '    < div > < /div>\n' +
            '</script>');
        bth('<script type="text/javascript">var foo = "bar";</script>',
            '<script type="text/javascript">\n' +
            '    var foo = "bar";\n' +
            '</script>');
        bth('<script type="application/javascript">var foo = "bar";</script>',
            '<script type="application/javascript">\n' +
            '    var foo = "bar";\n' +
            '</script>');
        bth('<script type="application/javascript;version=1.8">var foo = "bar";</script>',
            '<script type="application/javascript;version=1.8">\n' +
            '    var foo = "bar";\n' +
            '</script>');
        bth('<script type="application/x-javascript">var foo = "bar";</script>',
            '<script type="application/x-javascript">\n' +
            '    var foo = "bar";\n' +
            '</script>');
        bth('<script type="application/ecmascript">var foo = "bar";</script>',
            '<script type="application/ecmascript">\n' +
            '    var foo = "bar";\n' +
            '</script>');
        bth('<script type="text/javascript1.5">var foo = "bar";</script>',
            '<script type="text/javascript1.5">\n' +
            '    var foo = "bar";\n' +
            '</script>');
        bth('<script>var foo = "bar";</script>',
            '<script>\n' +
            '    var foo = "bar";\n' +
            '</script>');

        bth('<style type="text/unknown"><tag></tag></style>',
            '<style type="text/unknown">\n' +
            '    <tag></tag>\n' +
            '</style>');
        bth('<style type="text/css"><tag></tag></style>',
            '<style type="text/css">\n' +
            '    <tag></tag>\n' +
            '</style>');
        bth('<style><tag></tag></style>',
            '<style>\n' +
            '    <tag></tag>\n' +
            '</style>');
        bth('<style type="text/css">.selector {font-size:12px;}</style>',
            '<style type="text/css">\n' +
            '    .selector {\n' +
            '        font-size: 12px;\n' +
            '    }\n'+
            '</style>');
        bth('<style>.selector {font-size:12px;}</style>',
            '<style>\n' +
            '    .selector {\n' +
            '        font-size: 12px;\n' +
            '    }\n'+
            '</style>');
        // END tests for issue 453

        var unformatted = opts.unformatted;
        opts.unformatted = ['script', 'style'];
        bth('<script id="javascriptTemplate" type="text/x-kendo-template">\n' +
            '  <ul>\n' +
            '  # for (var i = 0; i < data.length; i++) { #\n' +
            '    <li>#= data[i] #</li>\n' +
            '  # } #\n' +
            '  </ul>\n' +
            '</script>');
        bth('<style>\n' +
            '  body {background-color:lightgrey}\n' +
            '  h1   {color:blue}\n' +
            '</style>');
        opts.unformatted = unformatted;

        unformatted = opts.unformatted;
        opts.unformatted = ['custom-element'];
        test_fragment('<div>should <custom-element>not</custom-element>' +
                      ' insert newlines</div>',
                      '<div>should <custom-element>not</custom-element>' +
                      ' insert newlines</div>');
        opts.unformatted = unformatted;

        // Tests that don't pass, but probably should.
        // bth('<div><span>content</span></div>');

        // Handlebars tests
        // Without the indent option on, handlebars are treated as content.
        opts.indent_handlebars = false;
        bth('{{#if 0}}\n' +
            '    <div>\n' +
            '    </div>\n' +
            '{{/if}}',
            '{{#if 0}}\n' +
            '<div>\n' +
            '</div>\n' +
            '{{/if}}');
        bth('<div>\n' +
            '{{#each thing}}\n' +
            '    {{name}}\n' +
            '{{/each}}\n' +
            '</div>',
            '<div>\n' +
            '    {{#each thing}} {{name}} {{/each}}\n' +
            '</div>');

        opts.indent_handlebars = true;
        bth('{{#if 0}}{{/if}}');
        bth('{{#if 0}}content{{/if}}');
        bth('{{#if 0}}\n' +
            '{{/if}}');
        bth('{{#if     words}}{{/if}}',
            '{{#if words}}{{/if}}');
        bth('{{#if     words}}content{{/if}}',
            '{{#if words}}content{{/if}}');
        bth('{{#if     words}}content{{/if}}',
            '{{#if words}}content{{/if}}');
        bth('{{#if 1}}\n' +
            '    <div>\n' +
            '    </div>\n' +
            '{{/if}}');
        bth('{{#if 1}}\n' +
            '<div>\n' +
            '</div>\n' +
            '{{/if}}',
            '{{#if 1}}\n' +
            '    <div>\n' +
            '    </div>\n' +
            '{{/if}}');
        bth('<div>\n' +
            '    {{#if 1}}\n' +
            '    {{/if}}\n' +
            '</div>');
        bth('<div>\n' +
            '{{#if 1}}\n' +
            '{{/if}}\n' +
            '</div>',
            '<div>\n' +
            '    {{#if 1}}\n' +
            '    {{/if}}\n' +
            '</div>');
        bth('{{#if}}\n' +
            '{{#each}}\n' +
            '{{#if}}\n' +
            'content\n' +
            '{{/if}}\n' +
            '{{#if}}\n' +
            'content\n' +
            '{{/if}}\n' +
            '{{/each}}\n' +
            '{{/if}}',
            '{{#if}}\n' +
            '    {{#each}}\n' +
            '        {{#if}}\n' +
            '            content\n' +
            '        {{/if}}\n' +
            '        {{#if}}\n' +
            '            content\n' +
            '        {{/if}}\n' +
            '    {{/each}}\n' +
            '{{/if}}');
        bth('{{#if 1}}\n' +
            '    <div>\n' +
            '    </div>\n' +
            '{{/if}}');

        // Test {{else}} aligned with {{#if}} and {{/if}}
        bth('{{#if 1}}\n' +
            '    content\n' +
            '    {{else}}\n' +
            '    content\n' +
            '{{/if}}',
            '{{#if 1}}\n' +
            '    content\n' +
            '{{else}}\n' +
            '    content\n' +
            '{{/if}}');
        bth('{{#if 1}}\n' +
            '    {{else}}\n' +
            '    {{/if}}',
            '{{#if 1}}\n' +
            '{{else}}\n' +
            '{{/if}}');
        bth('{{#if thing}}\n' +
            '{{#if otherthing}}\n' +
            '    content\n' +
            '    {{else}}\n' +
            'content\n' +
            '    {{/if}}\n' +
            '       {{else}}\n'+
            'content\n' +
            '{{/if}}',
            '{{#if thing}}\n' +
            '    {{#if otherthing}}\n' +
            '        content\n' +
            '    {{else}}\n' +
            '        content\n' +
            '    {{/if}}\n' +
            '{{else}}\n'+
            '    content\n' +
            '{{/if}}');

        // Test {{}} inside of <> tags, which should be separated by spaces
        // for readability, unless they are inside a string.
        bth('<div{{somestyle}}></div>',
            '<div {{somestyle}}></div>');
        bth('<div{{#if test}}class="foo"{{/if}}>content</div>',
            '<div {{#if test}} class="foo" {{/if}}>content</div>');
        bth('<div{{#if thing}}{{somestyle}}class="{{class}}"{{else}}class="{{class2}}"{{/if}}>content</div>',
            '<div {{#if thing}} {{somestyle}} class="{{class}}" {{else}} class="{{class2}}" {{/if}}>content</div>');
        bth('<span{{#if condition}}class="foo"{{/if}}>content</span>',
            '<span {{#if condition}} class="foo" {{/if}}>content</span>');
        bth('<div unformatted="{{#if}}content{{/if}}">content</div>');
        bth('<div unformatted="{{#if  }}    content{{/if}}">content</div>');

        // Quotes found inside of Handlebars expressions inside of quoted
        // strings themselves should not be considered string delimiters.
        bth('<div class="{{#if thingIs "value"}}content{{/if}}"></div>');
        bth('<div class="{{#if thingIs \'value\'}}content{{/if}}"></div>');
        bth('<div class=\'{{#if thingIs "value"}}content{{/if}}\'></div>');
        bth('<div class=\'{{#if thingIs \'value\'}}content{{/if}}\'></div>');

        opts.wrap_line_length = 0;
        //...---------1---------2---------3---------4---------5---------6---------7
        //...1234567890123456789012345678901234567890123456789012345678901234567890
        bth('<div>Some text that should not wrap at all.</div>',
            /* expected */
            '<div>Some text that should not wrap at all.</div>');

        // A value of 0 means no max line length, and should not wrap.
        //...---------1---------2---------3---------4---------5---------6---------7---------8---------9--------10--------11--------12--------13--------14--------15--------16--------17--------18--------19--------20--------21--------22--------23--------24--------25--------26--------27--------28--------29
        //...12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
        bth('<div>Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all.</div>',
            /* expected */
            '<div>Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all.</div>');

        opts.wrap_line_length = "0";
        //...---------1---------2---------3---------4---------5---------6---------7
        //...1234567890123456789012345678901234567890123456789012345678901234567890
        bth('<div>Some text that should not wrap at all.</div>',
            /* expected */
            '<div>Some text that should not wrap at all.</div>');

        // A value of "0" means no max line length, and should not wrap
        //...---------1---------2---------3---------4---------5---------6---------7---------8---------9--------10--------11--------12--------13--------14--------15--------16--------17--------18--------19--------20--------21--------22--------23--------24--------25--------26--------27--------28--------29
        //...12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
        bth('<div>Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all.</div>',
            /* expected */
            '<div>Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all. Some text that should not wrap at all.</div>');

        //BUGBUG: This should wrap before 40 not after.
        opts.wrap_line_length = 40;
        //...---------1---------2---------3---------4---------5---------6---------7
        //...1234567890123456789012345678901234567890123456789012345678901234567890
        bth('<div>Some test text that should wrap_inside_this section here.</div>',
            /* expected */
            '<div>Some test text that should wrap_inside_this\n' +
            '    section here.</div>');

        opts.wrap_line_length = "40";
        //...---------1---------2---------3---------4---------5---------6---------7
        //...1234567890123456789012345678901234567890123456789012345678901234567890
        bth('<div>Some test text that should wrap_inside_this section here.</div>',
            /* expected */
            '<div>Some test text that should wrap_inside_this\n' +
            '    section here.</div>');

        opts.indent_size = 1;
        opts.indent_char = '\t';
        opts.preserve_newlines = false;
        bth('<div>\n\tfoo\n</div>', '<div> foo </div>');

        opts.preserve_newlines = true;
        bth('<div>\n\tfoo\n</div>');



        // test preserve_newlines and max_preserve_newlines
        opts.preserve_newlines = false;
        bth('<div>Should not</div>\n\n\n' +
            '<div>preserve newlines</div>',
            '<div>Should not</div>\n' +
            '<div>preserve newlines</div>');

        opts.preserve_newlines = true;
        opts.max_preserve_newlines  = 0;
        bth('<div>Should</div>\n\n\n' +
            '<div>preserve zero newlines</div>',
            '<div>Should</div>\n' +
            '<div>preserve zero newlines</div>');

        opts.max_preserve_newlines  = 1;
        bth('<div>Should</div>\n\n\n' +
            '<div>preserve one newline</div>',
            '<div>Should</div>\n\n' +
            '<div>preserve one newline</div>');

        opts.max_preserve_newlines  = null;
        bth('<div>Should</div>\n\n\n' +
            '<div>preserve one newline</div>',
            '<div>Should</div>\n\n\n' +
            '<div>preserve one newline</div>');
    }

    beautifier_tests();
}

if (typeof exports !== "undefined") {
    exports.run_html_tests = run_html_tests;
}
//== js/test/beautify-html-tests.js end


//== js/test/sanitytest.js
//
// simple testing interface
// written by Einar Lielmanis, einar@jsbeautifier.org
//
// usage:
//
// var t = new SanityTest(function (x) { return x; }, 'my function');
// t.expect('input', 'output');
// t.expect('a', 'a');
// output_somewhere(t.results()); // good for <pre>, html safe-ish
// alert(t.results_raw());        // html unescaped


function SanityTest (func, name_of_test) {

    var test_func = func || function (x) {
        return x;
    };

    var test_name = name_of_test || '';

    var n_failed = 0;
    var n_succeeded = 0;

    var failures = [];

    this.test_function = function(func, name) {
        test_func = func;
        test_name = name || '';
    };

    this.get_exitcode = function() {
        return n_succeeded === 0 || n_failed !== 0 ? 1 : 0;
    };

    this.expect = function(parameters, expected_value) {
        // multi-parameter calls not supported (I don't need them now).
        var result = test_func(parameters);
        // proper array checking is a pain. i'll maybe do it later, compare strings representations instead
        if ((result === expected_value) || (expected_value instanceof Array && result.join(', ') == expected_value.join(', '))) {
            n_succeeded += 1;
        } else {
            n_failed += 1;
            failures.push([test_name, parameters, expected_value, result]);
        }
    };


    this.results_raw = function() {
        var results = '';
        if (n_failed === 0) {
            if (n_succeeded === 0) {
                results = 'No tests run.';
            } else {
                results = _localize("All %S tests passed.").replace("%S", n_succeeded);
            }
        } else {
            for (var i = 0 ; i < failures.length; i++) {
                var f = failures[i];
                if (f[0]) {
                    f[0] = f[0] + ' ';
                }
                results += '---- ' + f[0] + 'input -------\n' + this.prettyprint(f[1]) + '\n';
                results += '---- ' + f[0] + 'expected ----\n' + this.prettyprint(f[2]) + '\n';
                results += '---- ' + f[0] + 'output ------\n' + this.prettyprint(f[3]) + '\n\n';

            }
            results += n_failed + ' tests failed.\n';
        }
        return results;
    };


    this.results = function() {
        return this.lazy_escape(this.results_raw());
    };


    this.prettyprint = function(something, quote_strings) {
        var type = typeof something;
        switch(type.toLowerCase()) {
        case 'string':
            if (quote_strings) {
                return "'" + something.replace("'", "\\'") + "'";
            } else {
                return something;
            }
        case 'number':
            return '' + something;
        case 'boolean':
            return something ? 'true' : 'false';
        case 'undefined':
            return 'undefined';
        case 'object':
            if (something instanceof Array) {
                var x = [];
                var expected_index = 0;
                for (var k in something) {
                    if (k == expected_index) {
                        x.push(this.prettyprint(something[k], true));
                        expected_index += 1;
                    } else {
                        x.push('\n' + k + ': ' + this.prettyprint(something[k], true));
                    }
                }
                return '[' + x.join(', ') + ']';
            } else {
                return 'object: ' + something;
            }
        default:
            return type + ': ' + something;
        }
    };


    this.lazy_escape = function (str) {
        return str.replace(/</g, '&lt;').replace(/\>/g, '&gt;').replace(/\n/g, '<br />');
    };


    this.log = function () {
        if (window.console) {
            if (console.firebug) {
                console.log.apply(console, Array.prototype.slice.call(arguments));
            } else {
                console.log.call(console, Array.prototype.slice.call(arguments));
            }
        }
    };

}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SanityTest;
}
//== js/test/sanitytest.js end


//== AkelPad integration
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

for(var p in window) {
	// See http://akelpad.sourceforge.net/forum/viewtopic.php?p=19660#19660
	var _orig = eval("typeof " + p + ' == "undefined" ? undefined : ' + p + ";");
	var _new = window[p];
	if(_new === _orig)
		continue;
	if(_orig !== undefined && _new !== undefined) {
		AkelPad.MessageBox(
			hMainWnd,
			'Warning, "' + p + '" variable will be overridden!',
			WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/
		);
	}
	eval(p + " = _new;");
}

if(typeof AkelPad.IsInclude == "undefined" || !AkelPad.IsInclude())
	handleArgs();

function handleArgs() {
	if(!hMainWnd)
		return;
	if(update)
		selfUpdate();
	else
		beautifyAkelEdit();
}
function beautifyAkelEdit() {
	var res;
	if(!test) {
		var newLine = 2; //"\n"
		var src = AkelPad.GetSelText(newLine);
		if(!src && !onlySelected) {
			var selectAll = true;
			src = AkelPad.GetTextRange(0, -1, newLine);
		}
		if(!AkelPad.IsAkelEdit())
			src = src.replace(/\r/g, "\n");
	}
	if(test || !src) {
		res = runTests();
		var icon = /tests failed/.test(res) ? 48 /*MB_ICONEXCLAMATION*/ : 64 /*MB_ICONINFORMATION*/;
		AkelPad.MessageBox(hMainWnd, res, WScript.ScriptName, icon);
	}
	else {
		if(action == ACT_INSERT)
			var lpFrameTarget = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);

		if(
			selectAll
			&& (action == ACT_INSERT || action == ACT_INSERT_NEW_DOC)
			&& restoreCaretPos
		) {
			var selStart = AkelPad.GetTextRange(0, AkelPad.GetSelStart())
				.replace(/\s+/g, "");
		}

		if(beautifyCSS) {
			var srcCSS = "<style>\n" + src + "\n</style>";
			indentScripts = "separate";
			var syntax = { value: "css" };
			res = (beautify(srcCSS) || "")
				.replace(/^\s*<style>\n?/, "")
				.replace(/\n?<\/style>\s*$/, "");
		}
		else {
			var syntax = { value: undefined };
			res = beautify(src, syntax);
		}

		if(action == ACT_INSERT) {
			if(lpFrameTarget && lpFrameTarget != AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0))
				AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameTarget);
		}
		if(res) {
			if(action == ACT_INSERT && res != src) {
				if(AkelPad.GetEditReadOnly(hWndEdit))
					action = ACT_INSERT_NEW_DOC;
				else {
					insertNoScroll(res, selectAll, getCaretPos(res, selStart));
					setSyntax(syntax.value);
				}
			}
			if(action == ACT_INSERT_NEW_DOC) {
				AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
				AkelPad.SetSel(0, 0);
				insertNoScroll(res, true, getCaretPos(res, selStart));
				setSyntax(syntax.value);
			}
			if(action == ACT_COPY && res != AkelPad.GetClipboardText())
				AkelPad.SetClipboardText(res);
			if(action == ACT_SHOW)
				AkelPad.MessageBox(hMainWnd, res.substr(0, 3000), WScript.ScriptName, 64 /*MB_ICONINFORMATION*/);
		}
	}
}

function convertSource(file, text) {
	text = text
		.replace(/\r\n?|\n\r?/g, "\r\n")
		.replace(/[ \t]+([\n\r]|$)/g, "$1");
	if(file == "js/lib/beautify.js") {
		text = text
			.replace(".substr(-esc2)", ".slice(-esc2)")
			.replace("token_text[token_text.length - 1]", "token_text.charAt(token_text.length - 1)")
			.replace("&& flags.whitespace_before.length", "&& flags.whitespace_before && flags.whitespace_before.length");
	}
	else if(file == "js/lib/beautify-html.js") {
		text = text
			.replace(/tag_complete\[(\d+)\]/g, "tag_complete.charAt($1)")
			.replace(
				"comment[comment.length - 1] === delimiter[delimiter.length - 1]",
				"comment.charAt(comment.length - 1) === delimiter.charAt(delimiter.length - 1)"
			)
			.replace(
				"content.length && content[content.length - 2]",
				"content.length && content.charAt(content.length - 2)"
			)
			.replace(
				"text.length > 1 && text[text.length - 1]",
				"text.length > 1 && text.charAt(text.length - 1)"
			);
	}
	else if(file == "js/lib/beautify-css.js") {
		text = text.replace(
			"variableOrRule[variableOrRule.length -1]",
			"variableOrRule.charAt(variableOrRule.length - 1)"
		);
	}
	else if(file == "js/test/sanitytest.js") {
		text = text.replace(
			"results = 'All ' + n_succeeded + ' tests passed.';",
			'results = _localize("All %S tests passed.").replace("%S", n_succeeded);'
		);
	}
	return text;
}
function selfUpdate() {
	var baseUrl = update == 2
		? "https://raw.githubusercontent.com/beautify-web/js-beautify/gh-pages/"
		: "https://raw.githubusercontent.com/beautify-web/js-beautify/master/";
	var sourceUrl = update == 2
		? "https://github.com/beautify-web/js-beautify/tree/gh-pages"
		: "https://github.com/beautify-web/js-beautify/tree/master";
	var rssUrl = update == 2
		? "https://github.com/beautify-web/js-beautify/commits/gh-pages.atom"
		: "https://github.com/beautify-web/js-beautify/commits/master.atom";
	var data = {
		"js/lib/beautify.js": "",
		"js/lib/beautify-css.js": "",
		"js/lib/beautify-html.js": "",
		"js/lib/unpackers/javascriptobfuscator_unpacker.js": "",
		"js/lib/unpackers/myobfuscate_unpacker.js": "",
		"js/lib/unpackers/p_a_c_k_e_r_unpacker.js": "",
		"js/lib/unpackers/urlencode_unpacker.js": "",
		"js/test/beautify-javascript-tests.js": "",
		"js/test/beautify-css-tests.js": "",
		"js/test/beautify-html-tests.js": "",
		"js/test/sanitytest.js": ""
	};

	var startTime = new Date().getTime();

	var errors = [];
	var noCache = forceNoCache ? "?" + startTime : "";
	var request = new ActiveXObject("Microsoft.XMLHTTP");
	for(var file in data) {
		var url = baseUrl + file;
		request.open("GET", url + noCache, false);
		request.send(null);
		if(request.status != 200) {
			errors[errors.length] = "Can't download file: " + url + ", status: " + request.status;
			continue;
		}
		//WScript.Echo(request.getResponseHeader("Last-Modified"));
		var text = request.responseText
			.replace(/^\s+|\s+$/g, "");
		if(!text)
			errors[errors.length] = "Empty file: " + url;
		else
			data[file] = convertSource(file, text);
	}
	if(errors.length)
		AkelPad.MessageBox(hMainWnd, _localize("Download errors:\n") + errors.join("\n"), WScript.ScriptBaseName, 16 /*MB_ICONERROR*/);
	else
		onComplete();

	function onComplete() {
		var selfCode = AkelPad.ReadFile(WScript.ScriptFullName, 0, 65001, 1)
			.replace(/\r\n?|\n\r?/g, "\r\n");
		var selfCodeOld = selfCode;
		for(var file in data) {
			var start = "\r\n//== " + file + "\r\n";
			var end = "\r\n//== " + file + " end\r\n";
			var indexStart = selfCode.indexOf(start);
			var indexEnd = selfCode.indexOf(end);
			if(indexStart == -1 || indexEnd == -1) {
				AkelPad.MessageBox(hMainWnd, _localize("Not found:\n") + start + end, WScript.ScriptBaseName, 48 /*MB_ICONEXCLAMATION*/);
				continue;
			}
			selfCode = selfCode.substr(0, indexStart + start.length)
				+ data[file]
				+ selfCode.substr(indexEnd);
		}
		var noRealChanges = selfCode == selfCodeOld;
		selfCode = selfCode.replace(
			/(\r\n?|\n)\/\/+ *\[built from http\S+ [^\n\r]+\](\r\n?|\n)/,
			"$1// [built from " + sourceUrl + " " + date() + "]$2"
		);
		if(selfCode == selfCodeOld) {
			AkelPad.MessageBox(hMainWnd, _localize("Already updated!"), WScript.ScriptBaseName, 64 /*MB_ICONINFORMATION*/);
			return;
		}
		if(noRealChanges)
			AkelPad.MessageBox(hMainWnd, _localize("No real changes, only updated header information"), WScript.ScriptBaseName, 64 /*MB_ICONINFORMATION*/);

		// Create backup
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		fso.CopyFile(WScript.ScriptFullName, WScript.ScriptFullName.slice(0, -3) + ts() + ".js.bak", true);

		AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
		AkelPad.SetSel(0, -1);
		AkelPad.ReplaceSel(selfCode);
		AkelPad.Command(4184); // IDM_EDIT_NEWLINE_WIN
		AkelPad.SetSel(0, 0);
		AkelPad.SaveFile(AkelPad.GetEditWnd(), WScript.ScriptFullName, 65001, 1);
	}

	function ts() {
		var d = new Date();
		return "_" + d.getFullYear()   + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
		     + "_" + pad(d.getHours()) + "-" + pad(d.getMinutes())   + "-" + pad(d.getSeconds());
	}
	function date() {
		request.open("GET", rssUrl + noCache, false);
		request.send(null);
		var text = request.responseText;
		if(/<updated>(\d{4})-(\d+)-(\d+)T(\d+):(\d+):(\d+)-(\d+):(\d+)<\/updated>/.test(text)) {
			var r = RegExp;
			var d = new Date(Date.UTC(+r.$1, +r.$2 - 1, +r.$3, +r.$4 + +r.$7, +r.$5 + +r.$8, +r.$6));
		}
		else {
			var d = new Date();
		}

		return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate())
			+ " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds())
			+ " UTC";
	}
	function pad(n) {
		return n > 9 ? n : "0" + n;
	}
}

function setSyntax(ext) {
	if(!setSyntaxMode)
		return;
	var alias = getCoderAlias().toLowerCase();
	if(setSyntaxMode == 1) {
		if(alias)
			return;
	}
	else if(setSyntaxMode == 2) {
		var curType = getSyntaxType(alias);
		var newType = getSyntaxType("." + ext);
		if(curType == newType)
			return;
	}

	if(
		ext && (
			AkelPad.IsPluginRunning("Coder::HighLight")
			|| AkelPad.IsPluginRunning("Coder::AutoComplete")
			|| AkelPad.IsPluginRunning("Coder::CodeFold")
		)
	)
		AkelPad.Call("Coder::Settings", 1, ext);
}
function getSyntaxType(alias) {
	if(alias == ".css")
		return "css";
	if(/\.([xs]?html?|mht(ml)?|hta|asp|xml|axl|dxl|fb2|kml|manifest|msc|ndl|rdf|rss|svg|user|wsdl|xaml|xmp|xsd|xslt?|xul|resx|v[cbd]proj|csproj|wx[ils]|wixobj|wixout|wixlib|wixpdb|wixmsp|wixmst)$/.test(alias))
		return "html";
	if(/\.(jsm?|json|php|c|cpp|h|java|as|cs)$/.test(alias))
		return "js";
	return "";
}
function getCoderAlias() {
	if(
		!AkelPad.IsPluginRunning("Coder::HighLight")
		&& !AkelPad.IsPluginRunning("Coder::CodeFold")
		&& !AkelPad.IsPluginRunning("Coder::AutoComplete")
	)
		return "";
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=19363#19363
	var hWndEdit = AkelPad.GetEditWnd();
	var hDocEdit = AkelPad.GetEditDoc();
	var pAlias = "";
	if(hWndEdit && hDocEdit) {
		var lpAlias = AkelPad.MemAlloc(256 * 2 /*sizeof(wchar_t)*/);
		if(lpAlias) {
			AkelPad.CallW("Coder::Settings", 18 /*DLLA_CODER_GETALIAS*/, hWndEdit, hDocEdit, lpAlias, 0);
			pAlias = AkelPad.MemRead(lpAlias, 1 /*DT_UNICODE*/);
			AkelPad.MemFree(lpAlias);
		}
	}
	return pAlias;
}

function getCaretPos(newStr, oldSelStart) {
	if(oldSelStart == undefined)
		return undefined;
	if(!newStr || !oldSelStart)
		//return 0;
		return "1:1";
	var pos = 0;
	var posStop = oldSelStart.length;
	var line = 1;
	var col = 1;
	for(var i = 0, l = newStr.length; i < l; ++i) {
		var chr = newStr.charAt(i);
		if(chr != "\n")
			++col;
		else {
			++line;
			col = 1;
		}
		if(/^\s$/.test(chr))
			continue;
		var oldChr = oldSelStart.charAt(pos);
		if(chr != oldChr)
			break;
		if(++pos == posStop)
			//return i + 1;
			return line + ":" + col;
	}
	return undefined;
}
function insertNoScroll(str, selectAll, caretPos) {
	var hWndEdit = AkelPad.GetEditWnd();

	var saveScrollPos = caretPos == undefined;
	if(saveScrollPos)
		var nFirstLine = saveLineScroll(hWndEdit);
	else
		setRedraw(hWndEdit, false);

	if(selectAll)
		AkelPad.SetSel(0, -1);
	AkelPad.ReplaceSel(str, saveScrollPos);

	if(saveScrollPos)
		restoreLineScroll(hWndEdit, nFirstLine);
	else {
		setRedraw(hWndEdit, true); // Should be here to correctly redraw caret
		//AkelPad.SetSel(caretPos, caretPos);
		AkelPad.SendMessage(hMainWnd, 1204 /*AKD_GOTO*/, 0x1 /*GT_LINE*/, AkelPad.MemStrPtr(caretPos));
	}
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}

// From Instructor's SearchReplace.js
function saveLineScroll(hWnd)
{
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, false, 0);
	return AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0);
}
function restoreLineScroll(hWnd, nBeforeLine)
{
	if (AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0) != nBeforeLine)
	{
		var lpScrollPos;
		var nPosY=AkelPad.SendMessage(hWnd, 3198 /*AEM_VPOSFROMLINE*/, 0 /*AECT_GLOBAL*/, nBeforeLine);

		if (lpScrollPos=AkelPad.MemAlloc(_X64?16:8 /*sizeof(POINT64)*/))
		{
			AkelPad.MemCopy(lpScrollPos + 0 /*offsetof(POINT64, x)*/, -1, 2 /*DT_QWORD*/);
			AkelPad.MemCopy(lpScrollPos + (_X64?8:4) /*offsetof(POINT64, y)*/, nPosY, 2 /*DT_QWORD*/);
			AkelPad.SendMessage(hWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpScrollPos);
			AkelPad.MemFree(lpScrollPos);
		}
	}
	AkelPad.SendMessage(hWnd, 3377 /*AEM_UPDATECARET*/, 0, 0);
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, true, 0);
	oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}

function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; ++i)
		if(/^[-\/](\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
			args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
	getArg = function(argName, defaultVal) {
		argName = argName.toLowerCase();
		return typeof args[argName] == "undefined" // argName in args
			? defaultVal
			: args[argName];
	};
	getArg._args = args;
	return getArg(argName, defaultVal);
}