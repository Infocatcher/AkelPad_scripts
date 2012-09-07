// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11096#11096
// http://infocatcher.ucoz.net/js/akelpad_scripts/getHash.js

// (c) Infocatcher 2010-2012
// version 0.2.2 - 2012-01-03

//===================
// Based on following scripts:
//   http://phpjs.org/functions/crc32:377
//   http://phpjs.org/functions/md5:469
//   http://www.movable-type.co.uk/scripts/sha1.html
//   http://www.movable-type.co.uk/scripts/sha256.html
//   http://www.farfarfar.com/scripts/encrypt/

// Hotkeys:
//   Enter                    - Copy
//   Ctrl+Enter, Shift+Enter  - Calculate
//   Escape                   - Cancel
//   Ctrl+Z                   - Undo
//   Ctrl+Shift+Z             - Redo
//   Ctrl+C, Ctrl+Insert      - Copy hash
//   Ctrl+V, Shift+Insert     - Paste
//   Ctrl+X, Shift+Del        - Cut
//   Delete                   - Delete selection
//   Ctrl+A                   - Select all
//   Ctrl+S                   - Save file

// Arguments:
//   -type="MD5"            - hash function ("CRC32", "MD5", "SHA1", "SHA224", "SHA256", "SHA384" or "SHA512")
//   -codePage=65001        - code page for hash calculation, -1 - use current code page
//   -autoCalc=true         - auto calculate
//   -dialog=false          - copy without dialog
//   -onlySelected=true     - use only selected text
//   -upperCase=false       - convert output to upper case
//   -warningTime=4000      - show warning for slow calculations
//   -saveOptions=0         - don't store options
//               =1         - (default) save options after them usage
//               =2         - save options on exit
//   -savePosition=true     - allow store last window position

// Usage:
//   Call("Scripts::Main", 1, "getHash.js")
//   Call("Scripts::Main", 1, "getHash.js", `-type="SHA1" -dialog=false -onlySelected=true`)
//   Call("Scripts::Main", 1, "getHash.js", `-dialog=true -saveOptions=0 -savePosition=false`)
//===================

function _localize(s) {
	var strings = {
		"This is hash of empty string!": {
			ru: "Это хэш пустой строки!"
		},
		"Hash function “%S” not found!": {
			ru: "Не найдена хэш-функция «%S»!"
		},
		"Required time: %S (estimate)\nContinue?": {
			ru: "Требуется времени: %S (оценочно)\n Продолжить?"
		},
		"Hash function": {
			ru: "Хэш-функция"
		},
		"CRC&32": {
			ru: "CRC&32"
		},
		"MD&5": {
			ru: "MD&5"
		},
		"SHA-&1": {
			ru: "SHA-&1"
		},
		"SHA-224": {
			ru: "SHA-224"
		},
		"SHA-&256": {
			ru: "SHA-&256"
		},
		"SHA-384": {
			ru: "SHA-384"
		},
		"SHA-512": {
			ru: "SHA-512"
		},
		"Hash": {
			ru: "Хэш"
		},
		"&Upper case": {
			ru: "Верхний &регистр"
		},
		"Co&py": {
			ru: "&Копировать"
		},
		"&Calculate": {
			ru: "&Вычислить"
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

var DEFAULT_HASH = "md5";

var CP_NOT_CONVERT = -2;
var CP_CURRENT     = -1;

// Read arguments and prefs:
// getArg(argName, defaultValue), getArgOrPref(argAndPrefName, type, defaultValue)
var saveOptions  = getArg("saveOptions", 1);
var savePosition = getArg("savePosition", true);
if(saveOptions || savePosition)
	var prefs = new Prefs();

var codePage     = getArg("codePage", -1);
var autoCalc     = getArg("autoCalc", false);
var showDialog   = getArg("dialog", true);
var onlySelected = getArg("onlySelected", false);
var warningTime  = getArg("warningTime", 4000);

var type         = getArgOrPref("type", prefs && prefs.STRING, DEFAULT_HASH).toLowerCase();
var upperCase    = getArgOrPref("upperCase", prefs && prefs.DWORD, false);

prefs && prefs.end();

// http://phpjs.org/functions/crc32:377
function crc32 (str) {
    // http://kevin.vanzonneveld.net
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // +   improved by: T0bsn
    // -    depends on: utf8_encode
    // *     example 1: crc32('Kevin van Zonneveld');
    // *     returns 1: 1249991249

    str = convertFromUnicode(str, codePage);
    var table = [
        0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
        0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
        0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
        0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
        0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
        0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
        0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
        0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
        0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
        0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
        0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
        0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
        0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
        0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
        0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
        0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
        0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
        0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
        0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
        0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
        0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
        0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
        0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
        0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
        0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
        0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
        0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
        0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
        0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
        0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
        0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
        0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
    ];

    var crc = crc ^ -1;
    for (var i = 0, iTop = str.length; i < iTop; i++)
        crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];

    crc = crc ^ -1;

    // Seems to work fine...
    crc = (0x100000000 + crc).toString(16);
    if(crc.length > 8)
        crc = crc.substr(crc.length - 8, 8);
    else if(crc.length < 8)
        crc = "00000000".substr(crc.length) + crc;

    return crc;
}


// http://phpjs.org/functions/md5:469
function md5 (str) {
    // http://kevin.vanzonneveld.net
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // + namespaced by: Michael White (http://getsprink.com)
    // +    tweaked by: Jack
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // -    depends on: utf8_encode
    // *     example 1: md5('Kevin van Zonneveld');
    // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'

    var xl;

    var rotateLeft = function (lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    };

    var addUnsigned = function (lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    };

    var _F = function (x,y,z) { return (x & y) | ((~x) & z); };
    var _G = function (x,y,z) { return (x & z) | (y & (~z)); };
    var _H = function (x,y,z) { return (x ^ y ^ z); };
    var _I = function (x,y,z) { return (y ^ (x | (~z))); };

    var _FF = function (a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };

    var _GG = function (a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };

    var _HH = function (a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };

    var _II = function (a,b,c,d,x,s,ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };

    var convertToWordArray = function (str) {
        var lWordCount;
        var lMessageLength = str.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=new Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    };

    var wordToHex = function (lValue) {
        var wordToHexValue="",wordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
            lByte = (lValue>>>(lCount*8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length-2,2);
        }
        return wordToHexValue;
    };

    var x=[],
        k,AA,BB,CC,DD,a,b,c,d,
        S11=7, S12=12, S13=17, S14=22,
        S21=5, S22=9 , S23=14, S24=20,
        S31=4, S32=11, S33=16, S34=23,
        S41=6, S42=10, S43=15, S44=21;

    str = convertFromUnicode(str, codePage);
    x = convertToWordArray(str);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    xl = x.length;
    for (k=0;k<xl;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=_FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=_FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=_FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=_FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=_FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=_FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=_FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=_FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=_FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=_FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=_FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=_FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=_FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=_FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=_FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=_FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=_GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=_GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=_GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=_GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=_GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=_GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=_GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=_GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=_GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=_GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=_GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=_GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=_GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=_GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=_GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=_GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=_HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=_HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=_HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=_HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=_HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=_HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=_HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=_HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=_HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=_HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=_HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=_HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=_HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=_HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=_HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=_HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=_II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=_II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=_II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=_II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=_II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=_II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=_II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=_II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=_II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=_II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=_II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=_II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=_II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=_II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=_II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=_II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=addUnsigned(a,AA);
        b=addUnsigned(b,BB);
        c=addUnsigned(c,CC);
        d=addUnsigned(d,DD);
    }

    var temp = wordToHex(a)+wordToHex(b)+wordToHex(c)+wordToHex(d);

    return temp.toLowerCase();
}


// http://www.movable-type.co.uk/scripts/sha1.html

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-1 implementation in JavaScript | (c) Chris Veness 2002-2010 | www.movable-type.co.uk      */
/*   - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                             */
/*         http://csrc.nist.gov/groups/ST/toolkit/examples.html                                   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Sha1 = {};  // Sha1 namespace

/**
 * Generates SHA-1 hash of string
 *
 * @param {String} msg                String to be hashed
 * @param {Boolean} [utf8encode=true] Encode msg as UTF-8 before generating hash
 * @returns {String}                  Hash of msg as hex character string
 */
Sha1.hash = function(msg, utf8encode) {
  utf8encode =  (typeof utf8encode == 'undefined') ? true : utf8encode;

  // convert string to UTF-8, as SHA only deals with byte-streams
  if (utf8encode) msg = convertFromUnicode(msg, codePage);

  // constants [§4.2.1]
  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

  // PREPROCESSING

  msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

  // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
  var l = msg.length/4 + 2;  // length (in 32-bit integers) of msg + ‘1’ + appended length
  var N = Math.ceil(l/16);   // number of 16-integer-blocks required to hold 'l' ints
  var M = new Array(N);

  for (var i=0; i<N; i++) {
    M[i] = new Array(16);
    for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
      M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) |
        (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
    } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
  }
  // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
  // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
  // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
  M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14])
  M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;

  // set initial hash value [§5.3.1]
  var H0 = 0x67452301;
  var H1 = 0xefcdab89;
  var H2 = 0x98badcfe;
  var H3 = 0x10325476;
  var H4 = 0xc3d2e1f0;

  // HASH COMPUTATION [§6.1.2]

  var W = new Array(80); var a, b, c, d, e;
  for (var i=0; i<N; i++) {

    // 1 - prepare message schedule 'W'
    for (var t=0;  t<16; t++) W[t] = M[i][t];
    for (var t=16; t<80; t++) W[t] = Sha1.ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);

    // 2 - initialise five working variables a, b, c, d, e with previous hash value
    a = H0; b = H1; c = H2; d = H3; e = H4;

    // 3 - main loop
    for (var t=0; t<80; t++) {
      var s = Math.floor(t/20); // seq for blocks of 'f' functions and 'K' constants
      var T = (Sha1.ROTL(a,5) + Sha1.f(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;
      e = d;
      d = c;
      c = Sha1.ROTL(b, 30);
      b = a;
      a = T;
    }

    // 4 - compute the new intermediate hash value
    H0 = (H0+a) & 0xffffffff;  // note 'addition modulo 2^32'
    H1 = (H1+b) & 0xffffffff;
    H2 = (H2+c) & 0xffffffff;
    H3 = (H3+d) & 0xffffffff;
    H4 = (H4+e) & 0xffffffff;
  }

  return Sha1.toHexStr(H0) + Sha1.toHexStr(H1) +
    Sha1.toHexStr(H2) + Sha1.toHexStr(H3) + Sha1.toHexStr(H4);
}

