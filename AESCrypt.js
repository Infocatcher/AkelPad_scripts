// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11212#11212
// http://infocatcher.ucoz.net/js/akelpad_scripts/AESCrypt.js

// (c) Infocatcher 2010-2011
// version 0.2.7 - 2011-12-20

//===================
// AES-256 encrypt/decrypt
// Based on script from http://www.movable-type.co.uk/scripts/aes.html

// Arguments:
//   -mode=0             - (default) ask user about direction (encrypt or decrypt)
//        =1             - encrypt
//        =2             - decrypt
//   -maxLineWidth=75    - allow split output to lines with fixed width
//   -showPassword=true  - force show or hide password
//   -saveOptions=true   - allow store last used password state

// Usage:
//   Call("Scripts::Main", 1, "AESCrypt.js", "-mode=1")     - encrypt
//   Call("Scripts::Main", 1, "AESCrypt.js", "-mode=2")     - decrypt
//   Call("Scripts::Main", 1, "AESCrypt.js", "-mode=0 -maxLineWidth=0 -showPassword=true -saveOptions=false")
//===================

function _localize(s) {
	var strings = {
		"Nothing to encrypt!": {
			ru: "Нечего зашифровывать!"
		},
		"Nothing to decrypt!": {
			ru: "Нечего расшифровывать!"
		},
		"Direction": {
			ru: "Направление"
		},
		"Encrypt": {
			ru: "Зашифровать"
		},
		"Decrypt": {
			ru: "Расшифровать"
		},
		"Password": {
			ru: "Пароль"
		},
		"&Encrypt": {
			ru: "&Зашифровать"
		},
		"&Decrypt": {
			ru: "&Расшифровать"
		},
		"Impossible to decrypt: invalid format!": {
			ru: "Невозможно расшифровать: некорректный формат!"
		},
		"Enter &password:": {
			ru: "Введите &пароль:"
		},
		"Reenter p&assword:": {
			ru: "Повторите п&ароль:"
		},
		"&Show password": {
			ru: "По&казывать пароль"
		},
		"OK": {
			ru: "ОК"
		},
		"Cancel": {
			ru: "Отмена"
		},
		"Passwords do not match!": {
			ru: "Пароли не совпадают!"
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

var MODE_USER_SELECT = 0;
var MODE_ENCRYPT     = 1;
var MODE_DECRYPT     = 2;

// Read arguments:
// getArg(argName, defaultValue)
var mode         = getArg("mode", 0);
var maxLineWidth = getArg("maxLineWidth", 75);
var showPassword = getArg("showPassword");
var saveOptions  = getArg("saveOptions", true);

var decrypt = mode == MODE_DECRYPT;


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  AES implementation in JavaScript (c) Chris Veness 2005-2010                                   */
/*   - see http://csrc.nist.gov/publications/PubsFIPS.html#197                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Aes = {};  // Aes namespace

/**
 * AES Cipher function: encrypt 'input' state with Rijndael algorithm
 *   applies Nr rounds (10/12/14) using key schedule w for 'add round key' stage
 *
 * @param {Number[]} input 16-byte (128-bit) input state array
 * @param {Number[][]} w   Key schedule as 2D byte-array (Nr+1 x Nb bytes)
 * @returns {Number[]}     Encrypted output state array
 */
Aes.cipher = function(input, w) {    // main Cipher function [§5.1]
  var Nb = 4;               // block size (in words): no of columns in state (fixed at 4 for AES)
  var Nr = w.length/Nb - 1; // no of rounds: 10/12/14 for 128/192/256-bit keys

  var state = [[],[],[],[]];  // initialise 4xNb byte-array 'state' with input [§3.4]
  for (var i=0; i<4*Nb; i++) state[i%4][Math.floor(i/4)] = input[i];

  state = Aes.addRoundKey(state, w, 0, Nb);

  for (var round=1; round<Nr; round++) {
    state = Aes.subBytes(state, Nb);
    state = Aes.shiftRows(state, Nb);
    state = Aes.mixColumns(state, Nb);
    state = Aes.addRoundKey(state, w, round, Nb);
  }

  state = Aes.subBytes(state, Nb);
  state = Aes.shiftRows(state, Nb);
  state = Aes.addRoundKey(state, w, Nr, Nb);

  var output = new Array(4*Nb);  // convert state to 1-d array before returning [§3.4]
  for (var i=0; i<4*Nb; i++) output[i] = state[i%4][Math.floor(i/4)];
  return output;
}

/**
 * Perform Key Expansion to generate a Key Schedule
 *
 * @param {Number[]} key Key as 16/24/32-byte array
 * @returns {Number[][]} Expanded key schedule as 2D byte-array (Nr+1 x Nb bytes)
 */
Aes.keyExpansion = function(key) {  // generate Key Schedule (byte-array Nr+1 x Nb) from Key [§5.2]
  var Nb = 4;            // block size (in words): no of columns in state (fixed at 4 for AES)
  var Nk = key.length/4  // key length (in words): 4/6/8 for 128/192/256-bit keys
  var Nr = Nk + 6;       // no of rounds: 10/12/14 for 128/192/256-bit keys

  var w = new Array(Nb*(Nr+1));
  var temp = new Array(4);

  for (var i=0; i<Nk; i++) {
    var r = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
    w[i] = r;
  }

  for (var i=Nk; i<(Nb*(Nr+1)); i++) {
    w[i] = new Array(4);
    for (var t=0; t<4; t++) temp[t] = w[i-1][t];
    if (i % Nk == 0) {
      temp = Aes.subWord(Aes.rotWord(temp));
      for (var t=0; t<4; t++) temp[t] ^= Aes.rCon[i/Nk][t];
    } else if (Nk > 6 && i%Nk == 4) {
      temp = Aes.subWord(temp);
    }
    for (var t=0; t<4; t++) w[i][t] = w[i-Nk][t] ^ temp[t];
  }

  return w;
}

/*
 * ---- remaining routines are private, not called externally ----
 */

Aes.subBytes = function(s, Nb) {    // apply SBox to state S [§5.1.1]
  for (var r=0; r<4; r++) {
    for (var c=0; c<Nb; c++) s[r][c] = Aes.sBox[s[r][c]];
  }
  return s;
}

Aes.shiftRows = function(s, Nb) {    // shift row r of state S left by r bytes [§5.1.2]
  var t = new Array(4);
  for (var r=1; r<4; r++) {
    for (var c=0; c<4; c++) t[c] = s[r][(c+r)%Nb];  // shift into temp copy
    for (var c=0; c<4; c++) s[r][c] = t[c];         // and copy back
  }          // note that this will work for Nb=4,5,6, but not 7,8 (always 4 for AES):
  return s;  // see asmaes.sourceforge.net/rijndael/rijndaelImplementation.pdf
}

Aes.mixColumns = function(s, Nb) {   // combine bytes of each col of state S [§5.1.3]
  for (var c=0; c<4; c++) {
    var a = new Array(4);  // 'a' is a copy of the current column from 's'
    var b = new Array(4);  // 'b' is a•{02} in GF(2^8)
    for (var i=0; i<4; i++) {
      a[i] = s[i][c];
      b[i] = s[i][c]&0x80 ? s[i][c]<<1 ^ 0x011b : s[i][c]<<1;

    }
    // a[n] ^ b[n] is a•{03} in GF(2^8)
    s[0][c] = b[0] ^ a[1] ^ b[1] ^ a[2] ^ a[3]; // 2*a0 + 3*a1 + a2 + a3
    s[1][c] = a[0] ^ b[1] ^ a[2] ^ b[2] ^ a[3]; // a0 * 2*a1 + 3*a2 + a3
    s[2][c] = a[0] ^ a[1] ^ b[2] ^ a[3] ^ b[3]; // a0 + a1 + 2*a2 + 3*a3
    s[3][c] = a[0] ^ b[0] ^ a[1] ^ a[2] ^ b[3]; // 3*a0 + a1 + a2 + 2*a3
  }
  return s;
}

Aes.addRoundKey = function(state, w, rnd, Nb) {  // xor Round Key into state S [§5.1.4]
  for (var r=0; r<4; r++) {
    for (var c=0; c<Nb; c++) state[r][c] ^= w[rnd*4+c][r];
  }
  return state;
}

Aes.subWord = function(w) {    // apply SBox to 4-byte word w
  for (var i=0; i<4; i++) w[i] = Aes.sBox[w[i]];
  return w;
}

Aes.rotWord = function(w) {    // rotate 4-byte word w left by one byte
  var tmp = w[0];
  for (var i=0; i<3; i++) w[i] = w[i+1];
  w[3] = tmp;
  return w;
}

// sBox is pre-computed multiplicative inverse in GF(2^8) used in subBytes and keyExpansion [§5.1.1]
Aes.sBox =  [0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
             0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
             0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
             0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
             0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
             0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
             0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
             0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
             0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
             0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
             0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
             0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
             0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
             0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
             0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
             0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];

// rCon is Round Constant used for the Key Expansion [1st col is 2^(r-1) in GF(2^8)] [§5.2]
Aes.rCon = [ [0x00, 0x00, 0x00, 0x00],
             [0x01, 0x00, 0x00, 0x00],
             [0x02, 0x00, 0x00, 0x00],
             [0x04, 0x00, 0x00, 0x00],
             [0x08, 0x00, 0x00, 0x00],
             [0x10, 0x00, 0x00, 0x00],
             [0x20, 0x00, 0x00, 0x00],
             [0x40, 0x00, 0x00, 0x00],
             [0x80, 0x00, 0x00, 0x00],
             [0x1b, 0x00, 0x00, 0x00],
             [0x36, 0x00, 0x00, 0x00] ];


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  AES Counter-mode implementation in JavaScript (c) Chris Veness 2005-2009                      */
/*   - see http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf                       */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

Aes.Ctr = {};  // Aes.Ctr namespace: a subclass or extension of Aes

/**
 * Encrypt a text using AES encryption in Counter mode of operation
 *
 * Unicode multi-byte character safe
 *
 * @param {String} plaintext Source text to be encrypted
 * @param {String} password  The password to use to generate a key
 * @param {Number} nBits     Number of bits to be used in the key (128, 192, or 256)
 * @returns {string}         Encrypted text
 */
Aes.Ctr.encrypt = function(plaintext, password, nBits) {
  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  if (!(nBits==128 || nBits==192 || nBits==256)) return '';  // standard allows 128/192/256 bit keys
  plaintext = Utf8.encode(plaintext);
  password = Utf8.encode(password);
  //var t = new Date();  // timer

  // use AES itself to encrypt password to get cipher key (using plain password as source for key
  // expansion) - gives us well encrypted key
  var nBytes = nBits/8;  // no bytes in key
  var pwBytes = new Array(nBytes);
  for (var i=0; i<nBytes; i++) {
    pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
  }
  var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes));  // gives us 16-byte key
  key = key.concat(key.slice(0, nBytes-16));  // expand key to 16/24/32 bytes long

  // initialise counter block (NIST SP800-38A §B.2): millisecond time-stamp for nonce in 1st 8 bytes,
  // block counter in 2nd 8 bytes
  var counterBlock = new Array(blockSize);
  var nonce = (new Date()).getTime();  // timestamp: milliseconds since 1-Jan-1970
  var nonceSec = Math.floor(nonce/1000);
  var nonceMs = nonce%1000;
  // encode nonce with seconds in 1st 4 bytes, and (repeated) ms part filling 2nd 4 bytes
  for (var i=0; i<4; i++) counterBlock[i] = (nonceSec >>> i*8) & 0xff;
  for (var i=0; i<4; i++) counterBlock[i+4] = nonceMs & 0xff;
  // and convert it to a string to go on the front of the ciphertext
  var ctrTxt = '';
  for (var i=0; i<8; i++) ctrTxt += String.fromCharCode(counterBlock[i]);

  // generate key schedule - an expansion of the key into distinct Key Rounds for each round
  var keySchedule = Aes.keyExpansion(key);

  var blockCount = Math.ceil(plaintext.length/blockSize);
  var ciphertxt = new Array(blockCount);  // ciphertext as array of strings

  for (var b=0; b<blockCount; b++) {
    // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
    // done in two stages for 32-bit ops: using two words allows us to go past 2^32 blocks (68GB)
    for (var c=0; c<4; c++) counterBlock[15-c] = (b >>> c*8) & 0xff;
    for (var c=0; c<4; c++) counterBlock[15-c-4] = (b/0x100000000 >>> c*8)

    var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // -- encrypt counter block --

    // block size is reduced on final block
    var blockLength = b<blockCount-1 ? blockSize : (plaintext.length-1)%blockSize+1;
    var cipherChar = new Array(blockLength);

    for (var i=0; i<blockLength; i++) {  // -- xor plaintext with ciphered counter char-by-char --
      cipherChar[i] = cipherCntr[i] ^ plaintext.charCodeAt(b*blockSize+i);
      cipherChar[i] = String.fromCharCode(cipherChar[i]);
    }
    ciphertxt[b] = cipherChar.join('');
  }

  // Array.join is more efficient than repeated string concatenation in IE
  var ciphertext = ctrTxt + ciphertxt.join('');
  ciphertext = Base64.encode(ciphertext);  // encode in base64

  //alert((new Date()) - t);
  return ciphertext;
}

/**
 * Decrypt a text encrypted by AES in counter mode of operation
 *
 * @param {String} ciphertext Source text to be encrypted
 * @param {String} password   The password to use to generate a key
 * @param {Number} nBits      Number of bits to be used in the key (128, 192, or 256)
 * @returns {String}          Decrypted text
 */
Aes.Ctr.decrypt = function(ciphertext, password, nBits) {
  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  if (!(nBits==128 || nBits==192 || nBits==256)) return '';  // standard allows 128/192/256 bit keys
  ciphertext = Base64.decode(ciphertext);
  password = Utf8.encode(password);
  //var t = new Date();  // timer

  // use AES to encrypt password (mirroring encrypt routine)
  var nBytes = nBits/8;  // no bytes in key
  var pwBytes = new Array(nBytes);
  for (var i=0; i<nBytes; i++) {
    pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
  }
  var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes));
  key = key.concat(key.slice(0, nBytes-16));  // expand key to 16/24/32 bytes long

  // recover nonce from 1st 8 bytes of ciphertext
  var counterBlock = new Array(8);
  ctrTxt = ciphertext.slice(0, 8);
  for (var i=0; i<8; i++) counterBlock[i] = ctrTxt.charCodeAt(i);

  // generate key schedule
  var keySchedule = Aes.keyExpansion(key);

  // separate ciphertext into blocks (skipping past initial 8 bytes)
  var nBlocks = Math.ceil((ciphertext.length-8) / blockSize);
  var ct = new Array(nBlocks);
  for (var b=0; b<nBlocks; b++) ct[b] = ciphertext.slice(8+b*blockSize, 8+b*blockSize+blockSize);
  ciphertext = ct;  // ciphertext is now array of block-length strings

  // plaintext will get generated block-by-block into array of block-length strings
  var plaintxt = new Array(ciphertext.length);

  for (var b=0; b<nBlocks; b++) {
    // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
    for (var c=0; c<4; c++) counterBlock[15-c] = ((b) >>> c*8) & 0xff;
    for (var c=0; c<4; c++) counterBlock[15-c-4] = (((b+1)/0x100000000-1) >>> c*8) & 0xff;

    var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // encrypt counter block

    var plaintxtByte = new Array(ciphertext[b].length);
    for (var i=0; i<ciphertext[b].length; i++) {
      // -- xor plaintxt with ciphered counter byte-by-byte --
      plaintxtByte[i] = cipherCntr[i] ^ ciphertext[b].charCodeAt(i);
      plaintxtByte[i] = String.fromCharCode(plaintxtByte[i]);
    }
    plaintxt[b] = plaintxtByte.join('');
  }

  // join array of blocks into single plaintext string
  var plaintext = plaintxt.join('');
  plaintext = Utf8.decode(plaintext);  // decode from UTF8 back to Unicode multi-byte chars

  //alert((new Date()) - t);
  return plaintext;
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Base64 class: Base 64 encoding / decoding (c) Chris Veness 2002-2010                          */
/*    note: depends on Utf8 class                                                                 */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Base64 = {};  // Base64 namespace

