// https://akelpad.sourceforge.net/forum/viewtopic.php?p=11095#p11095
// https://infocatcher.ucoz.net/js/akelpad_scripts/converter.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/converter.js

// (c) Infocatcher 2010-2024
// Version: 0.2.5pre2 - 2024-07-20
// Author: Infocatcher

//// Encode/decode miscellaneous things

//===================
// Hotkeys:
//   Enter                    - Ok
//   Ctrl+Enter, Shift+Enter  - Convert
//   Escape                   - Cancel
//   Ctrl+Z                   - Undo
//   Ctrl+Shift+Z             - Redo
//   Ctrl+C, Ctrl+Insert      - Copy
//   Ctrl+V, Shift+Insert     - Paste
//   Ctrl+X, Shift+Del        - Cut
//   Delete                   - Delete selection
//   Ctrl+A                   - Select all
//   Ctrl+S                   - Save file
//   F1                       - "Help" (just open this file)

// HTML entities, encode/decode:
//   &    <=> &amp;
//   <    <=> &lt;
//   >    <=> &gt;
//   "    <=> &quot;
//   ©    <=> &copy;  (and some other entities, see arguments)
//   char <=> &#code; (see arguments)

// Escape sequences (JavaScript), convert:
//   \u00a9 <=> ©
//   \xa9   <=> ©

// Regular expressions special symbols, escape/unescape:
//   http://example.com/ <=> http:\/\/example\.com\/

// String literals special symbols, escape/unescape:
//   ab"cd\ef <=> ab\"cd\\ef
// Select string with commas to don't escape another commas inside:
//   "ab"cd'ef" <=> "ab\"cd'ef"

// Uniform Resource Identifier (URI), encode/decode with
// encodeURI()/decodeURI()
//   https://ru.wikipedia.org/wiki/%D0%A2%D0%B5%D1%81%D1%82 <=> https://ru.wikipedia.org/wiki/Тест
// Uniform Resource Identifier (URI), full, encode/decode with
// encodeURIComponent()/decodeURIComponent()
//   https%3A%2F%2Fru.wikipedia.org%2Fwiki%2F%D0%A2%D0%B5%D1%81%D1%82 <=> https://ru.wikipedia.org/wiki/Тест

// Hexadecimal escape/unescape:
//   JavaScript's escape()/unescape()
//   "test тест" <=> %22test%20%u0442%u0435%u0441%u0442%22

// Base64 encode/decode:
//   Test, проверка <=> VGVzdCwg0L/RgNC+0LLQtdGA0LrQsA== (used UTF-8 code page)
// (based on code from http://www.farfarfar.com/scripts/encrypt/)

// Quoted-printable encode/decode:
// -type="QuotedPrintable"
//   [=3D] <=> [=]

// Charset (semi-recode):
// -type="Charset"
//   Encode: WideCharToMultiByte() http://msdn.microsoft.com/en-us/library/dd374130(v=vs.85).aspx
//   Decode: MultiByteToWideChar() http://msdn.microsoft.com/en-us/library/dd319072(v=vs.85).aspx
//   Íå÷òî <=> Нечто (with cp1251 aka windows-1251)
// Charset (recode):
// -type="Recode" (works like built-in recode command in AkelPad itself, not available from UI)
//   бНОПНЯ <=> Вопрос (from cp20866 aka KOI8-R to cp1251 aka windows-1251)

// Arguments:
//   -mode=0                                 - (default) auto encode or decode
//   -mode=1                                 - encode
//   -mode=2                                 - decode
//   -type="RegExp"                          - type of converter ("HTML", "Escapes", "RegExp", "String",
//                                             "URI", "URIComponent", "Unescape", "Base64", "QuotedPrintable"
//                                             "Charset", "Recode")
//   -action=1                               - sum of flags: 1 - insert, 2 - copy, 4 - show
//   -dialog=false                           - don't show dialog
//   -onlySelected=true                      - use only selected text
//   -warningTime=4000                       - show warning for slow calculations
//   -test=true                              - display convert speed
//   -saveOptions=0                          - don't store options
//   -saveOptions=1                          - (default) save options after converting
//   -saveOptions=2                          - save options on exit
//   -savePosition=true                      - allow store last window position
//   -saveSize=true                          - allow store height of output field
// Arguments for HTML converter:
//   -decodeSpecialEntities=true             - (default: true)  decode special entities like &copy; -> ©
//   -encodeSpecialEntities=false            - (default: false) encode special entities
//   -decodeSpacesEntities=false             - (default: false) decode spaces entities like &nbsp;
//   -encodeSpacesEntities=true              - (default: true)  encode spaces entities
//   -decodeCharCodes=true                   - (default: true)  decode &#code; => char
//   -encodeChars=false                      - (default: false) encode char => &#code;
//   -encodeAsHex=false                      - use hex instead of decimal
//   -charsToEncode=/'|[^!-~ \t\n\rа-яё]/ig  - mask for chars to encode
//   -ignoreEntities="lt,gt"                 - don't convert some entities, comma-separated list
// Arguments for escapes converter:
//   -customEscapesDecoder=false             - (experimental, default: false) use custom decoder instead of eval()
// Arguments for URIs converters:
//   -codePageURI=1251                       - code page for URIs encoding, -1 - current, -2 - don't change
// Arguments for URI Component converter:
//   -toDataURI=true                         - encode as data URI (data:text/plain;charset=UTF-8,Test)
//   -toBase64=true                          - encode as base64 data URI (data:text/plain;charset=UTF-8;base64,VGVzdA==)
// Arguments for Base64 converter:
//   -codePageBase64=65001                   - code page: -1 - current, -2 - don't change
//   -maxLineWidth=75                        - allow split output to lines with fixed width
// Arguments for charsets converter:
//   -codePage=1251                          - code page: -1 - current
// Arguments for recode converter:
//   -codePageFrom=20866                     - code page: -1 - current
//   -codePageTo=1251                        - code page: -1 - current
// Arguments for quoted-printable converter:
//   -codePageQP=1251                        - code page: -1 - current

// Usage:
//   Call("Scripts::Main", 1, "converter.js")
//   Call("Scripts::Main", 1, "converter.js", `-mode=0 -type="HTML"`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=0 -type="HTML" -decodeCharCodes=true -encodeChars=true "-charsToEncode=/'|[^!-~ \t\n\rа-яё]/ig"`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=0 -type="Escapes" -dialog=false`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=2 -type="Charset" -codePage=1251 -dialog=false -saveOptions=0`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=2 -type="Recode" -codePageFrom=20866 -codePageTo=1251 -dialog=false -saveOptions=0`)
//===================

// Wrapper for AkelPad.Include()
if(!convertersArgs)
	var convertersArgs = {};