//
// function 'f' [§4.1.1]
//
Sha1.f = function(s, x, y, z)  {
  switch (s) {
  case 0: return (x & y) ^ (~x & z);           // Ch()
  case 1: return x ^ y ^ z;                    // Parity()
  case 2: return (x & y) ^ (x & z) ^ (y & z);  // Maj()
  case 3: return x ^ y ^ z;                    // Parity()
  }
}

//
// rotate left (circular left shift) value x by n positions [§3.2.5]
//
Sha1.ROTL = function(x, n) {
  return (x<<n) | (x>>>(32-n));
}

//
// hexadecimal representation of a number
//   (note toString(16) is implementation-dependant, and
//   in IE returns signed numbers when used on full words)
//
Sha1.toHexStr = function(n) {
  var s="", v;
  for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
  return s;
}


// http://www.movable-type.co.uk/scripts/sha256.html

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-256 implementation in JavaScript | (c) Chris Veness 2002-2010 | www.movable-type.co.uk    */
/*   - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                             */
/*         http://csrc.nist.gov/groups/ST/toolkit/examples.html                                   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Sha256 = {};  // Sha256 namespace

/**
 * Generates SHA-256 hash of string
 *
 * @param {String} msg                String to be hashed
 * @param {Boolean} [utf8encode=true] Encode msg as UTF-8 before generating hash
 * @returns {String}                  Hash of msg as hex character string
 */
Sha256.hash = function(msg, utf8encode) {
    utf8encode =  (typeof utf8encode == 'undefined') ? true : utf8encode;

    // convert string to UTF-8, as SHA only deals with byte-streams
    if (utf8encode) msg = convertFromUnicode(msg, codePage);

    // constants [§4.2.2]
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
             0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
             0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
             0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
             0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
             0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
             0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
             0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    // initial hash value [§5.3.1]
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    // PREPROCESSING

    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    var l = msg.length/4 + 2;  // length (in 32-bit integers) of msg + ‘1’ + appended length
    var N = Math.ceil(l/16);   // number of 16-integer-blocks required to hold 'l' ints
    var M = new Array(N);

    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) |
                      (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14])
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;


    // HASH COMPUTATION [§6.1.2]

    var W = new Array(64); var a, b, c, d, e, f, g, h;
    for (var i=0; i<N; i++) {

        // 1 - prepare message schedule 'W'
        for (var t=0;  t<16; t++) W[t] = M[i][t];
        for (var t=16; t<64; t++) W[t] = (Sha256.sigma1(W[t-2]) + W[t-7] + Sha256.sigma0(W[t-15]) + W[t-16]) & 0xffffffff;

        // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
        a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];

        // 3 - main loop (note 'addition modulo 2^32')
        for (var t=0; t<64; t++) {
            var T1 = h + Sha256.Sigma1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
            var T2 = Sha256.Sigma0(a) + Sha256.Maj(a, b, c);
            h = g;
            g = f;
            f = e;
            e = (d + T1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) & 0xffffffff;
        }
         // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
        H[0] = (H[0]+a) & 0xffffffff;
        H[1] = (H[1]+b) & 0xffffffff;
        H[2] = (H[2]+c) & 0xffffffff;
        H[3] = (H[3]+d) & 0xffffffff;
        H[4] = (H[4]+e) & 0xffffffff;
        H[5] = (H[5]+f) & 0xffffffff;
        H[6] = (H[6]+g) & 0xffffffff;
        H[7] = (H[7]+h) & 0xffffffff;
    }

    return Sha256.toHexStr(H[0]) + Sha256.toHexStr(H[1]) + Sha256.toHexStr(H[2]) + Sha256.toHexStr(H[3]) +
           Sha256.toHexStr(H[4]) + Sha256.toHexStr(H[5]) + Sha256.toHexStr(H[6]) + Sha256.toHexStr(H[7]);
}

