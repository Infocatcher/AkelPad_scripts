// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11246#11246
// http://infocatcher.ucoz.net/js/akelpad_scripts/jsBeautifier.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/jsBeautifier.js

// (c) Infocatcher 2011-2013
// version 0.2.4 - 2013-05-03
// Based on scripts from http://jsbeautifier.org/ [2013-05-02 20:02:42 UTC]

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
//   -keepArrayIndentation=true   - keep array indentation
//   -breakChainedMethods=false   - break lines on chained methods
//   -jsLintHappy=true            - use "function ()" instead of "function()"
//   -spaceBeforeConditional=true - space before conditional: "if(x)" / "if (x)"
//   -indentScripts="keep"        - HTML <style>, <script> formatting: keep indent level of the tag
//                 ="normal"      - add one indent level
//                 ="separate"    - separate indentation
//   -unescapeStrings=true        - unescape printable \xNN characters in strings ("example" vs "\x65\x78\x61\x6d\x70\x6c\x65")
//   -wrapLineLength=70           - lines should wrap at next opportunity after this number of characters
//   -e4x=true                    - handle E4X XML literals
//   -maxChar=70                  - maximum amount of characters per line (only for HTML)
//   -unformattedTags=["a"]       - list of tags, that shouldn't be reformatted (only for HTML)
//   -detectPackers=true          - detect packers
//   -css=true                    - force beautify CSS (just automatically wrap code into <style>...</style>)
//   -update=1                    - update source from https://github.com/einars/js-beautify/
//          =2                    - update source from https://github.com/einars/js-beautify/tree/gh-pages
//   -forceNoCache                - prevent caching during update
//   -test                        - force run the tests

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
var jsLintHappy            = getArg("jsLintHappy", false);
var spaceBeforeConditional = getArg("spaceBeforeConditional", false);
var indentScripts          = getArg("indentScripts", "normal");
var unescapeStrings        = getArg("unescapeStrings"); // Will use jsBeautifier defaults
var wrapLineLength         = getArg("wrapLineLength");
var e4x                    = getArg("e4x");
var maxChar                = getArg("maxChar"); // Will use jsBeautifier defaults
var unformattedTags        = getArg("unformattedTags"); // Will use jsBeautifier defaults
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
		jslint_happy:             jsLintHappy,
		space_before_conditional: spaceBeforeConditional,
		indent_scripts:           indentScripts,
		unescape_strings:         unescapeStrings,
		wrap_line_length:         wrapLineLength,
		e4x:                      e4x,
		// for style_html():
		max_char:                 maxChar,
		unformatted:              unformattedTags
	};

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
	run_beautifier_tests(st, Urlencoded, js_beautify);
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

            jslint_happy   !jslint_happy
            ---------------------------------
             function ()      function()

    brace_style (default "collapse") - "collapse" | "expand" | "end-expand"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line.

    space_before_conditional (default true) - should the space before conditional statement be added, "if(true)" vs "if (true)",

    unescape_strings (default false) - should printable characters in strings encoded in \xNN notation be unescaped, "example" vs "\x65\x78\x61\x6d\x70\x6c\x65"

    wrap_line_length (default unlimited) - lines should wrap at next opportunity after this number of characters.
          NOTE: This is not a hard limit. Lines will continue until a point where a newline would
                be preserved if it were present.

    e.g

    js_beautify(js_source_text, {
      'indent_size': 1,
      'indent_char': '\t'
    });

*/