(function() {
var overrideArgs = convertersArgs;

function _localize(s) {
	var strings = {
		"No text selected!": {
			ru: "Отсутствует выделенный текст!"
		},
		"No text!": {
			ru: "Текст отсутствует!"
		},
		"Converter “%S” not found!": {
			ru: "Конвертер «%S» не найден!"
		},
		"Can't encode!\nError:\n%S": {
			ru: "Не удаётся закодировать!\nОшибка:\n%S"
		},
		"Can't decode!\nError:\n%S": {
			ru: "Не удаётся раскодировать!\nОшибка:\n%S"
		},
		"Nothing to convert!": {
			ru: "Нечего конвертировать!"
		},
		"Required time: %S (estimate)\nContinue?": {
			ru: "Требуется времени: %S (оценочно)\n Продолжить?"
		},
		"&HTML entities": {
			ru: "&HTML-сущности"
		},
		"&&en&tity; => symbol": {
			ru: "&&су&щность; => символ"
		},
		"s&ymbol => &&entity;": {
			ru: "с&имвол => &&сущность;"
		},
		"&&nbs&p; => space": {
			ru: "&&nbs&p; => пробел"
		},
		"s&pace => &&nbsp;": {
			ru: "&пробел => &&nbsp;"
		},
		"&&#c&ode; => symbol": {
			ru: "&&#к&од; => символ"
		},
		"sym&bol => &&#code;": {
			ru: "си&мвол => &&#код;"
		},
		"he&x-code": {
			ru: "he&x-код"
		},
		"&Escape sequences": {
			ru: "&Escape-последовательности"
		},
		"Re&gular expressions special symbols": {
			ru: "Специальные символы &регулярных выражений"
		},
		"&String literals special symbols": {
			ru: "Специальные символы &строковых литералов"
		},
		"Uniform Resource Identifier (&URI)": {
			ru: "Унифицированный идентификатор ресурса (&URI)"
		},
		"Uniform Resource Identifier (U&RI), full": {
			ru: "Унифицированный идентификатор ресурса (U&RI), целиком"
		},
		"Encode as data URI": {
			ru: "Кодировать как data URI"
		},
		"Base64": {
			ru: "Base64"
		},
		"Hexadeci&mal escape": {
			ru: "&Шестнадцатеричное кодирование"
		},
		"Base&64": {
			ru: "Base&64"
		},
		"&Quoted-Printable": {
			ru: "&Quoted-Printable"
		},
		"&Charset (semi-recode)": {
			ru: "&Кодировка (частичное перекодирование)"
		},
		"Direction": {
			ru: "Направление"
		},
		"&Auto": {
			ru: "&Автоопределение"
		},
		"E&ncode": {
			ru: "Зако&дировать"
		},
		"&Decode": {
			ru: "&Раскодировать"
		},
		"Action": {
			ru: "Действие"
		},
		"&Insert": {
			ru: "&Вставить"
		},
		"C&opy": {
			ru: "К&опировать"
		},
		"Sho&w": {
			ru: "Пока&зать"
		},
		"OK": {
			ru: "ОК"
		},
		"Convert": {
			ru: "Конвертировать"
		},
		"Cancel": {
			ru: "Отмена"
		}
	};
	var lng = "en";
	switch(AkelPad.GetLangId(1 /*LANGID_PRIMARY*/)) {
		case 0x19: lng = "ru";
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	_localize._strings = strings;
	return _localize(s);
}


// Read arguments and prefs:
// getArg(argName, defaultValue), getArgOrPref(argAndPrefName, type, defaultValue)
var MODE_AUTO   = 0;
var MODE_ENCODE = 1;
var MODE_DECODE = 2;

var ACT_INSERT = 1;
var ACT_COPY   = 2;
var ACT_SHOW   = 4;

var CP_NOT_CONVERT = -2;
var CP_CURRENT     = -1;

var DEFAULT_TYPE = "html";

var saveOptions           = getArg("saveOptions", 1);
var savePosition          = getArg("savePosition", true);
var saveSize              = getArg("saveSize", true);
if(saveOptions || savePosition || saveSize)
	var prefs = new Prefs();

var forceShowDialog       = getArg("dialog", true);
var onlySelected          = getArg("onlySelected", false);
var warningTime           = getArg("warningTime", 4000);

var speedTest             = getArg("test", false);

var type                  = getArgOrPref("type",                  prefs && prefs.STRING, "html").toLowerCase();
var mode                  = getArgOrPref("mode",                  prefs && prefs.DWORD, MODE_AUTO);
var action                = getArgOrPref("action",                prefs && prefs.DWORD, ACT_INSERT);

var decodeSpecialEntities = getArgOrPref("decodeSpecialEntities", prefs && prefs.DWORD, true);
var encodeSpecialEntities = getArgOrPref("encodeSpecialEntities", prefs && prefs.DWORD, false);

var decodeSpacesEntities  = getArgOrPref("decodeSpacesEntities",  prefs && prefs.DWORD, false);
var encodeSpacesEntities  = getArgOrPref("encodeSpacesEntities",  prefs && prefs.DWORD, true);

var decodeCharCodes       = getArgOrPref("decodeCharCodes",       prefs && prefs.DWORD, true);
var encodeChars           = getArgOrPref("encodeChars",           prefs && prefs.DWORD, false);
var encodeAsHex           = getArgOrPref("encodeAsHex",           prefs && prefs.DWORD, false);
var charsToEncode         = getArg("charsToEncode", /'|[^!-~ \t\n\rа-яё]/ig);
// "!-~"     - latin symbols
// " \t\n\r" - spaces
// "а-яё"    - cyrillic symbols
var ignoreEntities        = getArg("ignoreEntities", "");

var customEscapesDecoder  = getArg("customEscapesDecoder", false);
var codePageURI           = getArg("codePageURI", CP_NOT_CONVERT);
var codePageBase64        = getArg("codePageBase64", CP_CURRENT);
var maxLineWidth          = getArg("maxLineWidth", 75);
var toDataURI             = getArgOrPref("toDataURI", prefs && prefs.DWORD, false);
var toBase64              = getArgOrPref("toBase64",  prefs && prefs.DWORD, false);
var codePage              = getArg("codePage", CP_CURRENT);
var codePageFrom          = getArg("codePageFrom", CP_CURRENT);
var codePageTo            = getArg("codePageTo", CP_CURRENT);
var codePageQP            = getArg("codePageQP", CP_CURRENT);

var entitiesBlackList = null;
if(ignoreEntities) {
	entitiesBlackList = {};
	var entities = ignoreEntities.split(/,\s*/);
	for(var i = 0, l = entities.length; i < l; ++i)
		entitiesBlackList[entities[i]] = true;
}

// Deprecated arguments and prefs
var copy = getArgOrPref("copy", prefs && prefs.DWORD);
if(copy !== undefined) {
	if(copy)
		action = action & ~ACT_INSERT | ACT_COPY;
	else
		action = action & ~ACT_COPY | ACT_INSERT;
	saveOptions && prefs.set("action", action);
}
if(saveOptions) {
	copy = prefs.get("copy", prefs.DWORD);
	if(copy !== undefined)
		prefs.remove("copy");
}
var cp = getArg("codePage");
if(cp !== undefined && getArg("codePageURI") === undefined && getArg("codePageBase64") === undefined) {
	codePageURI = cp;
	codePageBase64 = CP_CURRENT;
}

prefs && prefs.end();

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);


var specialEntities = {
	// Converted from \omni.ja\res\dtd\htmlmathml-f.ent in Firefox 128.0
	AElig:                           "\u00c6",
	//AMP:                           "\u0026",
	Aacute:                          "\u00c1",
	Abreve:                          "\u0102",
	Acirc:                           "\u00c2",
	Acy:                             "\u0410",
	Afr:                             "\ud835\udd04",
	Agrave:                          "\u00c0",
	Alpha:                           "\u0391",
	Amacr:                           "\u0100",
	And:                             "\u2a53",
	Aogon:                           "\u0104",
	Aopf:                            "\ud835\udd38",
	ApplyFunction:                   "\u2061",
	Aring:                           "\u00c5",
	Ascr:                            "\ud835\udc9c",
	Assign:                          "\u2254",
	Atilde:                          "\u00c3",
	Auml:                            "\u00c4",
	Backslash:                       "\u2216",
	Barv:                            "\u2ae7",
	Barwed:                          "\u2306",
	Bcy:                             "\u0411",
	Because:                         "\u2235",
	Bernoullis:                      "\u212c",
	Beta:                            "\u0392",
	Bfr:                             "\ud835\udd05",
	Bopf:                            "\ud835\udd39",
	Breve:                           "\u02d8",
	Bscr:                            "\u212c",
	Bumpeq:                          "\u224e",
	CHcy:                            "\u0427",
	COPY:                            "\u00a9",
	Cacute:                          "\u0106",
	Cap:                             "\u22d2",
	CapitalDifferentialD:            "\u2145",
	Cayleys:                         "\u212d",
	Ccaron:                          "\u010c",
	Ccedil:                          "\u00c7",
	Ccirc:                           "\u0108",
	Cconint:                         "\u2230",
	Cdot:                            "\u010a",
	Cedilla:                         "\u00b8",
	CenterDot:                       "\u00b7",
	Cfr:                             "\u212d",
	Chi:                             "\u03a7",
	CircleDot:                       "\u2299",
	CircleMinus:                     "\u2296",
	CirclePlus:                      "\u2295",
	CircleTimes:                     "\u2297",
	ClockwiseContourIntegral:        "\u2232",
	CloseCurlyDoubleQuote:           "\u201d",
	CloseCurlyQuote:                 "\u2019",
	Colon:                           "\u2237",
	Colone:                          "\u2a74",
	Congruent:                       "\u2261",
	Conint:                          "\u222f",
	ContourIntegral:                 "\u222e",
	Copf:                            "\u2102",
	Coproduct:                       "\u2210",
	CounterClockwiseContourIntegral: "\u2233",
	Cross:                           "\u2a2f",
	Cscr:                            "\ud835\udc9e",
	Cup:                             "\u22d3",
	CupCap:                          "\u224d",
	DD:                              "\u2145",
	DDotrahd:                        "\u2911",
	DJcy:                            "\u0402",
	DScy:                            "\u0405",
	DZcy:                            "\u040f",
	Dagger:                          "\u2021",
	Darr:                            "\u21a1",
	Dashv:                           "\u2ae4",
	Dcaron:                          "\u010e",
	Dcy:                             "\u0414",
	Del:                             "\u2207",
	Delta:                           "\u0394",
	Dfr:                             "\ud835\udd07",
	DiacriticalAcute:                "\u00b4",
	DiacriticalDot:                  "\u02d9",
	DiacriticalDoubleAcute:          "\u02dd",
	DiacriticalGrave:                "\u0060",
	DiacriticalTilde:                "\u02dc",
	Diamond:                         "\u22c4",
	DifferentialD:                   "\u2146",
	Dopf:                            "\ud835\udd3b",
	Dot:                             "\u00a8",
	DotDot:                          "\u20dc",
	DotEqual:                        "\u2250",
	DoubleContourIntegral:           "\u222f",
	DoubleDot:                       "\u00a8",
	DoubleDownArrow:                 "\u21d3",
	DoubleLeftArrow:                 "\u21d0",
	DoubleLeftRightArrow:            "\u21d4",
	DoubleLeftTee:                   "\u2ae4",
	DoubleLongLeftArrow:             "\u27f8",
	DoubleLongLeftRightArrow:        "\u27fa",
	DoubleLongRightArrow:            "\u27f9",
	DoubleRightArrow:                "\u21d2",
	DoubleRightTee:                  "\u22a8",
	DoubleUpArrow:                   "\u21d1",
	DoubleUpDownArrow:               "\u21d5",
	DoubleVerticalBar:               "\u2225",
	DownArrow:                       "\u2193",
	DownArrowBar:                    "\u2913",
	DownArrowUpArrow:                "\u21f5",
	DownBreve:                       "\u0311",
	DownLeftRightVector:             "\u2950",
	DownLeftTeeVector:               "\u295e",
	DownLeftVector:                  "\u21bd",
	DownLeftVectorBar:               "\u2956",
	DownRightTeeVector:              "\u295f",
	DownRightVector:                 "\u21c1",
	DownRightVectorBar:              "\u2957",
	DownTee:                         "\u22a4",
	DownTeeArrow:                    "\u21a7",
	Downarrow:                       "\u21d3",
	Dscr:                            "\ud835\udc9f",
	Dstrok:                          "\u0110",
	ENG:                             "\u014a",
	ETH:                             "\u00d0",
	Eacute:                          "\u00c9",
	Ecaron:                          "\u011a",
	Ecirc:                           "\u00ca",
	Ecy:                             "\u042d",
	Edot:                            "\u0116",
	Efr:                             "\ud835\udd08",
	Egrave:                          "\u00c8",
	Element:                         "\u2208",
	Emacr:                           "\u0112",
	EmptySmallSquare:                "\u25fb",
	EmptyVerySmallSquare:            "\u25ab",
	Eogon:                           "\u0118",
	Eopf:                            "\ud835\udd3c",
	Epsilon:                         "\u0395",
	Equal:                           "\u2a75",
	EqualTilde:                      "\u2242",
	Equilibrium:                     "\u21cc",
	Escr:                            "\u2130",
	Esim:                            "\u2a73",
	Eta:                             "\u0397",
	Euml:                            "\u00cb",
	Exists:                          "\u2203",
	ExponentialE:                    "\u2147",
	Fcy:                             "\u0424",
	Ffr:                             "\ud835\udd09",
	FilledSmallSquare:               "\u25fc",
	FilledVerySmallSquare:           "\u25aa",
	Fopf:                            "\ud835\udd3d",
	ForAll:                          "\u2200",
	Fouriertrf:                      "\u2131",
	Fscr:                            "\u2131",
	GJcy:                            "\u0403",
	GT:                              "\u003e",
	Gamma:                           "\u0393",
	Gammad:                          "\u03dc",
	Gbreve:                          "\u011e",
	Gcedil:                          "\u0122",
	Gcirc:                           "\u011c",
	Gcy:                             "\u0413",
	Gdot:                            "\u0120",
	Gfr:                             "\ud835\udd0a",
	Gg:                              "\u22d9",
	Gopf:                            "\ud835\udd3e",
	GreaterEqual:                    "\u2265",
	GreaterEqualLess:                "\u22db",
	GreaterFullEqual:                "\u2267",
	GreaterGreater:                  "\u2aa2",
	GreaterLess:                     "\u2277",
	GreaterSlantEqual:               "\u2a7e",
	GreaterTilde:                    "\u2273",
	Gscr:                            "\ud835\udca2",
	Gt:                              "\u226b",
	HARDcy:                          "\u042a",
	Hacek:                           "\u02c7",
	Hat:                             "\u005e",
	Hcirc:                           "\u0124",
	Hfr:                             "\u210c",
	HilbertSpace:                    "\u210b",
	Hopf:                            "\u210d",
	HorizontalLine:                  "\u2500",
	Hscr:                            "\u210b",
	Hstrok:                          "\u0126",
	HumpDownHump:                    "\u224e",
	HumpEqual:                       "\u224f",
	IEcy:                            "\u0415",
	IJlig:                           "\u0132",
	IOcy:                            "\u0401",
	Iacute:                          "\u00cd",
	Icirc:                           "\u00ce",
	Icy:                             "\u0418",
	Idot:                            "\u0130",
	Ifr:                             "\u2111",
	Igrave:                          "\u00cc",
	Im:                              "\u2111",
	Imacr:                           "\u012a",
	ImaginaryI:                      "\u2148",
	Implies:                         "\u21d2",
	Int:                             "\u222c",
	Integral:                        "\u222b",
	Intersection:                    "\u22c2",
	InvisibleComma:                  "\u2063",
	InvisibleTimes:                  "\u2062",
	Iogon:                           "\u012e",
	Iopf:                            "\ud835\udd40",
	Iota:                            "\u0399",
	Iscr:                            "\u2110",
	Itilde:                          "\u0128",
	Iukcy:                           "\u0406",
	Iuml:                            "\u00cf",
	Jcirc:                           "\u0134",
	Jcy:                             "\u0419",
	Jfr:                             "\ud835\udd0d",
	Jopf:                            "\ud835\udd41",
	Jscr:                            "\ud835\udca5",
	Jsercy:                          "\u0408",
	Jukcy:                           "\u0404",
	KHcy:                            "\u0425",
	KJcy:                            "\u040c",
	Kappa:                           "\u039a",
	Kcedil:                          "\u0136",
	Kcy:                             "\u041a",
	Kfr:                             "\ud835\udd0e",
	Kopf:                            "\ud835\udd42",
	Kscr:                            "\ud835\udca6",
	LJcy:                            "\u0409",
	Lacute:                          "\u0139",
	Lambda:                          "\u039b",
	Lang:                            "\u27ea",
	Laplacetrf:                      "\u2112",
	Larr:                            "\u219e",
	Lcaron:                          "\u013d",
	Lcedil:                          "\u013b",
	Lcy:                             "\u041b",
	LeftAngleBracket:                "\u27e8",
	LeftArrow:                       "\u2190",
	LeftArrowBar:                    "\u21e4",
	LeftArrowRightArrow:             "\u21c6",
	LeftCeiling:                     "\u2308",
	LeftDoubleBracket:               "\u27e6",
	LeftDownTeeVector:               "\u2961",
	LeftDownVector:                  "\u21c3",
	LeftDownVectorBar:               "\u2959",
	LeftFloor:                       "\u230a",
	LeftRightArrow:                  "\u2194",
	LeftRightVector:                 "\u294e",
	LeftTee:                         "\u22a3",
	LeftTeeArrow:                    "\u21a4",
	LeftTeeVector:                   "\u295a",
	LeftTriangle:                    "\u22b2",
	LeftTriangleBar:                 "\u29cf",
	LeftTriangleEqual:               "\u22b4",
	LeftUpDownVector:                "\u2951",
	LeftUpTeeVector:                 "\u2960",
	LeftUpVector:                    "\u21bf",
	LeftUpVectorBar:                 "\u2958",
	LeftVector:                      "\u21bc",
	LeftVectorBar:                   "\u2952",
	Leftarrow:                       "\u21d0",
	Leftrightarrow:                  "\u21d4",
	LessEqualGreater:                "\u22da",
	LessFullEqual:                   "\u2266",
	LessGreater:                     "\u2276",
	LessLess:                        "\u2aa1",
	LessSlantEqual:                  "\u2a7d",
	LessTilde:                       "\u2272",
	Lfr:                             "\ud835\udd0f",
	Ll:                              "\u22d8",
	Lleftarrow:                      "\u21da",
	Lmidot:                          "\u013f",
	LongLeftArrow:                   "\u27f5",
	LongLeftRightArrow:              "\u27f7",
	LongRightArrow:                  "\u27f6",
	Longleftarrow:                   "\u27f8",
	Longleftrightarrow:              "\u27fa",
	Longrightarrow:                  "\u27f9",
	Lopf:                            "\ud835\udd43",
	LowerLeftArrow:                  "\u2199",
	LowerRightArrow:                 "\u2198",
	Lscr:                            "\u2112",
	Lsh:                             "\u21b0",
	Lstrok:                          "\u0141",
	Lt:                              "\u226a",
	Map:                             "\u2905",
	Mcy:                             "\u041c",
	MediumSpace:                     "\u205f",
	Mellintrf:                       "\u2133",
	Mfr:                             "\ud835\udd10",
	MinusPlus:                       "\u2213",
	Mopf:                            "\ud835\udd44",
	Mscr:                            "\u2133",
	Mu:                              "\u039c",
	NJcy:                            "\u040a",
	Nacute:                          "\u0143",
	Ncaron:                          "\u0147",
	Ncedil:                          "\u0145",
	Ncy:                             "\u041d",
	NegativeMediumSpace:             "\u200b",
	NegativeThickSpace:              "\u200b",
	NegativeThinSpace:               "\u200b",
	NegativeVeryThinSpace:           "\u200b",
	NestedGreaterGreater:            "\u226b",
	NestedLessLess:                  "\u226a",
	NewLine:                         "\u000a",
	Nfr:                             "\ud835\udd11",
	NoBreak:                         "\u2060",
	NonBreakingSpace:                "\u00a0",
	Nopf:                            "\u2115",
	Not:                             "\u2aec",
	NotCongruent:                    "\u2262",
	NotCupCap:                       "\u226d",
	NotDoubleVerticalBar:            "\u2226",
	NotElement:                      "\u2209",
	NotEqual:                        "\u2260",
	NotEqualTilde:                   "\u2242\u0338",
	NotExists:                       "\u2204",
	NotGreater:                      "\u226f",
	NotGreaterEqual:                 "\u2271",
	NotGreaterFullEqual:             "\u2267\u0338",
	NotGreaterGreater:               "\u226b\u0338",
	NotGreaterLess:                  "\u2279",
	NotGreaterSlantEqual:            "\u2a7e\u0338",
	NotGreaterTilde:                 "\u2275",
	NotHumpDownHump:                 "\u224e\u0338",
	NotHumpEqual:                    "\u224f\u0338",
	NotLeftTriangle:                 "\u22ea",
	NotLeftTriangleBar:              "\u29cf\u0338",
	NotLeftTriangleEqual:            "\u22ec",
	NotLess:                         "\u226e",
	NotLessEqual:                    "\u2270",
	NotLessGreater:                  "\u2278",
	NotLessLess:                     "\u226a\u0338",
	NotLessSlantEqual:               "\u2a7d\u0338",
	NotLessTilde:                    "\u2274",
	NotNestedGreaterGreater:         "\u2aa2\u0338",
	NotNestedLessLess:               "\u2aa1\u0338",
	NotPrecedes:                     "\u2280",
	NotPrecedesEqual:                "\u2aaf\u0338",
	NotPrecedesSlantEqual:           "\u22e0",
	NotReverseElement:               "\u220c",
	NotRightTriangle:                "\u22eb",
	NotRightTriangleBar:             "\u29d0\u0338",
	NotRightTriangleEqual:           "\u22ed",
	NotSquareSubset:                 "\u228f\u0338",
	NotSquareSubsetEqual:            "\u22e2",
	NotSquareSuperset:               "\u2290\u0338",
	NotSquareSupersetEqual:          "\u22e3",
	NotSubset:                       "\u2282\u20d2",
	NotSubsetEqual:                  "\u2288",
	NotSucceeds:                     "\u2281",
	NotSucceedsEqual:                "\u2ab0\u0338",
	NotSucceedsSlantEqual:           "\u22e1",
	NotSucceedsTilde:                "\u227f\u0338",
	NotSuperset:                     "\u2283\u20d2",
	NotSupersetEqual:                "\u2289",
	NotTilde:                        "\u2241",
	NotTildeEqual:                   "\u2244",
	NotTildeFullEqual:               "\u2247",
	NotTildeTilde:                   "\u2249",
	NotVerticalBar:                  "\u2224",
	Nscr:                            "\ud835\udca9",
	Ntilde:                          "\u00d1",
	Nu:                              "\u039d",
	OElig:                           "\u0152",
	Oacute:                          "\u00d3",
	Ocirc:                           "\u00d4",
	Ocy:                             "\u041e",
	Odblac:                          "\u0150",
	Ofr:                             "\ud835\udd12",
	Ograve:                          "\u00d2",
	Omacr:                           "\u014c",
	Omega:                           "\u03a9",
	Omicron:                         "\u039f",
	Oopf:                            "\ud835\udd46",
	OpenCurlyDoubleQuote:            "\u201c",
	OpenCurlyQuote:                  "\u2018",
	Or:                              "\u2a54",
	Oscr:                            "\ud835\udcaa",
	Oslash:                          "\u00d8",
	Otilde:                          "\u00d5",
	Otimes:                          "\u2a37",
	Ouml:                            "\u00d6",
	OverBar:                         "\u203e",
	OverBrace:                       "\u23de",
	OverBracket:                     "\u23b4",
	OverParenthesis:                 "\u23dc",
	PartialD:                        "\u2202",
	Pcy:                             "\u041f",
	Pfr:                             "\ud835\udd13",
	Phi:                             "\u03a6",
	Pi:                              "\u03a0",
	PlusMinus:                       "\u00b1",
	Poincareplane:                   "\u210c",
	Popf:                            "\u2119",
	Pr:                              "\u2abb",
	Precedes:                        "\u227a",
	PrecedesEqual:                   "\u2aaf",
	PrecedesSlantEqual:              "\u227c",
	PrecedesTilde:                   "\u227e",
	Prime:                           "\u2033",
	Product:                         "\u220f",
	Proportion:                      "\u2237",
	Proportional:                    "\u221d",
	Pscr:                            "\ud835\udcab",
	Psi:                             "\u03a8",
	QUOT:                            "\u0022",
	Qfr:                             "\ud835\udd14",
	Qopf:                            "\u211a",
	Qscr:                            "\ud835\udcac",
	RBarr:                           "\u2910",
	REG:                             "\u00ae",
	Racute:                          "\u0154",
	Rang:                            "\u27eb",
	Rarr:                            "\u21a0",
	Rarrtl:                          "\u2916",
	Rcaron:                          "\u0158",
	Rcedil:                          "\u0156",
	Rcy:                             "\u0420",
	Re:                              "\u211c",
	ReverseElement:                  "\u220b",
	ReverseEquilibrium:              "\u21cb",
	ReverseUpEquilibrium:            "\u296f",
	Rfr:                             "\u211c",
	Rho:                             "\u03a1",
	RightAngleBracket:               "\u27e9",
	RightArrow:                      "\u2192",
	RightArrowBar:                   "\u21e5",
	RightArrowLeftArrow:             "\u21c4",
	RightCeiling:                    "\u2309",
	RightDoubleBracket:              "\u27e7",
	RightDownTeeVector:              "\u295d",
	RightDownVector:                 "\u21c2",
	RightDownVectorBar:              "\u2955",
	RightFloor:                      "\u230b",
	RightTee:                        "\u22a2",
	RightTeeArrow:                   "\u21a6",
	RightTeeVector:                  "\u295b",
	RightTriangle:                   "\u22b3",
	RightTriangleBar:                "\u29d0",
	RightTriangleEqual:              "\u22b5",
	RightUpDownVector:               "\u294f",
	RightUpTeeVector:                "\u295c",
	RightUpVector:                   "\u21be",
	RightUpVectorBar:                "\u2954",
	RightVector:                     "\u21c0",
	RightVectorBar:                  "\u2953",
	Rightarrow:                      "\u21d2",
	Ropf:                            "\u211d",
	RoundImplies:                    "\u2970",
	Rrightarrow:                     "\u21db",
	Rscr:                            "\u211b",
	Rsh:                             "\u21b1",
	RuleDelayed:                     "\u29f4",
	SHCHcy:                          "\u0429",
	SHcy:                            "\u0428",
	SOFTcy:                          "\u042c",
	Sacute:                          "\u015a",
	Sc:                              "\u2abc",
	Scaron:                          "\u0160",
	Scedil:                          "\u015e",
	Scirc:                           "\u015c",
	Scy:                             "\u0421",
	Sfr:                             "\ud835\udd16",
	ShortDownArrow:                  "\u2193",
	ShortLeftArrow:                  "\u2190",
	ShortRightArrow:                 "\u2192",
	ShortUpArrow:                    "\u2191",
	Sigma:                           "\u03a3",
	SmallCircle:                     "\u2218",
	Sopf:                            "\ud835\udd4a",
	Sqrt:                            "\u221a",
	Square:                          "\u25a1",
	SquareIntersection:              "\u2293",
	SquareSubset:                    "\u228f",
	SquareSubsetEqual:               "\u2291",
	SquareSuperset:                  "\u2290",
	SquareSupersetEqual:             "\u2292",
	SquareUnion:                     "\u2294",
	Sscr:                            "\ud835\udcae",
	Star:                            "\u22c6",
	Sub:                             "\u22d0",
	Subset:                          "\u22d0",
	SubsetEqual:                     "\u2286",
	Succeeds:                        "\u227b",
	SucceedsEqual:                   "\u2ab0",
	SucceedsSlantEqual:              "\u227d",
	SucceedsTilde:                   "\u227f",
	SuchThat:                        "\u220b",
	Sum:                             "\u2211",
	Sup:                             "\u22d1",
	Superset:                        "\u2283",
	SupersetEqual:                   "\u2287",
	Supset:                          "\u22d1",
	THORN:                           "\u00de",
	TRADE:                           "\u2122",
	TSHcy:                           "\u040b",
	TScy:                            "\u0426",
	Tab:                             "\u0009",
	Tau:                             "\u03a4",
	Tcaron:                          "\u0164",
	Tcedil:                          "\u0162",
	Tcy:                             "\u0422",
	Tfr:                             "\ud835\udd17",
	Therefore:                       "\u2234",
	Theta:                           "\u0398",
	ThickSpace:                      "\u205f\u200a",
	ThinSpace:                       "\u2009",
	Tilde:                           "\u223c",
	TildeEqual:                      "\u2243",
	TildeFullEqual:                  "\u2245",
	TildeTilde:                      "\u2248",
	Topf:                            "\ud835\udd4b",
	TripleDot:                       "\u20db",
	Tscr:                            "\ud835\udcaf",
	Tstrok:                          "\u0166",
	Uacute:                          "\u00da",
	Uarr:                            "\u219f",
	Uarrocir:                        "\u2949",
	Ubrcy:                           "\u040e",
	Ubreve:                          "\u016c",
	Ucirc:                           "\u00db",
	Ucy:                             "\u0423",
	Udblac:                          "\u0170",
	Ufr:                             "\ud835\udd18",
	Ugrave:                          "\u00d9",
	Umacr:                           "\u016a",
	UnderBar:                        "\u005f",
	UnderBrace:                      "\u23df",
	UnderBracket:                    "\u23b5",
	UnderParenthesis:                "\u23dd",
	Union:                           "\u22c3",
	UnionPlus:                       "\u228e",
	Uogon:                           "\u0172",
	Uopf:                            "\ud835\udd4c",
	UpArrow:                         "\u2191",
	UpArrowBar:                      "\u2912",
	UpArrowDownArrow:                "\u21c5",
	UpDownArrow:                     "\u2195",
	UpEquilibrium:                   "\u296e",
	UpTee:                           "\u22a5",
	UpTeeArrow:                      "\u21a5",
	Uparrow:                         "\u21d1",
	Updownarrow:                     "\u21d5",
	UpperLeftArrow:                  "\u2196",
	UpperRightArrow:                 "\u2197",
	Upsi:                            "\u03d2",
	Upsilon:                         "\u03a5",
	Uring:                           "\u016e",
	Uscr:                            "\ud835\udcb0",
	Utilde:                          "\u0168",
	Uuml:                            "\u00dc",
	VDash:                           "\u22ab",
	Vbar:                            "\u2aeb",
	Vcy:                             "\u0412",
	Vdash:                           "\u22a9",
	Vdashl:                          "\u2ae6",
	Vee:                             "\u22c1",
	Verbar:                          "\u2016",
	Vert:                            "\u2016",
	VerticalBar:                     "\u2223",
	VerticalLine:                    "\u007c",
	VerticalSeparator:               "\u2758",
	VerticalTilde:                   "\u2240",
	VeryThinSpace:                   "\u200a",
	Vfr:                             "\ud835\udd19",
	Vopf:                            "\ud835\udd4d",
	Vscr:                            "\ud835\udcb1",
	Vvdash:                          "\u22aa",
	Wcirc:                           "\u0174",
	Wedge:                           "\u22c0",
	Wfr:                             "\ud835\udd1a",
	Wopf:                            "\ud835\udd4e",
	Wscr:                            "\ud835\udcb2",
	Xfr:                             "\ud835\udd1b",
	Xi:                              "\u039e",
	Xopf:                            "\ud835\udd4f",
	Xscr:                            "\ud835\udcb3",
	YAcy:                            "\u042f",
	YIcy:                            "\u0407",
	YUcy:                            "\u042e",
	Yacute:                          "\u00dd",
	Ycirc:                           "\u0176",
	Ycy:                             "\u042b",
	Yfr:                             "\ud835\udd1c",
	Yopf:                            "\ud835\udd50",
	Yscr:                            "\ud835\udcb4",
	Yuml:                            "\u0178",
	ZHcy:                            "\u0416",
	Zacute:                          "\u0179",
	Zcaron:                          "\u017d",
	Zcy:                             "\u0417",
	Zdot:                            "\u017b",
	ZeroWidthSpace:                  "\u200b",
	Zeta:                            "\u0396",
	Zfr:                             "\u2128",
	Zopf:                            "\u2124",
	Zscr:                            "\ud835\udcb5",
	aacute:                          "\u00e1",
	abreve:                          "\u0103",
	ac:                              "\u223e",
	acE:                             "\u223e\u0333",
	acd:                             "\u223f",
	acirc:                           "\u00e2",
	acute:                           "\u00b4",
	acy:                             "\u0430",
	aelig:                           "\u00e6",
	af:                              "\u2061",
	afr:                             "\ud835\udd1e",
	agrave:                          "\u00e0",
	alefsym:                         "\u2135",
	aleph:                           "\u2135",
	alpha:                           "\u03b1",
	amacr:                           "\u0101",
	amalg:                           "\u2a3f",
	and:                             "\u2227",
	andand:                          "\u2a55",
	andd:                            "\u2a5c",
	andslope:                        "\u2a58",
	andv:                            "\u2a5a",
	ang:                             "\u2220",
	ange:                            "\u29a4",
	angle:                           "\u2220",
	angmsd:                          "\u2221",
	angmsdaa:                        "\u29a8",
	angmsdab:                        "\u29a9",
	angmsdac:                        "\u29aa",
	angmsdad:                        "\u29ab",
	angmsdae:                        "\u29ac",
	angmsdaf:                        "\u29ad",
	angmsdag:                        "\u29ae",
	angmsdah:                        "\u29af",
	angrt:                           "\u221f",
	angrtvb:                         "\u22be",
	angrtvbd:                        "\u299d",
	angsph:                          "\u2222",
	angst:                           "\u00c5",
	angzarr:                         "\u237c",
	aogon:                           "\u0105",
	aopf:                            "\ud835\udd52",
	ap:                              "\u2248",
	apE:                             "\u2a70",
	apacir:                          "\u2a6f",
	ape:                             "\u224a",
	apid:                            "\u224b",
	apos:                            "\u0027",
	approx:                          "\u2248",
	approxeq:                        "\u224a",
	aring:                           "\u00e5",
	ascr:                            "\ud835\udcb6",
	ast:                             "\u002a",
	asymp:                           "\u2248",
	asympeq:                         "\u224d",
	atilde:                          "\u00e3",
	auml:                            "\u00e4",
	awconint:                        "\u2233",
	awint:                           "\u2a11",
	bNot:                            "\u2aed",
	backcong:                        "\u224c",
	backepsilon:                     "\u03f6",
	backprime:                       "\u2035",
	backsim:                         "\u223d",
	backsimeq:                       "\u22cd",
	barvee:                          "\u22bd",
	barwed:                          "\u2305",
	barwedge:                        "\u2305",
	bbrk:                            "\u23b5",
	bbrktbrk:                        "\u23b6",
	bcong:                           "\u224c",
	bcy:                             "\u0431",
	bdquo:                           "\u201e",
	becaus:                          "\u2235",
	because:                         "\u2235",
	bemptyv:                         "\u29b0",
	bepsi:                           "\u03f6",
	bernou:                          "\u212c",
	beta:                            "\u03b2",
	beth:                            "\u2136",
	between:                         "\u226c",
	bfr:                             "\ud835\udd1f",
	bigcap:                          "\u22c2",
	bigcirc:                         "\u25ef",
	bigcup:                          "\u22c3",
	bigodot:                         "\u2a00",
	bigoplus:                        "\u2a01",
	bigotimes:                       "\u2a02",
	bigsqcup:                        "\u2a06",
	bigstar:                         "\u2605",
	bigtriangledown:                 "\u25bd",
	bigtriangleup:                   "\u25b3",
	biguplus:                        "\u2a04",
	bigvee:                          "\u22c1",
	bigwedge:                        "\u22c0",
	bkarow:                          "\u290d",
	blacklozenge:                    "\u29eb",
	blacksquare:                     "\u25aa",
	blacktriangle:                   "\u25b4",
	blacktriangledown:               "\u25be",
	blacktriangleleft:               "\u25c2",
	blacktriangleright:              "\u25b8",
	blank:                           "\u2423",
	blk12:                           "\u2592",
	blk14:                           "\u2591",
	blk34:                           "\u2593",
	block:                           "\u2588",
	bne:                             "\u003d\u20e5",
	bnequiv:                         "\u2261\u20e5",
	bnot:                            "\u2310",
	bopf:                            "\ud835\udd53",
	bot:                             "\u22a5",
	bottom:                          "\u22a5",
	bowtie:                          "\u22c8",
	boxDL:                           "\u2557",
	boxDR:                           "\u2554",
	boxDl:                           "\u2556",
	boxDr:                           "\u2553",
	boxH:                            "\u2550",
	boxHD:                           "\u2566",
	boxHU:                           "\u2569",
	boxHd:                           "\u2564",
	boxHu:                           "\u2567",
	boxUL:                           "\u255d",
	boxUR:                           "\u255a",
	boxUl:                           "\u255c",
	boxUr:                           "\u2559",
	boxV:                            "\u2551",
	boxVH:                           "\u256c",
	boxVL:                           "\u2563",
	boxVR:                           "\u2560",
	boxVh:                           "\u256b",
	boxVl:                           "\u2562",
	boxVr:                           "\u255f",
	boxbox:                          "\u29c9",
	boxdL:                           "\u2555",
	boxdR:                           "\u2552",
	boxdl:                           "\u2510",
	boxdr:                           "\u250c",
	boxh:                            "\u2500",
	boxhD:                           "\u2565",
	boxhU:                           "\u2568",
	boxhd:                           "\u252c",
	boxhu:                           "\u2534",
	boxminus:                        "\u229f",
	boxplus:                         "\u229e",
	boxtimes:                        "\u22a0",
	boxuL:                           "\u255b",
	boxuR:                           "\u2558",
	boxul:                           "\u2518",
	boxur:                           "\u2514",
	boxv:                            "\u2502",
	boxvH:                           "\u256a",
	boxvL:                           "\u2561",
	boxvR:                           "\u255e",
	boxvh:                           "\u253c",
	boxvl:                           "\u2524",
	boxvr:                           "\u251c",
	bprime:                          "\u2035",
	breve:                           "\u02d8",
	brvbar:                          "\u00a6",
	bscr:                            "\ud835\udcb7",
	bsemi:                           "\u204f",
	bsim:                            "\u223d",
	bsime:                           "\u22cd",
	bsol:                            "\u005c",
	bsolb:                           "\u29c5",
	bsolhsub:                        "\u27c8",
	bull:                            "\u2022",
	bullet:                          "\u2022",
	bump:                            "\u224e",
	bumpE:                           "\u2aae",
	bumpe:                           "\u224f",
	bumpeq:                          "\u224f",
	cacute:                          "\u0107",
	cap:                             "\u2229",
	capand:                          "\u2a44",
	capbrcup:                        "\u2a49",
	capcap:                          "\u2a4b",
	capcup:                          "\u2a47",
	capdot:                          "\u2a40",
	caps:                            "\u2229\ufe00",
	caret:                           "\u2041",
	caron:                           "\u02c7",
	ccaps:                           "\u2a4d",
	ccaron:                          "\u010d",
	ccedil:                          "\u00e7",
	ccirc:                           "\u0109",
	ccups:                           "\u2a4c",
	ccupssm:                         "\u2a50",
	cdot:                            "\u010b",
	cedil:                           "\u00b8",
	cemptyv:                         "\u29b2",
	cent:                            "\u00a2",
	centerdot:                       "\u00b7",
	cfr:                             "\ud835\udd20",
	chcy:                            "\u0447",
	check:                           "\u2713",
	checkmark:                       "\u2713",
	chi:                             "\u03c7",
	cir:                             "\u25cb",
	cirE:                            "\u29c3",
	circ:                            "\u02c6",
	circeq:                          "\u2257",
	circlearrowleft:                 "\u21ba",
	circlearrowright:                "\u21bb",
	circledR:                        "\u00ae",
	circledS:                        "\u24c8",
	circledast:                      "\u229b",
	circledcirc:                     "\u229a",
	circleddash:                     "\u229d",
	cire:                            "\u2257",
	cirfnint:                        "\u2a10",
	cirmid:                          "\u2aef",
	cirscir:                         "\u29c2",
	clubs:                           "\u2663",
	clubsuit:                        "\u2663",
	colon:                           "\u003a",
	colone:                          "\u2254",
	coloneq:                         "\u2254",
	comma:                           "\u002c",
	commat:                          "\u0040",
	comp:                            "\u2201",
	compfn:                          "\u2218",
	complement:                      "\u2201",
	complexes:                       "\u2102",
	cong:                            "\u2245",
	congdot:                         "\u2a6d",
	conint:                          "\u222e",
	copf:                            "\ud835\udd54",
	coprod:                          "\u2210",
	copy:                            "\u00a9",
	copysr:                          "\u2117",
	crarr:                           "\u21b5",
	cross:                           "\u2717",
	cscr:                            "\ud835\udcb8",
	csub:                            "\u2acf",
	csube:                           "\u2ad1",
	csup:                            "\u2ad0",
	csupe:                           "\u2ad2",
	ctdot:                           "\u22ef",
	cudarrl:                         "\u2938",
	cudarrr:                         "\u2935",
	cuepr:                           "\u22de",
	cuesc:                           "\u22df",
	cularr:                          "\u21b6",
	cularrp:                         "\u293d",
	cup:                             "\u222a",
	cupbrcap:                        "\u2a48",
	cupcap:                          "\u2a46",
	cupcup:                          "\u2a4a",
	cupdot:                          "\u228d",
	cupor:                           "\u2a45",
	cups:                            "\u222a\ufe00",
	curarr:                          "\u21b7",
	curarrm:                         "\u293c",
	curlyeqprec:                     "\u22de",
	curlyeqsucc:                     "\u22df",
	curlyvee:                        "\u22ce",
	curlywedge:                      "\u22cf",
	curren:                          "\u00a4",
	curvearrowleft:                  "\u21b6",
	curvearrowright:                 "\u21b7",
	cuvee:                           "\u22ce",
	cuwed:                           "\u22cf",
	cwconint:                        "\u2232",
	cwint:                           "\u2231",
	cylcty:                          "\u232d",
	dArr:                            "\u21d3",
	dHar:                            "\u2965",
	dagger:                          "\u2020",
	daleth:                          "\u2138",
	darr:                            "\u2193",
	dash:                            "\u2010",
	dashv:                           "\u22a3",
	dbkarow:                         "\u290f",
	dblac:                           "\u02dd",
	dcaron:                          "\u010f",
	dcy:                             "\u0434",
	dd:                              "\u2146",
	ddagger:                         "\u2021",
	ddarr:                           "\u21ca",
	ddotseq:                         "\u2a77",
	deg:                             "\u00b0",
	delta:                           "\u03b4",
	demptyv:                         "\u29b1",
	dfisht:                          "\u297f",
	dfr:                             "\ud835\udd21",
	dharl:                           "\u21c3",
	dharr:                           "\u21c2",
	diam:                            "\u22c4",
	diamond:                         "\u22c4",
	diamondsuit:                     "\u2666",
	diams:                           "\u2666",
	die:                             "\u00a8",
	digamma:                         "\u03dd",
	disin:                           "\u22f2",
	div:                             "\u00f7",
	divide:                          "\u00f7",
	divideontimes:                   "\u22c7",
	divonx:                          "\u22c7",
	djcy:                            "\u0452",
	dlcorn:                          "\u231e",
	dlcrop:                          "\u230d",
	dollar:                          "\u0024",
	dopf:                            "\ud835\udd55",
	dot:                             "\u02d9",
	doteq:                           "\u2250",
	doteqdot:                        "\u2251",
	dotminus:                        "\u2238",
	dotplus:                         "\u2214",
	dotsquare:                       "\u22a1",
	doublebarwedge:                  "\u2306",
	downarrow:                       "\u2193",
	downdownarrows:                  "\u21ca",
	downharpoonleft:                 "\u21c3",
	downharpoonright:                "\u21c2",
	drbkarow:                        "\u2910",
	drcorn:                          "\u231f",
	drcrop:                          "\u230c",
	dscr:                            "\ud835\udcb9",
	dscy:                            "\u0455",
	dsol:                            "\u29f6",
	dstrok:                          "\u0111",
	dtdot:                           "\u22f1",
	dtri:                            "\u25bf",
	dtrif:                           "\u25be",
	duarr:                           "\u21f5",
	duhar:                           "\u296f",
	dwangle:                         "\u29a6",
	dzcy:                            "\u045f",
	dzigrarr:                        "\u27ff",
	eDDot:                           "\u2a77",
	eDot:                            "\u2251",
	eacute:                          "\u00e9",
	easter:                          "\u2a6e",
	ecaron:                          "\u011b",
	ecir:                            "\u2256",
	ecirc:                           "\u00ea",
	ecolon:                          "\u2255",
	ecy:                             "\u044d",
	edot:                            "\u0117",
	ee:                              "\u2147",
	efDot:                           "\u2252",
	efr:                             "\ud835\udd22",
	eg:                              "\u2a9a",
	egrave:                          "\u00e8",
	egs:                             "\u2a96",
	egsdot:                          "\u2a98",
	el:                              "\u2a99",
	elinters:                        "\u23e7",
	ell:                             "\u2113",
	els:                             "\u2a95",
	elsdot:                          "\u2a97",
	emacr:                           "\u0113",
	empty:                           "\u2205",
	emptyset:                        "\u2205",
	emptyv:                          "\u2205",
	eng:                             "\u014b",
	eogon:                           "\u0119",
	eopf:                            "\ud835\udd56",
	epar:                            "\u22d5",
	eparsl:                          "\u29e3",
	eplus:                           "\u2a71",
	epsi:                            "\u03b5",
	epsilon:                         "\u03b5",
	epsiv:                           "\u03f5",
	eqcirc:                          "\u2256",
	eqcolon:                         "\u2255",
	eqsim:                           "\u2242",
	eqslantgtr:                      "\u2a96",
	eqslantless:                     "\u2a95",
	equals:                          "\u003d",
	equest:                          "\u225f",
	equiv:                           "\u2261",
	equivDD:                         "\u2a78",
	eqvparsl:                        "\u29e5",
	erDot:                           "\u2253",
	erarr:                           "\u2971",
	escr:                            "\u212f",
	esdot:                           "\u2250",
	esim:                            "\u2242",
	eta:                             "\u03b7",
	eth:                             "\u00f0",
	euml:                            "\u00eb",
	euro:                            "\u20ac",
	excl:                            "\u0021",
	exist:                           "\u2203",
	expectation:                     "\u2130",
	exponentiale:                    "\u2147",
	fallingdotseq:                   "\u2252",
	fcy:                             "\u0444",
	female:                          "\u2640",
	ffilig:                          "\ufb03",
	fflig:                           "\ufb00",
	ffllig:                          "\ufb04",
	ffr:                             "\ud835\udd23",
	filig:                           "\ufb01",
	fjlig:                           "\u0066\u006a",
	flat:                            "\u266d",
	fllig:                           "\ufb02",
	fltns:                           "\u25b1",
	fnof:                            "\u0192",
	fopf:                            "\ud835\udd57",
	forall:                          "\u2200",
	fork:                            "\u22d4",
	forkv:                           "\u2ad9",
	fpartint:                        "\u2a0d",
	frac12:                          "\u00bd",
	frac13:                          "\u2153",
	frac14:                          "\u00bc",
	frac15:                          "\u2155",
	frac16:                          "\u2159",
	frac18:                          "\u215b",
	frac23:                          "\u2154",
	frac25:                          "\u2156",
	frac34:                          "\u00be",
	frac35:                          "\u2157",
	frac38:                          "\u215c",
	frac45:                          "\u2158",
	frac56:                          "\u215a",
	frac58:                          "\u215d",
	frac78:                          "\u215e",
	frasl:                           "\u2044",
	frown:                           "\u2322",
	fscr:                            "\ud835\udcbb",
	gE:                              "\u2267",
	gEl:                             "\u2a8c",
	gacute:                          "\u01f5",
	gamma:                           "\u03b3",
	gammad:                          "\u03dd",
	gap:                             "\u2a86",
	gbreve:                          "\u011f",
	gcirc:                           "\u011d",
	gcy:                             "\u0433",
	gdot:                            "\u0121",
	ge:                              "\u2265",
	gel:                             "\u22db",
	geq:                             "\u2265",
	geqq:                            "\u2267",
	geqslant:                        "\u2a7e",
	ges:                             "\u2a7e",
	gescc:                           "\u2aa9",
	gesdot:                          "\u2a80",
	gesdoto:                         "\u2a82",
	gesdotol:                        "\u2a84",
	gesl:                            "\u22db\ufe00",
	gesles:                          "\u2a94",
	gfr:                             "\ud835\udd24",
	gg:                              "\u226b",
	ggg:                             "\u22d9",
	gimel:                           "\u2137",
	gjcy:                            "\u0453",
	gl:                              "\u2277",
	glE:                             "\u2a92",
	gla:                             "\u2aa5",
	glj:                             "\u2aa4",
	gnE:                             "\u2269",
	gnap:                            "\u2a8a",
	gnapprox:                        "\u2a8a",
	gne:                             "\u2a88",
	gneq:                            "\u2a88",
	gneqq:                           "\u2269",
	gnsim:                           "\u22e7",
	gopf:                            "\ud835\udd58",
	grave:                           "\u0060",
	gscr:                            "\u210a",
	gsim:                            "\u2273",
	gsime:                           "\u2a8e",
	gsiml:                           "\u2a90",
	gtcc:                            "\u2aa7",
	gtcir:                           "\u2a7a",
	gtdot:                           "\u22d7",
	gtlPar:                          "\u2995",
	gtquest:                         "\u2a7c",
	gtrapprox:                       "\u2a86",
	gtrarr:                          "\u2978",
	gtrdot:                          "\u22d7",
	gtreqless:                       "\u22db",
	gtreqqless:                      "\u2a8c",
	gtrless:                         "\u2277",
	gtrsim:                          "\u2273",
	gvertneqq:                       "\u2269\ufe00",
	gvnE:                            "\u2269\ufe00",
	hArr:                            "\u21d4",
	half:                            "\u00bd",
	hamilt:                          "\u210b",
	hardcy:                          "\u044a",
	harr:                            "\u2194",
	harrcir:                         "\u2948",
	harrw:                           "\u21ad",
	hbar:                            "\u210f",
	hcirc:                           "\u0125",
	hearts:                          "\u2665",
	heartsuit:                       "\u2665",
	hellip:                          "\u2026",
	hercon:                          "\u22b9",
	hfr:                             "\ud835\udd25",
	hksearow:                        "\u2925",
	hkswarow:                        "\u2926",
	hoarr:                           "\u21ff",
	homtht:                          "\u223b",
	hookleftarrow:                   "\u21a9",
	hookrightarrow:                  "\u21aa",
	hopf:                            "\ud835\udd59",
	horbar:                          "\u2015",
	hscr:                            "\ud835\udcbd",
	hslash:                          "\u210f",
	hstrok:                          "\u0127",
	hybull:                          "\u2043",
	hyphen:                          "\u2010",
	iacute:                          "\u00ed",
	ic:                              "\u2063",
	icirc:                           "\u00ee",
	icy:                             "\u0438",
	iecy:                            "\u0435",
	iexcl:                           "\u00a1",
	iff:                             "\u21d4",
	ifr:                             "\ud835\udd26",
	igrave:                          "\u00ec",
	ii:                              "\u2148",
	iiiint:                          "\u2a0c",
	iiint:                           "\u222d",
	iinfin:                          "\u29dc",
	iiota:                           "\u2129",
	ijlig:                           "\u0133",
	imacr:                           "\u012b",
	image:                           "\u2111",
	imagline:                        "\u2110",
	imagpart:                        "\u2111",
	imath:                           "\u0131",
	imof:                            "\u22b7",
	imped:                           "\u01b5",
	"in":                            "\u2208",
	incare:                          "\u2105",
	infin:                           "\u221e",
	infintie:                        "\u29dd",
	inodot:                          "\u0131",
	int:                             "\u222b",
	intcal:                          "\u22ba",
	integers:                        "\u2124",
	intercal:                        "\u22ba",
	intlarhk:                        "\u2a17",
	intprod:                         "\u2a3c",
	iocy:                            "\u0451",
	iogon:                           "\u012f",
	iopf:                            "\ud835\udd5a",
	iota:                            "\u03b9",
	iprod:                           "\u2a3c",
	iquest:                          "\u00bf",
	iscr:                            "\ud835\udcbe",
	isin:                            "\u2208",
	isinE:                           "\u22f9",
	isindot:                         "\u22f5",
	isins:                           "\u22f4",
	isinsv:                          "\u22f3",
	isinv:                           "\u2208",
	it:                              "\u2062",
	itilde:                          "\u0129",
	iukcy:                           "\u0456",
	iuml:                            "\u00ef",
	jcirc:                           "\u0135",
	jcy:                             "\u0439",
	jfr:                             "\ud835\udd27",
	jmath:                           "\u0237",
	jopf:                            "\ud835\udd5b",
	jscr:                            "\ud835\udcbf",
	jsercy:                          "\u0458",
	jukcy:                           "\u0454",
	kappa:                           "\u03ba",
	kappav:                          "\u03f0",
	kcedil:                          "\u0137",
	kcy:                             "\u043a",
	kfr:                             "\ud835\udd28",
	kgreen:                          "\u0138",
	khcy:                            "\u0445",
	kjcy:                            "\u045c",
	kopf:                            "\ud835\udd5c",
	kscr:                            "\ud835\udcc0",
	lAarr:                           "\u21da",
	lArr:                            "\u21d0",
	lAtail:                          "\u291b",
	lBarr:                           "\u290e",
	lE:                              "\u2266",
	lEg:                             "\u2a8b",
	lHar:                            "\u2962",
	lacute:                          "\u013a",
	laemptyv:                        "\u29b4",
	lagran:                          "\u2112",
	lambda:                          "\u03bb",
	lang:                            "\u27e8",
	langd:                           "\u2991",
	langle:                          "\u27e8",
	lap:                             "\u2a85",
	laquo:                           "\u00ab",
	larr:                            "\u2190",
	larrb:                           "\u21e4",
	larrbfs:                         "\u291f",
	larrfs:                          "\u291d",
	larrhk:                          "\u21a9",
	larrlp:                          "\u21ab",
	larrpl:                          "\u2939",
	larrsim:                         "\u2973",
	larrtl:                          "\u21a2",
	lat:                             "\u2aab",
	latail:                          "\u2919",
	late:                            "\u2aad",
	lates:                           "\u2aad\ufe00",
	lbarr:                           "\u290c",
	lbbrk:                           "\u2772",
	lbrace:                          "\u007b",
	lbrack:                          "\u005b",
	lbrke:                           "\u298b",
	lbrksld:                         "\u298f",
	lbrkslu:                         "\u298d",
	lcaron:                          "\u013e",
	lcedil:                          "\u013c",
	lceil:                           "\u2308",
	lcub:                            "\u007b",
	lcy:                             "\u043b",
	ldca:                            "\u2936",
	ldquo:                           "\u201c",
	ldquor:                          "\u201e",
	ldrdhar:                         "\u2967",
	ldrushar:                        "\u294b",
	ldsh:                            "\u21b2",
	le:                              "\u2264",
	leftarrow:                       "\u2190",
	leftarrowtail:                   "\u21a2",
	leftharpoondown:                 "\u21bd",
	leftharpoonup:                   "\u21bc",
	leftleftarrows:                  "\u21c7",
	leftrightarrow:                  "\u2194",
	leftrightarrows:                 "\u21c6",
	leftrightharpoons:               "\u21cb",
	leftrightsquigarrow:             "\u21ad",
	leftthreetimes:                  "\u22cb",
	leg:                             "\u22da",
	leq:                             "\u2264",
	leqq:                            "\u2266",
	leqslant:                        "\u2a7d",
	les:                             "\u2a7d",
	lescc:                           "\u2aa8",
	lesdot:                          "\u2a7f",
	lesdoto:                         "\u2a81",
	lesdotor:                        "\u2a83",
	lesg:                            "\u22da\ufe00",
	lesges:                          "\u2a93",
	lessapprox:                      "\u2a85",
	lessdot:                         "\u22d6",
	lesseqgtr:                       "\u22da",
	lesseqqgtr:                      "\u2a8b",
	lessgtr:                         "\u2276",
	lesssim:                         "\u2272",
	lfisht:                          "\u297c",
	lfloor:                          "\u230a",
	lfr:                             "\ud835\udd29",
	lg:                              "\u2276",
	lgE:                             "\u2a91",
	lhard:                           "\u21bd",
	lharu:                           "\u21bc",
	lharul:                          "\u296a",
	lhblk:                           "\u2584",
	ljcy:                            "\u0459",
	ll:                              "\u226a",
	llarr:                           "\u21c7",
	llcorner:                        "\u231e",
	llhard:                          "\u296b",
	lltri:                           "\u25fa",
	lmidot:                          "\u0140",
	lmoust:                          "\u23b0",
	lmoustache:                      "\u23b0",
	lnE:                             "\u2268",
	lnap:                            "\u2a89",
	lnapprox:                        "\u2a89",
	lne:                             "\u2a87",
	lneq:                            "\u2a87",
	lneqq:                           "\u2268",
	lnsim:                           "\u22e6",
	loang:                           "\u27ec",
	loarr:                           "\u21fd",
	lobrk:                           "\u27e6",
	longleftarrow:                   "\u27f5",
	longleftrightarrow:              "\u27f7",
	longmapsto:                      "\u27fc",
	longrightarrow:                  "\u27f6",
	looparrowleft:                   "\u21ab",
	looparrowright:                  "\u21ac",
	lopar:                           "\u2985",
	lopf:                            "\ud835\udd5d",
	loplus:                          "\u2a2d",
	lotimes:                         "\u2a34",
	lowast:                          "\u2217",
	lowbar:                          "\u005f",
	loz:                             "\u25ca",
	lozenge:                         "\u25ca",
	lozf:                            "\u29eb",
	lpar:                            "\u0028",
	lparlt:                          "\u2993",
	lrarr:                           "\u21c6",
	lrcorner:                        "\u231f",
	lrhar:                           "\u21cb",
	lrhard:                          "\u296d",
	lrm:                             "\u200e",
	lrtri:                           "\u22bf",
	lsaquo:                          "\u2039",
	lscr:                            "\ud835\udcc1",
	lsh:                             "\u21b0",
	lsim:                            "\u2272",
	lsime:                           "\u2a8d",
	lsimg:                           "\u2a8f",
	lsqb:                            "\u005b",
	lsquo:                           "\u2018",
	lsquor:                          "\u201a",
	lstrok:                          "\u0142",
	ltcc:                            "\u2aa6",
	ltcir:                           "\u2a79",
	ltdot:                           "\u22d6",
	lthree:                          "\u22cb",
	ltimes:                          "\u22c9",
	ltlarr:                          "\u2976",
	ltquest:                         "\u2a7b",
	ltrPar:                          "\u2996",
	ltri:                            "\u25c3",
	ltrie:                           "\u22b4",
	ltrif:                           "\u25c2",
	lurdshar:                        "\u294a",
	luruhar:                         "\u2966",
	lvertneqq:                       "\u2268\ufe00",
	lvnE:                            "\u2268\ufe00",
	mDDot:                           "\u223a",
	macr:                            "\u00af",
	male:                            "\u2642",
	malt:                            "\u2720",
	maltese:                         "\u2720",
	map:                             "\u21a6",
	mapsto:                          "\u21a6",
	mapstodown:                      "\u21a7",
	mapstoleft:                      "\u21a4",
	mapstoup:                        "\u21a5",
	marker:                          "\u25ae",
	mcomma:                          "\u2a29",
	mcy:                             "\u043c",
	mdash:                           "\u2014",
	measuredangle:                   "\u2221",
	mfr:                             "\ud835\udd2a",
	mho:                             "\u2127",
	micro:                           "\u00b5",
	mid:                             "\u2223",
	midast:                          "\u002a",
	midcir:                          "\u2af0",
	middot:                          "\u00b7",
	minus:                           "\u2212",
	minusb:                          "\u229f",
	minusd:                          "\u2238",
	minusdu:                         "\u2a2a",
	mlcp:                            "\u2adb",
	mldr:                            "\u2026",
	mnplus:                          "\u2213",
	models:                          "\u22a7",
	mopf:                            "\ud835\udd5e",
	mp:                              "\u2213",
	mscr:                            "\ud835\udcc2",
	mstpos:                          "\u223e",
	mu:                              "\u03bc",
	multimap:                        "\u22b8",
	mumap:                           "\u22b8",
	nGg:                             "\u22d9\u0338",
	nGt:                             "\u226b\u20d2",
	nGtv:                            "\u226b\u0338",
	nLeftarrow:                      "\u21cd",
	nLeftrightarrow:                 "\u21ce",
	nLl:                             "\u22d8\u0338",
	nLt:                             "\u226a\u20d2",
	nLtv:                            "\u226a\u0338",
	nRightarrow:                     "\u21cf",
	nVDash:                          "\u22af",
	nVdash:                          "\u22ae",
	nabla:                           "\u2207",
	nacute:                          "\u0144",
	nang:                            "\u2220\u20d2",
	nap:                             "\u2249",
	napE:                            "\u2a70\u0338",
	napid:                           "\u224b\u0338",
	napos:                           "\u0149",
	napprox:                         "\u2249",
	natur:                           "\u266e",
	natural:                         "\u266e",
	naturals:                        "\u2115",
	nbump:                           "\u224e\u0338",
	nbumpe:                          "\u224f\u0338",
	ncap:                            "\u2a43",
	ncaron:                          "\u0148",
	ncedil:                          "\u0146",
	ncong:                           "\u2247",
	ncongdot:                        "\u2a6d\u0338",
	ncup:                            "\u2a42",
	ncy:                             "\u043d",
	ndash:                           "\u2013",
	ne:                              "\u2260",
	neArr:                           "\u21d7",
	nearhk:                          "\u2924",
	nearr:                           "\u2197",
	nearrow:                         "\u2197",
	nedot:                           "\u2250\u0338",
	nequiv:                          "\u2262",
	nesear:                          "\u2928",
	nesim:                           "\u2242\u0338",
	nexist:                          "\u2204",
	nexists:                         "\u2204",
	nfr:                             "\ud835\udd2b",
	ngE:                             "\u2267\u0338",
	nge:                             "\u2271",
	ngeq:                            "\u2271",
	ngeqq:                           "\u2267\u0338",
	ngeqslant:                       "\u2a7e\u0338",
	nges:                            "\u2a7e\u0338",
	ngsim:                           "\u2275",
	ngt:                             "\u226f",
	ngtr:                            "\u226f",
	nhArr:                           "\u21ce",
	nharr:                           "\u21ae",
	nhpar:                           "\u2af2",
	ni:                              "\u220b",
	nis:                             "\u22fc",
	nisd:                            "\u22fa",
	niv:                             "\u220b",
	njcy:                            "\u045a",
	nlArr:                           "\u21cd",
	nlE:                             "\u2266\u0338",
	nlarr:                           "\u219a",
	nldr:                            "\u2025",
	nle:                             "\u2270",
	nleftarrow:                      "\u219a",
	nleftrightarrow:                 "\u21ae",
	nleq:                            "\u2270",
	nleqq:                           "\u2266\u0338",
	nleqslant:                       "\u2a7d\u0338",
	nles:                            "\u2a7d\u0338",
	nless:                           "\u226e",
	nlsim:                           "\u2274",
	nlt:                             "\u226e",
	nltri:                           "\u22ea",
	nltrie:                          "\u22ec",
	nmid:                            "\u2224",
	nopf:                            "\ud835\udd5f",
	not:                             "\u00ac",
	notin:                           "\u2209",
	notinE:                          "\u22f9\u0338",
	notindot:                        "\u22f5\u0338",
	notinva:                         "\u2209",
	notinvb:                         "\u22f7",
	notinvc:                         "\u22f6",
	notni:                           "\u220c",
	notniva:                         "\u220c",
	notnivb:                         "\u22fe",
	notnivc:                         "\u22fd",
	npar:                            "\u2226",
	nparallel:                       "\u2226",
	nparsl:                          "\u2afd\u20e5",
	npart:                           "\u2202\u0338",
	npolint:                         "\u2a14",
	npr:                             "\u2280",
	nprcue:                          "\u22e0",
	npre:                            "\u2aaf\u0338",
	nprec:                           "\u2280",
	npreceq:                         "\u2aaf\u0338",
	nrArr:                           "\u21cf",
	nrarr:                           "\u219b",
	nrarrc:                          "\u2933\u0338",
	nrarrw:                          "\u219d\u0338",
	nrightarrow:                     "\u219b",
	nrtri:                           "\u22eb",
	nrtrie:                          "\u22ed",
	nsc:                             "\u2281",
	nsccue:                          "\u22e1",
	nsce:                            "\u2ab0\u0338",
	nscr:                            "\ud835\udcc3",
	nshortmid:                       "\u2224",
	nshortparallel:                  "\u2226",
	nsim:                            "\u2241",
	nsime:                           "\u2244",
	nsimeq:                          "\u2244",
	nsmid:                           "\u2224",
	nspar:                           "\u2226",
	nsqsube:                         "\u22e2",
	nsqsupe:                         "\u22e3",
	nsub:                            "\u2284",
	nsubE:                           "\u2ac5\u0338",
	nsube:                           "\u2288",
	nsubset:                         "\u2282\u20d2",
	nsubseteq:                       "\u2288",
	nsubseteqq:                      "\u2ac5\u0338",
	nsucc:                           "\u2281",
	nsucceq:                         "\u2ab0\u0338",
	nsup:                            "\u2285",
	nsupE:                           "\u2ac6\u0338",
	nsupe:                           "\u2289",
	nsupset:                         "\u2283\u20d2",
	nsupseteq:                       "\u2289",
	nsupseteqq:                      "\u2ac6\u0338",
	ntgl:                            "\u2279",
	ntilde:                          "\u00f1",
	ntlg:                            "\u2278",
	ntriangleleft:                   "\u22ea",
	ntrianglelefteq:                 "\u22ec",
	ntriangleright:                  "\u22eb",
	ntrianglerighteq:                "\u22ed",
	nu:                              "\u03bd",
	num:                             "\u0023",
	numero:                          "\u2116",
	nvDash:                          "\u22ad",
	nvHarr:                          "\u2904",
	nvap:                            "\u224d\u20d2",
	nvdash:                          "\u22ac",
	nvge:                            "\u2265\u20d2",
	nvgt:                            "\u003e\u20d2",
	nvinfin:                         "\u29de",
	nvlArr:                          "\u2902",
	nvle:                            "\u2264\u20d2",
	nvlt:                            "\u003c\u20d2",
	nvltrie:                         "\u22b4\u20d2",
	nvrArr:                          "\u2903",
	nvrtrie:                         "\u22b5\u20d2",
	nvsim:                           "\u223c\u20d2",
	nwArr:                           "\u21d6",
	nwarhk:                          "\u2923",
	nwarr:                           "\u2196",
	nwarrow:                         "\u2196",
	nwnear:                          "\u2927",
	oS:                              "\u24c8",
	oacute:                          "\u00f3",
	oast:                            "\u229b",
	ocir:                            "\u229a",
	ocirc:                           "\u00f4",
	ocy:                             "\u043e",
	odash:                           "\u229d",
	odblac:                          "\u0151",
	odiv:                            "\u2a38",
	odot:                            "\u2299",
	odsold:                          "\u29bc",
	oelig:                           "\u0153",
	ofcir:                           "\u29bf",
	ofr:                             "\ud835\udd2c",
	ogon:                            "\u02db",
	ograve:                          "\u00f2",
	ogt:                             "\u29c1",
	ohbar:                           "\u29b5",
	ohm:                             "\u03a9",
	oint:                            "\u222e",
	olarr:                           "\u21ba",
	olcir:                           "\u29be",
	olcross:                         "\u29bb",
	oline:                           "\u203e",
	olt:                             "\u29c0",
	omacr:                           "\u014d",
	omega:                           "\u03c9",
	omicron:                         "\u03bf",
	omid:                            "\u29b6",
	ominus:                          "\u2296",
	oopf:                            "\ud835\udd60",
	opar:                            "\u29b7",
	operp:                           "\u29b9",
	oplus:                           "\u2295",
	or:                              "\u2228",
	orarr:                           "\u21bb",
	ord:                             "\u2a5d",
	order:                           "\u2134",
	orderof:                         "\u2134",
	ordf:                            "\u00aa",
	ordm:                            "\u00ba",
	origof:                          "\u22b6",
	oror:                            "\u2a56",
	orslope:                         "\u2a57",
	orv:                             "\u2a5b",
	oscr:                            "\u2134",
	oslash:                          "\u00f8",
	osol:                            "\u2298",
	otilde:                          "\u00f5",
	otimes:                          "\u2297",
	otimesas:                        "\u2a36",
	ouml:                            "\u00f6",
	ovbar:                           "\u233d",
	par:                             "\u2225",
	para:                            "\u00b6",
	parallel:                        "\u2225",
	parsim:                          "\u2af3",
	parsl:                           "\u2afd",
	part:                            "\u2202",
	pcy:                             "\u043f",
	percnt:                          "\u0025",
	period:                          "\u002e",
	permil:                          "\u2030",
	perp:                            "\u22a5",
	pertenk:                         "\u2031",
	pfr:                             "\ud835\udd2d",
	phi:                             "\u03c6",
	phiv:                            "\u03d5",
	phmmat:                          "\u2133",
	phone:                           "\u260e",
	pi:                              "\u03c0",
	pitchfork:                       "\u22d4",
	piv:                             "\u03d6",
	planck:                          "\u210f",
	planckh:                         "\u210e",
	plankv:                          "\u210f",
	plus:                            "\u002b",
	plusacir:                        "\u2a23",
	plusb:                           "\u229e",
	pluscir:                         "\u2a22",
	plusdo:                          "\u2214",
	plusdu:                          "\u2a25",
	pluse:                           "\u2a72",
	plusmn:                          "\u00b1",
	plussim:                         "\u2a26",
	plustwo:                         "\u2a27",
	pm:                              "\u00b1",
	pointint:                        "\u2a15",
	popf:                            "\ud835\udd61",
	pound:                           "\u00a3",
	pr:                              "\u227a",
	prE:                             "\u2ab3",
	prap:                            "\u2ab7",
	prcue:                           "\u227c",
	pre:                             "\u2aaf",
	prec:                            "\u227a",
	precapprox:                      "\u2ab7",
	preccurlyeq:                     "\u227c",
	preceq:                          "\u2aaf",
	precnapprox:                     "\u2ab9",
	precneqq:                        "\u2ab5",
	precnsim:                        "\u22e8",
	precsim:                         "\u227e",
	prime:                           "\u2032",
	primes:                          "\u2119",
	prnE:                            "\u2ab5",
	prnap:                           "\u2ab9",
	prnsim:                          "\u22e8",
	prod:                            "\u220f",
	profalar:                        "\u232e",
	profline:                        "\u2312",
	profsurf:                        "\u2313",
	prop:                            "\u221d",
	propto:                          "\u221d",
	prsim:                           "\u227e",
	prurel:                          "\u22b0",
	pscr:                            "\ud835\udcc5",
	psi:                             "\u03c8",
	qfr:                             "\ud835\udd2e",
	qint:                            "\u2a0c",
	qopf:                            "\ud835\udd62",
	qprime:                          "\u2057",
	qscr:                            "\ud835\udcc6",
	quaternions:                     "\u210d",
	quatint:                         "\u2a16",
	quest:                           "\u003f",
	questeq:                         "\u225f",
	rAarr:                           "\u21db",
	rArr:                            "\u21d2",
	rAtail:                          "\u291c",
	rBarr:                           "\u290f",
	rHar:                            "\u2964",
	race:                            "\u223d\u0331",
	racute:                          "\u0155",
	radic:                           "\u221a",
	raemptyv:                        "\u29b3",
	rang:                            "\u27e9",
	rangd:                           "\u2992",
	range:                           "\u29a5",
	rangle:                          "\u27e9",
	raquo:                           "\u00bb",
	rarr:                            "\u2192",
	rarrap:                          "\u2975",
	rarrb:                           "\u21e5",
	rarrbfs:                         "\u2920",
	rarrc:                           "\u2933",
	rarrfs:                          "\u291e",
	rarrhk:                          "\u21aa",
	rarrlp:                          "\u21ac",
	rarrpl:                          "\u2945",
	rarrsim:                         "\u2974",
	rarrtl:                          "\u21a3",
	rarrw:                           "\u219d",
	ratail:                          "\u291a",
	ratio:                           "\u2236",
	rationals:                       "\u211a",
	rbarr:                           "\u290d",
	rbbrk:                           "\u2773",
	rbrace:                          "\u007d",
	rbrack:                          "\u005d",
	rbrke:                           "\u298c",
	rbrksld:                         "\u298e",
	rbrkslu:                         "\u2990",
	rcaron:                          "\u0159",
	rcedil:                          "\u0157",
	rceil:                           "\u2309",
	rcub:                            "\u007d",
	rcy:                             "\u0440",
	rdca:                            "\u2937",
	rdldhar:                         "\u2969",
	rdquo:                           "\u201d",
	rdquor:                          "\u201d",
	rdsh:                            "\u21b3",
	real:                            "\u211c",
	realine:                         "\u211b",
	realpart:                        "\u211c",
	reals:                           "\u211d",
	rect:                            "\u25ad",
	reg:                             "\u00ae",
	rfisht:                          "\u297d",
	rfloor:                          "\u230b",
	rfr:                             "\ud835\udd2f",
	rhard:                           "\u21c1",
	rharu:                           "\u21c0",
	rharul:                          "\u296c",
	rho:                             "\u03c1",
	rhov:                            "\u03f1",
	rightarrow:                      "\u2192",
	rightarrowtail:                  "\u21a3",
	rightharpoondown:                "\u21c1",
	rightharpoonup:                  "\u21c0",
	rightleftarrows:                 "\u21c4",
	rightleftharpoons:               "\u21cc",
	rightrightarrows:                "\u21c9",
	rightsquigarrow:                 "\u219d",
	rightthreetimes:                 "\u22cc",
	ring:                            "\u02da",
	risingdotseq:                    "\u2253",
	rlarr:                           "\u21c4",
	rlhar:                           "\u21cc",
	rlm:                             "\u200f",
	rmoust:                          "\u23b1",
	rmoustache:                      "\u23b1",
	rnmid:                           "\u2aee",
	roang:                           "\u27ed",
	roarr:                           "\u21fe",
	robrk:                           "\u27e7",
	ropar:                           "\u2986",
	ropf:                            "\ud835\udd63",
	roplus:                          "\u2a2e",
	rotimes:                         "\u2a35",
	rpar:                            "\u0029",
	rpargt:                          "\u2994",
	rppolint:                        "\u2a12",
	rrarr:                           "\u21c9",
	rsaquo:                          "\u203a",
	rscr:                            "\ud835\udcc7",
	rsh:                             "\u21b1",
	rsqb:                            "\u005d",
	rsquo:                           "\u2019",
	rsquor:                          "\u2019",
	rthree:                          "\u22cc",
	rtimes:                          "\u22ca",
	rtri:                            "\u25b9",
	rtrie:                           "\u22b5",
	rtrif:                           "\u25b8",
	rtriltri:                        "\u29ce",
	ruluhar:                         "\u2968",
	rx:                              "\u211e",
	sacute:                          "\u015b",
	sbquo:                           "\u201a",
	sc:                              "\u227b",
	scE:                             "\u2ab4",
	scap:                            "\u2ab8",
	scaron:                          "\u0161",
	sccue:                           "\u227d",
	sce:                             "\u2ab0",
	scedil:                          "\u015f",
	scirc:                           "\u015d",
	scnE:                            "\u2ab6",
	scnap:                           "\u2aba",
	scnsim:                          "\u22e9",
	scpolint:                        "\u2a13",
	scsim:                           "\u227f",
	scy:                             "\u0441",
	sdot:                            "\u22c5",
	sdotb:                           "\u22a1",
	sdote:                           "\u2a66",
	seArr:                           "\u21d8",
	searhk:                          "\u2925",
	searr:                           "\u2198",
	searrow:                         "\u2198",
	sect:                            "\u00a7",
	//semi:                          "\u003b",
	seswar:                          "\u2929",
	setminus:                        "\u2216",
	setmn:                           "\u2216",
	sext:                            "\u2736",
	sfr:                             "\ud835\udd30",
	sfrown:                          "\u2322",
	sharp:                           "\u266f",
	shchcy:                          "\u0449",
	shcy:                            "\u0448",
	shortmid:                        "\u2223",
	shortparallel:                   "\u2225",
	shy:                             "\u00ad",
	sigma:                           "\u03c3",
	sigmaf:                          "\u03c2",
	sigmav:                          "\u03c2",
	sim:                             "\u223c",
	simdot:                          "\u2a6a",
	sime:                            "\u2243",
	simeq:                           "\u2243",
	simg:                            "\u2a9e",
	simgE:                           "\u2aa0",
	siml:                            "\u2a9d",
	simlE:                           "\u2a9f",
	simne:                           "\u2246",
	simplus:                         "\u2a24",
	simrarr:                         "\u2972",
	slarr:                           "\u2190",
	smallsetminus:                   "\u2216",
	smashp:                          "\u2a33",
	smeparsl:                        "\u29e4",
	smid:                            "\u2223",
	smile:                           "\u2323",
	smt:                             "\u2aaa",
	smte:                            "\u2aac",
	smtes:                           "\u2aac\ufe00",
	softcy:                          "\u044c",
	sol:                             "\u002f",
	solb:                            "\u29c4",
	solbar:                          "\u233f",
	sopf:                            "\ud835\udd64",
	spades:                          "\u2660",
	spadesuit:                       "\u2660",
	spar:                            "\u2225",
	sqcap:                           "\u2293",
	sqcaps:                          "\u2293\ufe00",
	sqcup:                           "\u2294",
	sqcups:                          "\u2294\ufe00",
	sqsub:                           "\u228f",
	sqsube:                          "\u2291",
	sqsubset:                        "\u228f",
	sqsubseteq:                      "\u2291",
	sqsup:                           "\u2290",
	sqsupe:                          "\u2292",
	sqsupset:                        "\u2290",
	sqsupseteq:                      "\u2292",
	squ:                             "\u25a1",
	square:                          "\u25a1",
	squarf:                          "\u25aa",
	squf:                            "\u25aa",
	srarr:                           "\u2192",
	sscr:                            "\ud835\udcc8",
	ssetmn:                          "\u2216",
	ssmile:                          "\u2323",
	sstarf:                          "\u22c6",
	star:                            "\u2606",
	starf:                           "\u2605",
	straightepsilon:                 "\u03f5",
	straightphi:                     "\u03d5",
	strns:                           "\u00af",
	sub:                             "\u2282",
	subE:                            "\u2ac5",
	subdot:                          "\u2abd",
	sube:                            "\u2286",
	subedot:                         "\u2ac3",
	submult:                         "\u2ac1",
	subnE:                           "\u2acb",
	subne:                           "\u228a",
	subplus:                         "\u2abf",
	subrarr:                         "\u2979",
	subset:                          "\u2282",
	subseteq:                        "\u2286",
	subseteqq:                       "\u2ac5",
	subsetneq:                       "\u228a",
	subsetneqq:                      "\u2acb",
	subsim:                          "\u2ac7",
	subsub:                          "\u2ad5",
	subsup:                          "\u2ad3",
	succ:                            "\u227b",
	succapprox:                      "\u2ab8",
	succcurlyeq:                     "\u227d",
	succeq:                          "\u2ab0",
	succnapprox:                     "\u2aba",
	succneqq:                        "\u2ab6",
	succnsim:                        "\u22e9",
	succsim:                         "\u227f",
	sum:                             "\u2211",
	sung:                            "\u266a",
	sup:                             "\u2283",
	sup1:                            "\u00b9",
	sup2:                            "\u00b2",
	sup3:                            "\u00b3",
	supE:                            "\u2ac6",
	supdot:                          "\u2abe",
	supdsub:                         "\u2ad8",
	supe:                            "\u2287",
	supedot:                         "\u2ac4",
	suphsol:                         "\u27c9",
	suphsub:                         "\u2ad7",
	suplarr:                         "\u297b",
	supmult:                         "\u2ac2",
	supnE:                           "\u2acc",
	supne:                           "\u228b",
	supplus:                         "\u2ac0",
	supset:                          "\u2283",
	supseteq:                        "\u2287",
	supseteqq:                       "\u2ac6",
	supsetneq:                       "\u228b",
	supsetneqq:                      "\u2acc",
	supsim:                          "\u2ac8",
	supsub:                          "\u2ad4",
	supsup:                          "\u2ad6",
	swArr:                           "\u21d9",
	swarhk:                          "\u2926",
	swarr:                           "\u2199",
	swarrow:                         "\u2199",
	swnwar:                          "\u292a",
	szlig:                           "\u00df",
	target:                          "\u2316",
	tau:                             "\u03c4",
	tbrk:                            "\u23b4",
	tcaron:                          "\u0165",
	tcedil:                          "\u0163",
	tcy:                             "\u0442",
	tdot:                            "\u20db",
	telrec:                          "\u2315",
	tfr:                             "\ud835\udd31",
	there4:                          "\u2234",
	therefore:                       "\u2234",
	theta:                           "\u03b8",
	thetasym:                        "\u03d1",
	thetav:                          "\u03d1",
	thickapprox:                     "\u2248",
	thicksim:                        "\u223c",
	thkap:                           "\u2248",
	thksim:                          "\u223c",
	thorn:                           "\u00fe",
	tilde:                           "\u02dc",
	times:                           "\u00d7",
	timesb:                          "\u22a0",
	timesbar:                        "\u2a31",
	timesd:                          "\u2a30",
	tint:                            "\u222d",
	toea:                            "\u2928",
	top:                             "\u22a4",
	topbot:                          "\u2336",
	topcir:                          "\u2af1",
	topf:                            "\ud835\udd65",
	topfork:                         "\u2ada",
	tosa:                            "\u2929",
	tprime:                          "\u2034",
	trade:                           "\u2122",
	triangle:                        "\u25b5",
	triangledown:                    "\u25bf",
	triangleleft:                    "\u25c3",
	trianglelefteq:                  "\u22b4",
	triangleq:                       "\u225c",
	triangleright:                   "\u25b9",
	trianglerighteq:                 "\u22b5",
	tridot:                          "\u25ec",
	trie:                            "\u225c",
	triminus:                        "\u2a3a",
	triplus:                         "\u2a39",
	trisb:                           "\u29cd",
	tritime:                         "\u2a3b",
	trpezium:                        "\u23e2",
	tscr:                            "\ud835\udcc9",
	tscy:                            "\u0446",
	tshcy:                           "\u045b",
	tstrok:                          "\u0167",
	twixt:                           "\u226c",
	twoheadleftarrow:                "\u219e",
	twoheadrightarrow:               "\u21a0",
	uArr:                            "\u21d1",
	uHar:                            "\u2963",
	uacute:                          "\u00fa",
	uarr:                            "\u2191",
	ubrcy:                           "\u045e",
	ubreve:                          "\u016d",
	ucirc:                           "\u00fb",
	ucy:                             "\u0443",
	udarr:                           "\u21c5",
	udblac:                          "\u0171",
	udhar:                           "\u296e",
	ufisht:                          "\u297e",
	ufr:                             "\ud835\udd32",
	ugrave:                          "\u00f9",
	uharl:                           "\u21bf",
	uharr:                           "\u21be",
	uhblk:                           "\u2580",
	ulcorn:                          "\u231c",
	ulcorner:                        "\u231c",
	ulcrop:                          "\u230f",
	ultri:                           "\u25f8",
	umacr:                           "\u016b",
	uml:                             "\u00a8",
	uogon:                           "\u0173",
	uopf:                            "\ud835\udd66",
	uparrow:                         "\u2191",
	updownarrow:                     "\u2195",
	upharpoonleft:                   "\u21bf",
	upharpoonright:                  "\u21be",
	uplus:                           "\u228e",
	upsi:                            "\u03c5",
	upsih:                           "\u03d2",
	upsilon:                         "\u03c5",
	upuparrows:                      "\u21c8",
	urcorn:                          "\u231d",
	urcorner:                        "\u231d",
	urcrop:                          "\u230e",
	uring:                           "\u016f",
	urtri:                           "\u25f9",
	uscr:                            "\ud835\udcca",
	utdot:                           "\u22f0",
	utilde:                          "\u0169",
	utri:                            "\u25b5",
	utrif:                           "\u25b4",
	uuarr:                           "\u21c8",
	uuml:                            "\u00fc",
	uwangle:                         "\u29a7",
	vArr:                            "\u21d5",
	vBar:                            "\u2ae8",
	vBarv:                           "\u2ae9",
	vDash:                           "\u22a8",
	vangrt:                          "\u299c",
	varepsilon:                      "\u03f5",
	varkappa:                        "\u03f0",
	varnothing:                      "\u2205",
	varphi:                          "\u03d5",
	varpi:                           "\u03d6",
	varpropto:                       "\u221d",
	varr:                            "\u2195",
	varrho:                          "\u03f1",
	varsigma:                        "\u03c2",
	varsubsetneq:                    "\u228a\ufe00",
	varsubsetneqq:                   "\u2acb\ufe00",
	varsupsetneq:                    "\u228b\ufe00",
	varsupsetneqq:                   "\u2acc\ufe00",
	vartheta:                        "\u03d1",
	vartriangleleft:                 "\u22b2",
	vartriangleright:                "\u22b3",
	vcy:                             "\u0432",
	vdash:                           "\u22a2",
	vee:                             "\u2228",
	veebar:                          "\u22bb",
	veeeq:                           "\u225a",
	vellip:                          "\u22ee",
	verbar:                          "\u007c",
	vert:                            "\u007c",
	vfr:                             "\ud835\udd33",
	vltri:                           "\u22b2",
	vnsub:                           "\u2282\u20d2",
	vnsup:                           "\u2283\u20d2",
	vopf:                            "\ud835\udd67",
	vprop:                           "\u221d",
	vrtri:                           "\u22b3",
	vscr:                            "\ud835\udccb",
	vsubnE:                          "\u2acb\ufe00",
	vsubne:                          "\u228a\ufe00",
	vsupnE:                          "\u2acc\ufe00",
	vsupne:                          "\u228b\ufe00",
	vzigzag:                         "\u299a",
	wcirc:                           "\u0175",
	wedbar:                          "\u2a5f",
	wedge:                           "\u2227",
	wedgeq:                          "\u2259",
	weierp:                          "\u2118",
	wfr:                             "\ud835\udd34",
	wopf:                            "\ud835\udd68",
	wp:                              "\u2118",
	wr:                              "\u2240",
	wreath:                          "\u2240",
	wscr:                            "\ud835\udccc",
	xcap:                            "\u22c2",
	xcirc:                           "\u25ef",
	xcup:                            "\u22c3",
	xdtri:                           "\u25bd",
	xfr:                             "\ud835\udd35",
	xhArr:                           "\u27fa",
	xharr:                           "\u27f7",
	xi:                              "\u03be",
	xlArr:                           "\u27f8",
	xlarr:                           "\u27f5",
	xmap:                            "\u27fc",
	xnis:                            "\u22fb",
	xodot:                           "\u2a00",
	xopf:                            "\ud835\udd69",
	xoplus:                          "\u2a01",
	xotime:                          "\u2a02",
	xrArr:                           "\u27f9",
	xrarr:                           "\u27f6",
	xscr:                            "\ud835\udccd",
	xsqcup:                          "\u2a06",
	xuplus:                          "\u2a04",
	xutri:                           "\u25b3",
	xvee:                            "\u22c1",
	xwedge:                          "\u22c0",
	yacute:                          "\u00fd",
	yacy:                            "\u044f",
	ycirc:                           "\u0177",
	ycy:                             "\u044b",
	yen:                             "\u00a5",
	yfr:                             "\ud835\udd36",
	yicy:                            "\u0457",
	yopf:                            "\ud835\udd6a",
	yscr:                            "\ud835\udcce",
	yucy:                            "\u044e",
	yuml:                            "\u00ff",
	zacute:                          "\u017a",
	zcaron:                          "\u017e",
	zcy:                             "\u0437",
	zdot:                            "\u017c",
	zeetrf:                          "\u2128",
	zeta:                            "\u03b6",
	zfr:                             "\ud835\udd37",
	zhcy:                            "\u0436",
	zigrarr:                         "\u21dd",
	zopf:                            "\ud835\udd6b",
	zscr:                            "\ud835\udccf",
	zwj:                             "\u200d",
	zwnj:                            "\u200c"
};
var spacesEntities = {
	nbsp:     "\u00a0",
	ensp:     "\u2002",
	emsp:     "\u2003",
	emsp13:   "\u2004",
	emsp14:   "\u2005",
	numsp:    "\u2007",
	puncsp:   "\u2008",
	thinsp:   "\u2009",
	hairsp:   "\u200a"
};
function encodeHTML(str) {
	if(
		encodeSpecialEntities
		&& (!entitiesBlackList || !("semi" in entitiesBlackList))
	)
		str = str.replace(/;/g, "\0\1\2\3;\3\2\1\0");
	if(entitiesBlackList) {
		if(!("amp" in entitiesBlackList))
			str = str.replace(/&/g, "&amp;");
		if(!("lt" in entitiesBlackList))
			str = str.replace(/</g, "&lt;");
		if(!("gt" in entitiesBlackList))
			str = str.replace(/>/g, "&gt;");
		if(!("quot" in entitiesBlackList))
			str = str.replace(/"/g, "&quot;");
	}
	else {
		str = str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}
	if(encodeSpecialEntities) {
		str = str.replace(/\0\1\2\3;\3\2\1\0/g, "&semi;");
		str = encodeEntities(str, specialEntities);
	}
	if(encodeSpacesEntities)
		str = encodeEntities(str, spacesEntities);
	if(encodeChars) {
		str = str.replace(
			charsToEncode,
			function(s) {
				var code = s.charCodeAt(0);
				if(encodeAsHex)
					code = "x" + code.toString(16);
				return "&#" + code + ";";
			}
		);
	}
	return str;
}
function encodeEntities(str, entities) {
	for(var entity in entities) {
		if(entitiesBlackList && entity in entitiesBlackList)
			continue;
		var hex = uu(entities[entity]);
		str = str.replace(new RegExp(hex, "g"), "&" + entity + ";");
	}
	return str;
}
function decodeHTML(str) {
	if(decodeCharCodes) {
		str = str
			.replace(
				/&#(?:x([\da-f]{1,4})|(\d{1,5}));/ig,
				function(s, hex, dec) {
					var code = hex
						? parseInt(hex, 16)
						: parseInt(dec, 10);
					if(code > 0xffff)
						return s;
					return String.fromCharCode(code);
				}
			);
	}
	if(decodeSpecialEntities || decodeSpacesEntities) {
		str = str
			.replace(
				/&([a-z]+\d*);/ig,
				function(s, entity) {
					// "key in object" Doesn't work in old JScript, but "replace(str, function)" doesn't work too
					if(entitiesBlackList && entity in entitiesBlackList)
						return s;
					if(decodeSpecialEntities) {
						if(entity == "AMP")
							return "&";
						if(entity == "semi")
							return ";";
						if(entity in specialEntities)
							return specialEntities[entity];
					}
					if(decodeSpacesEntities && entity in spacesEntities)
						return spacesEntities[entity];
					return s;
				}
			);
	}
	if(entitiesBlackList) {
		if(!("lt" in entitiesBlackList))
			str = str.replace(/&lt;/g, "<");
		if(!("gt" in entitiesBlackList))
			str = str.replace(/&gt;/g, ">");
		if(!("quot" in entitiesBlackList))
			str = str.replace(/&quot;/g, '"');
		if(!("amp" in entitiesBlackList))
			str = str.replace(/&amp;/g, "&");
		return str;
	}
	return str
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&");
}
function uu(s) {
	var out = "";
	for(var i = 0, l = s.length; i < l; ++i)
		out += u(s.charCodeAt(i).toString(16));
	return out;
}
function u(h) {
	return "\\u" + ("000" + h).slice(-4);
}

function encodeEscapes(str) {
	return str.replace(/[^!-~ \t\n\r]/ig, u);
}
function decodeEscapes(str) {
	if(customEscapesDecoder)
		return decodeEscapesCustom(str);

	// Keep some escaped chars inside string literals
	// "ab\ncd" => "ab\\ncd" => eval() => "ab\ncd"
	var doubleEscape = function(s) {
		return s.replace(
			/(\\+)([nrt'"])?/g,
			function(s, bs, chr) {
				if(bs.length % 2 == 0 || chr) // \ => \\ (*2)
					return new Array(bs.length + 1).join("\\") + s;
				// \\\ => \\ + \ => (\\)*2 + \
				return new Array(Math.floor(bs.length/2)*2 + 1).join("\\") + s;
			}
		);
	};
	str = str
		.replace(/"(?:\\.|[^"\\\n\r])*"/g, doubleEscape)
		.replace(/'(?:\\.|[^'\\\n\r])*'/g, doubleEscape);

	var fixEsc = function(s, bs, chr, hex) {
		return bs.length % 2 == 0 && /[^0-9a-f]/i.test(hex)
			? bs + chr + hex
			: s;
	};

	try {
		str = eval(
			'"' +
			str // Make valid string
				.replace(
					/(\\*)["']/g,
					function(s, bs) {
						return bs.length % 2 == 0
							? "\\" + s
							: s;
					}
				)
				.replace(
					/\\+$/, // Fix qwe\ => "qwe\" => eval() error
					function(s) {
						return s.length % 2 != 0
							? "\\" + s
							: s;
					}
				)

				// Fix invalid \u and \x
				.replace(/(\\*)\\(x)([\s\S]{2})/g, fixEsc)
				.replace(/(\\*)\\(u)([\s\S]{4})/g, fixEsc)

				.replace(/\n/g, "\\n")
				.replace(/\r/g, "\\r")
				.replace(/\x00/g, "\\x00")
				.replace(/\u2028/g, "\\u2028")
				.replace(/\u2029/g, "\\u2029") +
			'"'
		);
	}
	catch(e) {
		throw new (e.constructor || SyntaxError)('eval("string") fail\n' + e.message);
	}

	return str;
}
function decodeEscapesCustom(str) {
	// Keep some escaped chars inside string literals
	// "ab\ncd" => "ab\\ncd" => eval() => "ab\ncd"
	var doubleEscape = function(s) {
		return s.replace(
			/(\\+)([nrt'"])?/g,
			function(s, bs, chr) {
				if(bs.length % 2 == 0 || chr) // \ => \\ (*2)
					return new Array(bs.length + 1).join("\\") + s;
				// \\\ => \\ + \ => (\\)*2 + \
				return new Array(Math.floor(bs.length/2)*2 + 1).join("\\") + s;
			}
		);
	};

	var decode = function(s, bs, num) {
		return bs.length % 2 == 0
			? bs + String.fromCharCode(num)
			: s;
	};
	var decodeHex = function(s, bs, hex) {
		return decode(s, bs, parseInt(hex, 16));
	};
	var decodeOct = function(s, bs, oct) {
		oct = parseInt(oct, 8);
		return oct <= 0xff
			? decode(s, bs, oct)
			: s;
	};

	return str
		.replace(/"(?:\\.|[^"\\\n\r])*"/g, doubleEscape)
		.replace(/'(?:\\.|[^'\\\n\r])*'/g, doubleEscape)

		.replace(/(\\*)\\x([0-9a-fA-F]{2})/g, decodeHex) // \xaa
		.replace(/(\\*)\\u([0-9a-fA-F]{4})/g, decodeHex) // \uaaaa
		.replace(/(\\*)\\([0-7]{1,3})/g,      decodeOct) // \0
		.replace(
			/(\\*)\\([bfnrtv])/g, // Be careful: MS JScript don't support "\v"
			function(s, bs, chr) {
				return bs.length % 2 == 0
					? bs + { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\x0b" }[chr]
					: s;
			}
		)

		.replace(
			/\\{2,}/g, // \\ -> \
			function(bs) {
				return bs.length % 2 == 0
					? new Array(bs.length/2 + 1).join("\\")
					: new Array((bs.length - 1)/2 + 1).join("\\") + "\\";
			}
		);
}

function escapeRegExp(str) {
	return str.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&");
}
function unescapeRegExp(str) {
	return str.replace(/\\([\\\/.^$+*?|()\[\]{}])/g, "$1");
}

function convertString(str, esc) {
	//~ todo: more intuitive handling for "ab\\cd'ef\"gh", 'ab\\cd\'ef"gh' ?
	if(/^(\s*("|'))([\s\S]*)(\2\s*)$/.test(str)) {
		var start  = RegExp.$1;
		var comma  = RegExp.$2;
		var middle = RegExp.$3;
		var end    = RegExp.$4;
		if(comma == '"') {
			middle = esc
				? middle.replace(/[\\"]/g, "\\$&")
				: middle.replace(/\\([\\"])/g, "$1");
		}
		else {
			middle = esc
				? middle.replace(/[\\']/g, "\\$&")
				: middle.replace(/\\([\\'])/g, "$1");
		}
		return start + middle + end;
	}
	return esc
		? str.replace(/[\\'"]/g, "\\$&")
		: str.replace(/\\([\\'"])/g, "$1");
}
function escapeString(str) {
	return convertString(str, true);
}
function unescapeString(str) {
	return convertString(str, false);
}

function encodeURIWrapped(str) {
	return encodeURIWrapper(
		str,
		encodeURI,
		/[\x00-\x20\x22\x25\x3c\x3e\x5b-\x5e\x60\x7b-\x7d\x7f-\ud7ff\ue000-\uffff]/g
	);
}
function encodeURIComponentWrapped(str) {
	if(toDataURI && toBase64)
		return encodeBase64(str, true);
	var ret = encodeURIWrapper(
		str,
		encodeURIComponent,
		/[\x00-\x20\x22-\x26\x2b\x2c\x2f\x3a-\x40\x5b-\x5e\x60\x7b-\x7d\x7f-\ud7ff\ue000-\uffff]/g
	);
	if(toDataURI) {
		var charsetName = codePageURI == CP_NOT_CONVERT
			? "UTF-8"
			: getCharsetName(codePageURI);
		return "data:text/plain" + (charsetName ? ";charset=" + charsetName : "") + "," + ret;
	}
	return ret;
}
function encodeURIWrapper(str, encodeURIFunc, pattern) {
	if(codePageURI == CP_NOT_CONVERT)
		return encodeURIFunc(str);
	if(/[\ud800-\udfff]/.test(str))
		throw new URIError("Invalid character detected (\\ud800-\\udfff)");
	return str.replace(
		pattern,
		function(chr) {
			var enc = convertFromUnicode(chr, codePageURI);
			if(enc.length > 1) // Multibyte? Use UTF-8 instead :)
				return chr;
			var hex = enc.charCodeAt(0).toString(16).toUpperCase();
			if(hex.length > 2)
				return chr;
			return "%" + ("0" + hex).slice(-2);
		}
	);
}
function decodeURIWrapped(str) {
	return decodeURIWrapper(str, decodeURI);
}
function decodeURIComponentWrapped(str) {
	if(/^\s*data:([^:,;=]+(;charset=([^:,;=]+))?)?(;base64)?,/.test(str)) {
		if(RegExp.$4)
			return decodeBase64(str);
		str = str.substr(RegExp.lastMatch.length);
		var cp = getCharsetCode(RegExp.$3);
	}
	return decodeURIWrapper(str, decodeURIComponent, cp);
}
function decodeURIWrapper(str, decodeURIFunc, cp) {
	try {
		return decodeURIFunc(str);
	}
	catch(e) {
		var ret = decodeURICustom(str, cp);
		if(ret != str)
			return ret;
		throw e;
	}
}
function decodeURICustom(str, cp) {
	if(!cp)
		cp = codePageURI;
	var ret = str.replace(
		/%([0-9a-f]{2})/ig,
		function(s, hex) {
			return convertToUnicode(String.fromCharCode("0x" + hex), cp);
		}
	);
	return ret.indexOf("%") == -1 ? ret : str;
}

function escapeWrapped(str) {
	return escape(str);
}
function unescapeWrapped(str) {
	return unescape(str);
}


var base64 = {
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode: function (input, toDataURI) {
		input = convertFromUnicode(input, codePageBase64); //~ todo: CP_NOT_CONVERT seems buggy

		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var _keyStr = this._keyStr;
		var i = 0;
		while(i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if(isNaN(chr2))
				enc3 = enc4 = 64;
			else if (isNaN(chr3))
				enc4 = 64;
			output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
		}

		if(toDataURI) {
			var charsetName = getCharsetName(codePageBase64);
			output = "data:text/plain;" + (charsetName ? "charset=" + charsetName + ";" : "") + "base64," + output;
		}
		else if(maxLineWidth > 0)
			output = output.replace(new RegExp(".{" + maxLineWidth + "}", "g"), "$&\n");
		return output;
	},
	decode: function (input) {
		var cp = codePageBase64;
		input = trimBase64String(input);

		if(/^data:([^:,;=]+(;charset=([^:,;=]+))?)?;base64,/.test(input)) {
			input = input.substr(RegExp.lastMatch.length);
			if(RegExp.$3)
				cp = getCharsetCode(RegExp.$3) || cp;
		}

		if(!isBase64(input))
			throw "Not a Base64 string!";

		var output = "";

		var _keyStr = this._keyStr;
		var _keyMap = this._keyMap;
		if(!_keyMap) {
			_keyMap = this._keyMap = {};
			for (var j = 0, l = _keyStr.length; j < l; ++j)
				_keyMap[_keyStr.charAt(j)] = j;
		}

		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var inputLen = input.length;
		//input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		while(i < inputLen) {
			enc1 = _keyMap[input.charAt(i++)];
			enc2 = _keyMap[input.charAt(i++)];
			enc3 = _keyMap[input.charAt(i++)];
			enc4 = _keyMap[input.charAt(i++)];
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if(enc3 != 64)
				output = output + String.fromCharCode(chr2);
			if(enc4 != 64)
				output = output + String.fromCharCode(chr3);
		}
		return convertToUnicode(output, cp);
	}
};
function trimBase64String(str) {
	return str.replace(/^\s+|[\n\r]+|[\s\x00]+$/g, "");
}
function isBase64(str) {
	return str.length % 4 == 0 && !/[^a-zA-Z0-9+\/]/.test(str.replace(/=+$/, ""));
}
var charsets = {
	"IBM850": 850,
	"IBM852": 852,
	"IBM855": 855,
	"IBM857": 857,
	"IBM862": 862,
	"IBM864": 864,
	"IBM866": 866,
	"ISO-2022-CN": 50227,
	"ISO-2022-JP": 50220,
	"ISO-8859-1": 28591,
	"ISO-8859-2": 28592,
	"ISO-8859-3": 28593,
	"ISO-8859-4": 28594,
	"ISO-8859-5": 28595,
	"ISO-8859-6": 28596,
	"ISO-8859-7": 28597,
	"ISO-8859-8": 28598,
	"ISO-8859-8-I": 28598,
	"ISO-8859-9": 28599,
	"ISO-8859-10": 28600,
	"ISO-8859-11": 28601,
	"ISO-8859-13": 28603,
	"ISO-8859-14": 28604,
	"ISO-8859-15": 28605,
	"ISO-8859-16": 28606,
	"KOI8-R": 20866,
	"Shift_JIS": 932,
	"UTF-16BE": 1201,
	"UTF-16LE": 1200,
	"UTF-8": 65001,
	"windows-874": 874,
	"windows-949": 949,
	"x-windows-949": 949,
	"windows-1250": 1250,
	"windows-1251": 1251,
	"windows-1252": 1252,
	"windows-1253": 1253,
	"windows-1254": 1254,
	"windows-1255": 1255,
	"windows-1256": 1256,
	"windows-1257": 1257,
	"windows-1258": 1258,
	"x-mac-ce": 10000,
	"x-mac-croatian": 10082,
	"x-mac-cyrillic": 10007,
	"x-mac-greek": 10006,
	"x-mac-romanian": 10010,
	"x-mac-turkish": 10081
	//label="Армянская (ARMSCII-8)"	value="armscii-8"
	//label="Вьетнамская (TCVN)"	value="x-viet-tcvn5712"
	//label="Вьетнамская (VISCII)"	value="VISCII"
	//label="Вьетнамская (VPS)"	value="x-viet-vps"
	//label="Грузинская (GEOSTD8)"	value="GEOSTD8"
	//label="Гуджарати (MacGujarati)"	value="x-mac-gujarati"
	//label="Гурмуки (MacGurmukhi)"	value="x-mac-gurmukhi"
	//label="Западноевропейская (MacRoman)"	value="x-mac-roman"
	//label="Исландская (MacIcelandic)"	value="x-mac-icelandic"
	//label="Кириллица (ISO-IR-111)"	value="ISO-IR-111"
	//label="Кириллица/Украина (KOI8-U)"	value="KOI8-U"
	//label="Китайская традиционная (Big5)"	value="Big5"
	//label="Китайская традиционная (Big5-HKSCS)"	value="Big5-HKSCS"
	//label="Китайская традиционная (EUC-TW)"	value="x-euc-tw"
	//label="Китайская упрощённая (GB18030)"	value="gb18030"
	//label="Китайская упрощённая (GB2312)"	value="GB2312"
	//label="Китайская упрощённая (HZ)"	value="HZ-GB-2312"
	//label="Корейская (EUC-KR)"	value="EUC-KR"
	//label="Корейская (ISO-2022-KR)"	value="ISO-2022-KR"
	//label="Корейская (JOHAB)"	value="x-johab"
	//label="Тайская (TIS-620)"	value="TIS-620"
	//label="Хинди (MacDevanagari)"	value="x-mac-devanagari"
	//label="Японская (EUC-JP)"	value="EUC-JP"
};
function getCharsetName(code) {
	//if(code == CP_NOT_CONVERT) //?
	//	return "UTF-8";
	if(code == CP_CURRENT)
		code = AkelPad.GetEditCodePage(0);
	for(var name in charsets)
		if(charsets[name] == code)
			return name;
	return undefined;
}
function getCharsetCode(name) {
	return charsets[name] || undefined;
}
function encodeBase64(str, toDataURI) {
	return base64.encode(str, toDataURI);
}
function decodeBase64(str) {
	return base64.decode(str);
}

function encodeQuotedPrintable(str, cp) {
	var max = 76;
	var c = 0;
	str = convertFromUnicode(str, cp || codePageQP);
	var out = [];
	for(var i = 0, l = str.length; i < l; ++i) {
		var s = str.charAt(i);
		if(/=|[^!-~ ]/.test(s)) {
			var code = s.charCodeAt(0);
			var hex = code.toString(16).toUpperCase();
			s = "=" + ("0" + hex).slice(-2);
		}
		var len = s.length;
		c += len;
		if(c >= max) {
			c = len;
			out[out.length] = "=\n" + s;
			continue;
		}
		out[out.length] = s;
	}
	return out.join("");
}
function decodeQuotedPrintable(str, cp) {
	if(!isQuotedPrintable(str))
		return str;
	str = str
		.replace(/[ \t]+$/mg, "")
		.replace(/=(\r\n?|\n\r?)/g, "")
		.replace(/=([\da-fA-F]{2})/g, function(s, code) {
			return String.fromCharCode("0x" + code);
		});
	return convertToUnicode(str, cp || codePageQP);
}
function isQuotedPrintable(str) {
	return /=([\da-fA-F]{2}|[ \t]*(\r\n?|\n\r?))/.test(str);
}

var convertersNoGUI = {
	charset: true,
	recode: true
};
var converters = {
	// speed: symbols/ms [encodeSpeed, decodeSpeed]
	html: {
		prettyName: "HTML",
		firstAction: "decode",
		speed: [2400, 9273],
		encode: encodeHTML,
		decode: decodeHTML
	},
	escapes: {
		prettyName: "Escapes",
		firstAction: "encode",
		speed: [25969, 2087],
		encode: encodeEscapes,
		decode: decodeEscapes
	},
	regexp: {
		prettyName: "RegExp",
		firstAction: "decode",
		speed: [25010, 43807],
		encode: escapeRegExp,
		decode: unescapeRegExp
	},
	string: {
		prettyName: "String",
		firstAction: "decode",
		speed: [43393, 93579],
		encode: escapeString,
		decode: unescapeString
	},
	uri: {
		prettyName: "URI",
		firstAction: "decode",
		speed: [12263, 84.46],
		encode: encodeURIWrapped,
		decode: decodeURIWrapped
	},
	uricomponent: {
		prettyName: "URI Component",
		firstAction: "decode",
		speed: [9994, 67.92],
		encode: encodeURIComponentWrapped,
		decode: decodeURIComponentWrapped
	},
	unescape: {
		prettyName: "Unescape",
		firstAction: "decode",
		speed: [24e3, 120e3],
		encode: escapeWrapped,
		decode: unescapeWrapped
	},
	base64: {
		prettyName: "Base64",
		firstAction: "decode",
		speed: [156.56, 138.30],
		encode: encodeBase64,
		decode: decodeBase64
	},
	quotedprintable: {
		prettyName: "Quoted-Printable",
		firstAction: "decode",
		speed: [10e3, 10e3], //~ todo: use real values
		encode: encodeQuotedPrintable,
		decode: decodeQuotedPrintable
	},
	charset: {
		prettyName: "Charset",
		firstAction: "decode",
		speed: [373, 258],
		encode: function(str) {
			return convertFromUnicode(str, codePage);
		},
		decode: function(str) {
			return convertToUnicode(str, codePage);
		}
	},
	recode: {
		prettyName: "Recode",
		firstAction: "decode",
		speed: [155, 155],
		encode: function(str) {
			return convertToUnicode(
				convertFromUnicode(str, codePageTo),
				codePageFrom
			);
		},
		decode: function(str) {
			return convertToUnicode(
				convertFromUnicode(str, codePageFrom),
				codePageTo
			);
		}
	}
};

if(hMainWnd && !AkelPad.IsInclude()) {
	if(!converters[type]) { // Invalid argument or pref
		AkelPad.MessageBox(
			hMainWnd,
			_localize("Converter “%S” not found!")
				.replace("%S", type),
			dialogTitle,
			16 /*MB_ICONERROR*/
		);
		type = DEFAULT_TYPE;
		forceShowDialog = true;
	}
	if(forceShowDialog) {
		if(convertersNoGUI[type])
			type = DEFAULT_TYPE;
		converterDialog();
	}
	else if(!AkelPad.GetEditReadOnly(AkelPad.GetEditWnd()))
		convert(); // Convert w/o dialog
}

function convert(hWnd, actionObj, firstChangedCharObj) {
	if(saveOptions == 1)
		savePrefs();

	var text = AkelPad.GetSelText(4 - AkelPad.GetEditNewLine(0));
	var selectAll = false;
	if(!text && !onlySelected) {
		text = getAllText();
		selectAll = true;
	}
	if(!text) {
		AkelPad.MessageBox(
			hWnd || hMainWnd,
			onlySelected
				? _localize("No text selected!")
				: _localize("No text!"),
			dialogTitle,
			48 /*MB_ICONEXCLAMATION*/
		);
		return false;
	}

	var auto   = mode == MODE_AUTO;
	var encode = mode == MODE_ENCODE;
	var decode = mode == MODE_DECODE;

	var converter = converters[type];
	var firstAction = converter.firstAction;
	var firstDecode = firstAction == "decode";
	var secondAction = firstDecode ? "encode" : "decode";
	var useFirstAction  = firstDecode ? decode : encode;
	var useSecondAction = !useFirstAction;

	if(warningTime > 0) {
		// We don't check processor speed now... Seems like decodeURI* is non-linear
		var speed = auto
			? (
				converter.speed[0]*(firstDecode ? 0.5 : 1)
				+ converter.speed[1]*(firstDecode ? 1 : 0.5)
			)/1.5
			: converter.speed[encode ? 0 : 1];
		var remTime = text.length/speed;
		if(remTime >= warningTime) {
			var s = Math.round(remTime/1000);
			var m = Math.floor(s/60);
			s -= m*60;
			if(s < 10)
				s = "0" + s;
			if(
				AkelPad.MessageBox(
					hWnd || hMainWnd,
					_localize("Required time: %S (estimate)\nContinue?").replace("%S", m + ":" + s),
					dialogTitle + " :: " + converter.prettyName,
					33 /*MB_OKCANCEL|MB_ICONQUESTION*/
				) == 2 /*IDCANCEL*/
			)
				return false;
		}
	}

	var res;
	if(auto && actionObj)
		actionObj.value = firstAction;
	if(speedTest)
		var t = new Date().getTime();
	if(useFirstAction || auto) {
		try {
			res = converter[firstAction](text);
		}
		catch(e) {
			if(useFirstAction) { // Don't show in auto mode
				AkelPad.MessageBox(
					hWnd || hMainWnd,
					_localize("Can't " + firstAction + "!\nError:\n%S")
						.replace("%S", e.name ? e.name + "\n" + e.message : e),
					dialogTitle + " :: " + converter.prettyName,
					16 /*MB_ICONERROR*/
				);
				return false;
			}
			res = null;
		}
		if(auto)
			useSecondAction = res == text || res == null;
	}
	if(useSecondAction) {
		try {
			res = converter[secondAction](text);
			if(auto && actionObj)
				actionObj.value = secondAction;
		}
		catch(e) {
			AkelPad.MessageBox(
				hWnd || hMainWnd,
				_localize("Can't " + secondAction + "!\n%S")
					.replace("%S", e.name ? e.name + "\n" + e.message : e),
				dialogTitle + " :: " + converter.prettyName,
				16 /*MB_ICONERROR*/
			);
			return false;
		}
	}

	if(speedTest) {
		AkelPad.MessageBox(
			hWnd || hMainWnd,
			"Speed: " + text.length/(new Date().getTime() - t),
			dialogTitle + " :: " + converter.prettyName,
			64 /*MB_ICONINFORMATION*/
		);
	}

	if(res == text || res == null) {
		AkelPad.MessageBox(
			hWnd || hMainWnd,
			_localize("Nothing to convert!"),
			dialogTitle + " :: " + converter.prettyName,
			48 /*MB_ICONEXCLAMATION*/
		);
		return false;
	}

	var ok = true;
	if(action & ACT_COPY) {
		if(res == AkelPad.GetClipboardText())
			ok = false;
		else
			AkelPad.SetClipboardText(res);
	}
	if(action & ACT_INSERT) {
		ok = true;
		insertNoScroll(res, selectAll);
	}

	if(ok && firstChangedCharObj) {
		var _text = text.replace(/\r\n/g, "\n");
		var _res = res.replace(/\r\n/g, "\n");
		var indx;
		for(var i = 0, l = Math.min(_text.length, _res.length); i < l; ++i) {
			if(_res.charAt(i) != _text.charAt(i)) {
				indx = i;
				break;
			}
		}
		if(indx == undefined) {
			indx = _res.length > _text.length
				? _text.length
				: _res.length - 1;
		}
		firstChangedCharObj.value = [indx, Math.min(indx + 1, _res.length)];
	}

	return ok && res;
}
function converterDialog(modal) {
	var hInstanceDLL = AkelPad.GetInstanceDll();
	var dialogClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");

	var hWndDialog = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, dialogClass, 0);
	if(hWndDialog) {
		if(oSys.Call("user32::IsIconic", hWndDialog))
			oSys.Call("user32::ShowWindow", hWndDialog, 9 /*SW_RESTORE*/);
		AkelPad.SendMessage(hWndDialog, 7 /*WM_SETFOCUS*/, 0, 0);
		return;
	}

	if(
		!AkelPad.WindowRegisterClass(dialogClass)
		&& ( // Previous script instance crashed
			!AkelPad.WindowUnregisterClass(dialogClass)
			|| !AkelPad.WindowRegisterClass(dialogClass)
		)
	)
		return;

	var disabled = false;
	var disabledTimeout = 150;

	var IDC_STATIC        = -1;
	var IDC_TYPE_HTML     = 1001;
	var IDC_DEC_ENT       = 1002;
	var IDC_ENC_ENT       = 1003;
	var IDC_DEC_ENT_SP    = 1004;
	var IDC_ENC_ENT_SP    = 1005;
	var IDC_DEC_CHR       = 1006;
	var IDC_ENC_CHR       = 1007;
	var IDC_ENC_CHR_HEX   = 1008;
	var IDC_TYPE_ESCAPES  = 1009;
	var IDC_TYPE_REGEXP   = 1010;
	var IDC_TYPE_STRING   = 1011;
	var IDC_TYPE_URI      = 1012;
	var IDC_TYPE_URIC     = 1013;
	var IDC_TO_DATA_URI   = 1014;
	var IDC_TO_BASE64     = 1015;
	var IDC_TYPE_UNESCAPE = 1016;
	var IDC_TYPE_BASE64   = 1017;
	var IDC_TYPE_QP       = 1018;
	var IDC_TYPE_CHARSET  = 1019;
	var IDC_MODE_AUTO     = 1020;
	var IDC_MODE_ENCODE   = 1021;
	var IDC_MODE_DECODE   = 1022;
	var IDC_ACT_INSERT    = 1023;
	var IDC_ACT_COPY      = 1024;
	var IDC_ACT_SHOW      = 1025;
	var IDC_OUTPUT        = 1026;
	var IDC_OK            = 1027;
	var IDC_CONVERT       = 1028;
	var IDC_CANCEL        = 1029;

	var hWndGroupType;
	var hWndType = {};
	var hWndDecEnt, hWndEncEnt, hWndDecEntSp, hWndEncEntSp, hWndDecChr, hWndEncChr, hWndEncChrHex;
	var hWndToDataURI, hWndToBase64;
	var hWndGroupMode, hWndModeAuto, hWndModeEncode, hWndModeDecode;
	var hWndGroupAction, hWndActInsert, hWndActCopy, hWndActShow;
	var hWndOutput;
	var hWndOK, hWndConvert, hWndCancel;

	if(savePosition) {
		var dlgX = prefs.get("windowLeft", prefs.DWORD);
		var dlgY = prefs.get("windowTop",  prefs.DWORD);
	}
	if(saveSize)
		var outputH = prefs.get("outputHeight", prefs.DWORD);
	prefs.end();
	function saveWindowPosition() {
		if(!savePosition && !saveSize || oSys.Call("user32::IsIconic", hWndDialog))
			return;
		var rcWnd = getWindowRect(hWndDialog);
		if(!rcWnd)
			return;
		if(savePosition) {
			prefs.set({
				windowLeft: rcWnd.left,
				windowTop:  rcWnd.top
			});
		}
		if(saveSize)
			prefs.set("outputHeight", Math.round(outputH/scale.y(10000)*10000));
		prefs.end();
	}

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 32 /*SM_CXSIZEFRAME*/) * 2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 33 /*SM_CYSIZEFRAME*/) * 2 + oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	var dlgMinW = scale.x(410) + sizeNonClientX;
	var dlgMinH = scale.y(430) + sizeNonClientY; // + outputH + 12
	var outputMinH = 20;

	if(outputH != undefined)
		outputH = Math.max(outputMinH, outputH);
	else
		outputH = 76; // Default height

	var dh = action & ACT_SHOW ? outputH + 12 : 0;

	var dlgW = dlgMinW;
	var dlgH = dlgMinH + scale.y(dh);

	var handleResize = true;

	// Create dialog
	hWndDialog = oSys.Call(
		"user32::CreateWindowEx" + _TCHAR,
		0,                  //dwExStyle
		dialogClass,        //lpClassName
		0,                  //lpWindowName
		0x90CE0000,         //WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX|WS_THICKFRAME
		scale.x(dlgX || 0), //x
		scale.y(dlgY || 0), //y
		dlgW,               //nWidth
		dlgH,               //nHeight
		hMainWnd,           //hWndParent
		0,                  //ID
		hInstanceDLL,       //hInstance
		dialogCallback      //Script function callback. To use it class must be registered by WindowRegisterClass.
	);
	if(!hWndDialog)
		return;

	function dialogCallback(hWnd, uMsg, wParam, lParam) {
		switch(uMsg) {
			case 1: //WM_CREATE
				function setWindowFontAndText(hWnd, hFont, pText) {
					AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
					windowText(hWnd, pText);
				}

				var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);

				// Dialog caption
				oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, dialogTitle);

				//centerWindow(hWnd);
				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);

				// GroupBox converter
				hWndGroupType = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,           //x
					10,           //y
					386,          //nWidth
					271,          //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndGroupType, hGuiFont, _localize("Convert"));

				//~ todo: add tooltip to each converter

				// Radiobutton HTML converter
				hWndType.HTML = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50000004,    //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,            //x
					28,            //y
					350,           //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_TYPE_HTML, //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndType.HTML, hGuiFont, _localize("&HTML entities"));
				checked(hWndType.HTML, type == "html");


				// Options for HTML:
				// Checkbox: HTML &entity; => symbol
				hWndDecEnt = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010003,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					40,           //x
					45,           //y
					136,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_DEC_ENT,  //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndDecEnt, hGuiFont, _localize("&&en&tity; => symbol"));
				checked(hWndDecEnt, decodeSpecialEntities);

				// Checkbox: HTML symbol => &entity;
				hWndEncEnt = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010003,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					182,          //x
					45,           //y
					136,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_ENC_ENT,  //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndEncEnt, hGuiFont, _localize("s&ymbol => &&entity;"));
				checked(hWndEncEnt, encodeSpecialEntities);

				// Checkbox: HTML &nbsp; => space
				hWndDecEntSp = createWindowEx(
					0,              //dwExStyle
					"BUTTON",       //lpClassName
					0,              //lpWindowName
					0x50010003,     //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					40,             //x
					62,             //y
					136,            //nWidth
					16,             //nHeight
					hWnd,           //hWndParent
					IDC_DEC_ENT_SP, //ID
					hInstanceDLL,   //hInstance
					0               //lpParam
				);
				setWindowFontAndText(hWndDecEntSp, hGuiFont, _localize("&&nbs&p; => space"));
				checked(hWndDecEntSp, decodeSpacesEntities);

				// Checkbox: HTML space => &nbsp;
				hWndEncEntSp = createWindowEx(
					0,              //dwExStyle
					"BUTTON",       //lpClassName
					0,              //lpWindowName
					0x50010003,     //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					182,            //x
					62,             //y
					136,            //nWidth
					16,             //nHeight
					hWnd,           //hWndParent
					IDC_ENC_ENT_SP, //ID
					hInstanceDLL,   //hInstance
					0               //lpParam
				);
				setWindowFontAndText(hWndEncEntSp, hGuiFont, _localize("s&pace => &&nbsp;"));
				checked(hWndEncEntSp, encodeSpacesEntities);

				// Checkbox: HTML &#code; => symbol
				hWndDecChr = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010003,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					40,           //x
					79,           //y
					136,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_DEC_CHR,  //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndDecChr, hGuiFont, _localize("&&#c&ode; => symbol"));
				checked(hWndDecChr, decodeCharCodes);

				// Checkbox: HTML symbol => &#code;
				hWndEncChr = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010003,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					182,          //x
					79,           //y
					136,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_ENC_CHR,  //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndEncChr, hGuiFont, _localize("sym&bol => &&#code;"));
				checked(hWndEncChr, encodeChars);

				// Checkbox: HTML symbol => &#code; as hex
				hWndEncChrHex = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50010003,      //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					324,             //x
					79,              //y
					72,              //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_ENC_CHR_HEX, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndEncChrHex, hGuiFont, _localize("he&x-code"));
				checked(hWndEncChrHex, encodeAsHex);


				// Radiobutton escapes converter
				hWndType.escapes = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50000004,       //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,               //x
					98,               //y
					350,              //nWidth
					16,               //nHeight
					hWnd,             //hWndParent
					IDC_TYPE_ESCAPES, //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndType.escapes, hGuiFont, _localize("&Escape sequences"));
				checked(hWndType.escapes, type == "escapes");

				// Radiobutton RegExp converter
				hWndType.regExp = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50000004,      //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,              //x
					115,             //y
					350,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_TYPE_REGEXP, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndType.regExp, hGuiFont, _localize("Re&gular expressions special symbols"));
				checked(hWndType.regExp, type == "regexp");

				// Radiobutton String converter
				hWndType.string = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50000004,      //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,              //x
					132,             //y
					350,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_TYPE_STRING, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndType.string, hGuiFont, _localize("&String literals special symbols"));
				checked(hWndType.string, type == "string");

				// Radiobutton URI converter
				hWndType.URI = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,           //x
					149,          //y
					350,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_TYPE_URI, //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndType.URI, hGuiFont, _localize("Uniform Resource Identifier (&URI)"));
				checked(hWndType.URI, type == "uri");

				// Radiobutton URI Component converter
				hWndType.URIComponent = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50000004,    //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,            //x
					166,           //y
					350,           //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_TYPE_URIC, //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndType.URIComponent, hGuiFont, _localize("Uniform Resource Identifier (U&RI), full"));
				checked(hWndType.URIComponent, type == "uricomponent");


				// Options for encode URI component:
				// Checkbox: to data URI
				hWndToDataURI = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50010003,      //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					40,              //x
					183,             //y
					220,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_TO_DATA_URI, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndToDataURI, hGuiFont, _localize("Encode as data URI"));
				checked(hWndToDataURI, toDataURI);

				// Checkbox: to base64
				hWndToBase64 = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50010003,    //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					324,           //x
					183,           //y
					72,            //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_TO_BASE64, //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndToBase64, hGuiFont, _localize("Base64"));
				checked(hWndToBase64, toBase64);


				// Radiobutton escape/unescape converter
				hWndType.unescape = createWindowEx(
					0,                 //dwExStyle
					"BUTTON",          //lpClassName
					0,                 //lpWindowName
					0x50000004,        //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,                //x
					202,               //y
					350,               //nWidth
					16,                //nHeight
					hWnd,              //hWndParent
					IDC_TYPE_UNESCAPE, //ID
					hInstanceDLL,      //hInstance
					0                  //lpParam
				);
				setWindowFontAndText(hWndType.unescape, hGuiFont, _localize("Hexadeci&mal escape"));
				checked(hWndType.unescape, type == "unescape");

				// Radiobutton Base64 converter
				hWndType.base64 = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50000004,      //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,              //x
					221,             //y
					350,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_TYPE_BASE64, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndType.base64, hGuiFont, _localize("Base&64"));
				checked(hWndType.base64, type == "base64");

				// Radiobutton Base64 converter
				hWndType.quotedPrintable = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50000004,      //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,              //x
					240,             //y
					350,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_TYPE_QP,     //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndType.quotedPrintable, hGuiFont, _localize("&Quoted-Printable"));
				checked(hWndType.quotedPrintable, type == "quotedprintable");

				// Radiobutton Charset converter
				hWndType.charset = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50000004,       //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,               //x
					259,              //y
					350,              //nWidth
					16,               //nHeight
					hWnd,             //hWndParent
					IDC_TYPE_CHARSET, //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndType.charset, hGuiFont, _localize("&Charset (semi-recode)"));
				checked(hWndType.charset, type == "charset");


				// GroupBox mode
				hWndGroupMode = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,           //x
					291,          //y
					386,          //nWidth
					42,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndGroupMode, hGuiFont, _localize("Direction"));

				// Radiobutton auto
				hWndModeAuto = createWindowEx(
					0,             //dwExStyle
					"BUTTON",      //lpClassName
					0,             //lpWindowName
					0x50000004,    //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,            //x
					309,           //y
					116,           //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_MODE_AUTO, //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndModeAuto, hGuiFont, _localize("&Auto"));
				checked(hWndModeAuto, mode == MODE_AUTO);

				// Radiobutton encode
				hWndModeEncode = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50000004,      //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					148,             //x
					309,             //y
					116,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_MODE_ENCODE, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndModeEncode, hGuiFont, _localize("E&ncode"));
				checked(hWndModeEncode, mode == MODE_ENCODE);

				// Radiobutton decode
				hWndModeDecode = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50000004,      //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					272,             //x
					309,             //y
					116,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_MODE_DECODE, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndModeDecode, hGuiFont, _localize("&Decode"));
				checked(hWndModeDecode, mode == MODE_DECODE);


				// GroupBox action
				hWndGroupAction = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,           //x
					343,          //y
					386,          //nWidth
					42,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndGroupAction, hGuiFont, _localize("Action"));

				// Checkbox insert
				hWndActInsert = createWindowEx(
					0,              //dwExStyle
					"BUTTON",       //lpClassName
					0,              //lpWindowName
					0x50010003,     //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					24,             //x
					361,            //y
					116,            //nWidth
					16,             //nHeight
					hWnd,           //hWndParent
					IDC_ACT_INSERT, //ID
					hInstanceDLL,   //hInstance
					0               //lpParam
				);
				setWindowFontAndText(hWndActInsert, hGuiFont, _localize("&Insert"));
				checked(hWndActInsert, action & ACT_INSERT);

				// Checkbox copy
				hWndActCopy = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010003,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					148,          //x
					361,          //y
					116,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_ACT_COPY, //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndActCopy, hGuiFont, _localize("C&opy"));
				checked(hWndActCopy, action & ACT_COPY);

				// Checkbox show
				hWndActShow = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010003,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					272,          //x
					361,          //y
					116,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_ACT_SHOW, //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndActShow, hGuiFont, _localize("Sho&w"));
				checked(hWndActShow, action & ACT_SHOW);

				// RichEdit output
				hWndOutput = createWindowEx(
					0x200,                 //WS_EX_CLIENTEDGE
					"RichEdit20" + _TCHAR, //lpClassName
					0,                     //lpWindowName
					0x50315904,            //WS_VISIBLE|WS_CHILD|WS_VSCROLL|WS_HSCROLL|ES_LEFT|ES_MULTILINE|ES_DISABLENOSCROLL|WS_TABSTOP|ES_SUNKEN|ES_NOHIDESEL|ES_READONLY
					12,                    //x
					397,                   //y
					386,                   //nWidth
					outputH,               //nHeight
					hWnd,                  //hWndParent
					IDC_OUTPUT,            //ID
					hInstanceDLL,          //hInstance
					0                      //lpParam
				);
				setWindowFontAndText(hWndOutput, hGuiFont, "");
				if(!(action & ACT_SHOW))
					oSys.Call("user32::ShowWindow", hWndOutput, false);

				var clr = oSys.Call("user32::GetSysColor", 15 /*COLOR_3DFACE*/);
				AkelPad.SendMessage(hWndOutput, 1091 /*EM_SETBKGNDCOLOR*/, 0, clr);

				// OK button window
				hWndOK = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010001,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					75,           //x
					396 + dh,     //y
					100,          //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_OK,       //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndOK, hGuiFont, _localize("OK"));

				// Convert button window
				hWndConvert = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					187,          //x
					396 + dh,     //y
					100,          //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_CONVERT,  //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndConvert, hGuiFont, _localize("Convert"));

				// Cancel button window
				hWndCancel = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					299,          //x
					396 + dh,     //y
					100,          //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_CANCEL,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));

				setHTMLOptions();
				setBase64Options();
				enableConvertButtons();

				outputMinH = scale.y(outputMinH);
				outputH = scale.y(outputH);
			break;
			case 7: //WM_SETFOCUS
				for(var t in hWndType) {
					var h = hWndType[t];
					if(checked(h)) {
						var hWndChecked = h;
						break;
					}
				}
				oSys.Call("user32::SetFocus", hWndChecked || hWndOK);
			break;
			case 256: //WM_KEYDOWN
				var ctrl = getKeyState(17 /*VK_CONTROL*/);
				var shift = getKeyState(16 /*VK_SHIFT*/);
				if(wParam == 27 /*VK_ESCAPE*/)
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
				else if(wParam == 13 /*VK_RETURN*/) {
					if(ctrl || shift) // Ctrl+Enter, Shift+Enter
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CONVERT, 0);
					else // Enter
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_OK, 0);
				}
				else if(wParam == 90 /*Z*/) {
					if(ctrl && shift) // Ctrl+Shift+Z
						AkelPad.Command(4152); //IDM_EDIT_REDO
					else if(ctrl) // Ctrl+Z
						AkelPad.Command(4151); //IDM_EDIT_UNDO
				}
				else if(ctrl && wParam == 67 /*C*/ || ctrl && wParam == 45 /*VK_INSERT*/) { // Ctrl+C, Ctrl+Insert
					if(oSys.Call("user32::GetFocus") != hWndOutput)
						AkelPad.Command(4154); //IDM_EDIT_COPY
				}
				else if(ctrl && wParam == 86 /*V*/ || shift && wParam == 45 /*VK_INSERT*/) { // Ctrl+V, Shift+Insert
					noScroll(function() {
						AkelPad.Command(4155); //IDM_EDIT_PASTE
					});
				}
				else if(ctrl && wParam == 88 /*X*/ || shift && wParam == 46 /*VK_DELETE*/) // Ctrl+X, Shift+Del
					AkelPad.Command(4153); //IDM_EDIT_CUT
				else if(wParam == 46 /*VK_DELETE*/) // Delete
					AkelPad.Command(4156); //IDM_EDIT_CLEAR
				else if(ctrl && wParam == 65 /*A*/) { // Ctrl+A
					if(oSys.Call("user32::GetFocus") != hWndOutput) {
						noScroll(function() {
							AkelPad.Command(4157); //IDM_EDIT_SELECTALL
						});
					}
				}
				else if(ctrl && wParam == 83 /*S*/) // Ctrl+S
					AkelPad.Command(4105); // IDM_FILE_SAVE
				else if(wParam == 112 /*VK_F1*/) // F1
					showHelp();

				//else if(wParam != 16 /*VK_SHIFT*/ && wParam != 17 /*VK_CONTROL*/ && wParam != 18 /*VK_MENU*/)
				//	AkelPad.MessageBox(hWnd, wParam, dialogTitle, 0 /*MB_OK*/);
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_OK:
					case IDC_CONVERT:
						var okBtn = idc == IDC_OK;
						if(disabled == true || disabled > new Date().getTime())
							break;
						disabled = true;
						if(!readControlsState())
							break;
						controlsEnabled(false);
						var actionObj = {};
						if(action & ACT_SHOW)
							var firstChangedCharObj = {};
						var res = convert(hWnd, actionObj, firstChangedCharObj);
						if(res && okBtn)
							closeDialog();
						else {
							if(action & ACT_SHOW) {
								windowText(hWndOutput, res || "");
								var indx = firstChangedCharObj.value;
								indx && AkelPad.SendMessage(hWndOutput, 177 /*EM_SETSEL*/, indx[0], indx[1]);
							}
							controlsEnabled(true);
							oSys.Call("user32::SetFocus", okBtn ? hWndOK : hWndConvert);
							disabled = new Date().getTime() + disabledTimeout;

							var enc = res && actionObj.value == "encode" ? "*" : "";
							var dec = res && actionObj.value == "decode" ? "*" : "";
							windowText(hWndModeEncode, windowText(hWndModeEncode).replace(/\*$/, "") + enc);
							windowText(hWndModeDecode, windowText(hWndModeDecode).replace(/\*$/, "") + dec);
						}
					break;
					case IDC_CANCEL:
						closeDialog();
					break;
					case IDC_TYPE_HTML:
					case IDC_TYPE_ESCAPES:
					case IDC_TYPE_REGEXP:
					case IDC_TYPE_STRING:
					case IDC_TYPE_URI:
					case IDC_TYPE_URIC:
					case IDC_TYPE_UNESCAPE:
					case IDC_TYPE_BASE64:
					case IDC_TYPE_QP:
					case IDC_TYPE_CHARSET:
						checked(hWndType.HTML,            idc == IDC_TYPE_HTML);
						checked(hWndType.escapes,         idc == IDC_TYPE_ESCAPES);
						checked(hWndType.regExp,          idc == IDC_TYPE_REGEXP);
						checked(hWndType.string,          idc == IDC_TYPE_STRING);
						checked(hWndType.URI,             idc == IDC_TYPE_URI);
						checked(hWndType.URIComponent,    idc == IDC_TYPE_URIC);
						checked(hWndType.unescape,        idc == IDC_TYPE_UNESCAPE);
						checked(hWndType.base64,          idc == IDC_TYPE_BASE64);
						checked(hWndType.quotedPrintable, idc == IDC_TYPE_QP);
						checked(hWndType.charset,         idc == IDC_TYPE_CHARSET);
						setHTMLOptions();
						setBase64Options();

						if((wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/)
							oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CONVERT, 0);
					break;
					case IDC_ENC_CHR:
						setHTMLOptions();
					break;
					case IDC_TO_DATA_URI:
						setBase64Options();
					break;
					case IDC_MODE_AUTO:
					case IDC_MODE_ENCODE:
					case IDC_MODE_DECODE:
						checked(hWndModeAuto,    idc == IDC_MODE_AUTO);
						checked(hWndModeEncode,  idc == IDC_MODE_ENCODE);
						checked(hWndModeDecode,  idc == IDC_MODE_DECODE);
						setBase64Options();

						if((wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/)
							oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CONVERT, 0);
					break;
					case IDC_ACT_SHOW:
						showOutput(checked(hWndActShow));
					case IDC_ACT_INSERT:
						if(idc == IDC_ACT_INSERT && checked(hWndActInsert))
							checked(hWndActCopy, false);
					case IDC_ACT_COPY:
						if(idc == IDC_ACT_COPY && checked(hWndActCopy))
							checked(hWndActInsert, false);
						enableConvertButtons();
				}
			break;
			case 123: //WM_CONTEXTMENU
				if(wParam != hWndOutput)
					break;

				var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
				if(!lpPoint)
					break;
				var xPos = 0;
				var yPos = 0;
				if(lParam == -1) { // Context menu from keyboard
					if(oSys.Call("user32::GetCaretPos", lpPoint)) {
						oSys.Call("user32::ClientToScreen", hWndOutput, lpPoint);
						xPos = AkelPad.MemRead(_PtrAdd(lpPoint, 0), 3 /*DT_DWORD*/);
						yPos = AkelPad.MemRead(_PtrAdd(lpPoint, 4), 3 /*DT_DWORD*/);
					}
					yPos += AkelPad.SendMessage(hWndOutput, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);
				}
				else if(oSys.Call("user32::GetCursorPos", lpPoint)) {
					xPos = AkelPad.MemRead(_PtrAdd(lpPoint, 0), 3 /*DT_DWORD*/);
					yPos = AkelPad.MemRead(_PtrAdd(lpPoint, 4), 3 /*DT_DWORD*/);
				}
				AkelPad.MemFree(lpPoint);

				var hPopupMenu = AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 24 /*MI_MENUPOPUP*/, 0);
				if(!hPopupMenu)
					break;
				var hPopupView = oSys.Call("user32::GetSubMenu", hPopupMenu, 1 /*MENU_POPUP_VIEW*/);

				var hasSel = AkelPad.SendMessage(hWndOutput, 3125 /*AEM_GETSEL*/, 0, 0);
				oSys.Call("user32::EnableMenuItem", hPopupView, 4154 /*IDM_EDIT_COPY*/, hasSel ? 0 /*MF_ENABLED*/ : 1 /*MF_GRAYED*/);

				var cmd = oSys.Call("user32::TrackPopupMenu", hPopupView, 0x182 /*TPM_RETURNCMD|TPM_NONOTIFY|TPM_LEFTBUTTON|TPM_RIGHTBUTTON*/, xPos, yPos, 0, hWnd, 0);
				if(cmd == 4154 /*IDM_EDIT_COPY*/)
					AkelPad.SendMessage(hWndOutput, 769 /*WM_COPY*/, 0, 0);
				else if(cmd == 4157 /*IDM_EDIT_SELECTALL*/) {
					noScroll(function() {
						AkelPad.SendMessage(hWndOutput, 177 /*EM_SETSEL*/, 0, -1);
					}, hWndOutput);
				}
			break;
			case 36: //WM_GETMINMAXINFO
				if(!handleResize)
					break;
				AkelPad.MemCopy(_PtrAdd(lParam, 24), dlgMinW, 3 /*DT_DWORD*/); //ptMinTrackSize.x
				AkelPad.MemCopy(_PtrAdd(lParam, 32), dlgMinW, 3 /*DT_DWORD*/); //ptMaxTrackSize.x
				if(checked(hWndActShow))
					AkelPad.MemCopy(_PtrAdd(lParam, 28), dlgMinH + outputMinH + 12, 3 /*DT_DWORD*/); //ptMinTrackSize.y
				else {
					AkelPad.MemCopy(_PtrAdd(lParam, 28), dlgH, 3 /*DT_DWORD*/); //ptMinTrackSize.y
					AkelPad.MemCopy(_PtrAdd(lParam, 36), dlgH, 3 /*DT_DWORD*/); //ptMaxTrackSize.y
				}
			break;
			case 5: //WM_SIZE
				if(!handleResize || oSys.Call("user32::IsIconic", hWnd))
					break;
				var rcWnd = getWindowRect(hWnd);
				if(!rcWnd)
					break;
				var curW = rcWnd.right - rcWnd.left;
				var curH = rcWnd.bottom - rcWnd.top;
				resizeDialog(hWnd, curW, curH);
			break;
			case 15: //WM_PAINT
				if(!checked(hWndActShow))
					break;
				// Based on code of SearchReplace.js script
				var ps;
				var hDC;
				var lpGrip;
				var rcGrip;
				if(ps = AkelPad.MemAlloc(_X64 ? 72 : 64 /*sizeof(PAINTSTRUCT)*/)) {
					if(hDC = oSys.Call("user32::BeginPaint", hWnd, ps)) {
						if(lpGrip = AkelPad.MemAlloc(16 /*sizeof(RECT)*/)) {
							if(oSys.Call("user32::GetClientRect", hWnd, lpGrip)) {
								rcGrip = parseRect(lpGrip);
								rcGrip.left = rcGrip.right  - oSys.Call("user32::GetSystemMetrics", 2 /*SM_CXVSCROLL*/);
								rcGrip.top  = rcGrip.bottom - oSys.Call("user32::GetSystemMetrics", 20 /*SM_CYVSCROLL*/);

								AkelPad.MemCopy(_PtrAdd(lpGrip,  0), rcGrip.left,   3 /*DT_DWORD*/);
								AkelPad.MemCopy(_PtrAdd(lpGrip,  4), rcGrip.top,    3 /*DT_DWORD*/);
								AkelPad.MemCopy(_PtrAdd(lpGrip,  8), rcGrip.right,  3 /*DT_DWORD*/);
								AkelPad.MemCopy(_PtrAdd(lpGrip, 12), rcGrip.bottom, 3 /*DT_DWORD*/);

								oSys.Call("user32::DrawFrameControl", hDC, lpGrip, 3 /*DFC_SCROLL*/, 0x8 /*DFCS_SCROLLSIZEGRIP*/);
							}
							AkelPad.MemFree(lpGrip);
						}
						oSys.Call("user32::EndPaint", hWnd, ps);
					}
					AkelPad.MemFree(ps);
				}
			break;
			case 16: //WM_CLOSE
				enabled(hMainWnd, true); // Enable main window
				saveWindowPosition();
				if(saveOptions == 2)
					readControlsState() && savePrefs();
				oSys.Call("user32::DestroyWindow", hWnd); // Destroy dialog
			break;
			case 2: //WM_DESTROY
				oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		}
		return 0;
	}
	function restoreWindowPosition(hWnd, hWndParent) {
		if(dlgX == undefined || dlgY == undefined) {
			centerWindow(hWnd, hWndParent);
			return;
		}

		var rcWnd = getWindowRect(hWnd);
		if(!rcWnd)
			return;

		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		if(!lpRect)
			return;
		AkelPad.MemCopy(_PtrAdd(lpRect,  0), dlgX,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect,  4), dlgY,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect,  8), dlgX + (rcWnd.right - rcWnd.left), 3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect, 12), dlgY + (rcWnd.top - rcWnd.bottom), 3 /*DT_DWORD*/);
		var hMonitor = oSys.Call("user32::MonitorFromRect", lpRect, 0x2 /*MONITOR_DEFAULTTONEAREST*/);

		if(hMonitor) {
			//typedef struct tagMONITORINFO {
			//  DWORD cbSize;
			//  RECT  rcMonitor;
			//  RECT  rcWork;
			//  DWORD dwFlags;
			//} MONITORINFO, *LPMONITORINFO;
			var sizeofMonitorInfo = 4 + 16 + 16 + 4;
			var lpMi = AkelPad.MemAlloc(sizeofMonitorInfo);
			if(lpMi) {
				AkelPad.MemCopy(lpMi, sizeofMonitorInfo, 3 /*DT_DWORD*/);
				oSys.Call("user32::GetMonitorInfo" + _TCHAR, hMonitor, lpMi);
				var rcWork = parseRect(_PtrAdd(lpMi, 4 + 16));
				AkelPad.MemFree(lpMi);
			}
		}
		else { //?
			oSys.Call("user32::SystemParametersInfo" + _TCHAR, 48 /*SPI_GETWORKAREA*/, 0, lpRect, 0);
			var rcWork = parseRect(lpRect);
		}
		AkelPad.MemFree(lpRect);

		if(rcWork) {
			var edge = Math.max(
				16,
				oSys.Call("user32::GetSystemMetrics", 33 /*SM_CYSIZEFRAME*/)
					+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/)
			);

			var minX = rcWork.left - (rcWnd.right - rcWnd.left) + edge;
			var minY = rcWork.top;
			var maxX = rcWork.right - edge;
			var maxY = rcWork.bottom - edge;

			dlgX = Math.max(minX, Math.min(maxX, dlgX));
			dlgY = Math.max(minY, Math.min(maxY, dlgY));
		}

		//oSys.Call("user32::SetWindowPos", hWnd, 0, dlgX, dlgY, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
		moveWindow(hWnd, dlgX, dlgY);
	}
	function centerWindow(hWnd, hWndParent) {
		var rcWnd = getWindowRect(hWnd);
		var rcWndParent = getWindowRect(hWndParent || oSys.Call("user32::GetDesktopWindow"));
		if(!rcWndParent || !rcWnd)
			return;
		var x = rcWndParent.left + ((rcWndParent.right  - rcWndParent.left) / 2 - (rcWnd.right  - rcWnd.left) / 2);
		var y = rcWndParent.top  + ((rcWndParent.bottom - rcWndParent.top)  / 2 - (rcWnd.bottom - rcWnd.top)  / 2);
		//oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
		moveWindow(hWnd, x, y);
	}
	function moveWindow(hWnd, x, y, hWndParent) {
		if(hWndParent) {
			var rcWnd = getWindowRect(hWnd, hWndParent);
			if(rcWnd) {
				x += rcWnd.left;
				y += rcWnd.top;
			}
		}
		oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
	}
	function resizeWindow(hWnd, dw, dh) {
		var rcWnd = getWindowRect(hWnd);
		if(!rcWnd)
			return;
		var w = rcWnd.right - rcWnd.left + dw;
		var h = rcWnd.bottom - rcWnd.top + dh;
		oSys.Call("user32::SetWindowPos", hWnd, 0, 0, 0, w, h, 0x16 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOMOVE*/);
	}
	function resizeDialog(hWnd, curW, curH) {
		var dw = curW - dlgW;
		var dh = curH - dlgH;

		resizeWindow(hWndOutput, dw, dh);
		moveWindow(hWndOK,      0, dh, hWnd);
		moveWindow(hWndConvert, 0, dh, hWnd);
		moveWindow(hWndCancel,  0, dh, hWnd);

		dlgW = curW;
		dlgH = curH;
		if(checked(hWndActShow))
			outputH = curH - dlgMinH - 12;

		oSys.Call("user32::InvalidateRect", hWnd, 0, true);
	}
	function showOutput(show) {
		handleResize = false;
		oSys.Call("user32::ShowWindow", hWndOutput, show);
		var dh = (outputH + 12)*(show ? 1 : -1);
		moveWindow(hWndOK,      0, dh, hWndDialog);
		moveWindow(hWndConvert, 0, dh, hWndDialog);
		moveWindow(hWndCancel,  0, dh, hWndDialog);
		resizeWindow(hWndDialog, 0, dh);
		dlgH += dh;
		handleResize = true;
	}
	function getWindowRect(hWnd, hWndParent) {
		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		getRect: if(lpRect) {
			if(!oSys.Call("user32::GetWindowRect", hWnd, lpRect))
				break getRect;
			if(hWndParent && !oSys.Call("user32::ScreenToClient", hWndParent, lpRect))
				break getRect;
			var rcWnd = parseRect(lpRect);
		}
		lpRect && AkelPad.MemFree(lpRect);
		return rcWnd;
	}
	function parseRect(lpRect) {
		return {
			left:   AkelPad.MemRead(_PtrAdd(lpRect,  0), 3 /*DT_DWORD*/),
			top:    AkelPad.MemRead(_PtrAdd(lpRect,  4), 3 /*DT_DWORD*/),
			right:  AkelPad.MemRead(_PtrAdd(lpRect,  8), 3 /*DT_DWORD*/),
			bottom: AkelPad.MemRead(_PtrAdd(lpRect, 12), 3 /*DT_DWORD*/)
		};
	}
	function setHTMLOptions() {
		var isHTML = checked(hWndType.HTML);
		enabled(hWndDecEnt,    isHTML);
		enabled(hWndEncEnt,    isHTML);
		enabled(hWndDecEntSp,  isHTML);
		enabled(hWndEncEntSp,  isHTML);
		enabled(hWndDecChr,    isHTML);
		enabled(hWndEncChr,    isHTML);
		enabled(hWndEncChrHex, isHTML && checked(hWndEncChr));
	}
	function setBase64Options() {
		var on = checked(hWndType.URIComponent) && !checked(hWndModeDecode);
		enabled(hWndToDataURI, on);
		enabled(hWndToBase64, on && checked(hWndToDataURI));
	}
	function readControlsState() {
		for(var t in hWndType) {
			var h = hWndType[t];
			if(checked(h)) {
				var newType = type = t.toLowerCase();
				break;
			}
		}
		if(!newType)
			return false;

		if(checked(hWndModeAuto))
			mode = MODE_AUTO;
		else if(checked(hWndModeEncode))
			mode = MODE_ENCODE;
		else if(checked(hWndModeDecode))
			mode = MODE_DECODE;
		else
			return false;

		action = 0;
		if(checked(hWndActInsert))
			action |= ACT_INSERT;
		if(checked(hWndActCopy))
			action |= ACT_COPY;
		if(checked(hWndActShow))
			action |= ACT_SHOW;
		if(!action)
			return false;

		decodeSpecialEntities = checked(hWndDecEnt);
		encodeSpecialEntities = checked(hWndEncEnt);
		decodeSpacesEntities  = checked(hWndDecEntSp);
		encodeSpacesEntities  = checked(hWndEncEntSp);
		decodeCharCodes       = checked(hWndDecChr);
		encodeChars           = checked(hWndEncChr);
		encodeAsHex           = checked(hWndEncChrHex);

		toDataURI             = checked(hWndToDataURI);
		toBase64              = checked(hWndToBase64);

		return true;
	}
	function enableConvertButtons() {
		var ok = checked(hWndActInsert) || checked(hWndActCopy) || checked(hWndActShow);
		enabled(hWndOK, ok);
		enabled(hWndConvert, ok);
	}
	function windowText(hWnd, pText) {
		if(arguments.length > 1)
			return oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, pText.replace(/\0/g, "¤"));
		var len = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWnd);
		var lpText = AkelPad.MemAlloc((len + 1)*_TSIZE);
		if(!lpText)
			return "";
		oSys.Call("user32::GetWindowText" + _TCHAR, hWnd, lpText, len + 1);
		pText = AkelPad.MemRead(lpText, _TSTR);
		AkelPad.MemFree(lpText);
		return pText;
	}
	function checked(hWnd, val) {
		return arguments.length == 1
			? AkelPad.SendMessage(hWnd, 240 /*BM_GETCHECK*/, 0, 0)
			: AkelPad.SendMessage(hWnd, 241 /*BM_SETCHECK*/, val ? 1 /*BST_CHECKED*/ : 0, 0);
	}
	function enabled(hWnd, val) {
		oSys.Call("user32::EnableWindow", hWnd, val);
	}
	function controlsEnabled(val) {
		enabled(hWndOK, val);
		enabled(hWndConvert, val);
		!modal && enabled(hMainWnd, val);
	}
	function closeDialog() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
	}
	function getKeyState(key) {
		return oSys.Call("user32::GetAsyncKeyState", key) & 0x8000; // Fix 4-byte result in AkelPad x64
	}
	function showHelp() {
		var res = AkelPad.OpenFile(WScript.ScriptFullName);
		if(
			res != 0 /*EOD_SUCCESS*/
			&& res != -13 /*EOD_WINDOW_EXIST*/
		)
			return;

		var help = "// Hotkeys:";
		for(var t in hWndType) {
			var h = hWndType[t];
			if(!checked(h))
				continue;
			var text = windowText(h);
			loop: for(var str in _localize._strings) {
				var o = _localize._strings[str];
				for(var lng in o) {
					if(o[lng] == text) {
						help = "// " + str.replace(/&/, "");
						break loop;
					}
				}
			}
			break;
		}
		AkelPad.TextFind(AkelPad.GetEditWnd(), help, 0x200001 /*FRF_DOWN|FRF_BEGINNING*/);
	}

	function Scale(hDC, hWnd) {
		var hNewDC = hDC || oSys.Call("user32::GetDC", hWnd);
		if(hNewDC) {
			this._x = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 88 /*LOGPIXELSX*/);
			this._y = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 90 /*LOGPIXELSY*/);

			//Align to 16 pixel
			this._x += (16 - this._x % 16) % 16;
			this._y += (16 - this._y % 16) % 16;

			!hDC && oSys.Call("user32::ReleaseDC", hWnd, hNewDC);

			this.x = function(x) {
				return oSys.Call("kernel32::MulDiv", x, this._x, 96);
			};
			this.y = function(y) {
				return oSys.Call("kernel32::MulDiv", y, this._y, 96);
			};
		}
		else {
			this.x = this.y = function(n) {
				return n;
			};
		}
	}
	function createWindowEx(
		dwExStyle, lpClassName, lpWindowName, dwStyle,
		x, y, w, h,
		hWndParent, id, hInstance, callback
	) {
		return oSys.Call(
			"user32::CreateWindowEx" + _TCHAR,
			dwExStyle,
			lpClassName,
			lpWindowName,
			dwStyle,
			scale.x(x),
			scale.y(y),
			scale.x(w),
			scale.y(h),
			hWndParent,
			id,
			hInstance,
			callback || 0
		);
	}

	modal && enabled(hMainWnd, false); // Disable main window, to make dialog modal

	AkelPad.ScriptNoMutex(); // Allow other scripts running
	AkelPad.WindowGetMessage(); // Message loop

	AkelPad.WindowUnregisterClass(dialogClass);
}
function savePrefs() {
	prefs.set({
		type:   type,
		mode:   mode,
		action: action,

		decodeSpecialEntities: decodeSpecialEntities,
		encodeSpecialEntities: encodeSpecialEntities,

		decodeSpacesEntities:  decodeSpacesEntities,
		encodeSpacesEntities:  encodeSpacesEntities,

		decodeCharCodes:       decodeCharCodes,
		encodeChars:           encodeChars,
		encodeAsHex:           encodeAsHex,

		toDataURI:             toDataURI,
		toBase64:              toBase64
	});
	prefs.end();
}