Sha256.ROTR = function(n, x) { return (x >>> n) | (x << (32-n)); }
Sha256.Sigma0 = function(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); }
Sha256.Sigma1 = function(x) { return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); }
Sha256.sigma0 = function(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  }
Sha256.sigma1 = function(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); }
Sha256.Ch = function(x, y, z)  { return (x & y) ^ (~x & z); }
Sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }

//
// hexadecimal representation of a number
//   (note toString(16) is implementation-dependant, and
//   in IE returns signed numbers when used on full words)
//
Sha256.toHexStr = function(n) {
  var s="", v;
  for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
  return s;
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Utf8 class: encode / decode between multi-byte Unicode characters and UTF-8 multiple          */
/*              single-byte character encoding (c) Chris Veness 2002-2010                         */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Utf8 = {};  // Utf8 namespace

/**
 * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
 * (BMP / basic multilingual plane only)
 *
 * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
 *
 * @param {String} strUni Unicode string to be encoded as UTF-8
 * @returns {String} encoded string
 */
Utf8.encode = function(strUni) {
  // use regular expressions & String.replace callback function for better efficiency
  // than procedural approaches
  var strUtf = strUni.replace(
      /[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
      function(c) {
        var cc = c.charCodeAt(0);
        return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f); }
    );
  strUtf = strUtf.replace(
      /[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
      function(c) {
        var cc = c.charCodeAt(0);
        return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f); }
    );
  return strUtf;
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


function SHA512(str, variant) {
	// http://www.farfarfar.com/scripts/encrypt/
	//str_sha(val, "SHA-224")
	//str_sha(val, "SHA-384")
	//str_sha(val, "SHA-512")

	str = convertFromUnicode(str, codePage);


	/* A JavaScript implementation of the SHA family of hashes, as defined in FIPS PUB 180-2
	 * Version 0.1 Copyright Brian Turek 2008
	 * Distributed under the BSD License
	 * See http://jssha.sourceforge.net/ for more information
	 *
	 * Several functions taken, as noted, from Paul Johnson
	 */

	/*
	 * Configurable variables. Defaults typically work
	 */
	var charSize = 8; /* Number of Bits Per character (8 for ASCII, 16 for Unicode)	  */
	var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
	var hexCase = 0; /* hex output format. 0 - lowercase; 1 - uppercase		*/

	/*
	 * The below three functions are those you will probably want to use.  They take the string to be hashed, as well as
	 * the SHA-variant you want to use (SHA-1, SHA-224, SHA-256, SHA-384, or SHA-512)
	 */
	function hex_sha(string, variant)
	{
		if (variant != "SHA-1")
			return binb2hex(coreSHA2(str2binb(string), string.length * charSize, variant));
		else
			return binb2hex(coreSHA1(str2binb(string), string.length * charSize));
	}

	function b64_sha(string, variant)
	{
		if (variant != "SHA-1")
		return binb2b64(coreSHA2(str2binb(string), string.length * charSize, variant));
		else
			return binb2b64(coreSHA1(str2binb(string), string.length * charSize));
	}

	function str_sha(string, variant)
	{
		if (variant != "SHA-1")
			return binb2str(coreSHA2(str2binb(string), string.length * charSize, variant));
		else
			return binb2str(coreSHA1(str2binb(string), string.length * charSize));
	}

	var K_1 = new Array(
				0x5a827999, 0x5a827999, 0x5a827999, 0x5a827999,
				0x5a827999, 0x5a827999, 0x5a827999, 0x5a827999,
				0x5a827999, 0x5a827999, 0x5a827999, 0x5a827999,
				0x5a827999, 0x5a827999, 0x5a827999, 0x5a827999,
				0x5a827999, 0x5a827999, 0x5a827999, 0x5a827999,
				0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1,
				0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1,
				0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1,
				0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1,
				0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1, 0x6ed9eba1,
				0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc,
				0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc,
				0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc,
				0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc,
				0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc, 0x8f1bbcdc,
				0xca62c1d6, 0xca62c1d6, 0xca62c1d6, 0xca62c1d6,
				0xca62c1d6, 0xca62c1d6, 0xca62c1d6, 0xca62c1d6,
				0xca62c1d6, 0xca62c1d6, 0xca62c1d6, 0xca62c1d6,
				0xca62c1d6, 0xca62c1d6, 0xca62c1d6, 0xca62c1d6,
				0xca62c1d6, 0xca62c1d6, 0xca62c1d6, 0xca62c1d6
			);

	var K_32 = new Array(
				0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
				0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
				0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
				0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
				0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
				0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
				0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
				0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
				0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
				0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
				0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
				0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
				0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
				0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
				0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
				0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
			);

	var K_64 = new Array(
				new int_64(0x428a2f98,0xd728ae22), new int_64(0x71374491,0x23ef65cd), new int_64(0xb5c0fbcf,0xec4d3b2f), new int_64(0xe9b5dba5,0x8189dbbc),
				new int_64(0x3956c25b,0xf348b538), new int_64(0x59f111f1,0xb605d019), new int_64(0x923f82a4,0xaf194f9b), new int_64(0xab1c5ed5,0xda6d8118),
				new int_64(0xd807aa98,0xa3030242), new int_64(0x12835b01,0x45706fbe), new int_64(0x243185be,0x4ee4b28c), new int_64(0x550c7dc3,0xd5ffb4e2),
				new int_64(0x72be5d74,0xf27b896f), new int_64(0x80deb1fe,0x3b1696b1), new int_64(0x9bdc06a7,0x25c71235), new int_64(0xc19bf174,0xcf692694),
				new int_64(0xe49b69c1,0x9ef14ad2), new int_64(0xefbe4786,0x384f25e3), new int_64(0x0fc19dc6,0x8b8cd5b5), new int_64(0x240ca1cc,0x77ac9c65),
				new int_64(0x2de92c6f,0x592b0275), new int_64(0x4a7484aa,0x6ea6e483), new int_64(0x5cb0a9dc,0xbd41fbd4), new int_64(0x76f988da,0x831153b5),
				new int_64(0x983e5152,0xee66dfab), new int_64(0xa831c66d,0x2db43210), new int_64(0xb00327c8,0x98fb213f), new int_64(0xbf597fc7,0xbeef0ee4),
				new int_64(0xc6e00bf3,0x3da88fc2), new int_64(0xd5a79147,0x930aa725), new int_64(0x06ca6351,0xe003826f), new int_64(0x14292967,0x0a0e6e70),
				new int_64(0x27b70a85,0x46d22ffc), new int_64(0x2e1b2138,0x5c26c926), new int_64(0x4d2c6dfc,0x5ac42aed), new int_64(0x53380d13,0x9d95b3df),
				new int_64(0x650a7354,0x8baf63de), new int_64(0x766a0abb,0x3c77b2a8), new int_64(0x81c2c92e,0x47edaee6), new int_64(0x92722c85,0x1482353b),
				new int_64(0xa2bfe8a1,0x4cf10364), new int_64(0xa81a664b,0xbc423001), new int_64(0xc24b8b70,0xd0f89791), new int_64(0xc76c51a3,0x0654be30),
				new int_64(0xd192e819,0xd6ef5218), new int_64(0xd6990624,0x5565a910), new int_64(0xf40e3585,0x5771202a), new int_64(0x106aa070,0x32bbd1b8),
				new int_64(0x19a4c116,0xb8d2d0c8), new int_64(0x1e376c08,0x5141ab53), new int_64(0x2748774c,0xdf8eeb99), new int_64(0x34b0bcb5,0xe19b48a8),
				new int_64(0x391c0cb3,0xc5c95a63), new int_64(0x4ed8aa4a,0xe3418acb), new int_64(0x5b9cca4f,0x7763e373), new int_64(0x682e6ff3,0xd6b2b8a3),
				new int_64(0x748f82ee,0x5defb2fc), new int_64(0x78a5636f,0x43172f60), new int_64(0x84c87814,0xa1f0ab72), new int_64(0x8cc70208,0x1a6439ec),
				new int_64(0x90befffa,0x23631e28), new int_64(0xa4506ceb,0xde82bde9), new int_64(0xbef9a3f7,0xb2c67915), new int_64(0xc67178f2,0xe372532b),
				new int_64(0xca273ece,0xea26619c), new int_64(0xd186b8c7,0x21c0c207), new int_64(0xeada7dd6,0xcde0eb1e), new int_64(0xf57d4f7f,0xee6ed178),
				new int_64(0x06f067aa,0x72176fba), new int_64(0x0a637dc5,0xa2c898a6), new int_64(0x113f9804,0xbef90dae), new int_64(0x1b710b35,0x131c471b),
				new int_64(0x28db77f5,0x23047d84), new int_64(0x32caab7b,0x40c72493), new int_64(0x3c9ebe0a,0x15c9bebc), new int_64(0x431d67c4,0x9c100d4c),
				new int_64(0x4cc5d4be,0xcb3e42b6), new int_64(0x597f299c,0xfc657e2a), new int_64(0x5fcb6fab,0x3ad6faec), new int_64(0x6c44198c,0x4a475817)
			);

	var H_1 = new Array(
				0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0
			);

	var H_224 = new Array(
				0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
				0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
			);

	var H_256 = new Array(
				0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
				0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
			);

	var H_384 = new Array(
		new int_64(0xcbbb9d5d,0xc1059ed8), new int_64(0x629a292a,0x367cd507), new int_64(0x9159015a,0x3070dd17), new int_64(0x152fecd8,0xf70e5939),
		new int_64(0x67332667,0xffc00b31), new int_64(0x98eb44a87,0x68581511), new int_64(0xdb0c2e0d,0x64f98fa7), new int_64(0x47b5481d,0xbefa4fa4)
	);

	var H_512 = new Array(
		new int_64(0x6a09e667,0xf3bcc908), new int_64(0xbb67ae85,0x84caa73b), new int_64(0x3c6ef372,0xfe94f82b), new int_64(0xa54ff53a,0x5f1d36f1),
		new int_64(0x510e527f,0xade682d1), new int_64(0x9b05688c,0x2b3e6c1f), new int_64(0x1f83d9ab,0xfb41bd6b), new int_64(0x5be0cd19,0x137e2179)
	);

	function ROTL_32(x, n)
	{
		if (n < 32)
			return (x <<  n) | (x >>> (32 - n));
		else
			return x
	}

	function ROTR_32(x, n)
	{
		if (n < 32)
			return (x >>> n) | (x << (32 - n));
		else
			return x
	}

	function ROTR_64(x, n)
	{
		if (n < 32)
			return new int_64(
					(x.highOrder >>> n) | (x.lowOrder << (32 - n)),
					(x.lowOrder >>> n) | (x.highOrder << (32 - n))
				);
		else if (n == 32) // Apparently in JS, shifting a 32-bit value by 32 yields original value
			return new int_64(x.lowOrder, x.highOrder);
		else
			return ROTR_64(ROTR_64(x, 32), n-32);
	}

	function SHR_32 (x, n)
	{
		if (n < 32)
			return x >>> n;
		else
			return 0;
	}

	function SHR_64(x, n)
	{
		if (n < 32)
			return new int_64(
					x.highOrder >>> n,
					x.lowOrder >>> n | (x.highOrder << (32 - n))
				);
		else if (n == 32) // Apparently in JS, shifting a 32-bit value by 32 yields original value
			return new int_64(0, x.highOrder);
		else
			return SHR_64(SHR_64(x, 32), n-32);
	}

	function Parity_32(x, y, z)
	{
		return x ^ y ^ z;
	}

	function Ch_32(x, y, z)
	{
		return (x & y) ^ (~x & z);
	}

	function Ch_64(x, y, z)
	{
		return new int_64(
				(x.highOrder & y.highOrder) ^ (~x.highOrder & z.highOrder),
				(x.lowOrder & y.lowOrder) ^ (~x.lowOrder & z.lowOrder)
			);
	}

	function Maj_32(x, y, z)
	{
		return (x & y) ^ (x & z) ^ (y & z);
	}

	function Maj_64(x, y, z)
	{
		return new int_64(
				(x.highOrder & y.highOrder) ^ (x.highOrder & z.highOrder) ^ (y.highOrder & z.highOrder),
				(x.lowOrder & y.lowOrder) ^ (x.lowOrder & z.lowOrder) ^ (y.lowOrder & z.lowOrder)
			);
	}

	function Sigma0_32(x)
	{
		return ROTR_32(x, 2) ^ ROTR_32(x, 13) ^ ROTR_32(x, 22);
	}

	function Sigma0_64(x)
	{
		var ROTR28 = ROTR_64(x, 28);
		var ROTR34 = ROTR_64(x, 34);
		var ROTR39 = ROTR_64(x, 39);

		return new int_64(
				ROTR28.highOrder ^ ROTR34.highOrder ^ ROTR39.highOrder,
				ROTR28.lowOrder ^ ROTR34.lowOrder ^ ROTR39.lowOrder
			);
	}

	function Sigma1_32(x)
	{
		return ROTR_32(x, 6) ^ ROTR_32(x, 11) ^ ROTR_32(x, 25);
	}

	function Sigma1_64(x)
	{
		var ROTR14 = ROTR_64(x, 14);
		var ROTR18 = ROTR_64(x, 18);
		var ROTR41 = ROTR_64(x, 41)

		return new int_64(
				ROTR14.highOrder ^ ROTR18.highOrder ^ ROTR41.highOrder,
				ROTR14.lowOrder ^ ROTR18.lowOrder ^ ROTR41.lowOrder
			);
	}

	function Gamma0_32(x)
	{
		return ROTR_32(x, 7) ^ ROTR_32(x, 18) ^ SHR_32(x, 3);
	}

	function Gamma0_64(x)
	{
		var ROTR1 = ROTR_64(x, 1);
		var ROTR8 = ROTR_64(x, 8);
		var SHR7 = SHR_64(x, 7);

		return new int_64(
				ROTR1.highOrder ^ ROTR8.highOrder ^ SHR7.highOrder,
				ROTR1.lowOrder ^ ROTR8.lowOrder ^ SHR7.lowOrder
			);
	}

	function Gamma1_32(x)
	{
		return ROTR_32(x, 17) ^ ROTR_32(x, 19) ^ SHR_32(x, 10);
	}

	function Gamma1_64(x)
	{
		var ROTR19 = ROTR_64(x, 19);
		var ROTR61 = ROTR_64(x, 61);
		var SHR6 = SHR_64(x, 6);

		return new int_64(
				ROTR19.highOrder ^ ROTR61.highOrder ^ SHR6.highOrder,
				ROTR19.lowOrder ^ ROTR61.lowOrder ^ SHR6.lowOrder
			);
	}

	function coreSHA1(message, messageLength)
	{
		var W = new Array();
		var a, b, c, d, e;
		var K = K_1;
		var T;
		var Ch = Ch_32, Parity = Parity_32, Maj = Maj_32, ROTL = ROTL_32, safeAdd = safeAdd_32;
		var H = H_1.slice();

		message[messageLength >> 5] |= 0x80 << (24 - messageLength % 32); // Append '1' at  the end of the binary string
		message[((messageLength + 1 + 64 >> 9) << 4) + 15] = messageLength; // Append length of binary string in the position such that the new length is a multiple of 512

		var appendedMessageLength = message.length;

		for (var i = 0; i < appendedMessageLength; i += 16) {
			a = H[0];
			b = H[1];
			c = H[2];
			d = H[3];
			e = H[4];

			for ( var t = 0; t < 80; t++)
			{
				if (t < 16)
					W[t] = message[t + i];
				else
					W[t] = ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);

				if (t < 20)
					T = safeAdd(safeAdd(safeAdd(safeAdd(ROTL(a, 5), Ch(b, c, d)), e), K[t]), W[t]);
				else if (t < 40)
					T = safeAdd(safeAdd(safeAdd(safeAdd(ROTL(a, 5), Parity(b, c, d)), e), K[t]), W[t]);
				else if (t < 60)
					T = safeAdd(safeAdd(safeAdd(safeAdd(ROTL(a, 5), Maj(b, c, d)), e), K[t]), W[t]);
				else
					T = safeAdd(safeAdd(safeAdd(safeAdd(ROTL(a, 5), Parity(b, c, d)), e), K[t]), W[t]);

				e = d;
				d = c;
				c = ROTL(b, 30);
				b = a;
				a = T;
			}

			H[0] = safeAdd(a, H[0]);
			H[1] = safeAdd(b, H[1]);
			H[2] = safeAdd(c, H[2]);
			H[3] = safeAdd(d, H[3]);
			H[4] = safeAdd(e, H[4]);
		}

		return H;

	}

	function coreSHA2(message, messageLength, variant)
	{
		var W = new Array();
		var a, b, c, d, e, f, g, h;
		var T1, T2;
		var H;
		var numRounds, lengthPosition, binaryStringInc, binaryStringMult;
		var safeAdd, Gamma0, Gamma1, Sigma0, Sigma1, Ch, Maj, int;

		// Set up the various function handles and variable for the specific variant
		if (variant == "SHA-224" || variant == "SHA-256") // 32-bit variant
		{
			numRounds = 64;
			lengthPosition = ((messageLength + 1 + 64 >> 9) << 4) + 15;
			binaryStringInc = 16;
			binaryStringMult = 1;
			int = Number;
			K = K_32;
			safeAdd = safeAdd_32;
			Gamma0 = Gamma0_32;
			Gamma1 = Gamma1_32;
			Sigma0 = Sigma0_32;
			Sigma1 = Sigma1_32;
			Maj = Maj_32;
			Ch = Ch_32;

			if (variant == "SHA-224")
				H = H_224.slice();
			else
				H = H_256.slice();
		} else if (variant == "SHA-384" || variant == "SHA-512")// 64-bit variant
		{
			numRounds = 80;
			lengthPosition = ((messageLength + 1 + 128 >> 10) << 5) + 31;
			binaryStringInc = 32;
			binaryStringMult = 2;
			int = int_64;
			H = H_512;
			K = K_64;
			safeAdd = safeAdd_64;
			Gamma0 = Gamma0_64;
			Gamma1 = Gamma1_64;
			Sigma0 = Sigma0_64;
			Sigma1 = Sigma1_64;
			Maj = Maj_64;
			Ch = Ch_64;

			if (variant == "SHA-384")
				H = H_384.slice();
			else
				H = H_512.slice();
		} else
		{
			return "HASH NOT RECOGNIZED";
		}

		message[messageLength >> 5] |= 0x80 << (24 - messageLength % 32); // Append '1' at  the end of the binary string
		message[lengthPosition] = messageLength; // Append length of binary string in the position such that the new length is correct

		var appendedMessageLength = message.length;

		for (var i = 0; i < appendedMessageLength; i += binaryStringInc) {
			a = H[0];
			b = H[1];
			c = H[2];
			d = H[3];
			e = H[4];
			f = H[5];
			g = H[6];
			h = H[7];

			for ( var t = 0; t < numRounds; t++)
			{
				if (t < 16)
					W[t] = new int(message[t*binaryStringMult + i], message[t*binaryStringMult + i +1]); // Bit of a hack - for 32-bit, the second term is ignored
				else
					W[t] = safeAdd(safeAdd(safeAdd(Gamma1(W[t - 2]), W[t - 7]), Gamma0(W[t - 15])), W[t - 16]);

				T1 = safeAdd(safeAdd(safeAdd(safeAdd(h, Sigma1(e)), Ch(e, f, g)), K[t]), W[t]);
				T2 = safeAdd(Sigma0(a), Maj(a, b, c));
				h = g;
				g = f;
				f = e;
				e = safeAdd(d, T1);
				d = c;
				c = b;
				b = a;
				a = safeAdd(T1, T2);
			}

			H[0] = safeAdd(a, H[0]);
			H[1] = safeAdd(b, H[1]);
			H[2] = safeAdd(c, H[2]);
			H[3] = safeAdd(d, H[3]);
			H[4] = safeAdd(e, H[4]);
			H[5] = safeAdd(f, H[5]);
			H[6] = safeAdd(g, H[6]);
			H[7] = safeAdd(h, H[7]);
		}

		return returnSHA(H, variant);
	}

	function returnSHA(hashArray, variant)
	{
		switch (variant)
		{
			case "SHA-224":
					return new Array(
							hashArray[0],
							hashArray[1],
							hashArray[2],
							hashArray[3],
							hashArray[4],
							hashArray[5],
							hashArray[6]
						);
				break;
			case "SHA-256":
					return hashArray;
				break;
			case "SHA-384":
					return new Array(
							hashArray[0].highOrder, hashArray[0].lowOrder,
							hashArray[1].highOrder, hashArray[1].lowOrder,
							hashArray[2].highOrder, hashArray[2].lowOrder,
							hashArray[3].highOrder, hashArray[3].lowOrder,
							hashArray[4].highOrder, hashArray[4].lowOrder,
							hashArray[5].highOrder, hashArray[5].lowOrder
						);
				break;
			case "SHA-512":
					return new Array(
							hashArray[0].highOrder, hashArray[0].lowOrder,
							hashArray[1].highOrder, hashArray[1].lowOrder,
							hashArray[2].highOrder, hashArray[2].lowOrder,
							hashArray[3].highOrder, hashArray[3].lowOrder,
							hashArray[4].highOrder, hashArray[4].lowOrder,
							hashArray[5].highOrder, hashArray[5].lowOrder,
							hashArray[6].highOrder, hashArray[6].lowOrder,
							hashArray[7].highOrder, hashArray[7].lowOrder
					);
				break;
		}
	}

	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 * Taken from Paul Johnson (modified slightly)
	 */
	function safeAdd_32 (x, y)
	{
		var lsw = (x & 0xFFFF) + (y & 0xFFFF);
		var msw = (x >>> 16) + (y >>> 16) + (lsw >>> 16);

		return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
	}

	/*
	 * The 64-bit counterpart to safeAdd_32
	 */
	function safeAdd_64 (x, y) {
		var lsw = (x.lowOrder & 0xFFFF) + (y.lowOrder & 0xFFFF);
		var msw = (x.lowOrder >>> 16) + (y.lowOrder >>> 16) + (lsw >>> 16);
		var lowOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF)

		lsw = (x.highOrder & 0xFFFF) + (y.highOrder & 0xFFFF) + (msw >>> 16);
		msw = (x.highOrder >>> 16) + (y.highOrder >>> 16) + (lsw >>> 16);
		var highOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);

		return new int_64(highOrder, lowOrder);
	}

	/*
	 * Convert a string to an array of big-endian words
	 * If charSize is ASCII, characters >255 have their hi-byte silently ignored.
	 * Taken from Paul Johnson
	 */
	function str2binb(str)
	{
		var bin = Array();
		var mask = (1 << charSize) - 1;
		var length = str.length * charSize;;

		for(var i = 0; i < length; i += charSize)
			bin[i>>5] |= (str.charCodeAt(i / charSize) & mask) << (32 - charSize - i%32);

		return bin;
	}

	/*
	 * Convert an array of big-endian words to a string
	 * Taken from Paul Johnson
	 */
	function binb2str(bin)
	{
		var str = "";
		var mask = (1 << charSize) - 1;
		var length = bin.length * 32;

		for(var i = 0; i < length; i += charSize)
			str += String.fromCharCode((bin[i>>5] >>> (32 - charSize - i%32)) & mask);

		return str;
	}

	/*
	 * Convert an array of big-endian words to a hex string.
	 * Taken from Paul Johnson
	 */
	function binb2hex(binarray)
	{
		var hex_tab = hexCase ? "0123456789ABCDEF" : "0123456789abcdef";
		var str = "";
		var length = binarray.length * 4;

		for(var i = 0; i < length; i++)
			str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
				hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8)) & 0xF);

		return str;
	}

	/*
	 * Convert an array of big-endian words to a base-64 string
	 * Taken from Paul Johnson
	 */
	function binb2b64(binarray)
	{
		var tab = "ABCDEFGHIJKLMNOPQRSTUVWxYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		var str = "";
		var length = binarray.length * 4;
		for (var i = 0; i < length; i += 3)
		{
			var triplet = (((binarray[i >> 2] >> 8 * (3 - i%4)) & 0xFF) << 16)
						| (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
						| ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
			for (var j = 0; j < 4; j++)
				if (i * 8 + j * 6 > binarray.length * 32)
					str += b64pad;
				else
					str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
		}
		return str;
	}

	/*
	 * int_64 is a object/container for 2 32-bit numbers emulating a 64-bit number
	 */
	function int_64(msint_32, lsint_32)
	{
		this.highOrder = msint_32;
		this.lowOrder = lsint_32;
	}


	function strToHex(str) {
		var charHex = "0123456789ABCDEF";
		var out = "";
		var len = str.length;
		for (var i = 0; i < len; i++) {
			var s = str.charCodeAt(i);
			out += charHex.charAt(s >>> 4) + charHex.charAt(0xf & s);
		}
		return out.toUpperCase()
	}
	return strToHex(str_sha(str, variant)).toLowerCase();
}