Base64.code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/**
 * Encode string into Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
 * (instance method extending String object). As per RFC 4648, no newlines are added.
 *
 * @param {String} str The string to be encoded as base-64
 * @param {Boolean} [utf8encode=false] Flag to indicate whether str is Unicode string to be encoded
 *   to UTF8 before conversion to base64; otherwise string is assumed to be 8-bit characters
 * @returns {String} Base64-encoded string
 */
Base64.encode = function(str, utf8encode) {  // http://tools.ietf.org/html/rfc4648
  utf8encode =  (typeof utf8encode == 'undefined') ? false : utf8encode;
  var o1, o2, o3, bits, h1, h2, h3, h4, e=[], pad = '', c, plain, coded;
  var b64 = Base64.code;

  plain = utf8encode ? str.encodeUTF8() : str;

  c = plain.length % 3;  // pad string to length of multiple of 3
  if (c > 0) { while (c++ < 3) { pad += '='; plain += '\0'; } }
  // note: doing padding here saves us doing special-case packing for trailing 1 or 2 chars

  for (c=0; c<plain.length; c+=3) {  // pack three octets into four hexets
    o1 = plain.charCodeAt(c);
    o2 = plain.charCodeAt(c+1);
    o3 = plain.charCodeAt(c+2);

    bits = o1<<16 | o2<<8 | o3;

    h1 = bits>>18 & 0x3f;
    h2 = bits>>12 & 0x3f;
    h3 = bits>>6 & 0x3f;
    h4 = bits & 0x3f;

    // use hextets to index into code string
    e[c/3] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
  }
  coded = e.join('');  // join() is far faster than repeated string concatenation in IE

  // replace 'A's from padded nulls with '='s
  coded = coded.slice(0, coded.length-pad.length) + pad;

  return coded;
}