function getAllText() {
	if(typeof AkelPad.GetTextRange != "undefined")
		return AkelPad.GetTextRange(0, -1, 4 - AkelPad.GetEditNewLine(0));
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
	var str = AkelPad.GetSelText(4 - AkelPad.GetEditNewLine(0));

	AkelPad.SetSel(ss, se);
	columnSel && AkelPad.SendMessage(hWndEdit, 3128 /*AEM_UPDATESEL*/, 0x1 /*AESELT_COLUMNON*/, 0);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	AkelPad.MemFree(lpPoint);
	setRedraw(hWndEdit, true);
	return str;
}
function insertNoScroll(str, selectAll) {
	noScroll(function() {
		selectAll && AkelPad.SetSel(0, -1);
		//var ss = AkelPad.GetSelStart();
		AkelPad.ReplaceSel(str, true);
		//if(ss != AkelPad.GetSelStart())
		//	AkelPad.SetSel(ss, ss + str.length);
	});
}
function noScroll(func, hWndEdit) {
	if(!hWndEdit)
		hWndEdit = AkelPad.GetEditWnd();
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	func();

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}

function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; ++i)
		if(/^[-\/](\w+)(=(.+))?$/i.test(WScript.Arguments(i)))
			args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
	for(var p in overrideArgs)
		args[p.toLowerCase()] = overrideArgs[p];
	getArg = function(argName, defaultVal) {
		argName = argName.toLowerCase();
		return typeof args[argName] == "undefined" // argName in args
			? defaultVal
			: args[argName];
	};
	return getArg(argName, defaultVal);
}
function getArgOrPref(name, type, defaultVal) {
	var argVal = getArg(name);
	return argVal === undefined
		? saveOptions
			? prefs.get(name, type, defaultVal)
			: defaultVal
		: argVal;
}
function Prefs(ns) {
	if(!ns)
		ns = WScript.ScriptBaseName;
	var oSet = AkelPad.ScriptSettings();
	var state  = 0;
	var READ   = 0x1; //POB_READ
	var SAVE   = 0x2; //POB_SAVE
	var CLEAR  = 0x4; //POB_CLEAR
	var DWORD  = 1;   //PO_DWORD
	var BINARY = 2;   //PO_BINARY
	var STRING = 3;   //PO_STRING
	function get(name, type, defaultVal) {
		if(!(state & READ)) {
			end();
			if(!oSet.Begin(ns, READ))
				return defaultVal;
			state = READ;
		}
		var val = oSet.Read(name, type || DWORD);
		if(val === undefined)
			val = defaultVal;
		//oSet.End();
		return val;
	}
	function initSave() {
		if(!(state & SAVE)) {
			end();
			if(!oSet.Begin(ns, SAVE))
				return false;
			state = SAVE;
		}
		return true;
	}
	function set(name, val) {
		if(!initSave())
			return false;
		var sets;
		if(arguments.length == 1)
			sets = name;
		else {
			sets = {};
			sets[name] = val;
		}
		var ok = true;
		for(var name in sets) {
			var val = sets[name];
			var type = typeof val == "number" || typeof val == "boolean" ? DWORD : STRING;
			if(!oSet.Write(name, type, val))
				ok = false;
		}
		//oSet.End();
		return ok;
	}
	function remove(name) {
		return initSave() && !!oSet.Delete(name);
	}
	function begin(flags) {
		end();
		var ok = oSet.Begin(ns, flags);
		if(ok)
			state = flags;
		return ok;
	}
	function end() {
		if(!state)
			return true;
		var ok = oSet.End();
		if(ok)
			state = 0;
		return ok;
	}
	this.READ   = READ;
	this.SAVE   = SAVE;
	this.CLEAR  = CLEAR;
	this.DWORD  = DWORD;
	this.BINARY = BINARY;
	this.STRING = STRING;
	this.get    = get;
	this.set    = set;
	this.remove = remove;
	this.begin  = begin;
	this.end    = end;
}