var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

var hashes = {
	// speed: symbols/ms
	crc32: {
		prettyName: "CRC32",
		speed: 224.1,
		get: function(str) {
			return crc32(str);
		}
	},
	md5: {
		prettyName: "MD5",
		speed: 88.10,
		get: function(str) {
			return md5(str);
		}
	},
	sha1: {
		prettyName: "SHA-1",
		speed: 104.63,
		get: function(str) {
			return Sha1.hash(str);
		}
	},
	sha224: {
		prettyName: "SHA-224",
		speed: 40.08,
		get: function(str) {
			return SHA512(str, "SHA-224");
		}
	},
	sha256: {
		prettyName: "SHA-256",
		speed: 65.89,
		get: function(str) {
			return Sha256.hash(str);
		}
	},
	sha384: {
		prettyName: "SHA-384",
		speed: 9.66,
		get: function(str) {
			return SHA512(str, "SHA-384");
		}
	},
	sha512: {
		prettyName: "SHA-512",
		speed: 9.21,
		get: function(str) {
			return SHA512(str, "SHA-512");
		}
	}
};

function getHash(hWnd, callback) {
	if(saveOptions == 1) {
		prefs.set({
			type:      type,
			upperCase: upperCase
		});
		prefs.end();
	}
	var hasher = hashes[type];
	var text = AkelPad.GetSelText(4 - AkelPad.GetEditNewLine(0));
	if(!text && !onlySelected)
		text = getAllText();

	if(!text) {
		var warn = function() {
			AkelPad.MessageBox(
				hWnd || hMainWnd,
				_localize("This is hash of empty string!"),
				dialogTitle + " :: " + hasher.prettyName,
				48 /*MB_ICONEXCLAMATION*/
			);
		};
		if(callback)
			callback.value = warn;
		else
			warn();
	}

	if(text && warningTime > 0) {
		//var remTime = text.length/hasher.speed;

		var part = text.substr(0, Math.max(500, 60*hasher.speed));
		var t = new Date().getTime();
		hasher.get(part);
		t = new Date().getTime() - t;
		var remTime = text.length/(part.length/t);

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
					dialogTitle + " :: " + hasher.prettyName,
					33 /*MB_OKCANCEL|MB_ICONQUESTION*/
				) == 2 /*IDCANCEL*/
			)
				return "";
		}
	}

	//var t = new Date().getTime();
	var hash = hasher.get(text);
	//WScript.Echo(text.length/(new Date().getTime() - t));
	if(upperCase)
		hash = hash.toUpperCase();
	return hash;
}
function getHashDialog(modal) {
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

	var IDC_STATIC     = -1;
	var IDC_CRC32      = 1001;
	var IDC_MD5        = 1002;
	var IDC_SHA1       = 1003;
	var IDC_SHA224     = 1004;
	var IDC_SHA256     = 1005;
	var IDC_SHA384     = 1006;
	var IDC_SHA512     = 1007;
	var IDC_HASH       = 1008;
	var IDC_UPPER_CASE = 1009;
	var IDC_COPY       = 1010;
	var IDC_CALC       = 1011;
	var IDC_CANCEL     = 1012;

	var hWndGroupHashes, hWndCRC32, hWndMD5, hWndSHA1, hWndSHA224, hWndSHA256, hWndSHA384, hWndSHA512;
	var hWndGroupHash, hWndHash;
	var hWndUpperCase;
	var hWndCopy, hWndCalc, hWndCancel;

	var rbW = 65;
	var rbSep = 2;

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 7 /*SM_CXFIXEDFRAME*/) * 2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/) * 2 + oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	// Create dialog
	hWndDialog = oSys.Call(
		"user32::CreateWindowEx" + _TCHAR,
		0,                             //dwExStyle
		dialogClass,                   //lpClassName
		0,                             //lpWindowName
		0x90CA0000,                    //WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX
		scale.x(0),                    //x
		scale.y(0),                    //y
		scale.x(511) + sizeNonClientX, //nWidth
		scale.y(185) + sizeNonClientY, //nHeight
		hMainWnd,                      //hWndParent
		0,                             //ID
		hInstanceDLL,                  //hInstance
		dialogCallback                 //Script function callback. To use it class must be registered by WindowRegisterClass.
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
				windowText(hWnd, dialogTitle);

				// GroupBox hashes
				hWndGroupHashes = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000007,           //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,                   //x
					13,                   //y
					rbW*7 + rbSep*6 + 20, //nWidth
					44,                   //nHeight
					hWnd,                 //hWndParent
					IDC_STATIC,           //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndGroupHashes, hGuiFont, _localize("Hash function"));

				// Radiobutton CRC32
				hWndCRC32 = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					24,           //x
					33,           //y
					rbW,          //nWidth
					16,           //nHeight
					hWnd,         //hWndParent
					IDC_CRC32,    //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndCRC32, hGuiFont, _localize("CRC&32"));
				checked(hWndCRC32, type == "crc32");

				// Radiobutton MD5
				hWndMD5 = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000004,           //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					26 + (rbW + rbSep)*1, //x
					33,                   //y
					rbW,                  //nWidth
					16,                   //nHeight
					hWnd,                 //hWndParent
					IDC_MD5,              //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndMD5, hGuiFont, _localize("MD&5"));
				checked(hWndMD5, type == "md5");

				// Radiobutton SHA1
				hWndSHA1 = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000004,           //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					26 + (rbW + rbSep)*2, //x
					33,                   //y
					rbW,                  //nWidth
					16,                   //nHeight
					hWnd,                 //hWndParent
					IDC_SHA1,             //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndSHA1, hGuiFont, _localize("SHA-&1"));
				checked(hWndSHA1, type == "sha1");

				// Radiobutton SHA224
				hWndSHA224 = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000004,           //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					26 + (rbW + rbSep)*3, //x
					33,                   //y
					rbW,                  //nWidth
					16,                   //nHeight
					hWnd,                 //hWndParent
					IDC_SHA224,           //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndSHA224, hGuiFont, _localize("SHA-224"));
				checked(hWndSHA224, type == "sha224");

				// Radiobutton SHA256
				hWndSHA256 = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000004,           //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					26 + (rbW + rbSep)*4, //x
					33,                   //y
					rbW,                  //nWidth
					16,                   //nHeight
					hWnd,                 //hWndParent
					IDC_SHA256,           //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndSHA256, hGuiFont, _localize("SHA-&256"));
				checked(hWndSHA256, type == "sha256");

				// Radiobutton SHA384
				hWndSHA384 = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000004,           //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					26 + (rbW + rbSep)*5, //x
					33,                   //y
					rbW,                  //nWidth
					16,                   //nHeight
					hWnd,                 //hWndParent
					IDC_SHA384,           //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndSHA384, hGuiFont, _localize("SHA-384"));
				checked(hWndSHA384, type == "sha384");

				// Radiobutton SHA512
				hWndSHA512 = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000004,           //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					26 + (rbW + rbSep)*6, //x
					33,                   //y
					rbW,                  //nWidth
					16,                   //nHeight
					hWnd,                 //hWndParent
					IDC_SHA512,           //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndSHA512, hGuiFont, _localize("SHA-512"));
				checked(hWndSHA512, type == "sha512");

				// GroupBox hash
				hWndGroupHash = createWindowEx(
					0,                    //dwExStyle
					"BUTTON",             //lpClassName
					0,                    //lpWindowName
					0x50000007,           //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					12,                   //x
					68,                   //y
					rbW*7 + rbSep*6 + 20, //nWidth
					72,                   //nHeight
					hWnd,                 //hWndParent
					IDC_STATIC,           //ID
					hInstanceDLL,         //hInstance
					0                     //lpParam
				);
				setWindowFontAndText(hWndGroupHash, hGuiFont, _localize("Hash"));

				// Hash
				hWndHash = createWindowEx(
					0x200,               //WS_EX_CLIENTEDGE
					"EDIT",              //lpClassName
					0,                   //lpWindowName
					0x50010880,          //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_READONLY
					26,                  //x
					88,                  //y
					rbW*7 + rbSep*6 - 8, //nWidth
					23,                  //nHeight
					hWnd,                //hWndParent
					IDC_HASH,            //ID
					hInstanceDLL,        //hInstance
					0                    //lpParam
				);
				setWindowFontAndText(hWndHash, hGuiFont, "");

				// Checkbox: upper case
				hWndUpperCase = createWindowEx(
					0,                   //dwExStyle
					"BUTTON",            //lpClassName
					0,                   //lpWindowName
					0x50010003,          //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					26,                  //x
					117,                 //y
					rbW*7 + rbSep*6 - 8, //nWidth
					16,                  //nHeight
					hWnd,                //hWndParent
					IDC_UPPER_CASE,      //ID
					hInstanceDLL,        //hInstance
					0                    //lpParam
				);
				setWindowFontAndText(hWndUpperCase, hGuiFont, _localize("&Upper case"));
				checked(hWndUpperCase, upperCase);

				// Copy button window
				hWndCopy = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010001,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					188,          //x
					151,          //y
					96,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_COPY,     //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndCopy, hGuiFont, _localize("Co&py"));

				// Calculate button window
				hWndCalc = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					296,          //x
					151,          //y
					96,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_CALC,     //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndCalc, hGuiFont, _localize("&Calculate"));

				// Cancel button window
				hWndCancel = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50010000,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					404,          //x
					151,          //y
					96,           //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_CANCEL,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));

				//centerWindow(hWnd);
				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);

				//autoCalc && oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CALC, 0);
				if(autoCalc) try {
					controlsEnabled(false);
					new ActiveXObject("htmlfile").parentWindow.setTimeout(function() {
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CALC, 0);
					}, 0);
				}
				catch(e) {
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CALC, 0);
				}
			break;
			case 7: //WM_SETFOCUS
				var hWndChecked = hWndMD5; // Only for hashes w/o GUI (should not happens now)
				if(checked(hWndCRC32))       hWndChecked = hWndCRC32;
				else if(checked(hWndMD5))    hWndChecked = hWndMD5;
				else if(checked(hWndSHA1))   hWndChecked = hWndSHA1;
				else if(checked(hWndSHA224)) hWndChecked = hWndSHA224;
				else if(checked(hWndSHA256)) hWndChecked = hWndSHA256;
				else if(checked(hWndSHA384)) hWndChecked = hWndSHA384;
				else if(checked(hWndSHA512)) hWndChecked = hWndSHA512;
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
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CALC, 0);
					else // Enter
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_COPY, 0);
				}
				else if(wParam == 90 /*Z*/) {
					if(ctrl && shift) // Ctrl+Shift+Z
						AkelPad.Command(4152); // Redo
					else if(ctrl) // Ctrl+Z
						AkelPad.Command(4151); // Undo
				}
				else if(ctrl && wParam == 67 /*C*/ || ctrl && wParam == 45 /*VK_INSERT*/) { // Ctrl+C, Ctrl+Insert
					if(oSys.Call("user32::GetFocus") != hWndHash)
						copyHash(hWnd);
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
					//if(oSys.Call("user32::GetFocus") != hWndHash)
					// Edit control doesn't support Ctrl+A
					noScroll(function() {
						AkelPad.Command(4157); //IDM_EDIT_SELECTALL
					});
				}
				else if(ctrl && wParam == 83 /*S*/) // Ctrl+S
					AkelPad.Command(4105); // IDM_FILE_SAVE
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_COPY:
					case IDC_CALC:
						var copyBtn = idc == IDC_COPY;
						if(disabled == true || disabled > new Date().getTime())
							break;
						disabled = true;
						if(!readRadiosState())
							break;
						var hWndFocused = oSys.Call("user32::GetFocus");
						controlsEnabled(false);
						try {
							var hash = copyBtn
								? copyHash(hWnd)
								: showHash(hWnd);
						}
						catch(e) {
							var err = e;
						}
						if(typeof hash == "string" && copyBtn)
							closeDialog();
						else {
							controlsEnabled(true);
							if(!oSys.Call("user32::GetFocus")) // We disable focused window
								oSys.Call("user32::SetFocus", hWndFocused);
							disabled = new Date().getTime() + disabledTimeout;
						}
						if(err)
							throw err;
					break;
					case IDC_CANCEL:
						closeDialog();
					break;
					case IDC_CRC32:
					case IDC_MD5:
					case IDC_SHA1:
					case IDC_SHA224:
					case IDC_SHA256:
					case IDC_SHA384:
					case IDC_SHA512:
						checked(hWndCRC32,  idc == IDC_CRC32);
						checked(hWndMD5,    idc == IDC_MD5);
						checked(hWndSHA1,   idc == IDC_SHA1);
						checked(hWndSHA224, idc == IDC_SHA224);
						checked(hWndSHA256, idc == IDC_SHA256);
						checked(hWndSHA384, idc == IDC_SHA384);
						checked(hWndSHA512, idc == IDC_SHA512);

						if(autoCalc || (wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/)
							oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CALC, 0);
					break;
					case IDC_UPPER_CASE:
						upperCase = checked(hWndUpperCase);
						var hash = windowText(hWndHash);
						var newHash = upperCase ? hash.toUpperCase() : hash.toLowerCase();
						if(newHash != hash)
							windowText(hWndHash, newHash);
				}
			break;
			case 16: //WM_CLOSE
				enabled(hMainWnd, true); // Enable main window
				savePosition && !oSys.Call("user32::IsIconic", hWnd) && saveWindowPosition(hWnd);
				if(saveOptions == 2) {
					readRadiosState() && prefs.set("type", type);
					prefs.set("upperCase", upperCase);
					prefs.end();
				}
				oSys.Call("user32::DestroyWindow", hWnd); // Destroy dialog
			break;
			case 2: //WM_DESTROY
				oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		}
		return 0;
	}
	function saveWindowPosition(hWnd) {
		var rcWnd = getWindowRect(hWnd);
		if(!rcWnd)
			return;
		prefs.set({
			windowLeft: rcWnd.left,
			windowTop:  rcWnd.top
		});
		prefs.end();
	}
	function restoreWindowPosition(hWnd, hWndParent) {
		if(savePosition) {
			var dlgX = prefs.get("windowLeft", prefs.DWORD);
			var dlgY = prefs.get("windowTop",  prefs.DWORD);
			prefs.end();
		}

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
				oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/)
					+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/)
			);

			var minX = rcWork.left - (rcWnd.right - rcWnd.left) + edge;
			var minY = rcWork.top;
			var maxX = rcWork.right - edge;
			var maxY = rcWork.bottom - edge;

			dlgX = Math.max(minX, Math.min(maxX, dlgX));
			dlgY = Math.max(minY, Math.min(maxY, dlgY));
		}

		oSys.Call("user32::SetWindowPos", hWnd, 0, dlgX, dlgY, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
	}
	function centerWindow(hWnd, hWndParent) {
		var rcWnd = getWindowRect(hWnd);
		var rcWndParent = getWindowRect(hWndParent || oSys.Call("user32::GetDesktopWindow"));
		if(!rcWndParent || !rcWnd)
			return;
		var x = rcWndParent.left + ((rcWndParent.right  - rcWndParent.left) / 2 - (rcWnd.right  - rcWnd.left) / 2);
		var y = rcWndParent.top  + ((rcWndParent.bottom - rcWndParent.top)  / 2 - (rcWnd.bottom - rcWnd.top)  / 2);
		oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
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
	function showHash(hWnd) {
		var callback = { value: null };
		var hash = getHash(hWnd, callback);
		if(typeof hash == "string")
			windowText(hWndHash, hash);
		callback.value && callback.value();
		return hash;
	}
	function copyHash(hWnd) {
		var hash = windowText(hWndHash);
		if(!hash) {
			var callback = { value: null };
			hash = getHash(hWnd, callback);
			if(typeof hash == "string")
				windowText(hWndHash, hash);
		}
		hash && AkelPad.SetClipboardText(hash);
		callback && callback.value && callback.value();
		return hash;
	}
	function readRadiosState() {
		if(checked(hWndCRC32))
			type = "crc32";
		else if(checked(hWndMD5))
			type = "md5";
		else if(checked(hWndSHA1))
			type = "sha1";
		else if(checked(hWndSHA224))
			type = "sha224";
		else if(checked(hWndSHA256))
			type = "sha256";
		else if(checked(hWndSHA384))
			type = "sha384";
		else if(checked(hWndSHA512))
			type = "sha512";
		else
			return false;
		//upperCase = checked(hWndUpperCase);
		return true;
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
		enabled(hWndCopy, val);
		enabled(hWndCalc, val);
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

if(hMainWnd && (typeof AkelPad.IsInclude == "undefined" || !AkelPad.IsInclude())) {
	if(!hashes[type]) { // Invalid argument or pref
		AkelPad.MessageBox(
			hMainWnd,
			_localize("Hash function “%S” not found!")
				.replace("%S", type),
			dialogTitle,
			16 /*MB_ICONERROR*/
		);
		type = DEFAULT_HASH;
		showDialog = true;
	}
	if(showDialog)
		getHashDialog();
	else {
		var callback = { value: null };
		var hash = getHash(null, callback);
		hash && AkelPad.SetClipboardText(hash);
		callback.value && callback.value();
	}
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
	function set(name, val) {
		if(!(state & SAVE)) {
			end();
			if(!oSet.Begin(ns, SAVE))
				return false;
			state = SAVE;
		}
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
	this.begin  = begin;
	this.end    = end;
}


// Testcase for convertFromUnicode:

//var u = "Проверка\x00Test";
//var a = convertFromUnicode(u, 1251);
//WScript.Echo(("convertFromUnicode:\n" + u + "\n" + a + "\n" + u.length + "\n" + a.length).replace(/\x00/g, "\\0"));

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