(function() {
    function js_beautify(js_source_text, options) {
        "use strict";
        var beautifier = new Beautifier(js_source_text, options);
        return beautifier.beautify();
    }

    function Beautifier(js_source_text, options) {
        "use strict";
        var input, output, token_text, token_type, last_type, last_last_text, indent_string;
        var flags, previous_flags, flag_store;
        var whitespace, wordchar, punct, parser_pos, line_starters, digits;
        var prefix;
        var input_wanted_newline;
        var output_wrapped, output_space_before_token;
        var input_length, n_newlines, whitespace_before_token;
        var handlers, MODE, opt;
        var preindent_string = '';

        whitespace = "\n\r\t ".split('');
        wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split('');
        digits = '0123456789'.split('');

        punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |= ::';
        punct += ' <%= <% %> <?= <? ?>'; // try to be a good boy and try not to break the markup language identifiers
        punct = punct.split(' ');

        // words which should always start on new line.
        line_starters = 'continue,try,throw,return,var,if,switch,case,default,for,while,break,function'.split(',');

        MODE = {
            BlockStatement: 'BlockStatement', // 'BLOCK'
            Statement: 'Statement', // 'STATEMENT'
            ObjectLiteral: 'ObjectLiteral', // 'OBJECT',
            ArrayLiteral: 'ArrayLiteral', //'[EXPRESSION]',
            ForInitializer: 'ForInitializer', //'(FOR-EXPRESSION)',
            Conditional: 'Conditional', //'(COND-EXPRESSION)',
            Expression: 'Expression' //'(EXPRESSION)'
        };

        handlers = {
            'TK_START_EXPR': handle_start_expr,
            'TK_END_EXPR': handle_end_expr,
            'TK_START_BLOCK': handle_start_block,
            'TK_END_BLOCK': handle_end_block,
            'TK_WORD': handle_word,
            'TK_SEMICOLON': handle_semicolon,
            'TK_STRING': handle_string,
            'TK_EQUALS': handle_equals,
            'TK_OPERATOR': handle_operator,
            'TK_COMMA': handle_comma,
            'TK_BLOCK_COMMENT': handle_block_comment,
            'TK_INLINE_COMMENT': handle_inline_comment,
            'TK_COMMENT': handle_comment,
            'TK_DOT': handle_dot,
            'TK_UNKNOWN': handle_unknown
        };

        function create_flags(flags_base, mode) {
            return {
                mode: mode,
                last_text: flags_base ? flags_base.last_text : '', // last token text
                last_word: flags_base ? flags_base.last_word : '', // last 'TK_WORD' passed
                var_line: false,
                var_line_tainted: false,
                var_line_reindented: false,
                in_html_comment: false,
                multiline_array: false,
                if_block: false,
                do_block: false,
                do_while: false,
                in_case_statement: false, // switch(..){ INSIDE HERE }
                in_case: false, // we're on the exact line with "case 0:"
                case_body: false, // the indented case-action block
                indentation_level: (flags_base ? flags_base.indentation_level + ((flags_base.var_line && flags_base.var_line_reindented) ? 1 : 0) : 0),
                ternary_depth: 0
            };
        }

        // Some interpreters have unexpected results with foo = baz || bar;
        options = options ? options : {};
        opt = {};

        // compatibility
        if (options.space_after_anon_function !== undefined && options.jslint_happy === undefined) {
            options.jslint_happy = options.space_after_anon_function;
        }
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
        opt.jslint_happy = (options.jslint_happy === undefined) ? false : options.jslint_happy;
        opt.keep_array_indentation = (options.keep_array_indentation === undefined) ? false : options.keep_array_indentation;
        opt.space_before_conditional= (options.space_before_conditional === undefined) ? true : options.space_before_conditional;
        opt.unescape_strings = (options.unescape_strings === undefined) ? false : options.unescape_strings;
        opt.wrap_line_length = (options.wrap_line_length === undefined) ? 0 : parseInt(options.wrap_line_length, 10);
        opt.e4x = (options.e4x === undefined) ? false : options.e4x;


        //----------------------------------
        indent_string = '';
        while (opt.indent_size > 0) {
            indent_string += opt.indent_char;
            opt.indent_size -= 1;
        }

        while (js_source_text && (js_source_text.charAt(0) === ' ' || js_source_text.charAt(0) === '\t')) {
            preindent_string += js_source_text.charAt(0);
            js_source_text = js_source_text.substring(1);
        }
        input = js_source_text;
        // cache the source's length.
        input_length = js_source_text.length;

        last_type = 'TK_START_BLOCK'; // last token type
        last_last_text = ''; // pre-last token text
        output = [];
        output_wrapped = false;
        output_space_before_token = false;
        whitespace_before_token = [];

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

        parser_pos = 0;

        this.beautify = function () {
            /*jshint onevar:true */
            var t, i, keep_whitespace, sweet_code;

            while (true) {
                t = get_next_token();
                token_text = t[0];
                token_type = t[1];

                if (token_type === 'TK_EOF') {
                    break;
                }

                keep_whitespace = opt.keep_array_indentation && is_array(flags.mode);

                if (keep_whitespace) {
                    for (i = 0; i < n_newlines; i += 1) {
                        print_newline(true);
                    }
                } else {
                    input_wanted_newline = n_newlines > 0;
                    if (opt.max_preserve_newlines && n_newlines > opt.max_preserve_newlines) {
                        n_newlines = opt.max_preserve_newlines;
                    }

                    if (opt.preserve_newlines) {
                        if (n_newlines > 1) {
                            print_newline();
                            for (i = 1; i < n_newlines; i += 1) {
                                print_newline(true);
                            }
                        }
                    }
                }

                handlers[token_type]();

                // The cleanest handling of inline comments is to treat them as though they aren't there.
                // Just continue formatting and the behavior should be logical.
                // Also ignore unknown tokens.  Again, this should result in better behavior.
                if (token_type !== 'TK_INLINE_COMMENT' && token_type !== 'TK_COMMENT' &&
                    token_type !== 'TK_UNKNOWN') {
                    last_last_text = flags.last_text;
                    last_type = token_type;
                    flags.last_text = token_text;
                }
            }

            sweet_code = preindent_string + output.join('').replace(/[\r\n ]+$/, '');
            return sweet_code;
        };

        function trim_output(eat_newlines) {
            eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;
            while (output.length && (output[output.length - 1] === ' ' || output[output.length - 1] === indent_string || output[output.length - 1] === preindent_string || (eat_newlines && (output[output.length - 1] === '\n' || output[output.length - 1] === '\r')))) {
                output.pop();
            }
        }

        function trim(s) {
            return s.replace(/^\s\s*|\s\s*$/, '');
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

        function just_added_newline() {
            return output.length && output[output.length - 1] === "\n";
        }

        function _last_index_of(arr, find) {
            var i = arr.length - 1;
            if (i < 0) {
                i += arr.length;
            }
            if (i > arr.length - 1) {
                i = arr.length - 1;
            }
            for (i++; i-- > 0;) {
                if (i in arr && arr[i] === find) {
                    return i;
                }
            }
            return -1;
        }

        function allow_wrap_or_preserved_newline(force_linewrap) {
            force_linewrap = (force_linewrap === undefined) ? false : force_linewrap;
            if (opt.wrap_line_length && !force_linewrap) {
                var current_line = '';
                var proposed_line_length = 0;
                var start_line = _last_index_of(output, '\n') + 1;
                // never wrap the first token of a line.
                if (start_line < output.length) {
                    current_line = output.slice(start_line).join('');
                    proposed_line_length = current_line.length + token_text.length +
                        (output_space_before_token ? 1 : 0);
                    if (proposed_line_length >= opt.wrap_line_length) {
                        force_linewrap = true;
                    }
                }
            }
            if (((opt.preserve_newlines && input_wanted_newline) || force_linewrap) && !just_added_newline()) {
                print_newline(false, true);
                output_wrapped = true;
                input_wanted_newline = false;
            }
        }

        function print_newline(force_newline, preserve_statement_flags) {
            output_wrapped = false;
            output_space_before_token = false;

            if (!preserve_statement_flags) {
                if  (flags.last_text !== ';') {
                    while (flags.mode === MODE.Statement && !flags.if_block) {
                        restore_mode();
                    }
                }
            }

            if (flags.mode === MODE.ArrayLiteral) {
                flags.multiline_array = true;
            }


            if (!output.length) {
                return; // no newline on start of file
            }

            if (force_newline || !just_added_newline()) {
                output.push("\n");
            }
        }

        function print_token_line_indentation() {
            if (just_added_newline()) {
                if (opt.keep_array_indentation && is_array(flags.mode) && whitespace_before_token.length) {
                    output.push(whitespace_before_token.join('') + '');
                } else {
                    if (preindent_string) {
                        output.push(preindent_string);
                    }

                    print_indent_string(flags.indentation_level);
                    print_indent_string(flags.var_line && flags.var_line_reindented);
                    print_indent_string(output_wrapped);
                }
            }
        }

        function print_indent_string(level) {
            if (level === undefined) {
                level = 1;
            } else if (typeof level !== 'number') {
                level = level ? 1 : 0;
            }

            // Never indent your first output indent at the start of the file
            if (flags.last_text !== '') {
                for (var i = 0; i < level; i += 1) {
                    output.push(indent_string);
                }
            }
        }

        function print_token_space_before() {
            if (output_space_before_token && output.length) {
                var last_output = output[output.length - 1];
                if (!just_added_newline() && last_output !== ' ' && last_output !== indent_string) { // prevent occassional duplicate space
                    output.push(' ');
                }
            }
        }

        function print_token(printable_token) {
            printable_token = printable_token || token_text;
            print_token_line_indentation();
            output_wrapped = false;
            print_token_space_before();
            output_space_before_token = false;
            output.push(printable_token);
        }

        function indent() {
            flags.indentation_level += 1;
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
            }
        }

        function start_of_statement() {
            if (
             (flags.last_text === 'do' ||
                 (flags.last_text === 'else' && token_text !== 'if') ||
                (last_type === 'TK_END_EXPR' && (previous_flags.mode === MODE.ForInitializer || previous_flags.mode === MODE.Conditional)))) {
                allow_wrap_or_preserved_newline();
                set_mode(MODE.Statement);
                indent();
                output_wrapped = false;
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

        function is_special_word(word) {
            return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
        }

        function in_array(what, arr) {
            for (var i = 0; i < arr.length; i += 1) {
                if (arr[i] === what) {
                    return true;
                }
            }
            return false;
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

        function is_next(find) {
            var local_pos = parser_pos;
            var c = input.charAt(local_pos);
            while (in_array(c, whitespace) && c !== find) {
                local_pos++;
                if (local_pos >= input_length) {
                    return false;
                }
                c = input.charAt(local_pos);
            }
            return c === find;
        }

        function get_next_token() {
            var i, resulting_string;

            n_newlines = 0;

            if (parser_pos >= input_length) {
                return ['', 'TK_EOF'];
            }

            input_wanted_newline = false;
            whitespace_before_token = [];

            var c = input.charAt(parser_pos);
            parser_pos += 1;

            while (in_array(c, whitespace)) {

                if (c === '\n') {
                    n_newlines += 1;
                    whitespace_before_token = [];
                } else if (n_newlines) {
                    if (c === indent_string) {
                        whitespace_before_token.push(indent_string);
                    } else if (c !== '\r') {
                        whitespace_before_token.push(' ');
                    }
                }

                if (parser_pos >= input_length) {
                    return ['', 'TK_EOF'];
                }

                c = input.charAt(parser_pos);
                parser_pos += 1;
            }

            if (in_array(c, wordchar)) {
                if (parser_pos < input_length) {
                    while (in_array(input.charAt(parser_pos), wordchar)) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos === input_length) {
                            break;
                        }
                    }
                }

                // small and surprisingly unugly hack for 1E-10 representation
                if (parser_pos !== input_length && c.match(/^[0-9]+[Ee]$/) && (input.charAt(parser_pos) === '-' || input.charAt(parser_pos) === '+')) {

                    var sign = input.charAt(parser_pos);
                    parser_pos += 1;

                    var t = get_next_token();
                    c += sign + t[0];
                    return [c, 'TK_WORD'];
                }

                if (c === 'in') { // hack for 'in' operator
                    return [c, 'TK_OPERATOR'];
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


            if (c === "'" || c === '"' || // string
                (
                    (c === '/') || // regexp
                    (opt.e4x && c ==="<" && input.slice(parser_pos - 1).match(/^<[a-zA-Z:0-9]+\s*([a-zA-Z:0-9]+="[^"]*"\s*)*\/?\s*>/)) // xml
                ) && ( // regex and xml can only appear in specific locations during parsing
                    (last_type === 'TK_WORD' && is_special_word (flags.last_text)) ||
                    (last_type === 'TK_END_EXPR' && in_array(previous_flags.mode, [MODE.Conditional, MODE.ForInitializer])) ||
                    (in_array(last_type, ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK',
                    'TK_END_BLOCK', 'TK_OPERATOR', 'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON', 'TK_COMMA']))
                )) {

                var sep = c,
                    esc = false,
                    has_char_escapes = false;

                resulting_string = c;

                if (parser_pos < input_length) {
                    if (sep === '/') {
                        //
                        // handle regexp
                        //
                        var in_char_class = false;
                        while (esc || in_char_class || input.charAt(parser_pos) !== sep) {
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
                            if (parser_pos >= input_length) {
                                // incomplete string/rexp when end-of-file reached.
                                // bail out with what had been received so far.
                                return [resulting_string, 'TK_STRING'];
                            }
                        }
                    } else if (opt.e4x && sep === '<') {
                        //
                        // handle e4x xml literals
                        //
                        var xmlRegExp = /<(\/?)([a-zA-Z:0-9]+)\s*([a-zA-Z:0-9]+="[^"]*"\s*)*(\/?)\s*>/g;
                        var xmlStr = input.slice(parser_pos - 1);
                        var match = xmlRegExp.exec(xmlStr);
                        if (match && match.index === 0) {
                            var rootTag = match[2];
                            var depth = 0;
                            while (match) {
                                var isEndTag = !! match[1];
                                var tagName = match[2];
                                var isSingletonTag = !! match[match.length - 1];
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
                        while (esc || input.charAt(parser_pos) !== sep) {
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
                            if (parser_pos >= input_length) {
                                // incomplete string/rexp when end-of-file reached.
                                // bail out with what had been received so far.
                                return [resulting_string, 'TK_STRING'];
                            }
                        }

                    }
                }

                parser_pos += 1;
                resulting_string += sep;

                if (has_char_escapes && opt.unescape_strings) {
                    resulting_string = unescape_string(resulting_string);
                }

                if (sep === '/') {
                    // regexps may have modifiers /regexp/MOD , so fetch those, too
                    while (parser_pos < input_length && in_array(input.charAt(parser_pos), wordchar)) {
                        resulting_string += input.charAt(parser_pos);
                        parser_pos += 1;
                    }
                }
                return [resulting_string, 'TK_STRING'];
            }

            if (c === '#') {


                if (output.length === 0 && input.charAt(parser_pos) === '!') {
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
                if (parser_pos < input_length && in_array(input.charAt(parser_pos), digits)) {
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
                flags.in_html_comment = true;
                return [c, 'TK_COMMENT'];
            }

            if (c === '-' && flags.in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
                flags.in_html_comment = false;
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

        function handle_start_expr() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            }

            if (token_text === '[') {

                if (last_type === 'TK_WORD' || flags.last_text === ')') {
                    // this is array index specifier, break immediately
                    // a[x], fn()[x]
                    if (in_array (flags.last_text, line_starters)) {
                        output_space_before_token = true;
                    }
                    set_mode(MODE.Expression);
                    print_token();
                    if (opt.space_in_paren) {
                        output_space_before_token = true;
                    }
                    return;
                }

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
                if  (flags.last_text === 'for') {
                    set_mode(MODE.ForInitializer);
                } else if (in_array (flags.last_text, ['if', 'while'])) {
                    set_mode(MODE.Conditional);
                } else {
                    set_mode(MODE.Expression);
                }
            }

            if  (flags.last_text === ';' || last_type === 'TK_START_BLOCK') {
                print_newline();
            } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || flags.last_text === '.') {
                if (input_wanted_newline) {
                    print_newline();
                }
                // do nothing on (( and )( and ][ and ]( and .(
            } else if (last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                output_space_before_token = true;
            } else if (flags.last_word === 'function' || flags.last_word === 'typeof') {
                // function() vs function ()
                if (opt.jslint_happy) {
                    output_space_before_token = true;
                }
            } else if (in_array (flags.last_text, line_starters) || flags.last_text === 'catch') {
                if (opt.space_before_conditional) {
                    output_space_before_token = true;
                }
            }

            // Support of this kind of newline preservation.
            // a = (b &&
            //     (c || d));
            if (token_text === '(') {
                if (last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                    if (flags.mode !== MODE.ObjectLiteral) {
                        allow_wrap_or_preserved_newline();
                    }
                }
            }
            print_token();
            if (opt.space_in_paren) {
                    output_space_before_token = true;
            }
            if (token_text === '[') {
                set_mode(MODE.ArrayLiteral);
                indent();
            }
        }

        function handle_end_expr() {
            // statements inside expressions are not valid syntax, but...
            // statements must all be closed when their container closes
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }

            if (token_text === ']' && is_array(flags.mode) && flags.multiline_array && !opt.keep_array_indentation) {
                print_newline();
            }
            restore_mode();
            if (opt.space_in_paren) {
                    output_space_before_token = true;
            }
            print_token();

            // do {} while () // no statement required after
            if (flags.do_while && previous_flags.mode === MODE.Conditional) {
                previous_flags.mode = MODE.Expression;
                flags.do_block = false;
                flags.do_while = false;

            }
        }

        function handle_start_block() {
            set_mode(MODE.BlockStatement);

            var empty_braces = is_next('}');
            var empty_anonymous_function = empty_braces && flags.last_word === 'function' &&
                last_type === 'TK_END_EXPR';

            if (opt.brace_style === "expand") {
                if (last_type !== 'TK_OPERATOR' &&
                    (empty_anonymous_function ||
                        last_type === 'TK_EQUALS' ||
                        (is_special_word (flags.last_text) && flags.last_text !== 'else'))) {
                        output_space_before_token = true;
                } else {
                    print_newline();
                }
            } else { // collapse
                if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                    if (last_type === 'TK_START_BLOCK') {
                        print_newline();
                    } else {
                        output_space_before_token = true;
                    }
                } else {
                    // if TK_OPERATOR or TK_START_EXPR
                    if (is_array(previous_flags.mode) && flags.last_text === ',') {
                        if (last_last_text === '}') {
                            // }, { in array context
                            output_space_before_token = true;
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
            restore_mode();
            var empty_braces = last_type === 'TK_START_BLOCK';

            if (opt.brace_style === "expand") {
                if  (!empty_braces) {
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
            print_token();
        }

        function handle_word() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            } else if (input_wanted_newline && !is_expression(flags.mode) &&
                (last_type !== 'TK_OPERATOR' || (flags.last_text === '--' || flags.last_text === '++')) &&
                last_type !== 'TK_EQUALS' &&
                (opt.preserve_newlines || flags.last_text !== 'var')) {

                print_newline();
            }

            if (flags.do_block && !flags.do_while) {
                if (token_text === 'while') {
                    // do {} ## while ()
                    output_space_before_token = true;
                    print_token();
                    output_space_before_token = true;
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
                if (token_text !== 'else') {
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }
                    flags.if_block = false;
                }
            }

            if (token_text === 'function') {
                if (flags.var_line && last_type !== 'TK_EQUALS') {
                    flags.var_line_reindented = true;
                }
                if ((just_added_newline() || flags.last_text === ';') && flags.last_text !== '{' &&
                    !is_array(flags.mode)) {
                    // make sure there is a nice clean space of at least one blank line
                    // before a new function definition, except in arrays
                    n_newlines = just_added_newline() ? n_newlines : 0;
                    if (!opt.preserve_newlines) {
                        n_newlines = 1;
                    }

                    for (var i = 0; i < 2 - n_newlines; i++) {
                        print_newline(true);
                    }
                }
                if (last_type === 'TK_WORD') {
                    if  (flags.last_text === 'get' || flags.last_text === 'set' || flags.last_text === 'new' || flags.last_text === 'return') {
                        output_space_before_token = true;
                    } else {
                        print_newline();
                    }
                } else if (last_type === 'TK_OPERATOR' || flags.last_text === '=') {
                    // foo = function
                    output_space_before_token = true;
                } else if (is_expression(flags.mode)) {
                    // (function
                } else {
                    print_newline();
                }

                print_token();
                flags.last_word = token_text;
                return;
            }

            if (token_text === 'case' || (token_text === 'default' && flags.in_case_statement)) {
                print_newline();
                if (flags.case_body || opt.jslint_happy) {
                    // switch cases following one another
                    flags.indentation_level--;
                    flags.case_body = false;
                }
                print_token();
                flags.in_case = true;
                flags.in_case_statement = true;
                return;
            }

            prefix = 'NONE';

            if (last_type === 'TK_END_BLOCK') {
                if (!in_array(token_text, ['else', 'catch', 'finally'])) {
                    prefix = 'NEWLINE';
                } else {
                    if (opt.brace_style === "expand" || opt.brace_style === "end-expand") {
                        prefix = 'NEWLINE';
                    } else {
                        prefix = 'SPACE';
                        output_space_before_token = true;
                    }
                }
            } else if (last_type === 'TK_SEMICOLON' && flags.mode === MODE.BlockStatement) {
                // TODO: Should this be for STATEMENT as well?
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
                prefix = 'SPACE';
            } else if (last_type === 'TK_STRING') {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_WORD') {
                prefix = 'SPACE';
            } else if (last_type === 'TK_START_BLOCK') {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_END_EXPR') {
                output_space_before_token = true;
                prefix = 'NEWLINE';
            }

            if (in_array(token_text, line_starters) && flags.last_text !== ')') {
                if  (flags.last_text === 'else') {
                    prefix = 'SPACE';
                } else {
                    prefix = 'NEWLINE';
                }

            }

            if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (flags.mode !== MODE.ObjectLiteral) {
                    allow_wrap_or_preserved_newline();
                }
            }

            if (in_array(token_text, ['else', 'catch', 'finally'])) {
                if (last_type !== 'TK_END_BLOCK' || opt.brace_style === "expand" || opt.brace_style === "end-expand") {
                    print_newline();
                } else {
                    trim_output(true);
                    // If we trimmed and there's something other than a close block before us
                    // put a newline back in.  Handles '} // comment' scenario.
                    if (output[output.length - 1] !== '}') {
                        print_newline();
                    }
                    output_space_before_token = true;
                }
            } else if (prefix === 'NEWLINE') {
                if (is_special_word (flags.last_text)) {
                    // no newline between 'return nnn'
                    output_space_before_token = true;
                } else if (last_type !== 'TK_END_EXPR') {
                    if ((last_type !== 'TK_START_EXPR' || token_text !== 'var') && flags.last_text !== ':') {
                        // no need to force newline on 'var': for (var x = 0...)
                        if (token_text === 'if' && flags.last_word === 'else' && flags.last_text !== '{') {
                            // no newline for } else if {
                            output_space_before_token = true;
                        } else {
                            flags.var_line = false;
                            flags.var_line_reindented = false;
                            print_newline();
                        }
                    }
                } else if (in_array(token_text, line_starters) && flags.last_text !== ')') {
                    flags.var_line = false;
                    flags.var_line_reindented = false;
                    print_newline();
                }
            } else if (is_array(flags.mode) && flags.last_text === ',' && last_last_text === '}') {
                print_newline(); // }, in lists get a newline treatment
            } else if (prefix === 'SPACE') {
                output_space_before_token = true;
            }
            print_token();
            flags.last_word = token_text;

            if (token_text === 'var') {
                flags.var_line = true;
                flags.var_line_reindented = false;
                flags.var_line_tainted = false;
            }

            if (token_text === 'do') {
                flags.do_block = true;
            }

            if (token_text === 'if') {
                flags.if_block = true;
            }
        }

        function handle_semicolon() {
            while (flags.mode === MODE.Statement && !flags.if_block) {
                restore_mode();
            }
            print_token();
            flags.var_line = false;
            flags.var_line_reindented = false;
            if (flags.mode === MODE.ObjectLiteral) {
                // if we're in OBJECT mode and see a semicolon, its invalid syntax
                // recover back to treating this as a BLOCK
                flags.mode = MODE.BlockStatement;
            }
        }

        function handle_string() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
                // One difference - strings want at least a space before
                output_space_before_token = true;
            } else if (last_type === 'TK_WORD') {
                output_space_before_token = true;
            } else if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (flags.mode !== MODE.ObjectLiteral) {
                    allow_wrap_or_preserved_newline();
                }
            } else {
                print_newline();
            }
            print_token();
        }

        function handle_equals() {
            if (flags.var_line) {
                // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
                flags.var_line_tainted = true;
            }
            output_space_before_token = true;
            print_token();
            output_space_before_token = true;
        }

        function handle_comma() {
            if (flags.var_line) {
                if (is_expression(flags.mode) || last_type === 'TK_END_BLOCK') {
                    // do not break on comma, for(var a = 1, b = 2)
                    flags.var_line_tainted = false;
                }

                if (flags.var_line) {
                    flags.var_line_reindented = true;
                }

                print_token();

                if (flags.var_line_tainted) {
                    flags.var_line_tainted = false;
                    print_newline();
                } else {
                    output_space_before_token = true;
                }
                return;
            }

            if (last_type === 'TK_END_BLOCK' && flags.mode !== MODE.Expression) {
                print_token();
                if (flags.mode === MODE.ObjectLiteral && flags.last_text === '}') {
                    print_newline();
                } else {
                    output_space_before_token = true;
                }
            } else {
                if (flags.mode === MODE.ObjectLiteral) {
                    print_token();
                    print_newline();
                } else {
                    // EXPR or DO_BLOCK
                    print_token();
                    output_space_before_token = true;
                }
            }
        }

        function handle_operator() {
            var space_before = true;
            var space_after = true;
            if (is_special_word (flags.last_text)) {
                // "return" had a special handling in TK_WORD. Now we need to return the favor
                output_space_before_token = true;
                print_token();
                return;
            }

            // hack for actionscript's import .*;
            if (token_text === '*' && last_type === 'TK_DOT' && !last_last_text.match(/^\d+$/)) {
                print_token();
                return;
            }

            if (token_text === ':' && flags.in_case) {
                flags.case_body = true;
                indent();
                print_token();
                print_newline();
                flags.in_case = false;
                return;
            }

            if (token_text === '::') {
                // no spaces around exotic namespacing syntax operator
                print_token();
                return;
            }

            // http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
            // if there is a newline between -- or ++ and anything else we should preserve it.
            if (input_wanted_newline && (token_text === '--' || token_text === '++')) {
                print_newline();
            }

            if (in_array(token_text, ['--', '++', '!']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array (flags.last_text, line_starters) || flags.last_text === ','))) {
                // unary operators (and binary +/- pretending to be unary) special cases

                space_before = false;
                space_after = false;

                if  (flags.last_text === ';' && is_expression(flags.mode)) {
                    // for (;; ++i)
                    //        ^^^
                    space_before = true;
                }

                if (last_type === 'TK_WORD' && in_array (flags.last_text, line_starters)) {
                    space_before = true;
                }

                if ((flags.mode === MODE.BlockStatement || flags.mode === MODE.Statement) &&  (flags.last_text === '{' || flags.last_text === ';')) {
                    // { foo; --i }
                    // foo(); --bar;
                    print_newline();
                }
            } else if (token_text === ':') {
                if (flags.ternary_depth === 0) {
                    if (flags.mode === MODE.BlockStatement) {
                        flags.mode = MODE.ObjectLiteral;
                    }
                    space_before = false;
                } else {
                    flags.ternary_depth -= 1;
                }
            } else if (token_text === '?') {
                flags.ternary_depth += 1;
            }
            output_space_before_token = output_space_before_token || space_before;
            print_token();
            output_space_before_token = space_after;
        }

        function handle_block_comment() {
            var lines = split_newlines(token_text);
            var j; // iterator for this case

            if (all_lines_start_with(lines.slice(1), '*')) {
                // javadoc: reformat and reindent
                print_newline(false, true);
                print_token(lines[0]);
                for (j = 1; j < lines.length; j++) {
                    print_newline(false, true);
                    print_token(' ' + trim(lines[j]));
                }

            } else {

                // simple block comment: leave intact
                if (lines.length > 1) {
                    // multiline comment block starts with a new line
                    print_newline(false, true);
                } else {
                    // single-line /* comment */ stays where it is
                    if (last_type === 'TK_END_BLOCK') {
                        print_newline(false, true);
                    } else {
                        output_space_before_token = true;
                    }

                }

                print_token(lines[0]);
                output.push("\n");
                for (j = 1; j < lines.length; j++) {
                    output.push(lines[j]);
                    output.push("\n");
                }

            }

            if (!is_next('\n')) {
                print_newline(false, true);
            }
        }

        function handle_inline_comment() {
            output_space_before_token = true;
            print_token();
            output_space_before_token = true;
        }

        function handle_comment() {
            if (input_wanted_newline) {
                print_newline(false, true);
            } else {
                trim_output(true);
            }

            output_space_before_token = true;
            print_token();
            print_newline(false, true);
        }

        function handle_dot() {
            if (is_special_word (flags.last_text)) {
                output_space_before_token = true;
            } else {
                // allow preserved newlines before dots in general
                // force newlines on dots after close paren when break_chained - for bar().baz()
                allow_wrap_or_preserved_newline (flags.last_text === ')' && opt.break_chained_methods);
            }

            print_token();
        }

        function handle_unknown() {
            print_token();
            if (token_text.charAt(token_text.length - 1) === '\n') {
                print_newline();
            }
        }
    }


    if (typeof define === "function") {
        // Add support for require.js
        define(function(require, exports, module) {
            exports.js_beautify = js_beautify;
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

    Based on code initially developed by: Einar Lielmanis, <elfz@laacz.lv>
        http://jsbeautifier.org/

    Usage:
        css_beautify(source_text);
        css_beautify(source_text, options);

    The options are:
        indent_size (default 4)          — indentation size,
        indent_char (default space)      — character to indent with,

    e.g

    css_beautify(css_source_text, {
      'indent_size': 1,
      'indent_char': '\t'
    });
*/

// http://www.w3.org/TR/CSS21/syndata.html#tokenization
// http://www.w3.org/TR/css3-syntax/

(function() {
    function css_beautify(source_text, options) {
        options = options || {};
        var indentSize = options.indent_size || 4;
        var indentCharacter = options.indent_char || ' ';

        // compatibility
        if (typeof indentSize === "string") {
            indentSize = parseInt(indentSize, 10);
        }


        // tokenizer
        var whiteRe = /^\s+$/;
        var wordRe = /[\w$\-_]/;

        var pos = -1, ch;
        function next() {
            ch = source_text.charAt(++pos);
            return ch;
        }
        function peek() {
            return source_text.charAt(pos+1);
        }
        function eatString(comma) {
            var start = pos;
            while(next()){
                if (ch === "\\"){
                    next();
                    next();
                } else if (ch === comma) {
                    break;
                } else if (ch === "\n") {
                    break;
                }
            }
            return source_text.substring(start, pos + 1);
        }

        function eatWhitespace() {
            var start = pos;
            while (whiteRe.test(peek())) {
                pos++;
            }
            return pos !== start;
        }

        function skipWhitespace() {
            var start = pos;
            do{
            }while (whiteRe.test(next()));
            return pos !== start + 1;
        }

        function eatComment() {
            var start = pos;
            next();
            while (next()) {
                if (ch === "*" && peek() === "/") {
                    pos ++;
                    break;
                }
            }

            return source_text.substring(start, pos + 1);
        }


        function lookBack(str) {
            return source_text.substring(pos-str.length, pos).toLowerCase() === str;
        }

        // printer
        var indentString = source_text.match(/^[\r\n]*[\t ]*/)[0];
        var singleIndent = Array(indentSize + 1).join(indentCharacter);
        var indentLevel = 0;
        function indent() {
            indentLevel++;
            indentString += singleIndent;
        }
        function outdent() {
            indentLevel--;
            indentString = indentString.slice(0, -indentSize);
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

        print.newLine = function(keepWhitespace) {
            if (!keepWhitespace) {
                while (whiteRe.test(output[output.length - 1])) {
                    output.pop();
                }
            }

            if (output.length) {
                output.push('\n');
            }
            if (indentString) {
                output.push(indentString);
            }
        };
        print.singleSpace = function() {
            if (output.length && !whiteRe.test(output[output.length - 1])) {
                output.push(' ');
            }
        };
        var output = [];
        if (indentString) {
            output.push(indentString);
        }
        /*_____________________--------------------_____________________*/

        while(true) {
            var isAfterSpace = skipWhitespace();

            if (!ch) {
                break;
            }


            if (ch === '{') {
                indent();
                print["{"](ch);
            } else if (ch === '}') {
                outdent();
                print["}"](ch);
            } else if (ch === '"' || ch === '\'') {
                output.push(eatString(ch));
            } else if (ch === ';') {
                output.push(ch, '\n', indentString);
            } else if (ch === '/' && peek() === '*') { // comment
                print.newLine();
                output.push(eatComment(), "\n", indentString);
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
                eatWhitespace();
                output.push(ch);
                print.singleSpace();
            } else if (ch === ']') {
                output.push(ch);
            }  else if (ch === '[' || ch === '=') { // no whitespace before or after
                eatWhitespace();
                output.push(ch);
            } else {
                if (isAfterSpace) {
                    print.singleSpace();
                }

                output.push(ch);
            }
        }


        var sweetCode = output.join('').replace(/[\n ]+$/, '');
        return sweetCode;
    }

    if (typeof define === "function") {
        // Add support for require.js
        define(function(require, exports, module) {
            exports.css_beautify = css_beautify;
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

  Based on code initially developed by: Einar Lielmanis, <elfz@laacz.lv>
    http://jsbeautifier.org/

  Usage:
    style_html(html_source);

    style_html(html_source, options);

  The options are:
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    max_char (default 250)            -  maximum amount of characters per line (0 = disable)
    brace_style (default "collapse") - "collapse" | "expand" | "end-expand"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line.
    unformatted (defaults to inline tags) - list of tags, that shouldn't be reformatted
    indent_scripts (default normal)  - "keep"|"separate"|"normal"

    e.g.

    style_html(html_source, {
      'indent_size': 2,
      'indent_char': ' ',
      'max_char': 78,
      'brace_style': 'expand',
      'unformatted': ['a', 'sub', 'sup', 'b', 'i', 'u']
    });
*/

(function() {

    function style_html(html_source, options, js_beautify, css_beautify) {
    //Wrapper function to invoke all the necessary constructors and deal with the output.

      var multi_parser,
          indent_size,
          indent_character,
          max_char,
          brace_style,
          unformatted;

      options = options || {};
      indent_size = options.indent_size || 4;
      indent_character = options.indent_char || ' ';
      brace_style = options.brace_style || 'collapse';
      max_char = options.max_char === 0 ? Infinity : options.max_char || 250;
      unformatted = options.unformatted || ['a', 'span', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike', 'font', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

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

        this.Utils = { //Uilities made available to the various functions
          whitespace: "\n\r\t ".split(''),
          single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed,?php,?,?='.split(','), //all the single tags for HTML
          extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
          in_array: function (what, arr) {
            for (var i=0; i<arr.length; i++) {
              if (what === arr[i]) {
                return true;
              }
            }
            return false;
          }
        };

        this.get_content = function () { //function to capture regular content between tags

          var input_char = '',
              content = [],
              space = false; //if a space is needed

          while (this.input.charAt(this.pos) !== '<') {
            if (this.pos >= this.input.length) {
              return content.length?content.join(''):['', 'TK_EOF'];
            }

            input_char = this.input.charAt(this.pos);
            this.pos++;
            this.line_char_count++;

            if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
              if (content.length) {
                space = true;
              }
              this.line_char_count--;
              continue; //don't want to insert unnecessary space
            }
            else if (space) {
              if (this.line_char_count >= this.max_char) { //insert a line when the max_char is reached
                content.push('\n');
                for (var i=0; i<this.indent_level; i++) {
                  content.push(this.indent_string);
                }
                this.line_char_count = 0;
              }
              else{
                content.push(' ');
                this.line_char_count++;
              }
              space = false;
            }
            content.push(input_char); //letter at-a-time (or string) inserted to an array
          }
          return content.length?content.join(''):'';
        };

        this.get_contents_to = function (name) { //get the full content of a script or style to pass to js_beautify
          if (this.pos === this.input.length) {
            return ['', 'TK_EOF'];
          }
          var input_char = '';
          var content = '';
          var reg_match = new RegExp('</' + name + '\\s*>', 'igm');
          reg_match.lastIndex = this.pos;
          var reg_array = reg_match.exec(this.input);
          var end_script = reg_array?reg_array.index:this.input.length; //absolute end of script
          if(this.pos < end_script) { //get everything in between the script tags
            content = this.input.substring(this.pos, end_script);
            this.pos = end_script;
          }
          return content;
        };

        this.record_tag = function (tag){ //function to record a tag and its parent in this.tags Object
          if (this.tags[tag + 'count']) { //check for the existence of this tag type
            this.tags[tag + 'count']++;
            this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
          }
          else { //otherwise initialize this tag type
            this.tags[tag + 'count'] = 1;
            this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
          }
          this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
          this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
        };

        this.retrieve_tag = function (tag) { //function to retrieve the opening tag to the corresponding closer
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
            }
            else {
              this.tags[tag + 'count']--;
            }
          }
        };

        this.get_tag = function (peek) { //function to get a full tag and parse its type
          var input_char = '',
              content = [],
              comment = '',
              space = false,
              tag_start, tag_end,
              orig_pos = this.pos,
              orig_line_char_count = this.line_char_count;

          peek = peek !== undefined ? peek : false;

          do {
            if (this.pos >= this.input.length) {
              if (peek) {
                this.pos = orig_pos;
                this.line_char_count = orig_line_char_count;
              }
              return content.length?content.join(''):['', 'TK_EOF'];
            }

            input_char = this.input.charAt(this.pos);
            this.pos++;
            this.line_char_count++;

            if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
              space = true;
              this.line_char_count--;
              continue;
            }

            if (input_char === "'" || input_char === '"') {
              if (!content[1] || content[1] !== '!') { //if we're in a comment strings don't get treated specially
                input_char += this.get_unformatted(input_char);
                space = true;
              }
            }

            if (input_char === '=') { //no space before =
              space = false;
            }

            if (content.length && content[content.length-1] !== '=' && input_char !== '>' && space) {
                //no space after = or before >
              if (this.line_char_count >= this.max_char) {
                this.print_newline(false, content);
                this.line_char_count = 0;
              }
              else {
                content.push(' ');
                this.line_char_count++;
              }
              space = false;
            }
            if (input_char === '<') {
              tag_start = this.pos - 1;
            }
            content.push(input_char); //inserts character at-a-time (or string)
          } while (input_char !== '>');

          var tag_complete = content.join('');
          var tag_index;
          if (tag_complete.indexOf(' ') !== -1) { //if there's whitespace, thats where the tag name ends
            tag_index = tag_complete.indexOf(' ');
          }
          else { //otherwise go with the tag ending
            tag_index = tag_complete.indexOf('>');
          }
          var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
          if (tag_complete.charAt(tag_complete.length-2) === '/' ||
            this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
            if ( ! peek) {
              this.tag_type = 'SINGLE';
            }
          }
          else if (tag_check === 'script') { //for later script handling
            if ( ! peek) {
              this.record_tag(tag_check);
              this.tag_type = 'SCRIPT';
            }
          }
          else if (tag_check === 'style') { //for future style handling (for now it justs uses get_content)
            if ( ! peek) {
              this.record_tag(tag_check);
              this.tag_type = 'STYLE';
            }
          }
          else if (this.is_unformatted(tag_check, unformatted)) { // do not reformat the "unformatted" tags
            comment = this.get_unformatted('</'+tag_check+'>', tag_complete); //...delegate to get_unformatted function
            content.push(comment);
            // Preserve collapsed whitespace either before or after this tag.
            if (tag_start > 0 && this.Utils.in_array(this.input.charAt(tag_start - 1), this.Utils.whitespace)){
                content.splice(0, 0, this.input.charAt(tag_start - 1));
            }
            tag_end = this.pos - 1;
            if (this.Utils.in_array(this.input.charAt(tag_end + 1), this.Utils.whitespace)){
                content.push(this.input.charAt(tag_end + 1));
            }
            this.tag_type = 'SINGLE';
          }
          else if (tag_check.charAt(0) === '!') { //peek for <!-- comment
            if (tag_check.indexOf('[if') !== -1) { //peek for <!--[if conditional comment
              if (tag_complete.indexOf('!IE') !== -1) { //this type needs a closing --> so...
                comment = this.get_unformatted('-->', tag_complete); //...delegate to get_unformatted
                content.push(comment);
              }
              if ( ! peek) {
                this.tag_type = 'START';
              }
            }
            else if (tag_check.indexOf('[endif') !== -1) {//peek for <!--[endif end conditional comment
              this.tag_type = 'END';
              this.unindent();
            }
            else if (tag_check.indexOf('[cdata[') !== -1) { //if it's a <[cdata[ comment...
              comment = this.get_unformatted(']]>', tag_complete); //...delegate to get_unformatted function
              content.push(comment);
              if ( ! peek) {
                this.tag_type = 'SINGLE'; //<![CDATA[ comments are treated like single tags
              }
            }
            else {
              comment = this.get_unformatted('-->', tag_complete);
              content.push(comment);
              this.tag_type = 'SINGLE';
            }
          }
          else if ( ! peek) {
            if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
              this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
              this.tag_type = 'END';
            }
            else { //otherwise it's a start-tag
              this.record_tag(tag_check); //push it on the tag stack
              this.tag_type = 'START';
            }
            if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
              this.print_newline(true, this.output);
            }
          }

          if (peek) {
            this.pos = orig_pos;
            this.line_char_count = orig_line_char_count;
          }

          return content.join(''); //returns fully formatted tag
        };

        this.get_unformatted = function (delimiter, orig_tag) { //function to return unformatted content in its entirety

          if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) !== -1) {
            return '';
          }
          var input_char = '';
          var content = '';
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


          } while (content.toLowerCase().indexOf(delimiter) === -1);
          return content;
        };

        this.get_token = function () { //initial handler for token-retrieval
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
            }
            else {
              return [token, 'TK_CONTENT'];
            }
          }

          if (this.current_mode === 'TAG') {
            token = this.get_tag();
            if (typeof token !== 'string') {
              return token;
            }
            else {
              var tag_name_type = 'TK_TAG_' + this.tag_type;
              return [token, tag_name_type];
            }
          }
        };

        this.get_full_indent = function (level) {
          level = this.indent_level + level || 0;
          if (level < 1) {
            return '';
          }

          return Array(level + 1).join(this.indent_string);
        };

        this.is_unformatted = function(tag_check, unformatted) {
            //is this an HTML5 block-level link?
            if (!this.Utils.in_array(tag_check, unformatted)){
                return false;
            }

            if (tag_check.toLowerCase() !== 'a' || !this.Utils.in_array('a', unformatted)){
                return true;
            }

            //at this point we have an  tag; is its first child something we want to remain
            //unformatted?
            var next_tag = this.get_tag(true /* peek. */);

            // tets next_tag to see if it is just html tag (no external content)
            var tag = (next_tag || "").match(/^\s*<\s*\/?([a-z]*)\s*[^>]*>\s*$/);

            // if next_tag comes back but is not an isolated tag, then
            // let's treat the 'a' tag as having content
            // and respect the unformatted option
            if (!tag || this.Utils.in_array(tag, unformatted)){
                return true;
            } else {
                return false;
            }
        };

        this.printer = function (js_source, indent_character, indent_size, max_char, brace_style) { //handles input/output and some other printing functions

          this.input = js_source || ''; //gets the input for the Parser
          this.output = [];
          this.indent_character = indent_character;
          this.indent_string = '';
          this.indent_size = indent_size;
          this.brace_style = brace_style;
          this.indent_level = 0;
          this.max_char = max_char;
          this.line_char_count = 0; //count to see if max_char was exceeded

          for (var i=0; i<this.indent_size; i++) {
            this.indent_string += this.indent_character;
          }

          this.print_newline = function (ignore, arr) {
            this.line_char_count = 0;
            if (!arr || !arr.length) {
              return;
            }
            if (!ignore) { //we might want the extra line
              while (this.Utils.in_array(arr[arr.length-1], this.Utils.whitespace)) {
                arr.pop();
              }
            }
            arr.push('\n');
            for (var i=0; i<this.indent_level; i++) {
              arr.push(this.indent_string);
            }
          };

          this.print_token = function (text) {
            this.output.push(text);
          };

          this.indent = function () {
            this.indent_level++;
          };

          this.unindent = function () {
            if (this.indent_level > 0) {
              this.indent_level--;
            }
          };
        };
        return this;
      }

      /*_____________________--------------------_____________________*/

      multi_parser = new Parser(); //wrapping functions Parser
      multi_parser.printer(html_source, indent_character, indent_size, max_char, brace_style); //initialize starting values

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
            multi_parser.indent();
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
                var tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length -1].match(/<\s*(\w+)/);
                if (tag_extracted_from_last_output === null || tag_extracted_from_last_output[1] !== tag_name) {
                    multi_parser.print_newline(true, multi_parser.output);
                }
            }
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = 'CONTENT';
            break;
          case 'TK_TAG_SINGLE':
            // Don't add a newline before elements that should remain unformatted.
            var tag_check = multi_parser.token_text.match(/^\s*<([a-z]+)/i);
            if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)){
                multi_parser.print_newline(false, multi_parser.output);
            }
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = 'CONTENT';
            break;
          case 'TK_CONTENT':
            if (multi_parser.token_text !== '') {
              multi_parser.print_token(multi_parser.token_text);
            }
            multi_parser.current_mode = 'TAG';
            break;
          case 'TK_STYLE':
          case 'TK_SCRIPT':
            if (multi_parser.token_text !== '') {
              multi_parser.output.push('\n');
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
                var reindent = multi_parser.get_full_indent(script_indent_level -_level);
                text = text.replace(/^\s*/, indentation)
                       .replace(/\r\n|\r|\n/g, '\n' + reindent)
                       .replace(/\s*$/, '');
              }
              if (text) {
                multi_parser.print_token(text);
                multi_parser.print_newline(true, multi_parser.output);
              }
            }
            multi_parser.current_mode = 'TAG';
            break;
        }
        multi_parser.last_token = multi_parser.token_type;
        multi_parser.last_text = multi_parser.token_text;
      }
      return multi_parser.output.join('');
    }

    if (typeof define === "function") {
        // Add support for require.js
        define(function(require, exports, module) {
            var js_beautify  = require('./beautify.js').js_beautify;
            var css_beautify = require('./beautify-css.js').css_beautify;

            exports.html_beautify = function(html_source, options) {
                return style_html(html_source, options, js_beautify, css_beautify);
            };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var html_beautify = require("beautify").html_beautify`.
        var js_beautify  = require('./beautify.js').js_beautify;
        var css_beautify = require('./beautify-css.js').css_beautify;

        exports.html_beautify = function(html_source, options) {
            return style_html(html_source, options, js_beautify, css_beautify);
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
            var modified_source = str.replace(';eval(', ';unpacked_source = (');
            var unpacked_source = '';
            eval(modified_source);
            if (unpacked_source) {
                if (MyObfuscate.starts_with(unpacked_source, 'var _escape')) {
                    // fetch the urlencoded stuff from the script,
                    var matches = /'([^']*)'/.exec(unpacked_source);
                    var unescaped = unescape(matches[1]);
                    if (MyObfuscate.starts_with(unescaped, '<script>')) {
                        unescaped = unescaped.substr(8, unescaped.length - 8);
                    }
                    if (MyObfuscate.ends_with(unescaped, '</script>')) {
                        unescaped = unescaped.substr(0, unescaped.length - 9);
                    }
                    unpacked_source = unescaped;
                }
            }
            return unpacked_source ? "// Unpacker warning: be careful when using myobfuscate.com for your projects:\n" +
                    "// scripts obfuscated by the free online version may call back home.\n" +
                    "\n//\n" + unpacked_source : str;
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
        var chunks = str.match(/eval\(\(?function\(.*?,0,\{\}\)\)($|\n)/g);
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


//== js/test/beautify-tests.js
/*global js_beautify: true */
/*jshint */

function run_beautifier_tests(test_obj, Urlencoded, js_beautify)
{

    var opts = {
        indent_size: 4,
        indent_char: ' ',
        preserve_newlines: true,
        jslint_happy: false,
        keep_array_indentation: false,
        brace_style: 'collapse',
        space_before_conditional: true,
        break_chained_methods: false
    };

    function test_beautifier(input)
    {
        return js_beautify(input, opts);
    }

    var sanitytest;

    // test the input on beautifier with the current flag settings
    // does not check the indentation / surroundings as bt() does
    function test_fragment(input, expected)
    {
        expected = expected || input;
        sanitytest.expect(input, expected);
    }



    // test the input on beautifier with the current flag settings
    // test both the input as well as { input } wrapping
    function bt(input, expectation)
    {
        var wrapped_input, wrapped_expectation;

        expectation = expectation || input;
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

    // test the input on beautifier with the current flag settings,
    // but dont't
    function bt_braces(input, expectation)
    {
        var braces_ex = opts.brace_style;
        opts.brace_style = 'expand';
        bt(input, expectation);
        opts.brace_style = braces_ex;
    }

    function beautifier_tests()
    {
        sanitytest = test_obj;
        sanitytest.test_function(test_beautifier, 'js_beautify');

        opts.indent_size       = 4;
        opts.indent_char       = ' ';
        opts.preserve_newlines = true;
        opts.jslint_happy      = false;
        opts.keep_array_indentation = false;
        opts.brace_style       = "collapse";


        bt('');
        bt('return .5');
        test_fragment('   return .5');
        test_fragment('   return .5;\n   a();');
        bt('a        =          1', 'a = 1');
        bt('a=1', 'a = 1');
        bt("a();\n\nb();", "a();\n\nb();");
        bt('var a = 1 var b = 2', "var a = 1\nvar b = 2");
        bt('var a=1, b=c[d], e=6;', 'var a = 1,\n    b = c[d],\n    e = 6;');
        bt('var a,\n    b,\n    c;');
        bt('a = " 12345 "');
        bt("a = ' 12345 '");
        bt('if (a == 1) b = 2;', "if (a == 1) b = 2;");
        bt('if(1){2}else{3}', "if (1) {\n    2\n} else {\n    3\n}");
        bt('if(1||2);', 'if (1 || 2);');
        bt('(a==1)||(b==2)', '(a == 1) || (b == 2)');
        bt('var a = 1 if (2) 3;', "var a = 1\nif (2) 3;");
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
        bt('a.b({c:d})', "a.b({\n    c: d\n})");
        bt('a.b\n(\n{\nc:\nd\n}\n)', "a.b({\n    c: d\n})");
        bt('a=!b', 'a = !b');
        bt('a?b:c', 'a ? b : c');
        bt('a?1:2', 'a ? 1 : 2');
        bt('a?(b):c', 'a ? (b) : c');
        bt('x={a:1,b:w=="foo"?x:y,c:z}', 'x = {\n    a: 1,\n    b: w == "foo" ? x : y,\n    c: z\n}');
        bt('x=a?b?c?d:e:f:g;', 'x = a ? b ? c ? d : e : f : g;');
        bt('x=a?b?c?d:{e1:1,e2:2}:f:g;', 'x = a ? b ? c ? d : {\n    e1: 1,\n    e2: 2\n} : f : g;');
        bt('function void(void) {}');
        bt('if(!a)foo();', 'if (!a) foo();');
        bt('a=~a', 'a = ~a');
        bt('a;/*comment*/b;', "a; /*comment*/\nb;");
        bt('a;/* comment */b;', "a; /* comment */\nb;");
        test_fragment('a;/*\ncomment\n*/b;', "a;\n/*\ncomment\n*/\nb;"); // simple comments don't get touched at all
        bt('a;/**\n* javadoc\n*/b;', "a;\n/**\n * javadoc\n */\nb;");
        test_fragment('a;/**\n\nno javadoc\n*/b;', "a;\n/**\n\nno javadoc\n*/\nb;");
        bt('a;/*\n* javadoc\n*/b;', "a;\n/*\n * javadoc\n */\nb;"); // comment blocks detected and reindented even w/o javadoc starter
        bt('if(a)break;', "if (a) break;");
        bt('if(a){break}', "if (a) {\n    break\n}");
        bt('if((a))foo();', 'if ((a)) foo();');
        bt('for(var i=0;;) a', 'for (var i = 0;;) a');
        bt('for(var i=0;;)\na', 'for (var i = 0;;)\n    a');
        bt('a++;', 'a++;');
        bt('for(;;i++)a()', 'for (;; i++) a()');
        bt('for(;;i++)\na()', 'for (;; i++)\n    a()');
        bt('for(;;++i)a', 'for (;; ++i) a');
        bt('return(1)', 'return (1)');
        bt('try{a();}catch(b){c();}finally{d();}', "try {\n    a();\n} catch (b) {\n    c();\n} finally {\n    d();\n}");
        bt('(xx)()'); // magic function call
        bt('a[1]()'); // another magic function call
        bt('if(a){b();}else if(c) foo();', "if (a) {\n    b();\n} else if (c) foo();");
        bt('switch(x) {case 0: case 1: a(); break; default: break}', "switch (x) {\n    case 0:\n    case 1:\n        a();\n        break;\n    default:\n        break\n}");
        bt('switch(x){case -1:break;case !y:break;}', 'switch (x) {\n    case -1:\n        break;\n    case !y:\n        break;\n}');
        bt('a !== b');
        bt('if (a) b(); else c();', "if (a) b();\nelse c();");
        bt("// comment\n(function something() {})"); // typical greasemonkey start
        bt("{\n\n    x();\n\n}"); // was: duplicating newlines
        bt('if (a in b) foo();');
        bt('var a, b;');
        //  bt('var a, b');
        bt('{a:1, b:2}', "{\n    a: 1,\n    b: 2\n}");
        bt('a={1:[-1],2:[+1]}', 'a = {\n    1: [-1],\n    2: [+1]\n}');
        bt('var l = {\'a\':\'1\', \'b\':\'2\'}', "var l = {\n    'a': '1',\n    'b': '2'\n}");
        bt('if (template.user[n] in bk) foo();');
        bt('{{}/z/}', "{\n    {}\n    /z/\n}");
        bt('return 45', "return 45");
        bt('If[1]', "If[1]");
        bt('Then[1]', "Then[1]");
        bt('a = 1e10', "a = 1e10");
        bt('a = 1.3e10', "a = 1.3e10");
        bt('a = 1.3e-10', "a = 1.3e-10");
        bt('a = -1.3e-10', "a = -1.3e-10");
        bt('a = 1e-10', "a = 1e-10");
        bt('a = e - 10', "a = e - 10");
        bt('a = 11-10', "a = 11 - 10");
        bt("a = 1;// comment", "a = 1; // comment");
        bt("a = 1; // comment", "a = 1; // comment");
        bt("a = 1;\n // comment", "a = 1;\n// comment");
        bt('a = [-1, -1, -1]');

        // The exact formatting these should have is open for discussion, but they are at least reasonable
        bt('a = [ // comment\n    -1, -1, -1\n]');
        bt('var a = [ // comment\n    -1, -1, -1\n]');
        bt('a = [ // comment\n    -1, // comment\n    -1, -1\n]');
        bt('var a = [ // comment\n    -1, // comment\n    -1, -1\n]');

        bt('o = [{a:b},{c:d}]', 'o = [{\n        a: b\n    }, {\n        c: d\n    }\n]');

        bt("if (a) {\n    do();\n}"); // was: extra space appended

        bt("if (a) {\n// comment\n}else{\n// comment\n}", "if (a) {\n    // comment\n} else {\n    // comment\n}"); // if/else statement with empty body
        bt("if (a) {\n// comment\n// comment\n}", "if (a) {\n    // comment\n    // comment\n}"); // multiple comments indentation
        bt("if (a) b() else c();", "if (a) b()\nelse c();");
        bt("if (a) b() else if c() d();", "if (a) b()\nelse if c() d();");

        bt("{}");
        bt("{\n\n}");
        bt("do { a(); } while ( 1 );", "do {\n    a();\n} while (1);");
        bt("do {} while (1);");
        bt("do {\n} while (1);", "do {} while (1);");
        bt("do {\n\n} while (1);");
        bt("var a = x(a, b, c)");
        bt("delete x if (a) b();", "delete x\nif (a) b();");
        bt("delete x[x] if (a) b();", "delete x[x]\nif (a) b();");
        bt("for(var a=1,b=2)d", "for (var a = 1, b = 2) d");
        bt("for(var a=1,b=2,c=3) d", "for (var a = 1, b = 2, c = 3) d");
        bt("for(var a=1,b=2,c=3;d<3;d++)\ne", "for (var a = 1, b = 2, c = 3; d < 3; d++)\n    e");
        bt("function x(){(a||b).c()}", "function x() {\n    (a || b).c()\n}");
        bt("function x(){return - 1}", "function x() {\n    return -1\n}");
        bt("function x(){return ! a}", "function x() {\n    return !a\n}");

        // a common snippet in jQuery plugins
        bt("settings = $.extend({},defaults,settings);", "settings = $.extend({}, defaults, settings);");

        bt('{xxx;}()', '{\n    xxx;\n}()');

        bt("a = 'a'\nb = 'b'");
        bt("a = /reg/exp");
        bt("a = /reg/");
        bt('/abc/.test()');
        bt('/abc/i.test()');
        bt("{/abc/i.test()}", "{\n    /abc/i.test()\n}");
        bt('var x=(a)/a;', 'var x = (a) / a;');

        bt('x != -1', 'x != -1');

        bt('for (; s-->0;)t', 'for (; s-- > 0;) t');
        bt('for (; s++>0;)u', 'for (; s++ > 0;) u');
        bt('a = s++>s--;', 'a = s++ > s--;');
        bt('a = s++>--s;', 'a = s++ > --s;');

        bt('{x=#1=[]}', '{\n    x = #1=[]\n}');
        bt('{a:#1={}}', '{\n    a: #1={}\n}');
        bt('{a:#1#}', '{\n    a: #1#\n}');

        test_fragment('"incomplete-string');
        test_fragment("'incomplete-string");
        test_fragment('/incomplete-regex');

        test_fragment('{a:1},{a:2}', '{\n    a: 1\n}, {\n    a: 2\n}');
        test_fragment('var ary=[{a:1}, {a:2}];', 'var ary = [{\n        a: 1\n    }, {\n        a: 2\n    }\n];');

        test_fragment('{a:#1', '{\n    a: #1'); // incomplete
        test_fragment('{a:#', '{\n    a: #'); // incomplete

        test_fragment('}}}', '}\n}\n}'); // incomplete

        test_fragment('<!--\nvoid();\n// -->', '<!--\nvoid();\n// -->');

        test_fragment('a=/regexp', 'a = /regexp'); // incomplete regexp

        bt('{a:#1=[],b:#1#,c:#999999#}', '{\n    a: #1=[],\n    b: #1#,\n    c: #999999#\n}');

        bt("a = 1e+2");
        bt("a = 1e-2");
        bt("do{x()}while(a>1)", "do {\n    x()\n} while (a > 1)");

        bt("x(); /reg/exp.match(something)", "x();\n/reg/exp.match(something)");

        test_fragment("something();(", "something();\n(");
        test_fragment("#!she/bangs, she bangs\nf=1", "#!she/bangs, she bangs\n\nf = 1");
        test_fragment("#!she/bangs, she bangs\n\nf=1", "#!she/bangs, she bangs\n\nf = 1");
        test_fragment("#!she/bangs, she bangs\n\n/* comment */", "#!she/bangs, she bangs\n\n/* comment */");
        test_fragment("#!she/bangs, she bangs\n\n\n/* comment */", "#!she/bangs, she bangs\n\n\n/* comment */");
        test_fragment("#", "#");
        test_fragment("#!", "#!");

        bt("function namespace::something()");

        test_fragment("<!--\nsomething();\n-->", "<!--\nsomething();\n-->");
        test_fragment("<!--\nif(i<0){bla();}\n-->", "<!--\nif (i < 0) {\n    bla();\n}\n-->");

        bt('{foo();--bar;}', '{\n    foo();\n    --bar;\n}');
        bt('{foo();++bar;}', '{\n    foo();\n    ++bar;\n}');
        bt('{--bar;}', '{\n    --bar;\n}');
        bt('{++bar;}', '{\n    ++bar;\n}');

        // Handling of newlines around unary ++ and -- operators
        bt('{foo\n++bar;}', '{\n    foo\n    ++bar;\n}');
        bt('{foo++\nbar;}', '{\n    foo++\n    bar;\n}');

        // This is invalid, but harder to guard against. Issue #203.
        bt('{foo\n++\nbar;}', '{\n    foo\n    ++\n    bar;\n}');


        // regexps
        bt('a(/abc\\/\\/def/);b()', "a(/abc\\/\\/def/);\nb()");
        bt('a(/a[b\\[\\]c]d/);b()', "a(/a[b\\[\\]c]d/);\nb()");
        test_fragment('a(/a[b\\[', "a(/a[b\\["); // incomplete char class
        // allow unescaped / in char classes
        bt('a(/[a/b]/);b()', "a(/[a/b]/);\nb()");

        bt('a=[[1,2],[4,5],[7,8]]', "a = [\n    [1, 2],\n    [4, 5],\n    [7, 8]\n]");
        bt('a=[[1,2],[4,5],function(){},[7,8]]',
            "a = [\n    [1, 2],\n    [4, 5],\n    function() {},\n    [7, 8]\n]");
        bt('a=[[1,2],[4,5],function(){},function(){},[7,8]]',
            "a = [\n    [1, 2],\n    [4, 5],\n    function() {},\n    function() {},\n    [7, 8]\n]");
        bt('a=[[1,2],[4,5],function(){},[7,8]]',
            "a = [\n    [1, 2],\n    [4, 5],\n    function() {},\n    [7, 8]\n]");
        bt('a=[b,c,function(){},function(){},d]',
            "a = [b, c,\n    function() {},\n    function() {},\n    d\n]");
        bt('a=[a[1],b[4],c[d[7]]]', "a = [a[1], b[4], c[d[7]]]");
        bt('[1,2,[3,4,[5,6],7],8]', "[1, 2, [3, 4, [5, 6], 7], 8]");

        bt('[[["1","2"],["3","4"]],[["5","6","7"],["8","9","0"]],[["1","2","3"],["4","5","6","7"],["8","9","0"]]]',
            '[\n    [\n        ["1", "2"],\n        ["3", "4"]\n    ],\n    [\n        ["5", "6", "7"],\n        ["8", "9", "0"]\n    ],\n    [\n        ["1", "2", "3"],\n        ["4", "5", "6", "7"],\n        ["8", "9", "0"]\n    ]\n]');

        bt('{[x()[0]];indent;}', '{\n    [x()[0]];\n    indent;\n}');

        bt('return ++i', 'return ++i');
        bt('return !!x', 'return !!x');
        bt('return !x', 'return !x');
        bt('return [1,2]', 'return [1, 2]');
        bt('return;', 'return;');
        bt('return\nfunc', 'return\nfunc');
        bt('catch(e)', 'catch (e)');

        bt('var a=1,b={foo:2,bar:3},{baz:4,wham:5},c=4;', 'var a = 1,\n    b = {\n        foo: 2,\n        bar: 3\n    }, {\n        baz: 4,\n        wham: 5\n    }, c = 4;');
        bt('var a=1,b={foo:2,bar:3},{baz:4,wham:5},\nc=4;', 'var a = 1,\n    b = {\n        foo: 2,\n        bar: 3\n    }, {\n        baz: 4,\n        wham: 5\n    },\n    c = 4;');

        // inline comment
        bt('function x(/*int*/ start, /*string*/ foo)', 'function x( /*int*/ start, /*string*/ foo)');

        // javadoc comment
        bt('/**\n* foo\n*/', '/**\n * foo\n */');
        bt('{\n/**\n* foo\n*/\n}', '{\n    /**\n     * foo\n     */\n}');

        bt('var a,b,c=1,d,e,f=2;', 'var a, b, c = 1,\n    d, e, f = 2;');
        bt('var a,b,c=[],d,e,f=2;', 'var a, b, c = [],\n    d, e, f = 2;');

        bt('do/regexp/;\nwhile(1);', 'do /regexp/;\nwhile (1);'); // hmmm

        bt('var a = a,\na;\nb = {\nb\n}', 'var a = a,\n    a;\nb = {\n    b\n}');

        bt('var a = a,\n    /* c */\n    b;');
        bt('var a = a,\n    // c\n    b;');

        bt('foo.("bar");'); // weird element referencing


        bt('if (a) a()\nelse b()\nnewline()');
        bt('if (a) a()\nnewline()');
        bt('a=typeof(x)', 'a = typeof(x)');

        bt('var a = function() {\n    return null;\n},\n    b = false;');

        bt('var a = function() {\n    func1()\n}');
        bt('var a = function() {\n    func1()\n}\nvar b = function() {\n    func2()\n}');



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

        opts.jslint_happy = false;

        bt('switch(x) {case 0: case 1: a(); break; default: break}',
            "switch (x) {\n    case 0:\n    case 1:\n        a();\n        break;\n    default:\n        break\n}");
        bt('switch(x){case -1:break;case !y:break;}',
            'switch (x) {\n    case -1:\n        break;\n    case !y:\n        break;\n}');
        test_fragment("// comment 2\n(function()", "// comment 2\n(function()"); // typical greasemonkey start
        bt("var a2, b2, c2, d2 = 0, c = function() {}, d = '';", "var a2, b2, c2, d2 = 0,\n    c = function() {}, d = '';");
        bt("var a2, b2, c2, d2 = 0, c = function() {},\nd = '';", "var a2, b2, c2, d2 = 0,\n    c = function() {},\n    d = '';");
        bt('var o2=$.extend(a);function(){alert(x);}', 'var o2 = $.extend(a);\n\nfunction() {\n    alert(x);\n}');

        bt('{"x":[{"a":1,"b":3},7,8,8,8,8,{"b":99},{"a":11}]}', '{\n    "x": [{\n            "a": 1,\n            "b": 3\n        },\n        7, 8, 8, 8, 8, {\n            "b": 99\n        }, {\n            "a": 11\n        }\n    ]\n}');

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

        opts.indent_size = 4;
        opts.indent_char = ' ';

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
        bt('var\na=do_preserve_newlines;', 'var\na = do_preserve_newlines;');
        bt('// a\n// b\n\n// c\n// d');
        bt('if (foo) //  comment\n{\n    bar();\n}');


        opts.keep_array_indentation = true;
        bt("a = ['a', 'b', 'c',\n    'd', 'e', 'f']");
        bt("a = ['a', 'b', 'c',\n    'd', 'e', 'f',\n        'g', 'h', 'i']");
        bt("a = ['a', 'b', 'c',\n        'd', 'e', 'f',\n            'g', 'h', 'i']");


        bt('var x = [{}\n]', 'var x = [{}\n]');
        bt('var x = [{foo:bar}\n]', 'var x = [{\n        foo: bar\n    }\n]');
        bt("a = ['something',\n    'completely',\n    'different'];\nif (x);");
        bt("a = ['a','b','c']", "a = ['a', 'b', 'c']");
        bt("a = ['a',   'b','c']", "a = ['a', 'b', 'c']");

        bt("x = [{'a':0}]", "x = [{\n        'a': 0\n    }]");

        bt('{a([[a1]], {b;});}', '{\n    a([[a1]], {\n        b;\n    });\n}');

        bt('a = //comment\n/regex/;');

        test_fragment('/*\n * X\n */');
        test_fragment('/*\r\n * X\r\n */', '/*\n * X\n */');

        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}', 'if (a) {\n    b;\n} else {\n    c;\n}');


        opts.brace_style = 'expand';

        bt('//case 1\nif (a == 1)\n{}\n//case 2\nelse if (a == 2)\n{}');
        bt('if(1){2}else{3}', "if (1)\n{\n    2\n}\nelse\n{\n    3\n}");
        bt('try{a();}catch(b){c();}catch(d){}finally{e();}',
            "try\n{\n    a();\n}\ncatch (b)\n{\n    c();\n}\ncatch (d)\n{}\nfinally\n{\n    e();\n}");
        bt('if(a){b();}else if(c) foo();',
            "if (a)\n{\n    b();\n}\nelse if (c) foo();");
        bt("if (a) {\n// comment\n}else{\n// comment\n}",
            "if (a)\n{\n    // comment\n}\nelse\n{\n    // comment\n}"); // if/else statement with empty body
        bt('if (x) {y} else { if (x) {y}}',
            'if (x)\n{\n    y\n}\nelse\n{\n    if (x)\n    {\n        y\n    }\n}');
        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}',
            'if (a)\n{\n    b;\n}\nelse\n{\n    c;\n}');
        test_fragment('    /*\n* xx\n*/\n// xx\nif (foo) {\n    bar();\n}',
                      '    /*\n     * xx\n     */\n    // xx\n    if (foo)\n    {\n        bar();\n    }');
        bt('if (foo)\n{}\nelse /regex/.test();');
        bt('if (foo) /regex/.test();');
        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}', 'if (a)\n{\n    b;\n}\nelse\n{\n    c;\n}');
        test_fragment('if (foo) {', 'if (foo)\n{');
        test_fragment('foo {', 'foo\n{');
        test_fragment('return {', 'return {'); // return needs the brace.
        test_fragment('return /* inline */ {', 'return /* inline */ {');
        // test_fragment('return\n{', 'return\n{'); // can't support this?, but that's an improbable and extreme case anyway.
        test_fragment('return;\n{', 'return;\n{');
        bt("throw {}");
        bt("throw {\n    foo;\n}");
        bt('var foo = {}');
        bt('if (foo) bar();\nelse break');
        bt('function x() {\n    foo();\n}zzz', 'function x()\n{\n    foo();\n}\nzzz');
        bt('a: do {} while (); xxx', 'a: do {} while ();\nxxx');
        bt('var a = new function();');
        bt('var a = new function() {};');
        bt('var a = new function a()\n    {};');
        test_fragment('new function');


        opts.brace_style = 'collapse';

        bt('//case 1\nif (a == 1) {}\n//case 2\nelse if (a == 2) {}');
        bt('if(1){2}else{3}', "if (1) {\n    2\n} else {\n    3\n}");
        bt('try{a();}catch(b){c();}catch(d){}finally{e();}',
             "try {\n    a();\n} catch (b) {\n    c();\n} catch (d) {} finally {\n    e();\n}");
        bt('if(a){b();}else if(c) foo();',
            "if (a) {\n    b();\n} else if (c) foo();");
        bt("if (a) {\n// comment\n}else{\n// comment\n}",
            "if (a) {\n    // comment\n} else {\n    // comment\n}"); // if/else statement with empty body
        bt('if (x) {y} else { if (x) {y}}',
            'if (x) {\n    y\n} else {\n    if (x) {\n        y\n    }\n}');
        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}',
            'if (a) {\n    b;\n} else {\n    c;\n}');
        test_fragment('    /*\n* xx\n*/\n// xx\nif (foo) {\n    bar();\n}',
                      '    /*\n     * xx\n     */\n    // xx\n    if (foo) {\n        bar();\n    }');
        bt('if (foo) {} else /regex/.test();');
        bt('if (foo) /regex/.test();');
        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}', 'if (a) {\n    b;\n} else {\n    c;\n}');
        test_fragment('if (foo) {', 'if (foo) {');
        test_fragment('foo {', 'foo {');
        test_fragment('return {', 'return {'); // return needs the brace.
        test_fragment('return /* inline */ {', 'return /* inline */ {');
        // test_fragment('return\n{', 'return\n{'); // can't support this?, but that's an improbable and extreme case anyway.
        test_fragment('return;\n{', 'return; {');
        bt("throw {}");
        bt("throw {\n    foo;\n}");
        bt('var foo = {}');
        bt('if (foo) bar();\nelse break');
        bt('function x() {\n    foo();\n}zzz', 'function x() {\n    foo();\n}\nzzz');
        bt('a: do {} while (); xxx', 'a: do {} while ();\nxxx');
        bt('var a = new function();');
        bt('var a = new function() {};');
        bt('var a = new function a() {};');
        test_fragment('new function');

        opts.brace_style = "end-expand";

        bt('//case 1\nif (a == 1) {}\n//case 2\nelse if (a == 2) {}');
        bt('if(1){2}else{3}', "if (1) {\n    2\n}\nelse {\n    3\n}");
        bt('try{a();}catch(b){c();}catch(d){}finally{e();}',
            "try {\n    a();\n}\ncatch (b) {\n    c();\n}\ncatch (d) {}\nfinally {\n    e();\n}");
        bt('if(a){b();}else if(c) foo();',
            "if (a) {\n    b();\n}\nelse if (c) foo();");
        bt("if (a) {\n// comment\n}else{\n// comment\n}",
            "if (a) {\n    // comment\n}\nelse {\n    // comment\n}"); // if/else statement with empty body
        bt('if (x) {y} else { if (x) {y}}',
            'if (x) {\n    y\n}\nelse {\n    if (x) {\n        y\n    }\n}');
        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}',
            'if (a) {\n    b;\n}\nelse {\n    c;\n}');
        test_fragment('    /*\n* xx\n*/\n// xx\nif (foo) {\n    bar();\n}',
                      '    /*\n     * xx\n     */\n    // xx\n    if (foo) {\n        bar();\n    }');
        bt('if (foo) {}\nelse /regex/.test();');
        bt('if (foo) /regex/.test();');
        bt('if (a)\n{\nb;\n}\nelse\n{\nc;\n}', 'if (a) {\n    b;\n}\nelse {\n    c;\n}');
        test_fragment('if (foo) {', 'if (foo) {');
        test_fragment('foo {', 'foo {');
        test_fragment('return {', 'return {'); // return needs the brace.
        test_fragment('return /* inline */ {', 'return /* inline */ {');
        // test_fragment('return\n{', 'return\n{'); // can't support this?, but that's an improbable and extreme case anyway.
        test_fragment('return;\n{', 'return; {');
        bt("throw {}");
        bt("throw {\n    foo;\n}");
        bt('var foo = {}');
        bt('if (foo) bar();\nelse break');
        bt('function x() {\n    foo();\n}zzz', 'function x() {\n    foo();\n}\nzzz');
        bt('a: do {} while (); xxx', 'a: do {} while ();\nxxx');
        bt('var a = new function();');
        bt('var a = new function() {};');
        bt('var a = new function a() {};');
        test_fragment('new function');

        opts.brace_style = 'collapse';


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
        bt("var x = set\n\nfunction() {}", "var x = set\n\n    function() {}");

        bt('<!-- foo\nbar();\n-->');
        bt('<!-- dont crash');
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
        bt('import foo.*;', 'import foo.*;'); // actionscript's import
        test_fragment('function f(a: a, b: b)'); // actionscript

        bt('{\n    foo // something\n    ,\n    bar // something\n    baz\n}');
        bt('function a(a) {} function b(b) {} function c(c) {}', 'function a(a) {}\nfunction b(b) {}\nfunction c(c) {}');
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

        opts.preserve_newlines = false;
        opts.wrap_line_length = 0;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_.okay();');

        opts.wrap_line_length = 70;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_.okay();');

        opts.wrap_line_length = 40;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat &&\n' +
                      '    "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_.okay();');

        opts.wrap_line_length = 41;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '    (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_.okay();');

        opts.wrap_line_length = 45;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('{\n' +
                      '    foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      '    Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      '    if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();\n' +
                      '}',
                      /* expected */
                      '{\n' +
                      '    foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '        (leans && mean));\n' +
                      '    Test_very_long_variable_name_this_should_never_wrap\n' +
                      '        .but_this_can\n' +
                      '    if (wraps_can_occur &&\n' +
                      '        inside_an_if_block) that_is_.okay();\n' +
                      '}');

        opts.preserve_newlines = true;
        opts.wrap_line_length = 0;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n' +
                      '        .okay();');

        opts.wrap_line_length = 70;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n' +
                      '        .okay();');


        opts.wrap_line_length = 40;
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat &&\n' +
                      '    "sassy") || (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_\n' +
                      '        .okay();');

        opts.wrap_line_length = 41;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      'if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();',
                      /* expected */
                      'foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '    (leans && mean));\n' +
                      'Test_very_long_variable_name_this_should_never_wrap\n' +
                      '    .but_this_can\n' +
                      'if (wraps_can_occur &&\n' +
                      '    inside_an_if_block) that_is_\n' +
                      '        .okay();');

        opts.wrap_line_length = 45;
        // NOTE: wrap is only best effort - line continues until next wrap point is found.
        //.............---------1---------2---------3---------4---------5---------6---------7
        //.............1234567890123456789012345678901234567890123456789012345678901234567890
        test_fragment('{\n' +
                      '    foo.bar().baz().cucumber((fat && "sassy") || (leans\n&& mean));\n' +
                      '    Test_very_long_variable_name_this_should_never_wrap\n.but_this_can\n' +
                      '    if (wraps_can_occur && inside_an_if_block) that_is_\n.okay();\n' +
                      '}',
                      /* expected */
                      '{\n' +
                      '    foo.bar().baz().cucumber((fat && "sassy") ||\n' +
                      '        (leans && mean));\n' +
                      '    Test_very_long_variable_name_this_should_never_wrap\n' +
                      '        .but_this_can\n' +
                      '    if (wraps_can_occur &&\n' +
                      '        inside_an_if_block) that_is_\n' +
                      '            .okay();\n' +
                      '}');

        opts.wrap_line_length = 0;

        opts.preserve_newlines = false;
        bt('if (foo) // comment\n    bar();');
        bt('if (foo) // comment\n    (bar());');
        bt('if (foo) // comment\n    (bar());');
        bt('if (foo) // comment\n    /asdf/;');
        bt('foo = {\n    x: y, // #44\n    w: z // #44\n}');
        bt('switch (x) {\n    case "a":\n        // comment on newline\n        break;\n    case "b": // comment on same line\n        break;\n}');

        // these aren't ready yet.
        //bt('if (foo) // comment\n    bar() /*i*/ + baz() /*j\n*/ + asdf();');

        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\na();', 'if (foo) if (bar) if (baz) whee();\na();');
        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\nelse\na();', 'if (foo) if (bar) if (baz) whee();\n        else a();');
        bt('if (foo)\nbar();\nelse\ncar();', 'if (foo) bar();\nelse car();');

        bt('if (foo) if (bar) if (baz) whee();\na();');
        bt('if (foo) a()\nif (bar) if (baz) whee();\na();');
        bt('if (options)\n' +
           '    for (var p in options)\n' +
           '        this[p] = options[p];',
           'if (options) for (var p in options) this[p] = options[p];');

        bt('function f(a, b, c,\nd, e) {}',
            'function f(a, b, c, d, e) {}');

        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\nfunction g(a, b) {\n    if (!a) b()\n}');
        bt('function f(a,b) {if(a) b()}\n\n\n\nfunction g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\n\nfunction g(a, b) {\n    if (!a) b()\n}');

        // This is not valid syntax, but still want to behave reasonably and not side-effect
        bt('(if(a) b())(if(a) b())',
            '(\nif (a) b())(\nif (a) b())');
        bt('(if(a) b())\n\n\n(if(a) b())',
            '(\nif (a) b())\n(\nif (a) b())');



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

        // these aren't ready yet.
        // bt('if (foo) // comment\n    bar() /*i*/ + baz() /*j\n*/ + asdf();');
        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\na();', 'if (foo)\n    if (bar)\n        if (baz)\n            whee();\na();');
        bt('if\n(foo)\nif\n(bar)\nif\n(baz)\nwhee();\nelse\na();', 'if (foo)\n    if (bar)\n        if (baz)\n            whee();\n        else\n            a();');
        bt('if (foo) bar();\nelse\ncar();', 'if (foo) bar();\nelse\n    car();');

        bt('if (foo) if (bar) if (baz) whee();\na();');
        bt('if (foo) a()\nif (bar) if (baz) whee();\na();');
        bt('if (options)\n' +
           '    for (var p in options)\n' +
           '        this[p] = options[p];');

        bt('function f(a, b, c,\nd, e) {}',
            'function f(a, b, c,\n    d, e) {}');

        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\nfunction g(a, b) {\n    if (!a) b()\n}');
        bt('function f(a,b) {if(a) b()}\n\n\n\nfunction g(a,b) {if(!a) b()}',
            'function f(a, b) {\n    if (a) b()\n}\n\n\n\nfunction g(a, b) {\n    if (!a) b()\n}');
        // This is not valid syntax, but still want to behave reasonably and not side-effect
        bt('(if(a) b())(if(a) b())',
            '(\nif (a) b())(\nif (a) b())');
        bt('(if(a) b())\n\n\n(if(a) b())',
            '(\nif (a) b())\n\n\n(\nif (a) b())');


        bt("if\n(a)\nb();", "if (a)\n    b();");
        bt('var a =\nfoo', 'var a =\n    foo');
        bt('var a = {\n"a":1,\n"b":2}', "var a = {\n    \"a\": 1,\n    \"b\": 2\n}");
        bt("var a = {\n'a':1,\n'b':2}", "var a = {\n    'a': 1,\n    'b': 2\n}");
        bt('var a = /*i*/ "b";');
        bt('var a = /*i*/\n"b";', 'var a = /*i*/\n    "b";');
        bt('var a = /*i*/\nb;', 'var a = /*i*/\n    b;');
        bt('{\n\n\n"x"\n}', '{\n\n\n    "x"\n}');
        bt('if(a &&\nb\n||\nc\n||d\n&&\ne) e = f', 'if (a &&\n    b ||\n    c || d &&\n    e) e = f');
        bt('if(a &&\n(b\n||\nc\n||d)\n&&\ne) e = f', 'if (a &&\n    (b ||\n    c || d) &&\n    e) e = f');
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
            'function f(a, b) {\n    if (a) b()\n}\nfunction g(a, b) {\n    if (!a) b()\n}');
        bt('a=[];',
            'a = [];');
        bt('a=[b,c,d];',
            'a = [b, c, d];');
        bt('a= f[b];',
            'a = f[b];');
        opts.space_in_paren = true
        bt('if(p) foo(a,b)', 'if ( p ) foo( a, b )');
        bt('try{while(true){willThrow()}}catch(result)switch(result){case 1:++result }',
           'try {\n    while ( true ) {\n        willThrow( )\n    }\n} catch ( result ) switch ( result ) {\n    case 1:\n        ++result\n}');
        bt('((e/((a+(b)*c)-d))^2)*5;', '( ( e / ( ( a + ( b ) * c ) - d ) ) ^ 2 ) * 5;');
        bt('function f(a,b) {if(a) b()}function g(a,b) {if(!a) b()}',
            'function f( a, b ) {\n    if ( a ) b( )\n}\nfunction g( a, b ) {\n    if ( !a ) b( )\n}');
        bt('a=[ ];',
            'a = [ ];');
        bt('a=[b,c,d];',
            'a = [ b, c, d ];');
        bt('a= f[b];',
            'a = f[ b ];');
        opts.space_in_paren = false;

        // Test that e4x literals passed through when e4x-option is enabled
        bt('xml=<a b="c"><d/><e>\n foo</e>x</a>;', 'xml = < a b = "c" > < d / > < e >\n    foo < /e>x</a > ;');
        opts.e4x = true;
        bt('xml=<a b="c"><d/><e>\n foo</e>x</a>;', 'xml = <a b="c"><d/><e>\n foo</e>x</a>;');
        // Handles messed up tags, as long as it isn't the same name
        // as the root tag. Also handles tags of same name as root tag
        // as long as nesting matches.
        bt('xml=<a x="jn"><c></b></f><a><d jnj="jnn"><f></a ></nj></a>;',
         'xml = <a x="jn"><c></b></f><a><d jnj="jnn"><f></a ></nj></a>;');
        // If xml is not terminated, the remainder of the file is treated
        // as part of the xml-literal (passed through unaltered)
        test_fragment('xml=<a></b>\nc<b;', 'xml = <a></b>\nc<b;');
        opts.e4x = false;


        Urlencoded.run_tests(sanitytest);

        return sanitytest;
    }

    return beautifier_tests();
}

if (typeof exports !== "undefined") {
    exports.run_beautifier_tests = run_beautifier_tests;
}
//== js/test/beautify-tests.js end


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

if(hMainWnd && (typeof AkelPad.IsInclude == "undefined" || !AkelPad.IsInclude())) {
	if(update)
		selfUpdate();
	else {
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
					.replace(/\n?<\/style>\s*/, "");
			}
			else {
				var syntax = { value: undefined };
				res = beautify(src, syntax);
			}

			if(action == ACT_INSERT) {
				if(lpFrameTarget && lpFrameTarget != AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0))
					AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameTarget);
				setSyntax(syntax.value);
			}
			if(res) {
				if(action == ACT_INSERT && res != src) {
					if(AkelPad.GetEditReadOnly(hWndEdit))
						action = ACT_INSERT_NEW_DOC;
					else
						insertNoScroll(res, selectAll, getCaretPos(res, selStart));
				}
				if(action == ACT_INSERT_NEW_DOC) {
					AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
					setSyntax(syntax.value);
					AkelPad.SetSel(0, 0);
					insertNoScroll(res, true, getCaretPos(res, selStart));
				}
				if(action == ACT_COPY && res != AkelPad.GetClipboardText())
					AkelPad.SetClipboardText(res);
				if(action == ACT_SHOW)
					AkelPad.MessageBox(hMainWnd, res.substr(0, 3000), WScript.ScriptName, 64 /*MB_ICONINFORMATION*/);
			}
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
			.replace("&& flags.whitespace_before.length", "&& flags.whitespace_before && flags.whitespace_before.length")
			.replace(/('TK_UNKNOWN': handle_unknown),(\s*\};)/, "$1$2");
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
		? "https://raw.github.com/einars/js-beautify/gh-pages/"
		: "https://raw.github.com/einars/js-beautify/master/";
	var data = {
		"js/lib/beautify.js": "",
		"js/lib/beautify-css.js": "",
		"js/lib/beautify-html.js": "",
		"js/lib/unpackers/javascriptobfuscator_unpacker.js": "",
		"js/lib/unpackers/myobfuscate_unpacker.js": "",
		"js/lib/unpackers/p_a_c_k_e_r_unpacker.js": "",
		"js/lib/unpackers/urlencode_unpacker.js": "",
		"js/test/beautify-tests.js": "",
		"js/test/sanitytest.js": ""
	};

	var startTime = new Date().getTime();

	var errors = [];
	var noCache = forceNoCache ? "?" + new Date().getTime() : "";
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
			selfCode = selfCode.substring(0, indexStart + start.length)
				+ data[file]
				+ selfCode.substring(indexEnd);
		}
		if(selfCode == selfCodeOld) {
			AkelPad.MessageBox(hMainWnd, _localize("Already updated!"), WScript.ScriptBaseName, 64 /*MB_ICONINFORMATION*/);
			return;
		}
		selfCode = selfCode.replace(/(\shttp:\/\/jsbeautifier\.org\/)[^\n\r]*([\n\r])/, "$1 [" + date() + "]$2");

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
		var rssUrl = "https://github.com/einars/js-beautify/commits/master.atom";
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
		var oldChr = oldSelStart.charAt(pos++);
		if(chr != oldChr)
			break;
		if(pos == posStop)
			//return i + 1;
			return line + ":" + col;
	}
	return undefined;
}
function insertNoScroll(str, selectAll, caretPos) {
	var hWndEdit = AkelPad.GetEditWnd();
	setRedraw(hWndEdit, false);

	var saveScrollPos = caretPos == undefined;
	if(saveScrollPos) {
		var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
		if(!lpPoint)
			return;
		AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);
	}

	if(selectAll)
		AkelPad.SetSel(0, -1);
	AkelPad.ReplaceSel(str, true);

	if(saveScrollPos) {
		AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
		AkelPad.MemFree(lpPoint);
		setRedraw(hWndEdit, true);
	}
	else {
		setRedraw(hWndEdit, true); // Should be here, otherwise caret doesn't redraw
		//AkelPad.SetSel(caretPos, caretPos);
		AkelPad.SendMessage(hMainWnd, 1206 /*AKD_GOTOW*/, 0x1 /*GT_LINE*/, AkelPad.MemStrPtr(caretPos));
	}
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