// Testcases for convertFromUnicode/convertToUnicode:

//var u = "Проверка\x00Test";
//var a = convertFromUnicode(u, 1251);
//WScript.Echo(("convertFromUnicode:\n" + u + "\n" + a + "\n" + u.length + "\n" + a.length).replace(/\x00/g, "\\0"));

//var a = "\xcf\xf0\xee\xe2\xe5\xf0\xea\xe0\0Test";
//var u = convertToUnicode(a, 1251);
//WScript.Echo(("convertToUnicode:\n" + a + "\n" + u + "\n" + a.length + "\n" + u.length).replace(/\x00/g, "\\0"));

//var u = "Qwe\u0419\u0446\u0443\u043A\uFFE0\uFFE0\uF900\x00\uFF4D";
//var a = convertFromUnicode(u, 65001);
//var u2 = convertToUnicode(a, 65001);
//WScript.Echo(((u2 == u ? "Ok!" : "Fail!") + "\n" + u + "\n=>\n" + a + "\n=>\n" + u2).replace(/\x00/g, "\\0"));

function convertFromUnicode(str, cp) {
	if(cp == CP_NOT_CONVERT)
		return str;
	if(cp == CP_CURRENT || cp === undefined)
		cp = AkelPad.GetEditCodePage(0);

	var ret = "";

	if(
		cp == 1200 //UTF-16LE
		|| cp == 1201 //UTF-16BE
		|| cp == 12000 //UTF-32LE
		|| cp == 12001 //UTF-32BE
	) {
		var isLE = cp == 1200 || cp == 12000;
		var u32 = cp == 12000 || cp == 12001 ? "\x00\x00" : "";
		for(var i = 0, l = str.length; i < l; ++i) {
			var code = str.charCodeAt(i);
			var b1 = String.fromCharCode(code & 0xff);
			var b2 = String.fromCharCode(code >> 8 & 0xff);
			ret += isLE
				? b1 + b2 + u32
				: u32 + b2 + b1;
		}
		return ret;
	}

	// based on Fr0sT's code: https://akelpad.sourceforge.net/forum/viewtopic.php?p=7972#p7972

	// current code page is UTF16* or UTF32* - set ansi current code page
	// (WideChar <-> MultiByte functions don't work with this code pages)
	if(cp == 1 || cp == 1200 || cp == 1201 || cp == 12000 || cp == 12001)
		cp = 0;

	try {
		var strLen = str.length + 1;
		var pWCBuf = AkelPad.MemAlloc(strLen * _TSIZE);
		if(!pWCBuf)
			throw new Error("MemAlloc fail");
		AkelPad.MemCopy(pWCBuf, str, _TSTR);

		// get required buffer size
		var bufLen = oSys.Call(
			"Kernel32::WideCharToMultiByte",
			cp,       //   __in   UINT CodePage,
			0,        //   __in   DWORD dwFlags,
			pWCBuf,   //   __in   LPCWSTR lpWideCharStr,
			strLen,   //   __in   int cchWideChar,
			0,        //   __out  LPSTR lpMultiByteStr,
			0,        //   __in   int cbMultiByte,
			0,        //   __in   LPCSTR lpDefaultChar,
			0         //   __out  LPBOOL lpUsedDefaultChar
		);
		if(!bufLen)
			throw new Error("WideCharToMultiByte fail " + oSys.GetLastError());

		var pMBBuf = AkelPad.MemAlloc(bufLen);
		if(!pMBBuf)
			throw new Error("MemAlloc fail");

		// convert buffer
		bufLen = oSys.Call(
			"Kernel32::WideCharToMultiByte",
			cp,       //   __in   UINT CodePage,
			0,        //   __in   DWORD dwFlags,
			pWCBuf,   //   __in   LPCWSTR lpWideCharStr,
			strLen,   //   __in   int cchWideChar,
			pMBBuf,   //   __out  LPSTR lpMultiByteStr,
			bufLen,   //   __in   int cbMultiByte,
			0,        //   __in   LPCSTR lpDefaultChar,
			0         //   __out  LPBOOL lpUsedDefaultChar
		);
		if(!bufLen)
			throw new Error("WideCharToMultiByte fail " + oSys.GetLastError());

		//ret = AkelPad.MemRead(pMBBuf, 0 /*DT_ANSI*/);
		for(
			var pCurr = pMBBuf, bufMax = _PtrAdd(pMBBuf, bufLen - 1);
			_PtrMath(pCurr, "<", bufMax);
			pCurr = _PtrAdd(pCurr, 1)
		)
			ret += String.fromCharCode(AkelPad.MemRead(pCurr, 5 /*DT_BYTE*/));
	}
	catch(e) {
		throw e;
	}
	finally {
		pWCBuf && AkelPad.MemFree(pWCBuf);
		pMBBuf && AkelPad.MemFree(pMBBuf);
	}

	return ret;
}

