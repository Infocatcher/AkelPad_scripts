// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11095#11095
// http://infocatcher.ucoz.net/js/akelpad_scripts/converter.js

// (c) Infocatcher 2010-2011
// version 0.2.2 - 2011-11-16

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

// Encode/decode HTML entities:
//   &    <=> &amp;
//   <    <=> &lt;
//   >    <=> &gt;
//   "    <=> &quot;
//   ©    <=> &copy;  (and some other entities, see arguments)
//   char <=> &#code; (see arguments)

// Convert JavaScript escape sequences like "\u00a9" or "\xa9" ((c) symbol)

// Escape/unescape special RegExp symbols:
//   http://example.com/ <=> http:\/\/example\.com\/

// Escape/unescape special strings symbols:
//   ab"cd\ef <=> ab\"cd\\ef
// Select string with commas to don't escape another commas inside:
//   "ab"cd'ef" <=> "ab\"cd'ef"

// Encode/decode Uniform Resource Identifiers (URIs) with
//   encodeURI/decodeURI or encodeURIComponent/decodeURIComponent

// Base64 encode/decode
// based on code from http://www.farfarfar.com/scripts/encrypt/

// Convert charset
// -type="Charset"
//   Encode: WideCharToMultiByte() http://msdn.microsoft.com/en-us/library/dd374130(v=vs.85).aspx
//   Decode: MultiByteToWideChar() http://msdn.microsoft.com/en-us/library/dd319072(v=vs.85).aspx
//   Íå÷òî <=> Нечто (with cp1251 aka windows-1251)
// -type="Recode" (works like built-in recode command)
//   бНОПНЯ <=> Вопрос (from cp20866 aka KOI8-R to cp1251 aka windows-1251)

// Arguments:
//   -mode=0                                 - (default) auto encode or decode
//   -mode=1                                 - encode
//   -mode=2                                 - decode
//   -type="RegExp"                          - type of converter ("HTML", "Escapes", "RegExp", "String",
//                                             "URI", "URIComponent", "Base64", "Charset", "Recode")
//   -action=1                               - sum of flags: 1 - insert, 2 - copy, 4 - show
//   -dialog=false                           - don't show dialog
//   -onlySelected=true                      - use only selected text
//   -warningTime=4000                       - show warning for slow calculations
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