/**
 * Decode string from Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
 * (instance method extending String object). As per RFC 4648, newlines are not catered for.
 *
 * @param {String} str The string to be decoded from base-64
 * @param {Boolean} [utf8decode=false] Flag to indicate whether str is Unicode string to be decoded
 *   from UTF8 after conversion from base64
 * @returns {String} decoded string
 */
Base64.decode = function(str, utf8decode) {
  utf8decode =  (typeof utf8decode == 'undefined') ? false : utf8decode;
  var o1, o2, o3, h1, h2, h3, h4, bits, d=[], plain, coded;
  var b64 = Base64.code;

  coded = utf8decode ? str.decodeUTF8() : str;


  for (var c=0; c<coded.length; c+=4) {  // unpack four hexets into three octets
    h1 = b64.indexOf(coded.charAt(c));
    h2 = b64.indexOf(coded.charAt(c+1));
    h3 = b64.indexOf(coded.charAt(c+2));
    h4 = b64.indexOf(coded.charAt(c+3));

    bits = h1<<18 | h2<<12 | h3<<6 | h4;

    o1 = bits>>>16 & 0xff;
    o2 = bits>>>8 & 0xff;
    o3 = bits & 0xff;

    d[c/4] = String.fromCharCode(o1, o2, o3);
    // check for padding
    if (h4 == 0x40) d[c/4] = String.fromCharCode(o1, o2);
    if (h3 == 0x40) d[c/4] = String.fromCharCode(o1);
  }
  plain = d.join('');  // join() is far faster than repeated string concatenation in IE

  return utf8decode ? plain.decodeUTF8() : plain;
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

/**
 * Decode utf-8 encoded string back into multi-byte Unicode characters
 *
 * @param {String} strUtf UTF-8 string to be decoded back to Unicode
 * @returns {String} decoded string
 */
Utf8.decode = function(strUtf) {
  // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
  var strUni = strUtf.replace(
      /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
      function(c) {  // (note parentheses for precence)
        var cc = ((c.charCodeAt(0)&0x0f)<<12) | ((c.charCodeAt(1)&0x3f)<<6) | ( c.charCodeAt(2)&0x3f);
        return String.fromCharCode(cc); }
    );
  strUni = strUni.replace(
      /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
      function(c) {  // (note parentheses for precence)
        var cc = (c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f;
        return String.fromCharCode(cc); }
    );
  return strUni;
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var hWndEdit = AkelPad.GetEditWnd();

if(hMainWnd && !AkelPad.GetEditReadOnly(hWndEdit))
	encryptOrDecrypt();

function encryptOrDecrypt(pass) {
	var text = AkelPad.GetSelText();
	var selectAll = false;
	if(!text) {
		text = getAllText();
		if(!text) {
			var msg = _localize("Nothing to " + (decrypt ? "decrypt" : "encrypt") + "!");
			AkelPad.MessageBox(hMainWnd, msg, WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
			return;
		}
		selectAll = true;
	}

	if(mode == MODE_USER_SELECT) {
		var dirObj = { value: isBase64(text) };
		var pass = passwordPrompt(WScript.ScriptName, _localize("Password"), true, dirObj);
		if(!pass) // Cancel
			return;
		decrypt = dirObj.value;
	}

	if(decrypt) {
		//if(maxLineWidth > 0)
		text = text.replace(/[\n\r]+/g, "");
		if(!isBase64(text)) {
			AkelPad.MessageBox(
				hMainWnd,
				_localize("Impossible to decrypt: invalid format!"),
				WScript.ScriptName,
				16 /*MB_ICONERROR*/
			);
			return;
		}
	}

	if(!pass)
		pass = passwordPrompt(WScript.ScriptName, _localize(decrypt ? "Decrypt" : "Encrypt"), true);
	if(!pass) // Cancel
		return;

	var res = Aes.Ctr[decrypt ? "decrypt" : "encrypt"](text, pass, 256);
	if(!decrypt && maxLineWidth > 0)
		res = res.replace(new RegExp(".{" + maxLineWidth + "}", "g"), "$&\n");

	insertNoScroll(res, selectAll);
}
function isBase64(str) {
	str = str.replace(/[\n\r]+/g, "");
	return str.length % 4 == 0 && !/[^a-zA-Z0-9+\/]/.test(str.replace(/=+$/, ""));
}

function passwordPrompt(caption, label, modal, direction) {
	var hInstanceDLL = AkelPad.GetInstanceDll();
	var dialogClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");

	// Note: "modal" argument is always true now and following should not happens
	var hWndDialog = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, dialogClass, 0);
	if(hWndDialog) {
		if(oSys.Call("user32::IsIconic", hWndDialog))
			oSys.Call("user32::ShowWindow", hWndDialog, 9 /*SW_RESTORE*/);
		AkelPad.SendMessage(hWndDialog, 7 /*WM_SETFOCUS*/, 0, 0);
		return null;
	}

	if(
		!AkelPad.WindowRegisterClass(dialogClass)
		&& ( // Previous script instance crashed
			!AkelPad.WindowUnregisterClass(dialogClass)
			|| !AkelPad.WindowRegisterClass(dialogClass)
		)
	)
		return null;

	var pass;
	var lpBuffer = AkelPad.MemAlloc(256 * _TSIZE);
	if(!lpBuffer)
		return null;

	var IDC_STATIC      = -1;
	var IDC_ENCRYPT     = 1001;
	var IDC_DECRYPT     = 1002;
	var IDC_PASS        = 1003;
	var IDC_PASS2       = 1004;
	var IDC_PASS2_LABEL = 1005;
	var IDC_SHOWPASS    = 1006;
	var IDC_OK          = 1007;
	var IDC_CANCEL      = 1008;

	var hWndGroupMode, hWndEncrypt, hWndDecrypt;
	var hWndGroup, hWndPassLabel, hWndPass, hWndPass2Label, hWndPass2, hWndShowPass;
	var hWndOK, hWndCancel;

	var addY = direction ? 54 : 0;
	var p2h = direction || !decrypt ? 0 : 52;

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 7 /*SM_CXFIXEDFRAME*/)*2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/)*2
		+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	// Create dialog
	hWndDialog = oSys.Call(
		"user32::CreateWindowEx" + _TCHAR,
		0,                                          //dwExStyle
		dialogClass,                                //lpClassName
		0,                                          //lpWindowName
		0x90CA0000,                                 //WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX
		scale.x(0),                                 //x
		scale.y(0),                                 //y
		scale.x(252) + sizeNonClientX,              //nWidth
		scale.y(214 + addY - p2h) + sizeNonClientY, //nHeight
		hMainWnd,                                   //hWndParent
		0,                                          //ID
		hInstanceDLL,                               //hInstance
		dialogCallback                              //Script function callback. To use it class must be registered by WindowRegisterClass.
	);
	if(!hWndDialog)
		return null;

	function dialogCallback(hWnd, uMsg, wParam, lParam) {
		switch(uMsg) {
			case 1: //WM_CREATE
				function setWindowFontAndText(hWnd, hFont, pText) {
					AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
					oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, pText.substr(0, 255));
				}

				var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);

				// Dialog caption
				oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, caption);

				if(direction) {
					// GroupBox mode
					hWndGroupMode = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
						14,           //x
						13,           //y
						224,          //nWidth
						44,           //nHeight
						hWnd,         //hWndParent
						IDC_STATIC,   //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndGroupMode, hGuiFont, _localize("Direction"));

					// Radiobutton encrypt
					hWndEncrypt = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000009,   //WS_VISIBLE|WS_CHILD|BS_AUTORADIOBUTTON
						26,           //x
						33,           //y
						96,           //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_ENCRYPT,  //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndEncrypt, hGuiFont, _localize("&Encrypt"));
					checked(hWndEncrypt, !direction.value);

					// Radiobutton decrypt
					hWndDecrypt = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000009,   //WS_VISIBLE|WS_CHILD|BS_AUTORADIOBUTTON
						128,          //x
						33,           //y
						96,           //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_DECRYPT,  //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndDecrypt, hGuiFont, _localize("&Decrypt"));
					//checked(hWndDecrypt, mode == MODE_DECRYPT);
					checked(hWndDecrypt, direction.value);
				}

				// GroupBox
				hWndGroup = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					14,           //x
					13 + addY,    //y
					224,          //nWidth
					152 - p2h,    //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndGroup, hGuiFont, label);

				// Static window: password label
				hWndPassLabel = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					32,           //x
					35 + addY,    //y
					177,          //nWidth
					13,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndPassLabel, hGuiFont, _localize("Enter &password:"));

				// Edit window: password
				hWndPass = createWindowEx(
					0x200,        //WS_EX_CLIENTEDGE
					"EDIT",       //lpClassName
					0,            //lpWindowName
					0x500100A0,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_PASSWORD
					29,           //x
					53 + addY,    //y
					195,          //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_PASS,     //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndPass, hGuiFont, "");

				if(direction || !decrypt) {
					// Static window: password 2 label
					hWndPass2Label = createWindowEx(
						0,               //dwExStyle
						"STATIC",        //lpClassName
						0,               //lpWindowName
						0x50000000,      //WS_VISIBLE|WS_CHILD
						32,              //x
						86 + addY,       //y
						177,             //nWidth
						13,              //nHeight
						hWnd,            //hWndParent
						IDC_PASS2_LABEL, //ID
						hInstanceDLL,    //hInstance
						0                //lpParam
					);
					setWindowFontAndText(hWndPass2Label, hGuiFont, _localize("Reenter p&assword:"));

					// Edit window: password 2
					hWndPass2 = createWindowEx(
						0x200,        //WS_EX_CLIENTEDGE
						"EDIT",       //lpClassName
						0,            //lpWindowName
						0x500100A0,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_PASSWORD
						29,           //x
						104 + addY,   //y
						195,          //nWidth
						23,           //nHeight
						hWnd,         //hWndParent
						IDC_PASS2,    //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndPass2, hGuiFont, "");
				}

				// Checkbox: show password
				hWndShowPass = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50010003,       //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					32,               //x
					138 + addY - p2h, //y
					177,              //nWidth
					16,               //nHeight
					hWnd,             //hWndParent
					IDC_SHOWPASS,     //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndShowPass, hGuiFont, _localize("&Show password"));
				var sp = showPassword === undefined
					? saveOptions
						? pref("showPassword", 1 /*PO_DWORD*/) == 1
						: false
					: showPassword;
				checked(hWndShowPass, sp);
				setShowPass(sp, direction ? !direction.value : !decrypt);

				// OK button window
				hWndOK = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50010001,       //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					13,               //x
					178 + addY - p2h, //y
					107,              //nWidth
					23,               //nHeight
					hWnd,             //hWndParent
					IDC_OK,           //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndOK, hGuiFont, _localize("OK"));

				// Cancel button window
				hWndCancel = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50010000,       //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					132,              //x
					178 + addY - p2h, //y
					107,              //nWidth
					23,               //nHeight
					hWnd,             //hWndParent
					IDC_CANCEL,       //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));

				oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_PASS, 0);

				//centerWindow(hMainWnd, hWnd);
				centerWindow(null, hWnd);
			break;
			case 7: //WM_SETFOCUS
				var hWndFocus = hWndPass;
				if(direction) {
					if(checked(hWndEncrypt))      hWndFocus = hWndEncrypt;
					else if(checked(hWndDecrypt)) hWndFocus = hWndDecrypt;
				}
				oSys.Call("user32::SetFocus", hWndFocus);
			break;
			case 256: //WM_KEYDOWN
				if(wParam == 27) //VK_ESCAPE
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
				else if(wParam == 13) //VK_RETURN
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_OK, 0);
			break;
			case 273: //WM_COMMAND
				switch(wParam & 0xffff) {
					case IDC_OK:
						oSys.Call("user32::GetWindowText" + _TCHAR, hWndPass, lpBuffer, 256);
						var pass1 = AkelPad.MemRead(lpBuffer, _TSTR);
						if(!pass1)
							break;
						var showPass = checked(hWndShowPass);
						var enc = direction ? checked(hWndEncrypt) : !decrypt;
						if(!showPass && enc) {
							oSys.Call("user32::GetWindowText" + _TCHAR, hWndPass2, lpBuffer, 256);
							var pass2 = AkelPad.MemRead(lpBuffer, _TSTR);
							if(pass1 != pass2) {
								AkelPad.MessageBox(
									hWnd,
									_localize("Passwords do not match!"),
									WScript.ScriptName,
									16 /*MB_ICONERROR*/
								);
								break;
							}
						}
						if(direction && !readRadiosState())
							break;
						saveOptions && pref("showPassword", 1 /*PO_DWORD*/, Number(showPass));
						pass = pass1;
						closeDialog();
					break;
					case IDC_CANCEL:
						closeDialog();
					break;
					case IDC_SHOWPASS:
					case IDC_ENCRYPT:
					case IDC_DECRYPT:
						setShowPass(checked(hWndShowPass), direction ? checked(hWndEncrypt) : !decrypt);
					break;
					case IDC_PASS:
					case IDC_PASS2:
						var hasPass = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndPass) > 0;
						enabled(hWndOK,    hasPass);
						enabled(hWndPass2, hasPass);
				}
			break;
			case 16: //WM_CLOSE
				modal && enabled(hMainWnd, true); // Enable main window
				oSys.Call("user32::DestroyWindow", hWnd); // Destroy dialog
			break;
			case 2: //WM_DESTROY
				oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		}
		return 0;
	}
	function centerWindow(hWndParent, hWnd) {
		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		if(!lpRect)
			return;
		if(!hWndParent)
			hWndParent = oSys.Call("user32::GetDesktopWindow");
		oSys.Call("user32::GetWindowRect", hWndParent, lpRect);
		var rcWndParent = parseRect(lpRect);
		oSys.Call("user32::GetWindowRect", hWnd, lpRect);
		var rcWnd = parseRect(lpRect);
		var x = rcWndParent.left + ((rcWndParent.right  - rcWndParent.left) / 2 - (rcWnd.right  - rcWnd.left) / 2);
		var y = rcWndParent.top  + ((rcWndParent.bottom - rcWndParent.top)  / 2 - (rcWnd.bottom - rcWnd.top)  / 2);
		oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
		AkelPad.MemFree(lpRect);
	}
	function parseRect(lpRect) {
		return {
			left:   AkelPad.MemRead(lpRect,      3 /*DT_DWORD*/),
			top:    AkelPad.MemRead(lpRect +  4, 3 /*DT_DWORD*/),
			right:  AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/),
			bottom: AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/)
		};
	}
	function readRadiosState() {
		if(checked(hWndEncrypt))
			direction.value = false;
		else if(checked(hWndDecrypt))
			direction.value = true;
		else
			return false;
		return true;
	}
	function checked(hWnd, val) {
		return arguments.length == 1
			? AkelPad.SendMessage(hWnd, 240 /*BM_GETCHECK*/, 0, 0)
			: AkelPad.SendMessage(hWnd, 241 /*BM_SETCHECK*/, val ? 1 /*BST_CHECKED*/ : 0, 0);
	}
	function enabled(hWnd, val) {
		oSys.Call("user32::EnableWindow", hWnd, val);
	}
	function showWindow(hWnd, val) {
		oSys.Call("user32::ShowWindow", hWnd, val);
	}
	function closeDialog() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
	}
	function setShowPass(showPass, showSecondField) {
		showSecondField = !showPass && showSecondField;
		hWndPass2Label && showWindow(hWndPass2Label, showSecondField);
		hWndPass2      && showWindow(hWndPass2,      showSecondField);
		if(!setShowPass.passChar)
			setShowPass.passChar = AkelPad.SendMessage(hWndPass, 0x00D2/*EM_GETPASSWORDCHAR*/, 0, 0) || 0x002A;
		var passChar = showPass ? 0 : setShowPass.passChar;
		AkelPad.SendMessage(hWndPass, 0x00CC/*EM_SETPASSWORDCHAR*/, passChar, 0);
		oSys.Call("user32::InvalidateRect", hWndPass, 0, 1/*TRUE*/);
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

	AkelPad.MemFree(lpBuffer);
	AkelPad.WindowUnregisterClass(dialogClass);
	return pass;
}

function getAllText() {
	if(typeof AkelPad.GetTextRange != "undefined")
		return AkelPad.GetTextRange(0, -1);
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return "";
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
function pref(name, type, val) {
	var oSet = AkelPad.ScriptSettings();
	if(arguments.length == 3) {
		if(!oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
			return false;
		var ok = oSet.Write(name, type, val);
		oSet.End();
		return ok;
	}
	if(!oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/))
		return undefined;
	var ret = oSet.Read(name, type || 1 /*PO_DWORD*/);
	oSet.End();
	return ret;
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