function convertToUnicode(str, cp) {
	if(cp == CP_NOT_CONVERT)
		return str;
	if(cp == CP_CURRENT || cp === undefined)
		cp = AkelPad.GetEditCodePage(0);

	var ret = "";

	if(
		cp == 1200 //UTF-16LE
		|| cp == 1201 //UTF-16BE
		|| cp == 12000 //UTF-32LE
		|| cp == 12001 //UTF-32BE
	) {
		var isLE = cp == 1200 || cp == 12000;
		var step = cp == 12000 || cp == 12001 ? 4 : 2;
		if(str.length % step != 0)
			throw "Invalid unicode string";
		for(var i = 0, l = str.length; i < l; i += step) {
			var chars = str.substr(i, step);
			if(isLE) {
				var b1 = chars.charCodeAt(0);
				var b2 = chars.charCodeAt(1);
			}
			else {
				var b1 = chars.charCodeAt(step - 1);
				var b2 = chars.charCodeAt(step - 2);
			}
			ret += String.fromCharCode((b2 << 8) + b1);
		}
		return ret;
	}

	// based on Fr0sT's code: https://akelpad.sourceforge.net/forum/viewtopic.php?p=7972#p7972

	// current code page is UTF16* or UTF32* - set ansi current code page
	// (WideChar <-> MultiByte functions don't work with this code pages)
	if(cp == 1 || cp == 1200 || cp == 1201 || cp == 12000 || cp == 12001)
		cp = 0;

	try {
		var strLen = str.length;
		var pMBBuf = AkelPad.MemAlloc(strLen * 1 /*sizeof(char)*/);
		if(!pMBBuf)
			throw new Error("MemAlloc fail");
		for(var i = 0; i < strLen; ++i)
			AkelPad.MemCopy(_PtrAdd(pMBBuf, i), str.charCodeAt(i), 5 /*DT_BYTE*/);

		// get required buffer size
		var bufLen = oSys.Call(
			"Kernel32::MultiByteToWideChar",
			cp,       //   __in   UINT CodePage,
			0,        //   __in   DWORD dwFlags,
			pMBBuf,   //   __in   LPCSTR lpMultiByteStr,
			strLen,   //   __in   int cbMultiByte,
			0,        //   __out  LPWSTR lpWideCharStr,
			0         //   __in   int cchWideChar
		);
		if(!bufLen)
			throw new Error("MultiByteToWideChar fail " + oSys.GetLastError());
		bufLen *= 2 /*sizeof(wchar_t)*/;

		var pWCBuf = AkelPad.MemAlloc(bufLen);
		if(!pWCBuf)
			throw new Error("MemAlloc fail");

		// convert buffer
		bufLen = oSys.Call(
			"Kernel32::MultiByteToWideChar",
			cp,       //   __in   UINT CodePage,
			0,        //   __in   DWORD dwFlags,
			pMBBuf,   //   __in   LPCSTR lpMultiByteStr,
			strLen,   //   __in   int cbMultiByte,
			pWCBuf,   //   __out  LPWSTR lpWideCharStr,
			bufLen    //   __in   int cchWideChar
		);
		if(!bufLen)
			throw new Error("MultiByteToWideChar fail " + oSys.GetLastError());

		//ret = AkelPad.MemRead(pWCBuf, 1 /*DT_UNICODE*/);
		for(
			var pCurr = pWCBuf, bufMax = _PtrAdd(pWCBuf, bufLen*2);
			_PtrMath(pCurr, "<", bufMax);
			pCurr = _PtrAdd(pCurr, 2)
		)
			ret += String.fromCharCode(AkelPad.MemRead(pCurr, 4 /*DT_WORD*/));
	}
	catch(e) {
		throw e;
	}
	finally {
		pMBBuf && AkelPad.MemFree(pMBBuf);
		pWCBuf && AkelPad.MemFree(pWCBuf);
	}

	return ret;
}

if(AkelPad.IsInclude()) {
	// this.foo = ... doesn't work:
	// https://akelpad.sourceforge.net/forum/viewtopic.php?p=18304#p18304
	// But declarations without "var" becomes global
	var _exports = {
		converters: converters,
		convertFromUnicode: convertFromUnicode,
		convertToUnicode: convertToUnicode,
		trimBase64String: trimBase64String,
		isBase64: isBase64
	};
	var _f = [];
	for(var _p in _exports)
		_f[_f.length] = "if(typeof " + _p + " == 'undefined') " + _p + " = e." + _p + ";";
	// Go to the global scope
	new Function("e", _f.join("\n"))(_exports);
}

})();