// Usage:
//   Call("Scripts::Main", 1, "converter.js")
//   Call("Scripts::Main", 1, "converter.js", `-mode=0 -type="HTML"`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=0 -type="HTML" -decodeCharCodes=true -encodeChars=true "-charsToEncode=/'|[^!-~ \t\n\rа-яё]/ig"`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=0 -type="Escapes" -dialog=false`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=2 -type="Charset" -codePage=1251 -dialog=false -saveOptions=0`)
//   Call("Scripts::Main", 1, "converter.js", `-mode=2 -type="Recode" -codePageFrom=20866 -codePageTo=1251 -dialog=false -saveOptions=0`)
//===================

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
		"sy&mbol => &&#code;": {
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
		"&Base64": {
			ru: "&Base64"
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
		"&Copy": {
			ru: "&Копировать"
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

var customEscapesDecoder  = getArg("customEscapesDecoder", false);
var codePageURI           = getArg("codePageURI", CP_NOT_CONVERT);
var codePageBase64        = getArg("codePageBase64", CP_CURRENT);
var maxLineWidth          = getArg("maxLineWidth", 75);
var toDataURI             = getArgOrPref("toDataURI", prefs && prefs.DWORD, false);
var toBase64              = getArgOrPref("toBase64",  prefs && prefs.DWORD, false);
var codePage              = getArg("codePage", CP_CURRENT);
var codePageFrom          = getArg("codePageFrom", CP_CURRENT);
var codePageTo            = getArg("codePageTo", CP_CURRENT);

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
	// Converted from \res\dtd\xhtml11.dtd in Firefox 3.6.13
	iexcl:    "\u00a1",
	cent:     "\u00a2",
	pound:    "\u00a3",
	curren:   "\u00a4",
	yen:      "\u00a5",
	brvbar:   "\u00a6",
	sect:     "\u00a7",
	uml:      "\u00a8",
	copy:     "\u00a9",
	ordf:     "\u00aa",
	laquo:    "\u00ab",
	not:      "\u00ac",
	shy:      "\u00ad",
	reg:      "\u00ae",
	macr:     "\u00af",
	deg:      "\u00b0",
	plusmn:   "\u00b1",
	sup2:     "\u00b2",
	sup3:     "\u00b3",
	acute:    "\u00b4",
	micro:    "\u00b5",
	para:     "\u00b6",
	middot:   "\u00b7",
	cedil:    "\u00b8",
	sup1:     "\u00b9",
	ordm:     "\u00ba",
	raquo:    "\u00bb",
	frac14:   "\u00bc",
	frac12:   "\u00bd",
	frac34:   "\u00be",
	iquest:   "\u00bf",
	Agrave:   "\u00c0",
	Aacute:   "\u00c1",
	Acirc:    "\u00c2",
	Atilde:   "\u00c3",
	Auml:     "\u00c4",
	Aring:    "\u00c5",
	AElig:    "\u00c6",
	Ccedil:   "\u00c7",
	Egrave:   "\u00c8",
	Eacute:   "\u00c9",
	Ecirc:    "\u00ca",
	Euml:     "\u00cb",
	Igrave:   "\u00cc",
	Iacute:   "\u00cd",
	Icirc:    "\u00ce",
	Iuml:     "\u00cf",
	ETH:      "\u00d0",
	Ntilde:   "\u00d1",
	Ograve:   "\u00d2",
	Oacute:   "\u00d3",
	Ocirc:    "\u00d4",
	Otilde:   "\u00d5",
	Ouml:     "\u00d6",
	times:    "\u00d7",
	Oslash:   "\u00d8",
	Ugrave:   "\u00d9",
	Uacute:   "\u00da",
	Ucirc:    "\u00db",
	Uuml:     "\u00dc",
	Yacute:   "\u00dd",
	THORN:    "\u00de",
	szlig:    "\u00df",
	agrave:   "\u00e0",
	aacute:   "\u00e1",
	acirc:    "\u00e2",
	atilde:   "\u00e3",
	auml:     "\u00e4",
	aring:    "\u00e5",
	aelig:    "\u00e6",
	ccedil:   "\u00e7",
	egrave:   "\u00e8",
	eacute:   "\u00e9",
	ecirc:    "\u00ea",
	euml:     "\u00eb",
	igrave:   "\u00ec",
	iacute:   "\u00ed",
	icirc:    "\u00ee",
	iuml:     "\u00ef",
	eth:      "\u00f0",
	ntilde:   "\u00f1",
	ograve:   "\u00f2",
	oacute:   "\u00f3",
	ocirc:    "\u00f4",
	otilde:   "\u00f5",
	ouml:     "\u00f6",
	divide:   "\u00f7",
	oslash:   "\u00f8",
	ugrave:   "\u00f9",
	uacute:   "\u00fa",
	ucirc:    "\u00fb",
	uuml:     "\u00fc",
	yacute:   "\u00fd",
	thorn:    "\u00fe",
	yuml:     "\u00ff",
	fnof:     "\u0192",
	Alpha:    "\u0391",
	Beta:     "\u0392",
	Gamma:    "\u0393",
	Delta:    "\u0394",
	Epsilon:  "\u0395",
	Zeta:     "\u0396",
	Eta:      "\u0397",
	Theta:    "\u0398",
	Iota:     "\u0399",
	Kappa:    "\u039a",
	Lambda:   "\u039b",
	Mu:       "\u039c",
	Nu:       "\u039d",
	Xi:       "\u039e",
	Omicron:  "\u039f",
	Pi:       "\u03a0",
	Rho:      "\u03a1",
	Sigma:    "\u03a3",
	Tau:      "\u03a4",
	Upsilon:  "\u03a5",
	Phi:      "\u03a6",
	Chi:      "\u03a7",
	Psi:      "\u03a8",
	Omega:    "\u03a9",
	alpha:    "\u03b1",
	beta:     "\u03b2",
	gamma:    "\u03b3",
	delta:    "\u03b4",
	epsilon:  "\u03b5",
	zeta:     "\u03b6",
	eta:      "\u03b7",
	theta:    "\u03b8",
	iota:     "\u03b9",
	kappa:    "\u03ba",
	lambda:   "\u03bb",
	mu:       "\u03bc",
	nu:       "\u03bd",
	xi:       "\u03be",
	omicron:  "\u03bf",
	pi:       "\u03c0",
	rho:      "\u03c1",
	sigmaf:   "\u03c2",
	sigma:    "\u03c3",
	tau:      "\u03c4",
	upsilon:  "\u03c5",
	phi:      "\u03c6",
	chi:      "\u03c7",
	psi:      "\u03c8",
	omega:    "\u03c9",
	thetasym: "\u03d1",
	upsih:    "\u03d2",
	piv:      "\u03d6",
	bull:     "\u2022",
	hellip:   "\u2026",
	prime:    "\u2032",
	Prime:    "\u2033",
	oline:    "\u203e",
	frasl:    "\u2044",
	weierp:   "\u2118",
	image:    "\u2111",
	real:     "\u211c",
	trade:    "\u2122",
	alefsym:  "\u2135",
	larr:     "\u2190",
	uarr:     "\u2191",
	rarr:     "\u2192",
	darr:     "\u2193",
	harr:     "\u2194",
	crarr:    "\u21b5",
	lArr:     "\u21d0",
	uArr:     "\u21d1",
	rArr:     "\u21d2",
	dArr:     "\u21d3",
	hArr:     "\u21d4",
	forall:   "\u2200",
	part:     "\u2202",
	exist:    "\u2203",
	empty:    "\u2205",
	nabla:    "\u2207",
	isin:     "\u2208",
	notin:    "\u2209",
	ni:       "\u220b",
	prod:     "\u220f",
	sum:      "\u2211",
	minus:    "\u2212",
	lowast:   "\u2217",
	radic:    "\u221a",
	prop:     "\u221d",
	infin:    "\u221e",
	ang:      "\u2220",
	and:      "\u2227",
	or:       "\u2228",
	cap:      "\u2229",
	cup:      "\u222a",
	int:      "\u222b",
	there4:   "\u2234",
	sim:      "\u223c",
	cong:     "\u2245",
	asymp:    "\u2248",
	ne:       "\u2260",
	equiv:    "\u2261",
	le:       "\u2264",
	ge:       "\u2265",
	sub:      "\u2282",
	sup:      "\u2283",
	nsub:     "\u2284",
	sube:     "\u2286",
	supe:     "\u2287",
	oplus:    "\u2295",
	otimes:   "\u2297",
	perp:     "\u22a5",
	sdot:     "\u22c5",
	lceil:    "\u2308",
	rceil:    "\u2309",
	lfloor:   "\u230a",
	rfloor:   "\u230b",
	lang:     "\u2329",
	rang:     "\u232a",
	loz:      "\u25ca",
	spades:   "\u2660",
	clubs:    "\u2663",
	hearts:   "\u2665",
	diams:    "\u2666",
	OElig:    "\u0152",
	oelig:    "\u0153",
	Scaron:   "\u0160",
	scaron:   "\u0161",
	Yuml:     "\u0178",
	circ:     "\u02c6",
	tilde:    "\u02dc",
	zwnj:     "\u200c",
	zwj:      "\u200d",
	lrm:      "\u200e",
	rlm:      "\u200f",
	ndash:    "\u2013",
	mdash:    "\u2014",
	lsquo:    "\u2018",
	rsquo:    "\u2019",
	sbquo:    "\u201a",
	ldquo:    "\u201c",
	rdquo:    "\u201d",
	bdquo:    "\u201e",
	dagger:   "\u2020",
	Dagger:   "\u2021",
	permil:   "\u2030",
	lsaquo:   "\u2039",
	rsaquo:   "\u203a",
	euro:     "\u20ac"
};
var spacesEntities = {
	nbsp:     "\u00a0",
	ensp:     "\u2002",
	emsp:     "\u2003",
	thinsp:   "\u2009"
};
function encodeHTML(str) {
	str = str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
	if(encodeSpecialEntities)
		str = encodeEntities(str, specialEntities);
	if(encodeSpacesEntities)
		str = encodeEntities(str, spacesEntities);
	if(encodeChars)
		str = str.replace(
			charsToEncode,
			function(s) {
				var code = s.charCodeAt(0);
				if(encodeAsHex)
					code = "x" + code.toString(16);
				return "&#" + code + ";";
			}
		);
	return str;
}
function encodeEntities(str, entities) {
	for(var entity in entities) {
		var chr = entities[entity];
		var hex = chr.charCodeAt(0).toString(16);
		hex = "\\u" + "0000".substr(hex.length) + hex;
		str = str.replace(new RegExp(hex, "g"), "&" + entity + ";");
	}
	return str;
}
function decodeHTML(str) {
	if(decodeCharCodes)
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
	if(decodeSpecialEntities || decodeSpacesEntities)
		str = str
			.replace(
				/&([a-z]+\d*);/ig,
				function(s, entity) {
					// "key in object" Doesn't work in old JScript, but "replace(str, function)" doesn't work too
					if(decodeSpecialEntities && entity in specialEntities)
						return specialEntities[entity];
					if(decodeSpacesEntities && entity in spacesEntities)
						return spacesEntities[entity];
					return s;
				}
			);
	return str
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&");
}

function encodeEscapes(str) {
	return str.replace(
		/[^!-~ \t\n\r]/ig,
		function(s) {
			var hex = s.charCodeAt(0).toString(16);
			return "\\u" + "0000".substr(hex.length) + hex;
		}
	);
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
		if(comma == '"')
			middle = esc
				? middle.replace(/[\\"]/g, "\\$&")
				: middle.replace(/\\([\\"])/g, "$1");
		else
			middle = esc
				? middle.replace(/[\\']/g, "\\$&")
				: middle.replace(/\\([\\'])/g, "$1");
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
			return "%" + "00".substr(hex.length) + hex;
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
			return convertToUnicode(String.fromCharCode(parseInt(hex, 16)), cp);
		}
	);
	return /%/.test(ret) ? str : ret;
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
			for (var j = 0, l = _keyStr.length; j < l; j++)
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
	base64: {
		prettyName: "Base64",
		firstAction: "decode",
		speed: [156.56, 138.30],
		encode: encodeBase64,
		decode: decodeBase64
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

if(hMainWnd && (typeof AkelPad.IsInclude == "undefined" || !AkelPad.IsInclude())) {
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
	//var t = new Date().getTime();
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
	//WScript.Echo(text.length/(new Date().getTime() - t));

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
		for(var i = 0, l = Math.min(_text.length, _res.length); i < l; i++) {
			if(_res.charAt(i) != _text.charAt(i)) {
				indx = i;
				break;
			}
		}
		if(indx == undefined)
			indx = _res.length > _text.length
				? _text.length
				: _res.length - 1;
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
	var IDC_TYPE_BASE64   = 1014;
	var IDC_TO_DATA_URI   = 1015;
	var IDC_TO_BASE64     = 1016;
	var IDC_MODE_AUTO     = 1017;
	var IDC_MODE_ENCODE   = 1018;
	var IDC_MODE_DECODE   = 1019;
	var IDC_ACT_INSERT    = 1020;
	var IDC_ACT_COPY      = 1021;
	var IDC_ACT_SHOW      = 1022;
	var IDC_OUTPUT        = 1023;
	var IDC_OK            = 1024;
	var IDC_CONVERT       = 1025;
	var IDC_CANCEL        = 1026;

	var hWndGroupType, hWndTypeHTML, hWndTypeEscapes, hWndTypeRegExp, hWndTypeString, hWndTypeURI, hWndTypeURIC, hWndTypeBase64;
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
		if(savePosition)
			prefs.set({
				windowLeft: rcWnd.left,
				windowTop:  rcWnd.top
			});
		if(saveSize)
			prefs.set("outputHeight", Math.round(outputH/scale.y(10000)*10000));
		prefs.end();
	}

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 32 /*SM_CXSIZEFRAME*/) * 2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 33 /*SM_CYSIZEFRAME*/) * 2 + oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	var dlgMinW = scale.x(410) + sizeNonClientX;
	var dlgMinH = scale.y(373) + sizeNonClientY; // + outputH + 12
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

				// GroupBox converter
				hWndGroupType = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,           //x
					10,           //y
					386,          //nWidth
					214,          //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndGroupType, hGuiFont, _localize("Convert"));

				//~ todo: add tooltip to each converter

				// Radiobutton HTML converter
				hWndTypeHTML = createWindowEx(
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
				setWindowFontAndText(hWndTypeHTML, hGuiFont, _localize("&HTML entities"));
				checked(hWndTypeHTML, type == "html");


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
				setWindowFontAndText(hWndEncChr, hGuiFont, _localize("sy&mbol => &&#code;"));
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
				hWndTypeEscapes = createWindowEx(
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
				setWindowFontAndText(hWndTypeEscapes, hGuiFont, _localize("&Escape sequences"));
				checked(hWndTypeEscapes, type == "escapes");

				// Radiobutton RegExp converter
				hWndTypeRegExp = createWindowEx(
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
				setWindowFontAndText(hWndTypeRegExp, hGuiFont, _localize("Re&gular expressions special symbols"));
				checked(hWndTypeRegExp, type == "regexp");

				// Radiobutton String converter
				hWndTypeString = createWindowEx(
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
				setWindowFontAndText(hWndTypeString, hGuiFont, _localize("&String literals special symbols"));
				checked(hWndTypeString, type == "string");

				// Radiobutton URI converter
				hWndTypeURI = createWindowEx(
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
				setWindowFontAndText(hWndTypeURI, hGuiFont, _localize("Uniform Resource Identifier (&URI)"));
				checked(hWndTypeURI, type == "uri");

				// Radiobutton URI Component converter
				hWndTypeURIC = createWindowEx(
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
				setWindowFontAndText(hWndTypeURIC, hGuiFont, _localize("Uniform Resource Identifier (U&RI), full"));
				checked(hWndTypeURIC, type == "uricomponent");


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
					180,           //nWidth
					16,            //nHeight
					hWnd,          //hWndParent
					IDC_TO_BASE64, //ID
					hInstanceDLL,  //hInstance
					0              //lpParam
				);
				setWindowFontAndText(hWndToBase64, hGuiFont, _localize("Base64"));
				checked(hWndToBase64, toBase64);


				// Radiobutton Base64 converter
				hWndTypeBase64 = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50000004,      //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,              //x
					202,             //y
					350,             //nWidth
					16,              //nHeight
					hWnd,            //hWndParent
					IDC_TYPE_BASE64, //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndTypeBase64, hGuiFont, _localize("&Base64"));
				checked(hWndTypeBase64, type == "base64");


				// GroupBox mode
				hWndGroupMode = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,           //x
					234,          //y
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
					252,           //y
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
					252,             //y
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
					252,             //y
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
					286,          //y
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
					304,            //y
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
					304,          //y
					116,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_ACT_COPY, //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndActCopy, hGuiFont, _localize("&Copy"));
				checked(hWndActCopy, action & ACT_COPY);

				// Checkbox show
				hWndActShow = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010003,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					272,          //x
					304,          //y
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
					340,                   //y
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
					339 + dh,     //y
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
					339 + dh,     //y
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
					339 + dh,     //y
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

				//centerWindow(hWnd);
				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);

				outputMinH = scale.y(outputMinH);
				outputH = scale.y(outputH);
			break;
			case 7: //WM_SETFOCUS
				var hWndChecked;
				if(checked(hWndTypeHTML))         hWndChecked = hWndTypeHTML;
				else if(checked(hWndTypeEscapes)) hWndChecked = hWndTypeEscapes;
				else if(checked(hWndTypeRegExp))  hWndChecked = hWndTypeRegExp;
				else if(checked(hWndTypeString))  hWndChecked = hWndTypeString;
				else if(checked(hWndTypeURI))     hWndChecked = hWndTypeURI;
				else if(checked(hWndTypeURIC))    hWndChecked = hWndTypeURIC;
				else if(checked(hWndTypeBase64))  hWndChecked = hWndTypeBase64;
				oSys.Call("user32::SetFocus", hWndChecked);
			break;
			case 256: //WM_KEYDOWN
				var ctrl = oSys.Call("user32::GetAsyncKeyState", 162 /*VK_LCONTROL*/)
					|| oSys.Call("user32::GetAsyncKeyState", 163 /*VK_RCONTROL*/);
				var shift = oSys.Call("user32::GetAsyncKeyState", 160 /*VK_LSHIFT*/)
					|| oSys.Call("user32::GetAsyncKeyState", 161 /*VK_RSHIFT*/);
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
				else if(ctrl && wParam == 86 /*V*/ || shift && wParam == 45 /*VK_INSERT*/) // Ctrl+V, Shift+Insert
					noScroll(function() {
						AkelPad.Command(4155); //IDM_EDIT_PASTE
					});
				else if(ctrl && wParam == 88 /*X*/ || shift && wParam == 46 /*VK_DELETE*/) // Ctrl+X, Shift+Del
					AkelPad.Command(4153); //IDM_EDIT_CUT
				else if(wParam == 46 /*VK_DELETE*/) // Delete
					AkelPad.Command(4156); //IDM_EDIT_CLEAR
				else if(ctrl && wParam == 65 /*A*/) { // Ctrl+A
					if(oSys.Call("user32::GetFocus") != hWndOutput)
						noScroll(function() {
							AkelPad.Command(4157); //IDM_EDIT_SELECTALL
						});
				}
				else if(ctrl && wParam == 83 /*S*/) // Ctrl+S
					AkelPad.Command(4105); // IDM_FILE_SAVE

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
					case IDC_TYPE_BASE64:
						checked(hWndTypeHTML,    idc == IDC_TYPE_HTML);
						checked(hWndTypeEscapes, idc == IDC_TYPE_ESCAPES);
						checked(hWndTypeRegExp,  idc == IDC_TYPE_REGEXP);
						checked(hWndTypeString,  idc == IDC_TYPE_STRING);
						checked(hWndTypeURI,     idc == IDC_TYPE_URI);
						checked(hWndTypeURIC,    idc == IDC_TYPE_URIC);
						checked(hWndTypeBase64,  idc == IDC_TYPE_BASE64);
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
						xPos = AkelPad.MemRead(lpPoint,     3 /*DT_DWORD*/);
						yPos = AkelPad.MemRead(lpPoint + 4, 3 /*DT_DWORD*/);
					}
					yPos += AkelPad.SendMessage(hWndOutput, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);
				}
				else if(oSys.Call("user32::GetCursorPos", lpPoint)) {
					xPos = AkelPad.MemRead(lpPoint,     3 /*DT_DWORD*/);
					yPos = AkelPad.MemRead(lpPoint + 4, 3 /*DT_DWORD*/);
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
				else if(cmd == 4157 /*IDM_EDIT_SELECTALL*/)
					noScroll(function() {
						AkelPad.SendMessage(hWndOutput, 177 /*EM_SETSEL*/, 0, -1);
					}, hWndOutput);
			break;
			case 36: //WM_GETMINMAXINFO
				if(!handleResize)
					break;
				AkelPad.MemCopy(lParam + 24, dlgMinW, 3 /*DT_DWORD*/); //ptMinTrackSize.x
				AkelPad.MemCopy(lParam + 32, dlgMinW, 3 /*DT_DWORD*/); //ptMaxTrackSize.x
				if(checked(hWndActShow))
					AkelPad.MemCopy(lParam + 28, dlgMinH + outputMinH + 12, 3 /*DT_DWORD*/); //ptMinTrackSize.y
				else {
					AkelPad.MemCopy(lParam + 28, dlgH, 3 /*DT_DWORD*/); //ptMinTrackSize.y
					AkelPad.MemCopy(lParam + 36, dlgH, 3 /*DT_DWORD*/); //ptMaxTrackSize.y
				}
			break;
			case 5: //WM_SIZE
				if(!handleResize || oSys.Call("user32::IsIconic", hWnd))
					break;
				var rcWnd = getWindowRect(hWnd);
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
				if(ps = AkelPad.MemAlloc(64 /*sizeof(PAINTSTRUCT)*/)) {
					if(hDC = oSys.Call("user32::BeginPaint", hWnd, ps)) {
						if(lpGrip = AkelPad.MemAlloc(16 /*sizeof(RECT)*/)) {
							if(oSys.Call("user32::GetClientRect", hWnd, lpGrip)) {
								rcGrip = parseRect(lpGrip);
								rcGrip.left = rcGrip.right  - oSys.Call("user32::GetSystemMetrics", 2 /*SM_CXVSCROLL*/);
								rcGrip.top  = rcGrip.bottom - oSys.Call("user32::GetSystemMetrics", 20 /*SM_CYVSCROLL*/);

								AkelPad.MemCopy(lpGrip,      rcGrip.left,   3 /*DT_DWORD*/);
								AkelPad.MemCopy(lpGrip + 4,  rcGrip.top,    3 /*DT_DWORD*/);
								AkelPad.MemCopy(lpGrip + 8,  rcGrip.right,  3 /*DT_DWORD*/);
								AkelPad.MemCopy(lpGrip + 12, rcGrip.bottom, 3 /*DT_DWORD*/);

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
		AkelPad.MemCopy(lpRect,      dlgX,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpRect + 4,  dlgY,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpRect + 8,  dlgX + (rcWnd.right - rcWnd.left), 3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpRect + 12, dlgY + (rcWnd.top - rcWnd.bottom), 3 /*DT_DWORD*/);
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
				var rcWork = parseRect(lpMi + 4 + 16);
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
			x += rcWnd.left;
			y += rcWnd.top;
		}
		oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
	}
	function resizeWindow(hWnd, dw, dh) {
		var rcWnd = getWindowRect(hWnd);
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
		if(!lpRect)
			return null;
		oSys.Call("user32::GetWindowRect", hWnd, lpRect);
		hWndParent && oSys.Call("user32::ScreenToClient", hWndParent, lpRect);
		var rcWnd = parseRect(lpRect);
		AkelPad.MemFree(lpRect);
		return rcWnd;
	}
	function parseRect(lpRect) {
		return {
			left:   AkelPad.MemRead(lpRect,      3 /*DT_DWORD*/),
			top:    AkelPad.MemRead(lpRect +  4, 3 /*DT_DWORD*/),
			right:  AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/),
			bottom: AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/)
		};
	}
	function setHTMLOptions() {
		var isHTML = checked(hWndTypeHTML);
		enabled(hWndDecEnt,    isHTML);
		enabled(hWndEncEnt,    isHTML);
		enabled(hWndDecEntSp,  isHTML);
		enabled(hWndEncEntSp,  isHTML);
		enabled(hWndDecChr,    isHTML);
		enabled(hWndEncChr,    isHTML);
		enabled(hWndEncChrHex, isHTML && checked(hWndEncChr));
	}
	function setBase64Options() {
		var on = checked(hWndTypeURIC) && !checked(hWndModeDecode);
		enabled(hWndToDataURI, on);
		enabled(hWndToBase64, on && checked(hWndToDataURI));
	}
	function readControlsState() {
		if(checked(hWndTypeHTML))
			type = "html";
		else if(checked(hWndTypeEscapes))
			type = "escapes";
		else if(checked(hWndTypeRegExp))
			type = "regexp";
		else if(checked(hWndTypeString))
			type = "string";
		else if(checked(hWndTypeURI))
			type = "uri";
		else if(checked(hWndTypeURIC))
			type = "uricomponent";
		else if(checked(hWndTypeBase64))
			type = "base64";
		else
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
			return oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, pText);
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

	function Scale(hDC, hWnd) {
		var hNewDC = hDC || oSys.Call("user32::GetDC", hWnd);
		if(hNewDC) {
			this._x = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 88 /*LOGPIXELSX*/);
			this._y = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 90 /*LOGPIXELSY*/);

			//Align to 16 pixel
			this._x += this._x % 16;
			this._y += this._y % 16;

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
		for(var i = 0, l = str.length; i < l; i++) {
			var code = str.charCodeAt(i);
			var b1 = String.fromCharCode(code & 0xff);
			var b2 = String.fromCharCode(code >> 8 & 0xff);
			ret += isLE
				? b1 + b2 + u32
				: u32 + b2 + b1;
		}
		return ret;
	}

	// based on Fr0sT's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=7972#7972

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
		for(var pCurr = pMBBuf, bufMax = pMBBuf + bufLen - 1; pCurr < bufMax; pCurr++)
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

	// based on Fr0sT's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=7972#7972

	// current code page is UTF16* or UTF32* - set ansi current code page
	// (WideChar <-> MultiByte functions don't work with this code pages)
	if(cp == 1 || cp == 1200 || cp == 1201 || cp == 12000 || cp == 12001)
		cp = 0;

	try {
		var strLen = str.length;
		var pMBBuf = AkelPad.MemAlloc(strLen * 1 /*sizeof(char)*/);
		if(!pMBBuf)
			throw new Error("MemAlloc fail");
		for(var i = 0; i < strLen; i++)
			AkelPad.MemCopy(pMBBuf + i, str.charCodeAt(i), 5 /*DT_BYTE*/);

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
		for(var pCurr = pWCBuf, bufMax = pWCBuf + bufLen*2; pCurr < bufMax; pCurr += 2)
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