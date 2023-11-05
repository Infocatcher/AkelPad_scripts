// https://akelpad.sourceforge.net/forum/viewtopic.php?p=12843#p12843
// https://infocatcher.ucoz.net/js/akelpad_scripts/cryptExt.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/cryptExt.js

// (c) Infocatcher 2010-2012, 2014
// Version: 0.5.0a16 - 2014-05-06
// Author: Infocatcher

//===================
//// Encrypt/decrypt using AES-256/Blowfish/Twofish/Serpent
// Based on scripts from
// http://www.movable-type.co.uk/scripts/aes.html
// http://www.farfarfar.com/scripts/encrypt/
// https://github.com/bitwiseshiftleft/sjcl/
// http://ats.oka.nu/titaniumcore/js/crypto/Cipher.sample.html

// Simple encryption:
//   encrypted = encrypt(text, hash(pass))
//   encrypted = base64(encrypted)

// Multiple encryption:
//   encrypted = encrypt_1(text, hash(pass))
//   encrypted = encrypt_2(encrypted, hash(pass))
//   ...
//   encrypted = base64(encrypted)

// where hash() is PBKDF2 function http://en.wikipedia.org/wiki/PBKDF2

// PBKDF2 configuration:
//   hash algorithm:   SHA-256
//   iterations count: random from -iterations="min-max" range
//   salt:             random string with -saltLength="min-max" length

// Raw data after each encryption:
//   <salt><iterations><separator><encrypted data>
// See getHeader() and parseHeader()

// Hotkeys:
//   Enter                    - Ok
//   Ctrl+Enter, Shift+Enter  - Apply
//   Escape                   - Cancel
//   F2                       - Select direction (encrypt/decrypt)
//   F3                       - Select cryptor
//   Ctrl+Z                   - Undo
//   Ctrl+Shift+Z             - Redo
//   Ctrl+C, Ctrl+Insert      - Copy
//   Ctrl+V, Shift+Insert     - Paste
//   Ctrl+X, Shift+Del        - Cut
//   Delete                   - Delete selection
//   Ctrl+A                   - Select all
//   Ctrl+S                   - Save file

// Arguments:
//   -mode=0                  - (default) ask user about direction (encrypt or decrypt)
//        =1                  - encrypt
//        =2                  - decrypt
//   -modal=true              - use modal dialog
//   -cryptor="AES256"        - encryption algorithm: "AES256", "Blowfish", "Twofish" or "Serpent"
//                              (or combination like "AES256+Twofish")
//   -iterations="600-850"    - iterations for PBKDF2, 33 ... 65535 (due to encode method)
//                              (more == better, but JScript implementation is very slow)
//   -saltLength="8-16"       - length of "salt" string
//   -maxLineWidth=75         - split output to lines with fixed width (0 to disable)
//   -showPassword=true       - force show or hide password
//   -onlySelected=true       - use only selected text
//   -warningTime=4000        - show warning for slow calculations (0 to disable)
//   -focusPass=true          - focus password field instead of radio buttons/comboboxes
//   -test=true               - run tests
//   -testSpeed=true          - test performance
//   -saveOptions=0           - don't store options
//               =1           - (default) save options after encryption/decryption
//               =2           - save options on exit
//   -savePosition=true       - store last window position
//   -noAutoSave=true         - (default) automatically disable and re-enable SaveFile::AutoSave plugin
//              =false        - don't handle SaveFile::AutoSave plugin

// Usage:
//   Call("Scripts::Main", 1, "crypt.js")
//   Call("Scripts::Main", 1, "crypt.js", "-mode=1 -cryptor='AES256'")     - encrypt
//   Call("Scripts::Main", 1, "crypt.js", "-mode=2 -cryptor='AES256'")     - decrypt
//   Call("Scripts::Main", 1, "crypt.js", "-mode=0 -maxLineWidth=0 -showPassword=true -saveOptions=0")
//===================

// Wrapper for AkelPad.Include()
if(!cryptorsArgs)
	var cryptorsArgs = {};
(function() {
var overrideArgs = cryptorsArgs;

function _localize(s) {
	var strings = {
		"Nothing to encrypt!": {
			ru: "Нечего зашифровывать!"
		},
		"Nothing to decrypt!": {
			ru: "Нечего расшифровывать!"
		},
		"No text selected!": {
			ru: "Отсутствует выделенный текст!"
		},
		"Cryptor “%S” not found!": {
			ru: "Шифратор «%S» не найден!"
		},
		"Impossible to decrypt: invalid format!": {
			ru: "Невозможно расшифровать: некорректный формат!"
		},
		"Required time: %S (estimate)\nContinue?\n\nNote: hashing time isn't included.": {
			ru: "Требуется времени: %S (оценочно)\n Продолжить?\n\nПримечание: время хэширования не учитывалось."
		},
		"Passwords do not match!": {
			ru: "Пароли не совпадают!"
		},

		"Unicode ⇒ UTF-8": {
			ru: "Юникод ⇒ UTF-8"
		},
		"hashing": {
			ru: "хэширование"
		},
		"hashing-%S": {
			ru: "хэширование-%S"
		},
		"encryption": {
			ru: "шифрование"
		},
		"encryption-%S": {
			ru: "шифрование-%S"
		},
		"decryption": {
			ru: "расшифровывание"
		},
		"decryption-%S": {
			ru: "расшифровывание-%S"
		},
		"text ⇒ base64": {
			ru: "Текст ⇒ base64"
		},
		"base64 ⇒ text": {
			ru: "base64 ⇒ текст"
		},

		"Direction": {
			ru: "Направление"
		},
		"&Encrypt": {
			ru: "&Зашифровать"
		},
		"&Decrypt": {
			ru: "&Расшифровать"
		},
		"Encrypt": {
			ru: "Зашифровать"
		},
		"Decrypt": {
			ru: "Расшифровать"
		},
		"Encryption algorithm": {
			ru: "Алгоритм шифрования"
		},
		"Password": {
			ru: "Пароль"
		},
		"Enter &password:": {
			ru: "Введите &пароль:"
		},
		"Reenter p&assword:": {
			ru: "Повторите п&ароль:"
		},
		"Reenter p&assword: [passwords do not match!]": {
			ru: "Повторите п&ароль: [пароли не совпадают!]"
		},
		"&Show password": {
			ru: "По&казывать пароль"
		},
		"OK": {
			ru: "ОК"
		},
		"Apply": {
			ru: "Применить"
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
	return _localize(s);
}

var MODE_USER_SELECT = 0;
var MODE_ENCRYPT     = 1;
var MODE_DECRYPT     = 2;

// Read arguments:
// getArg(argName, defaultValue)
var mode                = getArg("mode", MODE_USER_SELECT);
var modalDlg            = getArg("modal", false);
var cryptor             = getArg("cryptor", "").toLowerCase();
var iterations          = getArg("iterations", "600-850");
var saltLength          = getArg("saltLength", "8-16");
var maxLineWidth        = getArg("maxLineWidth", 75);
var showPassword        = getArg("showPassword");
var onlySelected        = getArg("onlySelected", false);
var warningTime         = getArg("warningTime", 4000);
var focusPass           = getArg("focusPass", true);
var test                = getArg("test");
var testSpeed           = getArg("testSpeed");
var saveOptions         = getArg("saveOptions", 1);
var savePosition        = getArg("savePosition", true);
var noAutoSave          = getArg("noAutoSave", true);

var isDecrypt = mode == MODE_DECRYPT;
iterations = ("" + iterations).split("-");
var pbkdf2IterationsMin = +iterations[0];
var pbkdf2IterationsMax = +iterations[1] || pbkdf2IterationsMin;
saltLength = ("" + saltLength).split("-");
var saltLengthMin = +saltLength[0];
var saltLengthMax = +saltLength[1] || saltLengthMin;


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
Aes.Ctr.encrypt = function(plaintext, password, nBits, raw) {
  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  if (nBits != 128 && nBits != 192 && nBits != 256) // standard allows 128/192/256 bit keys
    throw "AES: wrong nBits argument: " + nBits;
  if (!raw) {
    plaintext = Utf8.encode(plaintext);
    password = Utf8.encode(password);
  }
  //var t = new Date();  // timer

  // use AES itself to encrypt password to get cipher key (using plain password as source for key
  // expansion) - gives us well encrypted key
  var nBytes = nBits/8;  // no bytes in key
  var pwBytes = new Array(nBytes);
  for (var i=0; i<nBytes; ++i) {
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
  for (var i=0; i<4; ++i) counterBlock[i] = (nonceSec >>> i*8) & 0xff;
  for (var i=0; i<4; ++i) counterBlock[i+4] = nonceMs & 0xff;
  // and convert it to a string to go on the front of the ciphertext
  var ctrTxt = '';
  for (var i=0; i<8; ++i) ctrTxt += String.fromCharCode(counterBlock[i]);

  // generate key schedule - an expansion of the key into distinct Key Rounds for each round
  var keySchedule = Aes.keyExpansion(key);

  var blockCount = Math.ceil(plaintext.length/blockSize);
  var ciphertxt = new Array(blockCount);  // ciphertext as array of strings

  for (var b=0; b<blockCount; ++b) {
    // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
    // done in two stages for 32-bit ops: using two words allows us to go past 2^32 blocks (68GB)
    for (var c=0; c<4; ++c) counterBlock[15-c] = (b >>> c*8) & 0xff;
    for (var c=0; c<4; ++c) counterBlock[15-c-4] = (b/0x100000000 >>> c*8)

    var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // -- encrypt counter block --

    // block size is reduced on final block
    var blockLength = b<blockCount-1 ? blockSize : (plaintext.length-1)%blockSize+1;
    var cipherChar = new Array(blockLength);

    for (var i=0; i<blockLength; ++i) {  // -- xor plaintext with ciphered counter char-by-char --
      cipherChar[i] = cipherCntr[i] ^ plaintext.charCodeAt(b*blockSize+i);
      cipherChar[i] = String.fromCharCode(cipherChar[i]);
    }
    ciphertxt[b] = cipherChar.join('');
  }

  // Array.join is more efficient than repeated string concatenation in IE
  var ciphertext = ctrTxt + ciphertxt.join('');
  //ciphertext = Base64.encode(ciphertext);  // encode in base64

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
Aes.Ctr.decrypt = function(ciphertext, password, nBits, raw) {
  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  if (nBits != 128 && nBits != 192 && nBits != 256) // standard allows 128/192/256 bit keys
    throw "AES: wrong nBits argument: " + nBits;
  //ciphertext = Base64.decode(ciphertext);
  if (!raw) password = Utf8.encode(password);
  //var t = new Date();  // timer

  // use AES to encrypt password (mirroring encrypt routine)
  var nBytes = nBits/8;  // no bytes in key
  var pwBytes = new Array(nBytes);
  for (var i=0; i<nBytes; ++i) {
    pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
  }
  var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes));
  key = key.concat(key.slice(0, nBytes-16));  // expand key to 16/24/32 bytes long

  // recover nonce from 1st 8 bytes of ciphertext
  var counterBlock = new Array(8);
  ctrTxt = ciphertext.slice(0, 8);
  for (var i=0; i<8; ++i) counterBlock[i] = ctrTxt.charCodeAt(i);

  // generate key schedule
  var keySchedule = Aes.keyExpansion(key);

  // separate ciphertext into blocks (skipping past initial 8 bytes)
  var nBlocks = Math.ceil((ciphertext.length-8) / blockSize);
  var ct = new Array(nBlocks);
  for (var b=0; b<nBlocks; ++b) ct[b] = ciphertext.slice(8+b*blockSize, 8+b*blockSize+blockSize);
  ciphertext = ct;  // ciphertext is now array of block-length strings

  // plaintext will get generated block-by-block into array of block-length strings
  var plaintxt = new Array(ciphertext.length);

  for (var b=0; b<nBlocks; ++b) {
    // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
    for (var c=0; c<4; ++c) counterBlock[15-c] = ((b) >>> c*8) & 0xff;
    for (var c=0; c<4; ++c) counterBlock[15-c-4] = (((b+1)/0x100000000-1) >>> c*8) & 0xff;

    var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // encrypt counter block

	var len = ciphertext[b].length;
    var plaintxtByte = new Array(len);
    for (var i=0; i<len; ++i) {
      // -- xor plaintxt with ciphered counter byte-by-byte --
      plaintxtByte[i] = cipherCntr[i] ^ ciphertext[b].charCodeAt(i);
      plaintxtByte[i] = String.fromCharCode(plaintxtByte[i]);
    }
    plaintxt[b] = plaintxtByte.join('');
  }

  // join array of blocks into single plaintext string
  var plaintext = plaintxt.join('');
  if (!raw) plaintext = Utf8.decode(plaintext);  // decode from UTF8 back to Unicode multi-byte chars

  //alert((new Date()) - t);
  return plaintext;
}

function aesRawEncrypt(text, pass) {
	return Aes.Ctr.encrypt(text, pass, 256, true);
}
function aesRawDecrypt(text, pass) {
	return Aes.Ctr.decrypt(text, pass, 256, true);
}


//===================

function trimBase64String(str) {
	// Note: 1) single ^a|b|c$ RegExp is very slow, 2) [\n\r] faster than \n|\r
	return str
		.replace(/^\s+/, "")
		.replace(/[\n\r]/g, "")
		.replace(/[\s\x00]+$/, "");
}
function isBase64(str) {
	return str.length % 4 == 0 && !/[^a-zA-Z0-9+\/]/.test(str.replace(/=+$/, ""));
}
var base64 = {
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode: function (input, utf8Encode) {
		//if(utf8Encode === true)
		//input = convertFromUnicode(input, cp);
		input = Utf8.encode(input);

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

		return output;
	},
	decode: function (input, utf8Decode) {
		input = trimBase64String(input);
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
		//if(utf8Decode === true)
		//output = convertToUnicode(output, cp);
		output = Utf8.decode(output);
		return output;
	}
};

//===================

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

//===================

// http://www.farfarfar.com/scripts/encrypt/
function strToBytes(str) {
	var ar = [];
	var len = str.length;
	var i = 0;
	var j = 0;
	do {
		ar[j++] = str.charCodeAt(i++);
	} while (i < len);
	return ar;
}
function addPadding(str, divisible) {
	// http://www.di-mgt.com.au/cryptopad.html
	var len = str.length;
	if(len % divisible == 0)
		return str;
	var paddingLen = divisible - (len % divisible);
	//var paddingChar = String.fromCharCode(paddingLen);
	for(var i = 1; i < paddingLen; ++i)
		str += "\x00";
	str += String.fromCharCode(paddingLen);
	return str;
}
function removePadding(str, divisible) {
	var len = str.length;
	var paddingLen = str.charCodeAt(len - 1);
	for(var i = 1; i < paddingLen; ++i)
		if(str.charCodeAt(len - 1 - i) != 0)
			return str; // Bad padding
	return str.slice(0, -paddingLen);
	//if(str.length % divisible != 0)
	//	return str; // Bad padding
	//return str.replace(new RegExp("\x00{1," + (divisible - 1) + "}$"), "");
}
function strToBigEndianArray(str) {
	var charBit = 8;
	var x = [];
	var mask = (1 << charBit) - 1;
	var len = str.length;
	var i = 0;
	for (var j = 0; j < len; i += charBit) {
		x[i >> 5] |= (str.charCodeAt(j++) & mask) << (32 - charBit - (i & 0x1f));
	}
	return x;
}
function hexToStr(str) {
	var stringHex = "0123456789abcdef";
	var out = "";
	var len = str.length;
	str = str.toLowerCase();
	if ((len % 2) == 1) {
		str += "0";
	}
	for (var i = 0; i < len; i += 2) {
		var s1 = str.substr(i, 1);
		var s2 = str.substr(i + 1, 1);
		var index1 = stringHex.indexOf(s1);
		var index2 = stringHex.indexOf(s2);
		if (index1 == -1 || index2 == -1) {
			throw "Hex invalid";
		}
		var val = (index1 << 4) | index2;
		out += "" + String.fromCharCode(parseInt(val));
	}
	return out;
}
function bigEndianArrayToHex(ar) {
	var charHex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
	var str = "";
	var len = ar.length;
	for (var i = 0, tmp = len << 2; i < tmp; i++) {
		str += charHex[((ar[i >> 2] >> (((3 - (i & 3)) << 3) + 4)) & 0xF)]
			+ charHex[((ar[i >> 2] >> ((3 - (i & 3)) << 3)) & 0xF)];
	}
	return str.toUpperCase();
}
var Blowfish = function () {
	this.n = 16;
	this.pArray = [];
	this.s_box = [];
};
Blowfish.prototype.resetKey = function () {
	this.pArray = [
		0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 0xa4093822, 0x299f31d0,
		0x082efa98, 0xec4e6c89, 0x452821e6, 0x38d01377, 0xbe5466cf, 0x34e90c6c,
		0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917, 0x9216d5d9, 0x8979fb1b
	];
	this.sBox = [
		[
			0xd1310ba6, 0x98dfb5ac, 0x2ffd72db, 0xd01adfb7, 0xb8e1afed, 0x6a267e96,
			0xba7c9045, 0xf12c7f99, 0x24a19947, 0xb3916cf7, 0x0801f2e2, 0x858efc16,
			0x636920d8, 0x71574e69, 0xa458fea3, 0xf4933d7e, 0x0d95748f, 0x728eb658,
			0x718bcd58, 0x82154aee, 0x7b54a41d, 0xc25a59b5, 0x9c30d539, 0x2af26013,
			0xc5d1b023, 0x286085f0, 0xca417918, 0xb8db38ef, 0x8e79dcb0, 0x603a180e,
			0x6c9e0e8b, 0xb01e8a3e, 0xd71577c1, 0xbd314b27, 0x78af2fda, 0x55605c60,
			0xe65525f3, 0xaa55ab94, 0x57489862, 0x63e81440, 0x55ca396a, 0x2aab10b6,
			0xb4cc5c34, 0x1141e8ce, 0xa15486af, 0x7c72e993, 0xb3ee1411, 0x636fbc2a,
			0x2ba9c55d, 0x741831f6, 0xce5c3e16, 0x9b87931e, 0xafd6ba33, 0x6c24cf5c,
			0x7a325381, 0x28958677, 0x3b8f4898, 0x6b4bb9af, 0xc4bfe81b, 0x66282193,
			0x61d809cc, 0xfb21a991, 0x487cac60, 0x5dec8032, 0xef845d5d, 0xe98575b1,
			0xdc262302, 0xeb651b88, 0x23893e81, 0xd396acc5, 0x0f6d6ff3, 0x83f44239,
			0x2e0b4482, 0xa4842004, 0x69c8f04a, 0x9e1f9b5e, 0x21c66842, 0xf6e96c9a,
			0x670c9c61, 0xabd388f0, 0x6a51a0d2, 0xd8542f68, 0x960fa728, 0xab5133a3,
			0x6eef0b6c, 0x137a3be4, 0xba3bf050, 0x7efb2a98, 0xa1f1651d, 0x39af0176,
			0x66ca593e, 0x82430e88, 0x8cee8619, 0x456f9fb4, 0x7d84a5c3, 0x3b8b5ebe,
			0xe06f75d8, 0x85c12073, 0x401a449f, 0x56c16aa6, 0x4ed3aa62, 0x363f7706,
			0x1bfedf72, 0x429b023d, 0x37d0d724, 0xd00a1248, 0xdb0fead3, 0x49f1c09b,
			0x075372c9, 0x80991b7b, 0x25d479d8, 0xf6e8def7, 0xe3fe501a, 0xb6794c3b,
			0x976ce0bd, 0x04c006ba, 0xc1a94fb6, 0x409f60c4, 0x5e5c9ec2, 0x196a2463,
			0x68fb6faf, 0x3e6c53b5, 0x1339b2eb, 0x3b52ec6f, 0x6dfc511f, 0x9b30952c,
			0xcc814544, 0xaf5ebd09, 0xbee3d004, 0xde334afd, 0x660f2807, 0x192e4bb3,
			0xc0cba857, 0x45c8740f, 0xd20b5f39, 0xb9d3fbdb, 0x5579c0bd, 0x1a60320a,
			0xd6a100c6, 0x402c7279, 0x679f25fe, 0xfb1fa3cc, 0x8ea5e9f8, 0xdb3222f8,
			0x3c7516df, 0xfd616b15, 0x2f501ec8, 0xad0552ab, 0x323db5fa, 0xfd238760,
			0x53317b48, 0x3e00df82, 0x9e5c57bb, 0xca6f8ca0, 0x1a87562e, 0xdf1769db,
			0xd542a8f6, 0x287effc3, 0xac6732c6, 0x8c4f5573, 0x695b27b0, 0xbbca58c8,
			0xe1ffa35d, 0xb8f011a0, 0x10fa3d98, 0xfd2183b8, 0x4afcb56c, 0x2dd1d35b,
			0x9a53e479, 0xb6f84565, 0xd28e49bc, 0x4bfb9790, 0xe1ddf2da, 0xa4cb7e33,
			0x62fb1341, 0xcee4c6e8, 0xef20cada, 0x36774c01, 0xd07e9efe, 0x2bf11fb4,
			0x95dbda4d, 0xae909198, 0xeaad8e71, 0x6b93d5a0, 0xd08ed1d0, 0xafc725e0,
			0x8e3c5b2f, 0x8e7594b7, 0x8ff6e2fb, 0xf2122b64, 0x8888b812, 0x900df01c,
			0x4fad5ea0, 0x688fc31c, 0xd1cff191, 0xb3a8c1ad, 0x2f2f2218, 0xbe0e1777,
			0xea752dfe, 0x8b021fa1, 0xe5a0cc0f, 0xb56f74e8, 0x18acf3d6, 0xce89e299,
			0xb4a84fe0, 0xfd13e0b7, 0x7cc43b81, 0xd2ada8d9, 0x165fa266, 0x80957705,
			0x93cc7314, 0x211a1477, 0xe6ad2065, 0x77b5fa86, 0xc75442f5, 0xfb9d35cf,
			0xebcdaf0c, 0x7b3e89a0, 0xd6411bd3, 0xae1e7e49, 0x00250e2d, 0x2071b35e,
			0x226800bb, 0x57b8e0af, 0x2464369b, 0xf009b91e, 0x5563911d, 0x59dfa6aa,
			0x78c14389, 0xd95a537f, 0x207d5ba2, 0x02e5b9c5, 0x83260376, 0x6295cfa9,
			0x11c81968, 0x4e734a41, 0xb3472dca, 0x7b14a94a, 0x1b510052, 0x9a532915,
			0xd60f573f, 0xbc9bc6e4, 0x2b60a476, 0x81e67400, 0x08ba6fb5, 0x571be91f,
			0xf296ec6b, 0x2a0dd915, 0xb6636521, 0xe7b9f9b6, 0xff34052e, 0xc5855664,
			0x53b02d5d, 0xa99f8fa1, 0x08ba4799, 0x6e85076a
		],
		[
			0x4b7a70e9, 0xb5b32944, 0xdb75092e, 0xc4192623, 0xad6ea6b0, 0x49a7df7d,
			0x9cee60b8, 0x8fedb266, 0xecaa8c71, 0x699a17ff, 0x5664526c, 0xc2b19ee1,
			0x193602a5, 0x75094c29, 0xa0591340, 0xe4183a3e, 0x3f54989a, 0x5b429d65,
			0x6b8fe4d6, 0x99f73fd6, 0xa1d29c07, 0xefe830f5, 0x4d2d38e6, 0xf0255dc1,
			0x4cdd2086, 0x8470eb26, 0x6382e9c6, 0x021ecc5e, 0x09686b3f, 0x3ebaefc9,
			0x3c971814, 0x6b6a70a1, 0x687f3584, 0x52a0e286, 0xb79c5305, 0xaa500737,
			0x3e07841c, 0x7fdeae5c, 0x8e7d44ec, 0x5716f2b8, 0xb03ada37, 0xf0500c0d,
			0xf01c1f04, 0x0200b3ff, 0xae0cf51a, 0x3cb574b2, 0x25837a58, 0xdc0921bd,
			0xd19113f9, 0x7ca92ff6, 0x94324773, 0x22f54701, 0x3ae5e581, 0x37c2dadc,
			0xc8b57634, 0x9af3dda7, 0xa9446146, 0x0fd0030e, 0xecc8c73e, 0xa4751e41,
			0xe238cd99, 0x3bea0e2f, 0x3280bba1, 0x183eb331, 0x4e548b38, 0x4f6db908,
			0x6f420d03, 0xf60a04bf, 0x2cb81290, 0x24977c79, 0x5679b072, 0xbcaf89af,
			0xde9a771f, 0xd9930810, 0xb38bae12, 0xdccf3f2e, 0x5512721f, 0x2e6b7124,
			0x501adde6, 0x9f84cd87, 0x7a584718, 0x7408da17, 0xbc9f9abc, 0xe94b7d8c,
			0xec7aec3a, 0xdb851dfa, 0x63094366, 0xc464c3d2, 0xef1c1847, 0x3215d908,
			0xdd433b37, 0x24c2ba16, 0x12a14d43, 0x2a65c451, 0x50940002, 0x133ae4dd,
			0x71dff89e, 0x10314e55, 0x81ac77d6, 0x5f11199b, 0x043556f1, 0xd7a3c76b,
			0x3c11183b, 0x5924a509, 0xf28fe6ed, 0x97f1fbfa, 0x9ebabf2c, 0x1e153c6e,
			0x86e34570, 0xeae96fb1, 0x860e5e0a, 0x5a3e2ab3, 0x771fe71c, 0x4e3d06fa,
			0x2965dcb9, 0x99e71d0f, 0x803e89d6, 0x5266c825, 0x2e4cc978, 0x9c10b36a,
			0xc6150eba, 0x94e2ea78, 0xa5fc3c53, 0x1e0a2df4, 0xf2f74ea7, 0x361d2b3d,
			0x1939260f, 0x19c27960, 0x5223a708, 0xf71312b6, 0xebadfe6e, 0xeac31f66,
			0xe3bc4595, 0xa67bc883, 0xb17f37d1, 0x018cff28, 0xc332ddef, 0xbe6c5aa5,
			0x65582185, 0x68ab9802, 0xeecea50f, 0xdb2f953b, 0x2aef7dad, 0x5b6e2f84,
			0x1521b628, 0x29076170, 0xecdd4775, 0x619f1510, 0x13cca830, 0xeb61bd96,
			0x0334fe1e, 0xaa0363cf, 0xb5735c90, 0x4c70a239, 0xd59e9e0b, 0xcbaade14,
			0xeecc86bc, 0x60622ca7, 0x9cab5cab, 0xb2f3846e, 0x648b1eaf, 0x19bdf0ca,
			0xa02369b9, 0x655abb50, 0x40685a32, 0x3c2ab4b3, 0x319ee9d5, 0xc021b8f7,
			0x9b540b19, 0x875fa099, 0x95f7997e, 0x623d7da8, 0xf837889a, 0x97e32d77,
			0x11ed935f, 0x16681281, 0x0e358829, 0xc7e61fd6, 0x96dedfa1, 0x7858ba99,
			0x57f584a5, 0x1b227263, 0x9b83c3ff, 0x1ac24696, 0xcdb30aeb, 0x532e3054,
			0x8fd948e4, 0x6dbc3128, 0x58ebf2ef, 0x34c6ffea, 0xfe28ed61, 0xee7c3c73,
			0x5d4a14d9, 0xe864b7e3, 0x42105d14, 0x203e13e0, 0x45eee2b6, 0xa3aaabea,
			0xdb6c4f15, 0xfacb4fd0, 0xc742f442, 0xef6abbb5, 0x654f3b1d, 0x41cd2105,
			0xd81e799e, 0x86854dc7, 0xe44b476a, 0x3d816250, 0xcf62a1f2, 0x5b8d2646,
			0xfc8883a0, 0xc1c7b6a3, 0x7f1524c3, 0x69cb7492, 0x47848a0b, 0x5692b285,
			0x095bbf00, 0xad19489d, 0x1462b174, 0x23820e00, 0x58428d2a, 0x0c55f5ea,
			0x1dadf43e, 0x233f7061, 0x3372f092, 0x8d937e41, 0xd65fecf1, 0x6c223bdb,
			0x7cde3759, 0xcbee7460, 0x4085f2a7, 0xce77326e, 0xa6078084, 0x19f8509e,
			0xe8efd855, 0x61d99735, 0xa969a7aa, 0xc50c06c2, 0x5a04abfc, 0x800bcadc,
			0x9e447a2e, 0xc3453484, 0xfdd56705, 0x0e1e9ec9, 0xdb73dbd3, 0x105588cd,
			0x675fda79, 0xe3674340, 0xc5c43465, 0x713e38d8, 0x3d28f89e, 0xf16dff20,
			0x153e21e7, 0x8fb03d4a, 0xe6e39f2b, 0xdb83adf7
		],
		[
			0xe93d5a68, 0x948140f7, 0xf64c261c, 0x94692934, 0x411520f7, 0x7602d4f7,
			0xbcf46b2e, 0xd4a20068, 0xd4082471, 0x3320f46a, 0x43b7d4b7, 0x500061af,
			0x1e39f62e, 0x97244546, 0x14214f74, 0xbf8b8840, 0x4d95fc1d, 0x96b591af,
			0x70f4ddd3, 0x66a02f45, 0xbfbc09ec, 0x03bd9785, 0x7fac6dd0, 0x31cb8504,
			0x96eb27b3, 0x55fd3941, 0xda2547e6, 0xabca0a9a, 0x28507825, 0x530429f4,
			0x0a2c86da, 0xe9b66dfb, 0x68dc1462, 0xd7486900, 0x680ec0a4, 0x27a18dee,
			0x4f3ffea2, 0xe887ad8c, 0xb58ce006, 0x7af4d6b6, 0xaace1e7c, 0xd3375fec,
			0xce78a399, 0x406b2a42, 0x20fe9e35, 0xd9f385b9, 0xee39d7ab, 0x3b124e8b,
			0x1dc9faf7, 0x4b6d1856, 0x26a36631, 0xeae397b2, 0x3a6efa74, 0xdd5b4332,
			0x6841e7f7, 0xca7820fb, 0xfb0af54e, 0xd8feb397, 0x454056ac, 0xba489527,
			0x55533a3a, 0x20838d87, 0xfe6ba9b7, 0xd096954b, 0x55a867bc, 0xa1159a58,
			0xcca92963, 0x99e1db33, 0xa62a4a56, 0x3f3125f9, 0x5ef47e1c, 0x9029317c,
			0xfdf8e802, 0x04272f70, 0x80bb155c, 0x05282ce3, 0x95c11548, 0xe4c66d22,
			0x48c1133f, 0xc70f86dc, 0x07f9c9ee, 0x41041f0f, 0x404779a4, 0x5d886e17,
			0x325f51eb, 0xd59bc0d1, 0xf2bcc18f, 0x41113564, 0x257b7834, 0x602a9c60,
			0xdff8e8a3, 0x1f636c1b, 0x0e12b4c2, 0x02e1329e, 0xaf664fd1, 0xcad18115,
			0x6b2395e0, 0x333e92e1, 0x3b240b62, 0xeebeb922, 0x85b2a20e, 0xe6ba0d99,
			0xde720c8c, 0x2da2f728, 0xd0127845, 0x95b794fd, 0x647d0862, 0xe7ccf5f0,
			0x5449a36f, 0x877d48fa, 0xc39dfd27, 0xf33e8d1e, 0x0a476341, 0x992eff74,
			0x3a6f6eab, 0xf4f8fd37, 0xa812dc60, 0xa1ebddf8, 0x991be14c, 0xdb6e6b0d,
			0xc67b5510, 0x6d672c37, 0x2765d43b, 0xdcd0e804, 0xf1290dc7, 0xcc00ffa3,
			0xb5390f92, 0x690fed0b, 0x667b9ffb, 0xcedb7d9c, 0xa091cf0b, 0xd9155ea3,
			0xbb132f88, 0x515bad24, 0x7b9479bf, 0x763bd6eb, 0x37392eb3, 0xcc115979,
			0x8026e297, 0xf42e312d, 0x6842ada7, 0xc66a2b3b, 0x12754ccc, 0x782ef11c,
			0x6a124237, 0xb79251e7, 0x06a1bbe6, 0x4bfb6350, 0x1a6b1018, 0x11caedfa,
			0x3d25bdd8, 0xe2e1c3c9, 0x44421659, 0x0a121386, 0xd90cec6e, 0xd5abea2a,
			0x64af674e, 0xda86a85f, 0xbebfe988, 0x64e4c3fe, 0x9dbc8057, 0xf0f7c086,
			0x60787bf8, 0x6003604d, 0xd1fd8346, 0xf6381fb0, 0x7745ae04, 0xd736fccc,
			0x83426b33, 0xf01eab71, 0xb0804187, 0x3c005e5f, 0x77a057be, 0xbde8ae24,
			0x55464299, 0xbf582e61, 0x4e58f48f, 0xf2ddfda2, 0xf474ef38, 0x8789bdc2,
			0x5366f9c3, 0xc8b38e74, 0xb475f255, 0x46fcd9b9, 0x7aeb2661, 0x8b1ddf84,
			0x846a0e79, 0x915f95e2, 0x466e598e, 0x20b45770, 0x8cd55591, 0xc902de4c,
			0xb90bace1, 0xbb8205d0, 0x11a86248, 0x7574a99e, 0xb77f19b6, 0xe0a9dc09,
			0x662d09a1, 0xc4324633, 0xe85a1f02, 0x09f0be8c, 0x4a99a025, 0x1d6efe10,
			0x1ab93d1d, 0x0ba5a4df, 0xa186f20f, 0x2868f169, 0xdcb7da83, 0x573906fe,
			0xa1e2ce9b, 0x4fcd7f52, 0x50115e01, 0xa70683fa, 0xa002b5c4, 0x0de6d027,
			0x9af88c27, 0x773f8641, 0xc3604c06, 0x61a806b5, 0xf0177a28, 0xc0f586e0,
			0x006058aa, 0x30dc7d62, 0x11e69ed7, 0x2338ea63, 0x53c2dd94, 0xc2c21634,
			0xbbcbee56, 0x90bcb6de, 0xebfc7da1, 0xce591d76, 0x6f05e409, 0x4b7c0188,
			0x39720a3d, 0x7c927c24, 0x86e3725f, 0x724d9db9, 0x1ac15bb4, 0xd39eb8fc,
			0xed545578, 0x08fca5b5, 0xd83d7cd3, 0x4dad0fc4, 0x1e50ef5e, 0xb161e6f8,
			0xa28514d9, 0x6c51133c, 0x6fd5c7e7, 0x56e14ec4, 0x362abfce, 0xddc6c837,
			0xd79a3234, 0x92638212, 0x670efa8e, 0x406000e0
		],
		[
			0x3a39ce37, 0xd3faf5cf, 0xabc27737, 0x5ac52d1b, 0x5cb0679e, 0x4fa33742,
			0xd3822740, 0x99bc9bbe, 0xd5118e9d, 0xbf0f7315, 0xd62d1c7e, 0xc700c47b,
			0xb78c1b6b, 0x21a19045, 0xb26eb1be, 0x6a366eb4, 0x5748ab2f, 0xbc946e79,
			0xc6a376d2, 0x6549c2c8, 0x530ff8ee, 0x468dde7d, 0xd5730a1d, 0x4cd04dc6,
			0x2939bbdb, 0xa9ba4650, 0xac9526e8, 0xbe5ee304, 0xa1fad5f0, 0x6a2d519a,
			0x63ef8ce2, 0x9a86ee22, 0xc089c2b8, 0x43242ef6, 0xa51e03aa, 0x9cf2d0a4,
			0x83c061ba, 0x9be96a4d, 0x8fe51550, 0xba645bd6, 0x2826a2f9, 0xa73a3ae1,
			0x4ba99586, 0xef5562e9, 0xc72fefd3, 0xf752f7da, 0x3f046f69, 0x77fa0a59,
			0x80e4a915, 0x87b08601, 0x9b09e6ad, 0x3b3ee593, 0xe990fd5a, 0x9e34d797,
			0x2cf0b7d9, 0x022b8b51, 0x96d5ac3a, 0x017da67d, 0xd1cf3ed6, 0x7c7d2d28,
			0x1f9f25cf, 0xadf2b89b, 0x5ad6b472, 0x5a88f54c, 0xe029ac71, 0xe019a5e6,
			0x47b0acfd, 0xed93fa9b, 0xe8d3c48d, 0x283b57cc, 0xf8d56629, 0x79132e28,
			0x785f0191, 0xed756055, 0xf7960e44, 0xe3d35e8c, 0x15056dd4, 0x88f46dba,
			0x03a16125, 0x0564f0bd, 0xc3eb9e15, 0x3c9057a2, 0x97271aec, 0xa93a072a,
			0x1b3f6d9b, 0x1e6321f5, 0xf59c66fb, 0x26dcf319, 0x7533d928, 0xb155fdf5,
			0x03563482, 0x8aba3cbb, 0x28517711, 0xc20ad9f8, 0xabcc5167, 0xccad925f,
			0x4de81751, 0x3830dc8e, 0x379d5862, 0x9320f991, 0xea7a90c2, 0xfb3e7bce,
			0x5121ce64, 0x774fbe32, 0xa8b6e37e, 0xc3293d46, 0x48de5369, 0x6413e680,
			0xa2ae0810, 0xdd6db224, 0x69852dfd, 0x09072166, 0xb39a460a, 0x6445c0dd,
			0x586cdecf, 0x1c20c8ae, 0x5bbef7dd, 0x1b588d40, 0xccd2017f, 0x6bb4e3bb,
			0xdda26a7e, 0x3a59ff45, 0x3e350a44, 0xbcb4cdd5, 0x72eacea8, 0xfa6484bb,
			0x8d6612ae, 0xbf3c6f47, 0xd29be463, 0x542f5d9e, 0xaec2771b, 0xf64e6370,
			0x740e0d8d, 0xe75b1357, 0xf8721671, 0xaf537d5d, 0x4040cb08, 0x4eb4e2cc,
			0x34d2466a, 0x0115af84, 0xe1b00428, 0x95983a1d, 0x06b89fb4, 0xce6ea048,
			0x6f3f3b82, 0x3520ab82, 0x011a1d4b, 0x277227f8, 0x611560b1, 0xe7933fdc,
			0xbb3a792b, 0x344525bd, 0xa08839e1, 0x51ce794b, 0x2f32c9b7, 0xa01fbac9,
			0xe01cc87e, 0xbcc7d1f6, 0xcf0111c3, 0xa1e8aac7, 0x1a908749, 0xd44fbd9a,
			0xd0dadecb, 0xd50ada38, 0x0339c32a, 0xc6913667, 0x8df9317c, 0xe0b12b4f,
			0xf79e59b7, 0x43f5bb3a, 0xf2d519ff, 0x27d9459c, 0xbf97222c, 0x15e6fc2a,
			0x0f91fc71, 0x9b941525, 0xfae59361, 0xceb69ceb, 0xc2a86459, 0x12baa8d1,
			0xb6c1075e, 0xe3056a0c, 0x10d25065, 0xcb03a442, 0xe0ec6e0e, 0x1698db3b,
			0x4c98a0be, 0x3278e964, 0x9f1f9532, 0xe0d392df, 0xd3a0342b, 0x8971f21e,
			0x1b0a7441, 0x4ba3348c, 0xc5be7120, 0xc37632d8, 0xdf359f8d, 0x9b992f2e,
			0xe60b6f47, 0x0fe3f11d, 0xe54cda54, 0x1edad891, 0xce6279cf, 0xcd3e7e6f,
			0x1618b166, 0xfd2c1d05, 0x848fd2c5, 0xf6fb2299, 0xf523f357, 0xa6327623,
			0x93a83531, 0x56cccd02, 0xacf08162, 0x5a75ebb5, 0x6e163697, 0x88d273cc,
			0xde966292, 0x81b949d0, 0x4c50901b, 0x71c65614, 0xe6c6c7bd, 0x327a140a,
			0x45e1d006, 0xc3f27b9a, 0xc9aa53fd, 0x62a80f00, 0xbb25bfe2, 0x35bdd2f6,
			0x71126905, 0xb2040222, 0xb6cbcf7c, 0xcd769c2b, 0x53113ec0, 0x1640e3d3,
			0x38abbd60, 0x2547adf0, 0xba38209c, 0xf746ce76, 0x77afa1c5, 0x20756060,
			0x85cbfe4e, 0x8ae88dd8, 0x7aaaf9b0, 0x4cf9aa7e, 0x1948c25c, 0x02fb8a8c,
			0x01c36ae4, 0xd6ebe1f9, 0x90d4f869, 0xa65cdea0, 0x3f09252d, 0xc208e69f,
			0xb74e6132, 0xce77e25b, 0x578fdfe3, 0x3ac372e6
		]
	];
};
Blowfish.prototype.setKey = function (key) {
	if (key.length > 56)
		//throw "Blowfish: Your key length must be between 0 and 448 bits long";
		key = key.substr(0, 56);
	this.resetKey();
	var data;
	var keys = strToBytes(key);
	var keyBytes = keys.length;
	var i = 0,
		j = 0;
	for (i = 0; i < 18; ++i) {
		data = 0x00000000;
		for (var k = 0; k < 4; ++k) {
			data = ((data << 8) | (keys[j]));
			++j;
			if (j >= keyBytes) {
				j = 0;
			}
		}
		this.pArray[i] = this.pArray[i] ^ data;
	}
	var datal = 0x00000000;
	var datar = 0x00000000;
	for (i = 0; i < this.n + 2; i += 2) {
		var tmp = this.encipher(datal, datar);
		datal = tmp[0];
		datar = tmp[1];
		this.pArray[i] = datal;
		this.pArray[i + 1] = datar;
	}
	for (i = 0; i < 4; ++i) {
		for (j = 0; j < 256; j += 2) {
			var tmp = this.encipher(datal, datar);
			datal = tmp[0];
			datar = tmp[1];
			this.sBox[i][j] = datal;
			this.sBox[i][j + 1] = datar;
		}
	}
};
Blowfish.prototype.encrypt = function (str) {
	if (!this.pArray[0]) {
		throw "Blowfish: You must initialize a key!";
	}
	var out = [];
	str = addPadding(str, 8);
	str = strToBigEndianArray(str);
	var t = str;
	var t2;
	for (var i = 0, l = t.length; i < l; i += 2) {
		t2 = this.encipher(t[i], t[i + 1]);
		out.push(t2[0], t2[1]);
	}
	return hexToStr(bigEndianArrayToHex(out));
};
Blowfish.prototype.decrypt = function (str) {
	var out = [];
	var t = strToBigEndianArray(str);
	var t2;
	for (var i = 0, l = t.length; i < l; i += 2) {
		t2 = this.decipher(t[i], t[i + 1]);
		out.push(t2[0], t2[1]);
	}
	str = hexToStr(bigEndianArrayToHex(out));
	return removePadding(str, 8);
};
Blowfish.prototype.encipher = function (xl, xr) {
	var pArray = this.pArray;
	xl ^= pArray[0];
	xr ^= this.f(xl) ^ pArray[1];
	xl ^= this.f(xr) ^ pArray[2];
	xr ^= this.f(xl) ^ pArray[3];
	xl ^= this.f(xr) ^ pArray[4];
	xr ^= this.f(xl) ^ pArray[5];
	xl ^= this.f(xr) ^ pArray[6];
	xr ^= this.f(xl) ^ pArray[7];
	xl ^= this.f(xr) ^ pArray[8];
	xr ^= this.f(xl) ^ pArray[9];
	xl ^= this.f(xr) ^ pArray[10];
	xr ^= this.f(xl) ^ pArray[11];
	xl ^= this.f(xr) ^ pArray[12];
	xr ^= this.f(xl) ^ pArray[13];
	xl ^= this.f(xr) ^ pArray[14];
	xr ^= this.f(xl) ^ pArray[15];
	xl ^= this.f(xr);
	return [xr ^ pArray[17], xl ^ pArray[16]];
};
Blowfish.prototype.decipher = function (xl, xr) {
	var pArray = this.pArray;
	xl ^= pArray[17];
	xr ^= this.f(xl) ^ pArray[16];
	xl ^= this.f(xr) ^ pArray[15];
	xr ^= this.f(xl) ^ pArray[14];
	xl ^= this.f(xr) ^ pArray[13];
	xr ^= this.f(xl) ^ pArray[12];
	xl ^= this.f(xr) ^ pArray[11];
	xr ^= this.f(xl) ^ pArray[10];
	xl ^= this.f(xr) ^ pArray[9];
	xr ^= this.f(xl) ^ pArray[8];
	xl ^= this.f(xr) ^ pArray[7];
	xr ^= this.f(xl) ^ pArray[6];
	xl ^= this.f(xr) ^ pArray[5];
	xr ^= this.f(xl) ^ pArray[4];
	xl ^= this.f(xr) ^ pArray[3];
	xr ^= this.f(xl) ^ pArray[2];
	xl ^= this.f(xr);
	return [(xr ^ pArray[0]), xl ^ pArray[1]];
};
Blowfish.prototype.f = function (x) {
	var str = ((this.sBox[0][(x >>> 24) & 0xff] + this.sBox[1][(x >>> 16) & 0xff]) ^ this.sBox[2][(x >>> 8) & 0xff])
		+ this.sBox[3][x & 0xff];
	return str;
};

function blowfishRawEncrypt(text, pass) {
	var bf = new Blowfish();
	bf.setKey(pass);
	text = bf.encrypt(text);
	return text;
}
function blowfishRawDecrypt(text, pass) {
	var bf = new Blowfish();
	bf.setKey(pass);
	text = bf.decrypt(text);
	return text;
}

//===================

// https://github.com/bitwiseshiftleft/sjcl/ at 2012-06-18
/** @fileOverview Javascript cryptography implementation.
 *
 * Crush to remove comments, shorten variable names and
 * generally reduce transmission size.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

//"use strict";
/*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */
/*global document, window, escape, unescape */

/** @namespace The Stanford Javascript Crypto Library, top-level namespace. */
var sjcl = {
  /** @namespace Symmetric ciphers. */
  cipher: {},

  /** @namespace Hash functions.  Right now only SHA256 is implemented. */
  hash: {},

  /** @namespace Key exchange functions.  Right now only SRP is implemented. */
  keyexchange: {},

  /** @namespace Block cipher modes of operation. */
  mode: {},

  /** @namespace Miscellaneous.  HMAC and PBKDF2. */
  misc: {},

  /**
   * @namespace Bit array encoders and decoders.
   *
   * @description
   * The members of this namespace are functions which translate between
   * SJCL's bitArrays and other objects (usually strings).  Because it
   * isn't always clear which direction is encoding and which is decoding,
   * the method names are "fromBits" and "toBits".
   */
  codec: {},

  /** @namespace Exceptions. */
  exception: {
    /** @class Ciphertext is corrupt. */
    corrupt: function(message) {
      this.toString = function() { return "CORRUPT: "+this.message; };
      this.message = message;
    },

    /** @class Invalid parameter. */
    invalid: function(message) {
      this.toString = function() { return "INVALID: "+this.message; };
      this.message = message;
    },

    /** @class Bug or missing feature in SJCL. */
    bug: function(message) {
      this.toString = function() { return "BUG: "+this.message; };
      this.message = message;
    },

    /** @class Something isn't ready. */
    notReady: function(message) {
      this.toString = function() { return "NOT READY: "+this.message; };
      this.message = message;
    }
  }
};

if(typeof module != 'undefined' && module.exports){
  module.exports = sjcl;
}


/** @fileOverview Arrays of bits, encoded as arrays of Numbers.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/** @namespace Arrays of bits, encoded as arrays of Numbers.
 *
 * @description
 * <p>
 * These objects are the currency accepted by SJCL's crypto functions.
 * </p>
 *
 * <p>
 * Most of our crypto primitives operate on arrays of 4-byte words internally,
 * but many of them can take arguments that are not a multiple of 4 bytes.
 * This library encodes arrays of bits (whose size need not be a multiple of 8
 * bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
 * array of words, 32 bits at a time.  Since the words are double-precision
 * floating point numbers, they fit some extra data.  We use this (in a private,
 * possibly-changing manner) to encode the number of bits actually  present
 * in the last word of the array.
 * </p>
 *
 * <p>
 * Because bitwise ops clear this out-of-band data, these arrays can be passed
 * to ciphers like AES which want arrays of words.
 * </p>
 */
sjcl.bitArray = {
  /**
   * Array slices in units of bits.
   * @param {bitArray} a The array to slice.
   * @param {Number} bstart The offset to the start of the slice, in bits.
   * @param {Number} bend The offset to the end of the slice, in bits.  If this is undefined,
   * slice until the end of the array.
   * @return {bitArray} The requested slice.
   */
  bitSlice: function (a, bstart, bend) {
    a = sjcl.bitArray._shiftRight(a.slice(bstart/32), 32 - (bstart & 31)).slice(1);
    return (bend === undefined) ? a : sjcl.bitArray.clamp(a, bend-bstart);
  },

  /**
   * Extract a number packed into a bit array.
   * @param {bitArray} a The array to slice.
   * @param {Number} bstart The offset to the start of the slice, in bits.
   * @param {Number} length The length of the number to extract.
   * @return {Number} The requested slice.
   */
  extract: function(a, bstart, blength) {
    // FIXME: this Math.floor is not necessary at all, but for some reason
    // seems to suppress a bug in the Chromium JIT.
    var x, sh = Math.floor((-bstart-blength) & 31);
    if ((bstart + blength - 1 ^ bstart) & -32) {
      // it crosses a boundary
      x = (a[bstart/32|0] << (32 - sh)) ^ (a[bstart/32+1|0] >>> sh);
    } else {
      // within a single word
      x = a[bstart/32|0] >>> sh;
    }
    return x & ((1<<blength) - 1);
  },

  /**
   * Concatenate two bit arrays.
   * @param {bitArray} a1 The first array.
   * @param {bitArray} a2 The second array.
   * @return {bitArray} The concatenation of a1 and a2.
   */
  concat: function (a1, a2) {
    if (a1.length === 0 || a2.length === 0) {
      return a1.concat(a2);
    }

    var out, i, last = a1[a1.length-1], shift = sjcl.bitArray.getPartial(last);
    if (shift === 32) {
      return a1.concat(a2);
    } else {
      return sjcl.bitArray._shiftRight(a2, shift, last|0, a1.slice(0,a1.length-1));
    }
  },

  /**
   * Find the length of an array of bits.
   * @param {bitArray} a The array.
   * @return {Number} The length of a, in bits.
   */
  bitLength: function (a) {
    var l = a.length, x;
    if (l === 0) { return 0; }
    x = a[l - 1];
    return (l-1) * 32 + sjcl.bitArray.getPartial(x);
  },

  /**
   * Truncate an array.
   * @param {bitArray} a The array.
   * @param {Number} len The length to truncate to, in bits.
   * @return {bitArray} A new array, truncated to len bits.
   */
  clamp: function (a, len) {
    if (a.length * 32 < len) { return a; }
    a = a.slice(0, Math.ceil(len / 32));
    var l = a.length;
    len = len & 31;
    if (l > 0 && len) {
      a[l-1] = sjcl.bitArray.partial(len, a[l-1] & 0x80000000 >> (len-1), 1);
    }
    return a;
  },

  /**
   * Make a partial word for a bit array.
   * @param {Number} len The number of bits in the word.
   * @param {Number} x The bits.
   * @param {Number} [0] _end Pass 1 if x has already been shifted to the high side.
   * @return {Number} The partial word.
   */
  partial: function (len, x, _end) {
    if (len === 32) { return x; }
    return (_end ? x|0 : x << (32-len)) + len * 0x10000000000;
  },

  /**
   * Get the number of bits used by a partial word.
   * @param {Number} x The partial word.
   * @return {Number} The number of bits used by the partial word.
   */
  getPartial: function (x) {
    return Math.round(x/0x10000000000) || 32;
  },

  /**
   * Compare two arrays for equality in a predictable amount of time.
   * @param {bitArray} a The first array.
   * @param {bitArray} b The second array.
   * @return {boolean} true if a == b; false otherwise.
   */
  equal: function (a, b) {
    if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) {
      return false;
    }
    var x = 0, i;
    for (i=0; i<a.length; i++) {
      x |= a[i]^b[i];
    }
    return (x === 0);
  },

  /** Shift an array right.
   * @param {bitArray} a The array to shift.
   * @param {Number} shift The number of bits to shift.
   * @param {Number} [carry=0] A byte to carry in
   * @param {bitArray} [out=[]] An array to prepend to the output.
   * @private
   */
  _shiftRight: function (a, shift, carry, out) {
    var i, last2=0, shift2;
    if (out === undefined) { out = []; }

    for (; shift >= 32; shift -= 32) {
      out.push(carry);
      carry = 0;
    }
    if (shift === 0) {
      return out.concat(a);
    }

    for (i=0; i<a.length; i++) {
      out.push(carry | a[i]>>>shift);
      carry = a[i] << (32-shift);
    }
    last2 = a.length ? a[a.length-1] : 0;
    shift2 = sjcl.bitArray.getPartial(last2);
    out.push(sjcl.bitArray.partial(shift+shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(),1));
    return out;
  },

  /** xor a block of 4 words together.
   * @private
   */
  _xor4: function(x,y) {
    return [x[0]^y[0],x[1]^y[1],x[2]^y[2],x[3]^y[3]];
  }
};


/** @fileOverview Bit array codec implementations.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/** @namespace UTF-8 strings */
sjcl.codec.utf8String = {
  /** Convert from a bitArray to a UTF-8 string. */
  fromBits: function (arr) {
    var out = "", bl = sjcl.bitArray.bitLength(arr), i, tmp;
    for (i=0; i<bl/8; i++) {
      if ((i&3) === 0) {
        tmp = arr[i/4];
      }
      out += String.fromCharCode(tmp >>> 24);
      tmp <<= 8;
    }
    //return decodeURIComponent(escape(out));
    return Utf8.decode(out);
  },

  /** Convert from a UTF-8 string to a bitArray. */
  toBits: function (str) {
    //str = unescape(encodeURIComponent(str));
    str = Utf8.encode(str);
    var out = [], i, tmp=0;
    for (i=0; i<str.length; i++) {
      tmp = tmp << 8 | str.charCodeAt(i);
      if ((i&3) === 3) {
        out.push(tmp);
        tmp = 0;
      }
    }
    if (i&3) {
      out.push(sjcl.bitArray.partial(8*(i&3), tmp));
    }
    return out;
  }
};


/** @fileOverview Bit array codec implementations.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/** @namespace Hexadecimal */
sjcl.codec.hex = {
  /** Convert from a bitArray to a hex string. */
  fromBits: function (arr) {
    var out = "", i, x;
    for (i=0; i<arr.length; i++) {
      out += ((arr[i]|0)+0xF00000000000).toString(16).substr(4);
    }
    return out.substr(0, sjcl.bitArray.bitLength(arr)/4);//.replace(/(.{8})/g, "$1 ");
  },
  /** Convert from a hex string to a bitArray. */
  toBits: function (str) {
    var i, out=[], len;
    str = str.replace(/\s|0x/g, "");
    len = str.length;
    str = str + "00000000";
    for (i=0; i<str.length; i+=8) {
      out.push(parseInt(str.substr(i,8),16)^0);
    }
    return sjcl.bitArray.clamp(out, len*4);
  }
};


/** @fileOverview Javascript SHA-256 implementation.
 *
 * An older version of this implementation is available in the public
 * domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
 * Stanford University 2008-2010 and BSD-licensed for liability
 * reasons.
 *
 * Special thanks to Aldo Cortesi for pointing out several bugs in
 * this code.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * Context for a SHA-256 operation in progress.
 * @constructor
 * @class Secure Hash Algorithm, 256 bits.
 */
sjcl.hash.sha256 = function (hash) {
  if (!this._key[0]) { this._precompute(); }
  if (hash) {
    this._h = hash._h.slice(0);
    this._buffer = hash._buffer.slice(0);
    this._length = hash._length;
  } else {
    this.reset();
  }
};


/**
 * Hash a string or an array of words.
 * @static
 * @param {bitArray|String} data the data to hash.
 * @return {bitArray} The hash value, an array of 16 big-endian words.
 */
sjcl.hash.sha256.hash = function (data) {
  return (new sjcl.hash.sha256()).update(data).finalize();
};

sjcl.hash.sha256.prototype = {
  /**
   * The hash's block size, in bits.
   * @constant
   */
  blockSize: 512,

  /**
   * Reset the hash state.
   * @return this
   */
  reset:function () {
    this._h = this._init.slice(0);
    this._buffer = [];
    this._length = 0;
    return this;
  },

  /**
   * Input several words to the hash.
   * @param {bitArray|String} data the data to hash.
   * @return this
   */
  update: function (data) {
    if (typeof data === "string") {
      data = sjcl.codec.utf8String.toBits(data);
    }
    var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
        ol = this._length,
        nl = this._length = ol + sjcl.bitArray.bitLength(data);
    for (i = 512+ol & -512; i <= nl; i+= 512) {
      this._block(b.splice(0,16));
    }
    return this;
  },

  /**
   * Complete hashing and output the hash value.
   * @return {bitArray} The hash value, an array of 16 big-endian words.
   */
  finalize:function () {
    var i, b = this._buffer, h = this._h;

    // Round out and push the buffer
    b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1,1)]);

    // Round out the buffer to a multiple of 16 words, less the 2 length words.
    for (i = b.length + 2; i & 15; i++) {
      b.push(0);
    }

    // append the length
    b.push(Math.floor(this._length / 0x100000000));
    b.push(this._length | 0);

    while (b.length) {
      this._block(b.splice(0,16));
    }

    this.reset();
    return h;
  },

  /**
   * The SHA-256 initialization vector, to be precomputed.
   * @private
   */
  _init:[],
  /*
  _init:[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],
  */

  /**
   * The SHA-256 hash key, to be precomputed.
   * @private
   */
  _key:[],
  /*
  _key:
    [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
     0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
     0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
     0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
     0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
     0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
     0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
     0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2],
  */


  /**
   * Function to precompute _init and _key.
   * @private
   */
  _precompute: function () {
    var i = 0, prime = 2, factor;

    function frac(x) { return (x-Math.floor(x)) * 0x100000000 | 0; }

    outer: for (; i<64; prime++) {
      for (factor=2; factor*factor <= prime; factor++) {
        if (prime % factor === 0) {
          // not a prime
          continue outer;
        }
      }

      if (i<8) {
        this._init[i] = frac(Math.pow(prime, 1/2));
      }
      this._key[i] = frac(Math.pow(prime, 1/3));
      i++;
    }
  },

  /**
   * Perform one cycle of SHA-256.
   * @param {bitArray} words one block of words.
   * @private
   */
  _block:function (words) {
    var i, tmp, a, b,
      w = words.slice(0),
      h = this._h,
      k = this._key,
      h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3],
      h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];

    /* Rationale for placement of |0 :
     * If a value can overflow is original 32 bits by a factor of more than a few
     * million (2^23 ish), there is a possibility that it might overflow the
     * 53-bit mantissa and lose precision.
     *
     * To avoid this, we clamp back to 32 bits by |'ing with 0 on any value that
     * propagates around the loop, and on the hash state h[].  I don't believe
     * that the clamps on h4 and on h0 are strictly necessary, but it's close
     * (for h4 anyway), and better safe than sorry.
     *
     * The clamps on h[] are necessary for the output to be correct even in the
     * common case and for short inputs.
     */
    for (i=0; i<64; i++) {
      // load up the input word for this round
      if (i<16) {
        tmp = w[i];
      } else {
        a   = w[(i+1 ) & 15];
        b   = w[(i+14) & 15];
        tmp = w[i&15] = ((a>>>7  ^ a>>>18 ^ a>>>3  ^ a<<25 ^ a<<14) +
                         (b>>>17 ^ b>>>19 ^ b>>>10 ^ b<<15 ^ b<<13) +
                         w[i&15] + w[(i+9) & 15]) | 0;
      }

      tmp = (tmp + h7 + (h4>>>6 ^ h4>>>11 ^ h4>>>25 ^ h4<<26 ^ h4<<21 ^ h4<<7) +  (h6 ^ h4&(h5^h6)) + k[i]); // | 0;

      // shift register
      h7 = h6; h6 = h5; h5 = h4;
      h4 = h3 + tmp | 0;
      h3 = h2; h2 = h1; h1 = h0;

      h0 = (tmp +  ((h1&h2) ^ (h3&(h1^h2))) + (h1>>>2 ^ h1>>>13 ^ h1>>>22 ^ h1<<30 ^ h1<<19 ^ h1<<10)) | 0;
    }

    h[0] = h[0]+h0 | 0;
    h[1] = h[1]+h1 | 0;
    h[2] = h[2]+h2 | 0;
    h[3] = h[3]+h3 | 0;
    h[4] = h[4]+h4 | 0;
    h[5] = h[5]+h5 | 0;
    h[6] = h[6]+h6 | 0;
    h[7] = h[7]+h7 | 0;
  }
};


/** @fileOverview HMAC implementation.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/** HMAC with the specified hash function.
 * @constructor
 * @param {bitArray} key the key for HMAC.
 * @param {Object} [hash=sjcl.hash.sha256] The hash function to use.
 */
sjcl.misc.hmac = function (key, Hash) {
  this._hash = Hash = Hash || sjcl.hash.sha256;
  var exKey = [[],[]], i,
      bs = Hash.prototype.blockSize / 32;
  this._baseHash = [new Hash(), new Hash()];

  if (key.length > bs) {
    key = Hash.hash(key);
  }

  for (i=0; i<bs; i++) {
    exKey[0][i] = key[i]^0x36363636;
    exKey[1][i] = key[i]^0x5C5C5C5C;
  }

  this._baseHash[0].update(exKey[0]);
  this._baseHash[1].update(exKey[1]);
};

/** HMAC with the specified hash function.  Also called encrypt since it's a prf.
 * @param {bitArray|String} data The data to mac.
 * @param {Codec} [encoding] the encoding function to use.
 */
sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function (data, encoding) {
  var w = new (this._hash)(this._baseHash[0]).update(data, encoding).finalize();
  return new (this._hash)(this._baseHash[1]).update(w).finalize();
};


/** @fileOverview Password-based key-derivation function, version 2.0.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/** Password-Based Key-Derivation Function, version 2.0.
 *
 * Generate keys from passwords using PBKDF2-HMAC-SHA256.
 *
 * This is the method specified by RSA's PKCS #5 standard.
 *
 * @param {bitArray|String} password  The password.
 * @param {bitArray} salt The salt.  Should have lots of entropy.
 * @param {Number} [count=1000] The number of iterations.  Higher numbers make the function slower but more secure.
 * @param {Number} [length] The length of the derived key.  Defaults to the
                            output size of the hash function.
 * @param {Object} [Prff=sjcl.misc.hmac] The pseudorandom function family.
 * @return {bitArray} the derived key.
 */
sjcl.misc.pbkdf2 = function (password, salt, count, length, Prff) {
  count = count || 1000;

  if (length < 0 || count < 0) {
    throw sjcl.exception.invalid("invalid params to pbkdf2");
  }

  if (typeof password === "string") {
    password = sjcl.codec.utf8String.toBits(password);
  }
  if (typeof salt === "string") { //?
    salt = sjcl.codec.utf8String.toBits(salt);
  }

  Prff = Prff || sjcl.misc.hmac;

  var prf = new Prff(password),
      u, ui, i, j, k, out = [], b = sjcl.bitArray;

  for (k = 1; 32 * out.length < (length || 1); k++) {
    u = ui = prf.encrypt(b.concat(salt,[k]));

    for (i=1; i<count; i++) {
      ui = prf.encrypt(ui);
      for (j=0; j<ui.length; j++) {
        u[j] ^= ui[j];
      }
    }

    out = out.concat(u);
  }

  if (length) { out = b.clamp(out, length); }

  return out;
};

//===================

// http://ats.oka.nu/titaniumcore/js/crypto/Cipher.sample.html
var _scope = (function() {
var scope = {}; // See https://akelpad.sourceforge.net/forum/viewtopic.php?p=18304#p18304

/*
 * binary.js
 * Tools for creating, modifying binary data
 * including base64-encoding, base64-decoding , utf8-encoding and utf8-decoding
 * See binary.readme.txt for further information.
 *
 * Copyright(c) 2009 Atsushi Oka [ http://oka.nu/ ]
 * This script file is distributed under the LGPL
 */
function initBinary( packageRoot ) {
//    if ( packageRoot.__PACKAGE_ENABLED ) {
//        __unit( "binary.js" );
//    }

var i2a  = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
];

function base64_encode( s ) {
    var length = s.length;
    var groupCount = Math.floor( length / 3 );
    var remaining = length - 3 * groupCount;
    var result = "";

    var idx = 0;
    for (var i=0; i<groupCount; i++) {
        var b0 = s[idx++] & 0xff;
        var b1 = s[idx++] & 0xff;
        var b2 = s[idx++] & 0xff;
        result += (i2a[ b0 >> 2]);
        result += (i2a[(b0 << 4) &0x3f | (b1 >> 4)]);
        result += (i2a[(b1 << 2) &0x3f | (b2 >> 6)]);
        result += (i2a[ b2 & 0x3f]);
    }

    if ( remaining == 0 ) {
    } else if ( remaining == 1 ) {
        var b0 = s[idx++] & 0xff;
        result += ( i2a[ b0 >> 2 ] );
        result += ( i2a[ (b0 << 4) & 0x3f] );
        result += ( "==" );
    } else if ( remaining == 2 ) {
        var b0 = s[idx++] & 0xff;
        var b1 = s[idx++] & 0xff;
        result += ( i2a[ b0 >> 2 ] );
        result += ( i2a[(b0 << 4) & 0x3f | (b1 >> 4)]);
        result += ( i2a[(b1 << 2) & 0x3f ] );
        result += ('=');
    } else {
        throw "never happen";
    }
    return result;
}

var a2i = [
    -1,   -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1, -1,
    -1,   -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1, -1,
    -1,   -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  62,  -1,  -1,  -1, 63,
    52,   53,  54,  55,  56,  57,  58,  59,  60,  61,  -1,  -1,  -1,  -1,  -1, -1,
    -1,    0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13, 14,
    15,   16,  17,  18,  19,  20,  21,  22,  23,  24,  25,  -1,  -1,  -1,  -1, -1,
    -1,   26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39, 40,
    41,   42,  43,  44,  45,  46,  47,  48,  49,  50,  51
];

function get_a2i( c ) {
    var result = (0<=c) && (c<a2i.length) ? a2i[ c ] : -1;
    if (result < 0) throw "Illegal character " + c;
    return result;
}

function base64_decode(s) {
    var length = s.length;
    var groupCount = Math.floor( length/4 );
    if ( 4 * groupCount != length )
        throw "String length must be a multiple of four.";

    var missing = 0;
    if (length != 0) {
        if ( s.charAt( length - 1 ) == '=' ) {
            missing++;
            groupCount--;
        }
        if ( s.charAt( length - 2 ) == '=' )
            missing++;
    }

    var len = ( 3 * groupCount - missing );
    if ( len < 0 ) {
        len=0;
    }
    var result = new Array( len );
    // var result = new Array( 3 * groupCount - missing );
    // var result = new Array( 3 * ( groupCount +1 ) - missing );
    var idx_in = 0;
    var idx_out = 0;
    for ( var i=0; i<groupCount; i++ ) {
        var c0 = get_a2i( s.charCodeAt( idx_in++ ) );
        var c1 = get_a2i( s.charCodeAt( idx_in++ ) );
        var c2 = get_a2i( s.charCodeAt( idx_in++ ) );
        var c3 = get_a2i( s.charCodeAt( idx_in++ ) );
        result[ idx_out++ ] = 0xFF & ( (c0 << 2) | (c1 >> 4) );
        result[ idx_out++ ] = 0xFF & ( (c1 << 4) | (c2 >> 2) );
        result[ idx_out++ ] = 0xFF & ( (c2 << 6) | c3 );
    }

    if ( missing == 0 ) {
    } else if ( missing == 1 ) {
        var c0 = get_a2i( s.charCodeAt( idx_in++ ) );
        var c1 = get_a2i( s.charCodeAt( idx_in++ ) );
        var c2 = get_a2i( s.charCodeAt( idx_in++ ) );
        result[ idx_out++ ] = 0xFF & ( (c0 << 2) | (c1 >> 4) );
        result[ idx_out++ ] = 0xFF & ( (c1 << 4) | (c2 >> 2) );

    } else if ( missing == 2 ) {
        var c0 = get_a2i( s.charCodeAt( idx_in++ ) );
        var c1 = get_a2i( s.charCodeAt( idx_in++ ) );
        result[ idx_out++ ] = 0xFF & ( ( c0 << 2 ) | ( c1 >> 4 ) );
    } else {
        throw "never happen";
    }
    return result;
}

function base64x_encode( s ) {
    return base64x_pre_encode( base64_encode(s)  );
}
function base64x_decode( s ) {
    return base64_decode( base64x_pre_decode(s) );
}

var base64x_pre_encode_map = {};
base64x_pre_encode_map["x"] = "xx";
base64x_pre_encode_map["+"] = "xa";
base64x_pre_encode_map["/"] = "xb";
base64x_pre_encode_map["="] = "";


function base64x_pre_encode( s ) {
    var ss = "";
    for ( var i=0; i<s.length; i++ ) {
        var c = s.charAt(i);
        var cc = base64x_pre_encode_map[ c ];
        if ( cc != null ) {
            ss = ss + cc;
        } else {
            ss = ss + c;
        }
    }
    return ss;
}

var base64x_pre_decode_map = {};
base64x_pre_decode_map['x'] = 'x';
base64x_pre_decode_map['a'] = '+';
base64x_pre_decode_map['b'] = '/';

function base64x_pre_decode( s ) {
    var ss = "";
    for ( var i=0; i<s.length; i++ ) {
        var c = s.charAt(i);
        if ( c == 'x' ) {
            c = s.charAt(++i);
            var cc = base64x_pre_decode_map[ c ];
            if ( cc != null ) {
                ss = ss + cc;
                // ss = ss + '/';
            } else {
                // throw "invalid character was found. ("+cc+")"; // ignore.
            }
        } else {
            ss = ss + c;
        }
    }
    while ( ss.length % 4 != 0 ) {
        ss += "=";
    }
    return ss;
}

function equals( a, b ){
    if ( a.length != b.length )
        return false;
    var size=a.length;
    for ( var i=0;i<size;i++ ){
        // trace( a[i] + "/" + b[i] );
        if ( a[i] != b[i] )
            return false;
    }
    return true;
}


function hex( i ){
    if ( i == null )
        return "??";
    //if ( i < 0 ) i+=256;
    i&=0xff;
    var result = i.toString(16);
    return ( result.length<2 ) ? "0" +result : result;
}

function base16( data, columns, delim ) {
    return base16_encode( data,columns,delim );
}
function base16_encode( data, columns, delim ) {
    if ( delim == null ){
        delim="";
    }
    if ( columns == null ) {
        columns = 256;
    }
    var result ="";
    for ( var i=0; i<data.length; i++ ) {
        if ( ( i % columns == 0 ) && ( 0<i ) )
            result += "\n";
        result += hex( data[i] ) + delim;
    }
    return result.toUpperCase();
}

var amap = {};
 amap['0'] =   0; amap['1'] =   1; amap['2'] =   2; amap['3'] =   3;
 amap['4'] =   4; amap['5'] =   5; amap['6'] =   6; amap['7'] =   7;
 amap['8'] =   8; amap['9'] =   9; amap['A'] =  10; amap['B'] =  11;
 amap['C'] =  12; amap['D'] =  13; amap['E'] =  14; amap['F'] =  15;
                                   amap['a'] =  10; amap['b'] =  11;
 amap['c'] =  12; amap['d'] =  13; amap['e'] =  14; amap['f'] =  15;

function get_amap( c ) {
    var cc = amap[c];
    //trace(c + "=>" + cc );
    if ( cc == null )
        throw "found an invalid character.";
    return cc;
}

function base16_decode( data ) {
    var ca = [];
    for ( var i=0,j=0; i<data.length; i++ ) {
        var c = data.charAt( i );
        if ( c == "\s" ) {
            continue;
        } else {
            ca[j++] = c;
        }
    }
    if ( ca.length % 2 != 0 ) {
        throw "data must be a multiple of two.";
    }

    var result = new Array( ca.length >> 1 );
    for ( var i=0; i<ca.length; i+=2 ) {
        var v = 0xff & ( ( get_amap( ca[i] ) <<4 ) | ( get_amap( ca[i+1] ) ) )  ;
        result[i>>1] = v;
        // trace(  get_amap( ca[i+1] ) )
        // result[i>>1] =  get_amap( ca[i+1] );
    }
    return result;
}
// trace( base16_encode([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,128,255 ] ) );
// trace( base16_encode( base16_decode("000102030405060708090A0B0C0D0E0F1080FF") ) );
// trace( base16_encode( base16_decode( "000102030405060708090A0B0C0D0E0F102030405060708090A0B0C0D0E0F0FF" ) ) );
//                                       000102030405060708090A0B0C0D0E0F102030405060708090A0B0C0D0E0F0FF


/////////////////////////////////////////////////////////////////////////////////////////////

var B10000000 = 0x80;
var B11000000 = 0xC0;
var B11100000 = 0xE0;
var B11110000 = 0xF0;
var B11111000 = 0xF8;
var B11111100 = 0xFC;
var B11111110 = 0xFE;
var B01111111 = 0x7F;
var B00111111 = 0x3F;
var B00011111 = 0x1F;
var B00001111 = 0x0F;
var B00000111 = 0x07;
var B00000011 = 0x03;
var B00000001 = 0x01;

function str2utf8( str ){
    var result = [];
    var length = str.length;
    var idx=0;
    for ( var i=0; i<length; i++ ){
        var c = str.charCodeAt( i );
        if ( c <= 0x7f ) {
            result[idx++] = c;
        } else if ( c <= 0x7ff ) {
            result[idx++] = B11000000 | ( B00011111 & ( c >>>  6 ) );
            result[idx++] = B10000000 | ( B00111111 & ( c >>>  0 ) );
        } else if ( c <= 0xffff ) {
            result[idx++] = B11100000 | ( B00001111 & ( c >>> 12 ) ) ;
            result[idx++] = B10000000 | ( B00111111 & ( c >>>  6 ) ) ;
            result[idx++] = B10000000 | ( B00111111 & ( c >>>  0 ) ) ;
        } else if ( c <= 0x10ffff ) {
            result[idx++] = B11110000 | ( B00000111 & ( c >>> 18 ) ) ;
            result[idx++] = B10000000 | ( B00111111 & ( c >>> 12 ) ) ;
            result[idx++] = B10000000 | ( B00111111 & ( c >>>  6 ) ) ;
            result[idx++] = B10000000 | ( B00111111 & ( c >>>  0 ) ) ;
        } else {
            throw "error";
        }
    }
    return result;
}

function utf82str( data ) {
    var result = "";
    var length = data.length;

    for ( var i=0; i<length; ){
        var c = data[i++];
        if ( c < 0x80 ) {
            result += String.fromCharCode( c );
        } else if ( ( c < B11100000 ) ) {
            result += String.fromCharCode(
                ( ( B00011111 & c         ) <<  6 ) |
                ( ( B00111111 & data[i++] ) <<  0 )
            );
        } else if ( ( c < B11110000 ) ) {
            result += String.fromCharCode(
                ( ( B00001111 & c         ) << 12 ) |
                ( ( B00111111 & data[i++] ) <<  6 ) |
                ( ( B00111111 & data[i++] ) <<  0 )
            );
        } else if ( ( c < B11111000 ) ) {
            result += String.fromCharCode(
                ( ( B00000111 & c         ) << 18 ) |
                ( ( B00111111 & data[i++] ) << 12 ) |
                ( ( B00111111 & data[i++] ) <<  6 ) |
                ( ( B00111111 & data[i++] ) <<  0 )
            );
        } else if ( ( c < B11111100 ) ) {
            result += String.fromCharCode(
                ( ( B00000011 & c         ) << 24 ) |
                ( ( B00111111 & data[i++] ) << 18 ) |
                ( ( B00111111 & data[i++] ) << 12 ) |
                ( ( B00111111 & data[i++] ) <<  6 ) |
                ( ( B00111111 & data[i++] ) <<  0 )
            );
        } else if ( ( c < B11111110 ) ) {
            result += String.fromCharCode(
                ( ( B00000001 & c         ) << 30 ) |
                ( ( B00111111 & data[i++] ) << 24 ) |
                ( ( B00111111 & data[i++] ) << 18 ) |
                ( ( B00111111 & data[i++] ) << 12 ) |
                ( ( B00111111 & data[i++] ) <<  6 ) |
                ( ( B00111111 & data[i++] ) <<  0 )
            );
        }
    }
    return result;
}

/////////////////////////////////////////////////////////////////////////////////////////////

// convert unicode character array to string
function char2str( ca ) {
    var result = "";
    for ( var i=0; i<ca.length; i++ ) {
        result += String.fromCharCode( ca[i] );
    }
    return result;
}

// convert string to unicode character array
function str2char( str ) {
    var result = new Array( str.length );
    for ( var i=0; i<str.length; i++ ) {
        result[i] = str.charCodeAt( i );
    }
    return result;
}

/////////////////////////////////////////////////////////////////////////////////////////////

// byte expressions (big endian)
function i2ba_be(i) {
    return [
        0xff & (i>>24),
        0xff & (i>>16),
        0xff & (i>> 8),
        0xff & (i>> 0)
    ];
}
function ba2i_be(bs) {
    return (
          ( bs[0]<<24 )
        | ( bs[1]<<16 )
        | ( bs[2]<< 8 )
        | ( bs[3]<< 0 )
    );
}
function s2ba_be(i) {
    return [
        0xff & (i>> 8),
        0xff & (i>> 0)
    ];
}
function ba2s_be(bs) {
    return (
        0
        | ( bs[0]<< 8 )
        | ( bs[1]<< 0 )
    );
}

// byte expressions (little endian)
function i2ba_le(i) {
    return [
        0xff & (i>> 0),
        0xff & (i>> 8),
        0xff & (i>>16),
        0xff & (i>>24)
    ];
}
function ba2i_le(bs) {
    return (
        0
        | ( bs[3]<< 0 )
        | ( bs[2]<< 8 )
        | ( bs[1]<<16 )
        | ( bs[0]<<24 )
    );
}
function s2ba_le(i) {
    return [
        0xff & (i>> 0),
        0xff & (i>> 8)
    ];
}
function ba2s_le(bs) {
    return (
        0
        | ( bs[1]<< 0 )
        | ( bs[0]<< 8 )
    );
}

function ia2ba_be( ia ) {
    var length = ia.length <<2;
    var ba = new Array( length );
    for(var ii=0,bi=0;ii<ia.length&&bi<ba.length; ){
        ba[bi++] = 0xff & ( ia[ii] >> 24 );
        ba[bi++] = 0xff & ( ia[ii] >> 16 );
        ba[bi++] = 0xff & ( ia[ii] >>  8 );
        ba[bi++] = 0xff & ( ia[ii] >>  0 );
        ii++;
    }
    return ba;
}
function ba2ia_be( ba ) {
    var length = (ba.length+3)>>2;
    var ia = new Array( length );;
    for(var ii=0,bi=0; ii<ia.length && bi<ba.length; ){
        ia[ii++] =
            ( bi < ba.length ? (ba[bi++]  << 24 ) : 0 ) |
            ( bi < ba.length ? (ba[bi++]  << 16 ) : 0 ) |
            ( bi < ba.length ? (ba[bi++]  <<  8 ) : 0 ) |
            ( bi < ba.length ? (ba[bi++]/*<< 0*/) : 0 ) ;
    }
    return ia;
}

function ia2ba_le( ia ) {
    var length = ia.length <<2;
    var ba = new Array( length );
    for(var ii=0,bi=0;ii<ia.length&&bi<ba.length; ){
        ba[bi++] = 0xff & ( ia[ii] >>  0 );
        ba[bi++] = 0xff & ( ia[ii] >>  8 );
        ba[bi++] = 0xff & ( ia[ii] >> 16 );
        ba[bi++] = 0xff & ( ia[ii] >> 24 );
        ii++;
    }
    return ba;
}
function ba2ia_le( ba ) {
    var length = (ba.length+3)>>2;
    var ia = new Array( length );;
    for(var ii=0,bi=0; ii<ia.length && bi<ba.length; ){
        ia[ii++] =
            ( bi < ba.length ? (ba[bi++]/*<< 0*/) : 0 ) |
            ( bi < ba.length ? (ba[bi++]  <<  8 ) : 0 ) |
            ( bi < ba.length ? (ba[bi++]  << 16 ) : 0 ) |
            ( bi < ba.length ? (ba[bi++]  << 24 ) : 0 ) ;
    }
    return ia;
}

/////////////////////////////////////////////////////////////////////////////////////////////

function mktst( encode, decode ) {
    return function ( trial,from,to ) {
        var flg=true;
        for (var i=0; i<trial; i++) {
            for (var j=from; j<to; j++) {
                var arr = new Array(j);
                for (var k=0; k<j; k++)
                    arr[k] = Math.floor( Math.random() * 256 );

                var s = encode(arr);
                var b = decode(s);

                // trace( "in:"+arr.length);
                // trace( "base64:"+s.length);
                // trace( "out:"+b.length);
                // trace( "in:"+arr);
                // trace( "base64:"+s );
                // trace( "out:"+b );
                trace( "in :"+arr.length + ":"+ base16_encode(arr) );
                trace( "b64:"+s.length+":"+s);
                trace( "out:"+b.length + ":"+ base16_encode(arr) );
                if ( equals( arr, b ) ) {
                    trace( "OK! ( " + i + "," + j + ")" );
                } else {
                    trace( "ERR ( " + i + "," + j + ")" );
                    flg=false;
                }
                trace( "-----------");
            }
        }
        if ( flg ) {
            trace( "ALL OK! " );
        } else {
            trace( "FOUND ERROR!" );
        }
    };
}

// export

// base64
packageRoot.base64_encode = base64_encode;
packageRoot.base64_decode = base64_decode;
packageRoot.base64_test   = mktst( base64_encode, base64_decode );

// base64ex
packageRoot.base64x_encode = base64x_encode;
packageRoot.base64x_decode = base64x_decode;
packageRoot.base64x_test   = mktst( base64x_encode, base64x_decode );

packageRoot.base64x_pre_encode = base64x_pre_encode;
packageRoot.base64x_pre_decode = base64x_pre_decode;

// base16
packageRoot.base16_encode = base16_encode;
packageRoot.base16_decode = base16_decode;
packageRoot.base16        = base16;
packageRoot.hex           = base16;

// utf8
packageRoot.utf82str      = utf82str;
packageRoot.str2utf8      = str2utf8;
packageRoot.str2char      = str2char;
packageRoot.char2str      = char2str;

// byte expressions
packageRoot.i2ba    = i2ba_be;
packageRoot.ba2i    = ba2i_be;
packageRoot.i2ba_be = i2ba_be;
packageRoot.ba2i_be = ba2i_be;
packageRoot.i2ba_le = i2ba_le;
packageRoot.ba2i_le = ba2i_le;

packageRoot.s2ba    = s2ba_be;
packageRoot.ba2s    = ba2s_be;
packageRoot.s2ba_be = s2ba_be;
packageRoot.ba2s_be = ba2s_be;
packageRoot.s2ba_le = s2ba_le;
packageRoot.ba2s_le = ba2s_le;

packageRoot.ba2ia    = ba2ia_be;
packageRoot.ia2ba    = ia2ba_be;
packageRoot.ia2ba_be = ia2ba_be;
packageRoot.ba2ia_be = ba2ia_be;
packageRoot.ia2ba_le = ia2ba_le;
packageRoot.ba2ia_le = ba2ia_le;


// arrays
packageRoot.cmparr        = equals;
}

initBinary(scope);


/////////////////////////////////////////

/*
 * Cipher.js
 * A block-cipher algorithm implementation on JavaScript
 * See Cipher.readme.txt for further information.
 *
 * Copyright(c) 2009 Atsushi Oka [ http://oka.nu/ ]
 * This script file is distributed under the LGPL
 *
 * ACKNOWLEDGMENT
 *
 *     The main subroutines are written by Michiel van Everdingen.
 *
 *     Michiel van Everdingen
 *     http://home.versatel.nl/MAvanEverdingen/index.html
 *
 *     All rights for these routines are reserved to Michiel van Everdingen.
 *
 */

function initBlockCipher( packageRoot ) {
    //__unit( "Cipher.js" );
    //__uses( "packages.js" );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Math
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MAXINT = 0xFFFFFFFF;

function rotb(b,n){ return ( b<<n | b>>>( 8-n) ) & 0xFF; }
function rotw(w,n){ return ( w<<n | w>>>(32-n) ) & MAXINT; }
function getW(a,i){ return a[i]|a[i+1]<<8|a[i+2]<<16|a[i+3]<<24; }
function setW(a,i,w){ a.splice(i,4,w&0xFF,(w>>>8)&0xFF,(w>>>16)&0xFF,(w>>>24)&0xFF); }
function setWInv(a,i,w){ a.splice(i,4,(w>>>24)&0xFF,(w>>>16)&0xFF,(w>>>8)&0xFF,w&0xFF); }
function getB(x,n){ return (x>>>(n*8))&0xFF; }

function getNrBits(i){ var n=0; while (i>0){ n++; i>>>=1; } return n; }
function getMask(n){ return (1<<n)-1; }

// added 2008/11/13 XXX MUST USE ONE-WAY HASH FUNCTION FOR SECURITY REASON
function randByte() {
    return Math.floor( Math.random() * 256 );
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ciphers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var ALGORITHMS = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Serpent
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function createSerpent() {
    //
        var keyBytes      = null;
        var dataBytes     = null;
        var dataOffset    = -1;
        //var dataLength    = -1;
        var algorithmName = null;
        // var idx2          = -1;
    //

    algorithmName = "serpent";

    var srpKey=[];

    function srpK(r,a,b,c,d,i){
      r[a]^=srpKey[4*i]; r[b]^=srpKey[4*i+1]; r[c]^=srpKey[4*i+2]; r[d]^=srpKey[4*i+3];
    }

    function srpLK(r,a,b,c,d,e,i){
      r[a]=rotw(r[a],13);r[c]=rotw(r[c],3);r[b]^=r[a];r[e]=(r[a]<<3)&MAXINT;
      r[d]^=r[c];r[b]^=r[c];r[b]=rotw(r[b],1);r[d]^=r[e];r[d]=rotw(r[d],7);r[e]=r[b];
      r[a]^=r[b];r[e]=(r[e]<<7)&MAXINT;r[c]^=r[d];r[a]^=r[d];r[c]^=r[e];r[d]^=srpKey[4*i+3];
      r[b]^=srpKey[4*i+1];r[a]=rotw(r[a],5);r[c]=rotw(r[c],22);r[a]^=srpKey[4*i+0];r[c]^=srpKey[4*i+2];
    }

    function srpKL(r,a,b,c,d,e,i){
      r[a]^=srpKey[4*i+0];r[b]^=srpKey[4*i+1];r[c]^=srpKey[4*i+2];r[d]^=srpKey[4*i+3];
      r[a]=rotw(r[a],27);r[c]=rotw(r[c],10);r[e]=r[b];r[c]^=r[d];r[a]^=r[d];r[e]=(r[e]<<7)&MAXINT;
      r[a]^=r[b];r[b]=rotw(r[b],31);r[c]^=r[e];r[d]=rotw(r[d],25);r[e]=(r[a]<<3)&MAXINT;
      r[b]^=r[a];r[d]^=r[e];r[a]=rotw(r[a],19);r[b]^=r[c];r[d]^=r[c];r[c]=rotw(r[c],29);
    }

    var srpS=[
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x3];r[x3]|=r[x0];r[x0]^=r[x4];r[x4]^=r[x2];r[x4]=~r[x4];r[x3]^=r[x1];
      r[x1]&=r[x0];r[x1]^=r[x4];r[x2]^=r[x0];r[x0]^=r[x3];r[x4]|=r[x0];r[x0]^=r[x2];
      r[x2]&=r[x1];r[x3]^=r[x2];r[x1]=~r[x1];r[x2]^=r[x4];r[x1]^=r[x2];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x1];r[x1]^=r[x0];r[x0]^=r[x3];r[x3]=~r[x3];r[x4]&=r[x1];r[x0]|=r[x1];
      r[x3]^=r[x2];r[x0]^=r[x3];r[x1]^=r[x3];r[x3]^=r[x4];r[x1]|=r[x4];r[x4]^=r[x2];
      r[x2]&=r[x0];r[x2]^=r[x1];r[x1]|=r[x0];r[x0]=~r[x0];r[x0]^=r[x2];r[x4]^=r[x1];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x3]=~r[x3];r[x1]^=r[x0];r[x4]=r[x0];r[x0]&=r[x2];r[x0]^=r[x3];r[x3]|=r[x4];
      r[x2]^=r[x1];r[x3]^=r[x1];r[x1]&=r[x0];r[x0]^=r[x2];r[x2]&=r[x3];r[x3]|=r[x1];
      r[x0]=~r[x0];r[x3]^=r[x0];r[x4]^=r[x0];r[x0]^=r[x2];r[x1]|=r[x2];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x1];r[x1]^=r[x3];r[x3]|=r[x0];r[x4]&=r[x0];r[x0]^=r[x2];r[x2]^=r[x1];r[x1]&=r[x3];
      r[x2]^=r[x3];r[x0]|=r[x4];r[x4]^=r[x3];r[x1]^=r[x0];r[x0]&=r[x3];r[x3]&=r[x4];
      r[x3]^=r[x2];r[x4]|=r[x1];r[x2]&=r[x1];r[x4]^=r[x3];r[x0]^=r[x3];r[x3]^=r[x2];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x3];r[x3]&=r[x0];r[x0]^=r[x4];r[x3]^=r[x2];r[x2]|=r[x4];r[x0]^=r[x1];
      r[x4]^=r[x3];r[x2]|=r[x0];r[x2]^=r[x1];r[x1]&=r[x0];r[x1]^=r[x4];r[x4]&=r[x2];
      r[x2]^=r[x3];r[x4]^=r[x0];r[x3]|=r[x1];r[x1]=~r[x1];r[x3]^=r[x0];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x1];r[x1]|=r[x0];r[x2]^=r[x1];r[x3]=~r[x3];r[x4]^=r[x0];r[x0]^=r[x2];
      r[x1]&=r[x4];r[x4]|=r[x3];r[x4]^=r[x0];r[x0]&=r[x3];r[x1]^=r[x3];r[x3]^=r[x2];
      r[x0]^=r[x1];r[x2]&=r[x4];r[x1]^=r[x2];r[x2]&=r[x0];r[x3]^=r[x2];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x1];r[x3]^=r[x0];r[x1]^=r[x2];r[x2]^=r[x0];r[x0]&=r[x3];r[x1]|=r[x3];
      r[x4]=~r[x4];r[x0]^=r[x1];r[x1]^=r[x2];r[x3]^=r[x4];r[x4]^=r[x0];r[x2]&=r[x0];
      r[x4]^=r[x1];r[x2]^=r[x3];r[x3]&=r[x1];r[x3]^=r[x0];r[x1]^=r[x2];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x1]=~r[x1];r[x4]=r[x1];r[x0]=~r[x0];r[x1]&=r[x2];r[x1]^=r[x3];r[x3]|=r[x4];r[x4]^=r[x2];
      r[x2]^=r[x3];r[x3]^=r[x0];r[x0]|=r[x1];r[x2]&=r[x0];r[x0]^=r[x4];r[x4]^=r[x3];
      r[x3]&=r[x0];r[x4]^=r[x1];r[x2]^=r[x4];r[x3]^=r[x1];r[x4]|=r[x0];r[x4]^=r[x1];
    }];

    var srpSI=[
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x3];r[x1]^=r[x0];r[x3]|=r[x1];r[x4]^=r[x1];r[x0]=~r[x0];r[x2]^=r[x3];
      r[x3]^=r[x0];r[x0]&=r[x1];r[x0]^=r[x2];r[x2]&=r[x3];r[x3]^=r[x4];r[x2]^=r[x3];
      r[x1]^=r[x3];r[x3]&=r[x0];r[x1]^=r[x0];r[x0]^=r[x2];r[x4]^=r[x3];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x1]^=r[x3];r[x4]=r[x0];r[x0]^=r[x2];r[x2]=~r[x2];r[x4]|=r[x1];r[x4]^=r[x3];
      r[x3]&=r[x1];r[x1]^=r[x2];r[x2]&=r[x4];r[x4]^=r[x1];r[x1]|=r[x3];r[x3]^=r[x0];
      r[x2]^=r[x0];r[x0]|=r[x4];r[x2]^=r[x4];r[x1]^=r[x0];r[x4]^=r[x1];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x2]^=r[x1];r[x4]=r[x3];r[x3]=~r[x3];r[x3]|=r[x2];r[x2]^=r[x4];r[x4]^=r[x0];
      r[x3]^=r[x1];r[x1]|=r[x2];r[x2]^=r[x0];r[x1]^=r[x4];r[x4]|=r[x3];r[x2]^=r[x3];
      r[x4]^=r[x2];r[x2]&=r[x1];r[x2]^=r[x3];r[x3]^=r[x4];r[x4]^=r[x0];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x2]^=r[x1];r[x4]=r[x1];r[x1]&=r[x2];r[x1]^=r[x0];r[x0]|=r[x4];r[x4]^=r[x3];
      r[x0]^=r[x3];r[x3]|=r[x1];r[x1]^=r[x2];r[x1]^=r[x3];r[x0]^=r[x2];r[x2]^=r[x3];
      r[x3]&=r[x1];r[x1]^=r[x0];r[x0]&=r[x2];r[x4]^=r[x3];r[x3]^=r[x0];r[x0]^=r[x1];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x2]^=r[x3];r[x4]=r[x0];r[x0]&=r[x1];r[x0]^=r[x2];r[x2]|=r[x3];r[x4]=~r[x4];
      r[x1]^=r[x0];r[x0]^=r[x2];r[x2]&=r[x4];r[x2]^=r[x0];r[x0]|=r[x4];r[x0]^=r[x3];
      r[x3]&=r[x2];r[x4]^=r[x3];r[x3]^=r[x1];r[x1]&=r[x0];r[x4]^=r[x1];r[x0]^=r[x3];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x1];r[x1]|=r[x2];r[x2]^=r[x4];r[x1]^=r[x3];r[x3]&=r[x4];r[x2]^=r[x3];r[x3]|=r[x0];
      r[x0]=~r[x0];r[x3]^=r[x2];r[x2]|=r[x0];r[x4]^=r[x1];r[x2]^=r[x4];r[x4]&=r[x0];r[x0]^=r[x1];
      r[x1]^=r[x3];r[x0]&=r[x2];r[x2]^=r[x3];r[x0]^=r[x2];r[x2]^=r[x4];r[x4]^=r[x3];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x0]^=r[x2];r[x4]=r[x0];r[x0]&=r[x3];r[x2]^=r[x3];r[x0]^=r[x2];r[x3]^=r[x1];
      r[x2]|=r[x4];r[x2]^=r[x3];r[x3]&=r[x0];r[x0]=~r[x0];r[x3]^=r[x1];r[x1]&=r[x2];
      r[x4]^=r[x0];r[x3]^=r[x4];r[x4]^=r[x2];r[x0]^=r[x1];r[x2]^=r[x0];
    },
    function(r,x0,x1,x2,x3,x4){
      r[x4]=r[x3];r[x3]&=r[x0];r[x0]^=r[x2];r[x2]|=r[x4];r[x4]^=r[x1];r[x0]=~r[x0];r[x1]|=r[x3];
      r[x4]^=r[x0];r[x0]&=r[x2];r[x0]^=r[x1];r[x1]&=r[x2];r[x3]^=r[x2];r[x4]^=r[x3];
      r[x2]&=r[x3];r[x3]|=r[x0];r[x1]^=r[x4];r[x3]^=r[x4];r[x4]&=r[x0];r[x4]^=r[x2];
    }];

    var srpKc=[7788,63716,84032,7891,78949,25146,28835,67288,84032,40055,7361,1940,77639,27525,24193,75702,
      7361,35413,83150,82383,58619,48468,18242,66861,83150,69667,7788,31552,40054,23222,52496,57565,7788,63716];
    var srpEc=[44255,61867,45034,52496,73087,56255,43827,41448,18242,1939,18581,56255,64584,31097,26469,
      77728,77639,4216,64585,31097,66861,78949,58006,59943,49676,78950,5512,78949,27525,52496,18670,76143];
    var srpDc=[44255,60896,28835,1837,1057,4216,18242,77301,47399,53992,1939,1940,66420,39172,78950,
      45917,82383,7450,67288,26469,83149,57565,66419,47400,58006,44254,18581,18228,33048,45034,66508,7449];

    function srpInit(key)
    {
      keyBytes = key;
      var i,j,m,n;
      function keyIt(a,b,c,d,i){ srpKey[i]=r[b]=rotw(srpKey[a]^r[b]^r[c]^r[d]^0x9e3779b9^i,11); }
      function keyLoad(a,b,c,d,i){ r[a]=srpKey[i]; r[b]=srpKey[i+1]; r[c]=srpKey[i+2]; r[d]=srpKey[i+3]; }
      function keyStore(a,b,c,d,i){ srpKey[i]=r[a]; srpKey[i+1]=r[b]; srpKey[i+2]=r[c]; srpKey[i+3]=r[d]; }

      keyBytes.reverse();
      keyBytes[keyBytes.length]=1; while (keyBytes.length<32) keyBytes[keyBytes.length]=0;
      for (i=0; i<8; i++){
        srpKey[i] = (keyBytes[4*i+0] & 0xff)       | (keyBytes[4*i+1] & 0xff) <<  8 |
        (keyBytes[4*i+2] & 0xff) << 16 | (keyBytes[4*i+3] & 0xff) << 24;
      }

      var r = [srpKey[3],srpKey[4],srpKey[5],srpKey[6],srpKey[7]];

      i=0; j=0;
      while (keyIt(j++,0,4,2,i++),keyIt(j++,1,0,3,i++),i<132){
        keyIt(j++,2,1,4,i++); if (i==8){j=0;}
        keyIt(j++,3,2,0,i++); keyIt(j++,4,3,1,i++);
      }

      i=128; j=3; n=0;
      while(m=srpKc[n++],srpS[j++%8](r,m%5,m%7,m%11,m%13,m%17),m=srpKc[n],keyStore(m%5,m%7,m%11,m%13,i),i>0){
        i-=4; keyLoad(m%5,m%7,m%11,m%13,i);
      }
    }

    function srpClose(){
      srpKey=[];
    }

    function srpEncrypt( data,offset)
    {
      dataBytes = data;
      dataOffset = offset;
      var blk = dataBytes.slice(dataOffset,dataOffset+16); blk.reverse();
      var r=[getW(blk,0),getW(blk,4),getW(blk,8),getW(blk,12)];

      srpK(r,0,1,2,3,0);
      var n=0, m=srpEc[n];
      while (srpS[n%8](r,m%5,m%7,m%11,m%13,m%17),n<31){ m=srpEc[++n]; srpLK(r,m%5,m%7,m%11,m%13,m%17,n); }
      srpK(r,0,1,2,3,32);

      for (var j=3; j>=0; j--,dataOffset+=4) setWInv(dataBytes,dataOffset,r[j]);
    }

    function srpDecrypt(data,offset)
    {
      dataBytes = data;
      dataOffset = offset;
      var blk = dataBytes.slice(dataOffset,dataOffset+16); blk.reverse();
      var r=[getW(blk,0),getW(blk,4),getW(blk,8),getW(blk,12)];

      srpK(r,0,1,2,3,32);
      var n=0, m=srpDc[n];
      while (srpSI[7-n%8](r,m%5,m%7,m%11,m%13,m%17),n<31){ m=srpDc[++n]; srpKL(r,m%5,m%7,m%11,m%13,m%17,32-n); }
      srpK(r,2,3,1,4,0);

      setWInv(dataBytes,dataOffset,r[4]); setWInv(dataBytes,dataOffset+4,r[1]); setWInv(dataBytes,dataOffset+8,r[3]); setWInv(dataBytes,dataOffset+12,r[2]);
      dataOffset+=16;
    }

    return {
        name    : "serpent",
        blocksize : 128/8,
        open    : srpInit,
        close   : srpClose,
        encrypt : srpEncrypt,
        decrypt : srpDecrypt
    };
}
ALGORITHMS.SERPENT = {
    create : createSerpent
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Twofish
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createTwofish() {
    //
        var keyBytes      = null;
        var dataBytes     = null;
        var dataOffset    = -1;
        // var dataLength    = -1;
        var algorithmName = null;
        // var idx2          = -1;
    //

    algorithmName = "twofish";

    var tfsKey=[];
    var tfsM=[[],[],[],[]];

    function tfsInit(key)
    {
      keyBytes = key;
      var  i, a, b, c, d, meKey=[], moKey=[], inKey=[];
      var kLen;
      var sKey=[];
      var  f01, f5b, fef;

      var q0=[[8,1,7,13,6,15,3,2,0,11,5,9,14,12,10,4],[2,8,11,13,15,7,6,14,3,1,9,4,0,10,12,5]];
      var q1=[[14,12,11,8,1,2,3,5,15,4,10,6,7,0,9,13],[1,14,2,11,4,12,3,7,6,13,10,5,15,9,0,8]];
      var q2=[[11,10,5,14,6,13,9,0,12,8,15,3,2,4,7,1],[4,12,7,5,1,6,9,10,0,14,13,8,2,11,3,15]];
      var q3=[[13,7,15,4,1,2,6,14,9,11,3,0,8,5,12,10],[11,9,5,1,12,3,13,14,6,4,7,15,2,0,8,10]];
      var ror4=[0,8,1,9,2,10,3,11,4,12,5,13,6,14,7,15];
      var ashx=[0,9,2,11,4,13,6,15,8,1,10,3,12,5,14,7];
      var q=[[],[]];
      var m=[[],[],[],[]];

      function ffm5b(x){ return x^(x>>2)^[0,90,180,238][x&3]; }
      function ffmEf(x){ return x^(x>>1)^(x>>2)^[0,238,180,90][x&3]; }

      function mdsRem(p,q){
        var i,t,u;
        for(i=0; i<8; i++){
          t = q>>>24;
          q = ((q<<8)&MAXINT) | p>>>24;
          p = (p<<8)&MAXINT;
          u = t<<1; if (t&128){ u^=333; }
          q ^= t^(u<<16);
          u ^= t>>>1; if (t&1){ u^=166; }
          q ^= u<<24 | u<<8;
        }
        return q;
      }

      function qp(n,x){
        var a,b,c,d;
        a=x>>4; b=x&15;
        c=q0[n][a^b]; d=q1[n][ror4[b]^ashx[a]];
        return q3[n][ror4[d]^ashx[c]]<<4 | q2[n][c^d];
      }

      function hFun(x,key){
        var a=getB(x,0), b=getB(x,1), c=getB(x,2), d=getB(x,3);
        switch(kLen){
        case 4:
          a = q[1][a]^getB(key[3],0);
          b = q[0][b]^getB(key[3],1);
          c = q[0][c]^getB(key[3],2);
          d = q[1][d]^getB(key[3],3);
        case 3:
          a = q[1][a]^getB(key[2],0);
          b = q[1][b]^getB(key[2],1);
          c = q[0][c]^getB(key[2],2);
          d = q[0][d]^getB(key[2],3);
        case 2:
          a = q[0][q[0][a]^getB(key[1],0)]^getB(key[0],0);
          b = q[0][q[1][b]^getB(key[1],1)]^getB(key[0],1);
          c = q[1][q[0][c]^getB(key[1],2)]^getB(key[0],2);
          d = q[1][q[1][d]^getB(key[1],3)]^getB(key[0],3);
        }
        return m[0][a]^m[1][b]^m[2][c]^m[3][d];
      }

      keyBytes=keyBytes.slice(0,32); i=keyBytes.length;
      while ( i!=16 && i!=24 && i!=32 ) keyBytes[i++]=0;

      for (i=0; i<keyBytes.length; i+=4){ inKey[i>>2]=getW(keyBytes,i); }
      for (i=0; i<256; i++){ q[0][i]=qp(0,i); q[1][i]=qp(1,i); }
      for (i=0; i<256; i++){
        f01 = q[1][i]; f5b = ffm5b(f01); fef = ffmEf(f01);
        m[0][i] = f01 + (f5b<<8) + (fef<<16) + (fef<<24);
        m[2][i] = f5b + (fef<<8) + (f01<<16) + (fef<<24);
        f01 = q[0][i]; f5b = ffm5b(f01); fef = ffmEf(f01);
        m[1][i] = fef + (fef<<8) + (f5b<<16) + (f01<<24);
        m[3][i] = f5b + (f01<<8) + (fef<<16) + (f5b<<24);
      }

      kLen = inKey.length/2;
      for (i=0; i<kLen; i++){
        a = inKey[i+i];   meKey[i] = a;
        b = inKey[i+i+1]; moKey[i] = b;
        sKey[kLen-i-1] = mdsRem(a,b);
      }
      for (i=0; i<40; i+=2){
        a=0x1010101*i; b=a+0x1010101;
        a=hFun(a,meKey);
        b=rotw(hFun(b,moKey),8);
        tfsKey[i]=(a+b)&MAXINT;
        tfsKey[i+1]=rotw(a+2*b,9);
      }
      for (i=0; i<256; i++){
        a=b=c=d=i;
        switch(kLen){
        case 4:
          a = q[1][a]^getB(sKey[3],0);
          b = q[0][b]^getB(sKey[3],1);
          c = q[0][c]^getB(sKey[3],2);
          d = q[1][d]^getB(sKey[3],3);
        case 3:
          a = q[1][a]^getB(sKey[2],0);
          b = q[1][b]^getB(sKey[2],1);
          c = q[0][c]^getB(sKey[2],2);
          d = q[0][d]^getB(sKey[2],3);
        case 2:
          tfsM[0][i] = m[0][q[0][q[0][a]^getB(sKey[1],0)]^getB(sKey[0],0)];
          tfsM[1][i] = m[1][q[0][q[1][b]^getB(sKey[1],1)]^getB(sKey[0],1)];
          tfsM[2][i] = m[2][q[1][q[0][c]^getB(sKey[1],2)]^getB(sKey[0],2)];
          tfsM[3][i] = m[3][q[1][q[1][d]^getB(sKey[1],3)]^getB(sKey[0],3)];
        }
      }
    }

    function tfsG0(x){ return tfsM[0][getB(x,0)]^tfsM[1][getB(x,1)]^tfsM[2][getB(x,2)]^tfsM[3][getB(x,3)]; }
    function tfsG1(x){ return tfsM[0][getB(x,3)]^tfsM[1][getB(x,0)]^tfsM[2][getB(x,1)]^tfsM[3][getB(x,2)]; }

    function tfsFrnd(r,blk){
      var a=tfsG0(blk[0]); var b=tfsG1(blk[1]);
      blk[2] = rotw( blk[2]^(a+b+tfsKey[4*r+8])&MAXINT, 31 );
      blk[3] = rotw(blk[3],1) ^ (a+2*b+tfsKey[4*r+9])&MAXINT;
      a=tfsG0(blk[2]); b=tfsG1(blk[3]);
      blk[0] = rotw( blk[0]^(a+b+tfsKey[4*r+10])&MAXINT, 31 );
      blk[1] = rotw(blk[1],1) ^ (a+2*b+tfsKey[4*r+11])&MAXINT;
    }

    function tfsIrnd(i,blk){
      var a=tfsG0(blk[0]); var b=tfsG1(blk[1]);
      blk[2] = rotw(blk[2],1) ^ (a+b+tfsKey[4*i+10])&MAXINT;
      blk[3] = rotw( blk[3]^(a+2*b+tfsKey[4*i+11])&MAXINT, 31 );
      a=tfsG0(blk[2]); b=tfsG1(blk[3]);
      blk[0] = rotw(blk[0],1) ^ (a+b+tfsKey[4*i+8])&MAXINT;
      blk[1] = rotw( blk[1]^(a+2*b+tfsKey[4*i+9])&MAXINT, 31 );
    }

    function tfsClose(){
      tfsKey=[];
      tfsM=[[],[],[],[]];
    }

    function tfsEncrypt( data,offset){
      dataBytes = data;
      dataOffset = offset;
      var blk=[getW(dataBytes,dataOffset)^tfsKey[0], getW(dataBytes,dataOffset+4)^tfsKey[1], getW(dataBytes,dataOffset+8)^tfsKey[2], getW(dataBytes,dataOffset+12)^tfsKey[3]];
      for (var j=0;j<8;j++){ tfsFrnd(j,blk); }
      setW(dataBytes,dataOffset   ,blk[2]^tfsKey[4]);
      setW(dataBytes,dataOffset+ 4,blk[3]^tfsKey[5]);
      setW(dataBytes,dataOffset+ 8,blk[0]^tfsKey[6]);
      setW(dataBytes,dataOffset+12,blk[1]^tfsKey[7]);
      dataOffset+=16;
    }

    function tfsDecrypt(data,offset){
      dataBytes = data;
      dataOffset = offset;
      var blk=[getW(dataBytes,dataOffset)^tfsKey[4], getW(dataBytes,dataOffset+4)^tfsKey[5], getW(dataBytes,dataOffset+8)^tfsKey[6], getW(dataBytes,dataOffset+12)^tfsKey[7]];
      for (var j=7;j>=0;j--){ tfsIrnd(j,blk); }
      setW(dataBytes,dataOffset   ,blk[2]^tfsKey[0]);
      setW(dataBytes,dataOffset+ 4,blk[3]^tfsKey[1]);
      setW(dataBytes,dataOffset+ 8,blk[0]^tfsKey[2]);
      setW(dataBytes,dataOffset+12,blk[1]^tfsKey[3]);
      dataOffset+=16;
    }

    return {
        name    : "twofish",
        blocksize : 128/8,
        open    : tfsInit,
        close   : tfsClose,
        encrypt : tfsEncrypt,
        decrypt : tfsDecrypt
    };
}
ALGORITHMS.TWOFISH  = {
    create : createTwofish
};




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOCK CIPHER MODES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MODES = {};

function createECB() {
    function encryptOpenECB() {
        this.algorithm.open( this.keyBytes );
        this.dataLength = this.dataBytes.length;
        this.dataOffset=0;
        // idx2=0;
        return;
    }

    function encryptCloseECB() {
        this.algorithm.close();
    }
    function encryptProcECB(){
        this.algorithm.encrypt( this.dataBytes, this.dataOffset );
        this.dataOffset += this.algorithm.blocksize;
        if (this.dataLength<=this.dataOffset) {
            return 0;
        } else {
            return this.dataLength-this.dataOffset;
        }
    }
    function decryptOpenECB() {
        this.algorithm.open( this.keyBytes );
        // this.dataLength = dataBytes.length;
        this.dataLength = this.dataBytes.length;
        this.dataOffset=0;
        // idx2=0;
        return;
    }

    function decryptProcECB(){
        this.algorithm.decrypt( this.dataBytes, this.dataOffset );
        this.dataOffset += this.algorithm.blocksize;
        if ( this.dataLength<=this.dataOffset ){
            return 0;
        } else {
            return this.dataLength-this.dataOffset;
        }
    }
    function decryptCloseECB() {
        this.algorithm.close();

        // ???
        while( this.dataBytes[this.dataBytes.length-1] ==0 )
            this.dataBytes.pop();
        // while( dataBytes[dataBytes.length-1] ==0 )
        //     dataBytes.pop();
    }

    return {
        encrypt : {
            open  : encryptOpenECB,
            exec  : encryptProcECB,
            close : encryptCloseECB
        },
        decrypt : {
            open  : decryptOpenECB,
            exec  : decryptProcECB,
            close : decryptCloseECB
        }
    };
}
MODES.ECB = createECB();


function createCBC() {
    function encryptOpenCBC() {
        this.algorithm.open( this.keyBytes );
        this.dataBytes.unshift(
            randByte(),randByte(),randByte(),randByte(),   randByte(),randByte(),randByte(),randByte(),
            randByte(),randByte(),randByte(),randByte(),   randByte(),randByte(),randByte(),randByte()
        );
        this.dataLength = this.dataBytes.length;
        this.dataOffset=16;
        // idx2=0;
        return;
    }
    function encryptProcCBC(){
        for (var idx2=this.dataOffset; idx2<this.dataOffset+16; idx2++)
            this.dataBytes[idx2] ^= this.dataBytes[idx2-16];
        this.algorithm.encrypt( this.dataBytes, this.dataOffset );
        this.dataOffset += this.algorithm.blocksize;

        if (this.dataLength<=this.dataOffset) {
            return 0;
        } else {
            return this.dataLength-this.dataOffset;
        }
    }
    function encryptCloseCBC() {
        this.algorithm.close();
    }

    function decryptOpenCBC() {
        this.algorithm.open( this.keyBytes );
        this.dataLength = this.dataBytes.length;

        // notice it start from dataOffset:16
        this.dataOffset=16;

        // added 2008/12/31
        // 1. Create a new field for initialization vector.
        // 2. Get initialized vector and store it on the new field.
        this.iv = this.dataBytes.slice(0,16);

        // idx2=0;
        return;
    }

    // function decryptProcCBC(){
    //     this.dataOffset=this.dataLength-this.dataOffset;
    //
    //     this.algorithm.decrypt( this.dataBytes, this.dataOffset );
    //     this.dataOffset += this.algorithm.blocksize;
    //
    //     for (var idx2=this.dataOffset-16; idx2<this.dataOffset; idx2++)
    //         this.dataBytes[idx2] ^= this.dataBytes[idx2-16];
    //
    //     this.dataOffset = this.dataLength+32-this.dataOffset;
    //
    //     if ( this.dataLength<=this.dataOffset ){
    //         return 0;
    //     } else {
    //         return this.dataLength-this.dataOffset;
    //     }
    // }

    function decryptProcCBC(){
        // copy cipher text for later use of initialization vector.
        var iv2 = this.dataBytes.slice( this.dataOffset, this.dataOffset + 16 );
        // decryption
        this.algorithm.decrypt( this.dataBytes, this.dataOffset );
        // xor with the current initialization vector.
        for ( var ii=0; ii<16; ii++ )
            this.dataBytes[this.dataOffset+ii] ^= this.iv[ii];

        // advance the index counter.
        this.dataOffset += this.algorithm.blocksize;
        // set the copied previous cipher text as the current initialization vector.
        this.iv = iv2;

        if ( this.dataLength<=this.dataOffset ){
            return 0;
        } else {
            return this.dataLength-this.dataOffset;
        }
    }
    function decryptCloseCBC() {
        this.algorithm.close();
        // trace( "splice.before:"+base16( this.dataBytes ) );
        this.dataBytes.splice(0,16);
        // trace( "splice.after:"+base16( this.dataBytes ) );

        // ???
        while( this.dataBytes[this.dataBytes.length-1] ==0 )
            this.dataBytes.pop();
    }

    return {
        encrypt : {
            open  : encryptOpenCBC,
            exec  : encryptProcCBC,
            close : encryptCloseCBC
        },
        decrypt : {
            open  : decryptOpenCBC,
            exec  : decryptProcCBC,
            close : decryptCloseCBC
        }
    };
}
MODES.CBC = createCBC();

function createCFB() {
    function encryptOpenCFB() {
        throw "not implemented!";
    }
    function encryptProcCFB(){
        throw "not implemented!";
    }
    function encryptCloseCFB() {
        throw "not implemented!";
    }
    function decryptOpenCFB() {
        throw "not implemented!";
    }
    function decryptProcCFB(){
        throw "not implemented!";
    }
    function decryptCloseCFB() {
        throw "not implemented!";
    }

    return {
        encrypt : {
            open  : encryptOpenCFB,
            exec  : encryptProcCFB,
            close : encryptCloseCFB
        },
        decrypt : {
            open  : decryptOpenCFB,
            exec  : decryptProcCFB,
            close : decryptCloseCFB
        }
    };
}
MODES.CFB = createCFB();

function createOFB(){
    function encryptOpenOFB() {
        throw "not implemented!";
    }
    function encryptProcOFB(){
        throw "not implemented!";
    }
    function encryptCloseOFB() {
        throw "not implemented!";
    }
    function decryptOpenOFB() {
        throw "not implemented!";
    }
    function decryptProcOFB(){
        throw "not implemented!";
    }
    function decryptCloseOFB() {
        throw "not implemented!";
    }

    return {
        encrypt : {
            open  : encryptOpenOFB,
            exec  : encryptProcOFB,
            close : encryptCloseOFB
        },
        decrypt : {
            open  : decryptOpenOFB,
            exec  : decryptProcOFB,
            close : decryptCloseOFB
        }
    };
}
MODES.OFB = createOFB();

function createCTR() {
    function encryptOpenCTR() {
        throw "not implemented!";
    }
    function encryptProcCTR(){
        throw "not implemented!";
    }
    function encryptCloseCTR() {
        throw "not implemented!";
    }
    function decryptOpenCTR() {
        throw "not implemented!";
    }
    function decryptProcCTR(){
        throw "not implemented!";
    }
    function decryptCloseCTR() {
        throw "not implemented!";
    }

    return {
        encrypt : {
            open  : encryptOpenCTR,
            exec  : encryptProcCTR,
            close : encryptCloseCTR
        },
        decrypt : {
            open  : decryptOpenCTR,
            exec  : decryptProcCTR,
            close : decryptCloseCTR
        }
    };
}
MODES.CTR = createCTR();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PADDING ALGORITHMS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var PADDINGS = {};

/*
 * | DD DD DD DD DD DD DD DD | DD DD DD 80 00 00 00 00 |
 */
function createRFC1321() {
    function appendPaddingRFC1321(data) {
        var len = 16 - ( data.length % 16 );
        data.push( 0x80 );
        for ( var i=1;i<len;i++ ) {
            data.push( 0x00 );
        }
        return data;
    }
    // trace( "appendPaddingRFC1321:" + base16( appendPaddingRFC1321( [0,1,2,3,4,5,6,7,8] ) ) );

    function removePaddingRFC1321(data) {
        for ( var i=data.length-1; 0<=i; i-- ) {
            var val = data[i];
            if ( val == 0x80 ) {
                data.splice( i );
                break;
            } else if ( val != 0x00 ) {
                break;
            }
        }
        return data;
    }
    // trace( "removePaddingRFC1321:" + base16( removePaddingRFC1321( [0,1,2,3,4,5,6,7,8,9,0x80,00,00,00,00] ) ) );
    return {
        append : appendPaddingRFC1321,
        remove : removePaddingRFC1321
    };
};
PADDINGS.RFC1321 = createRFC1321();

/*
 * ... | DD DD DD DD DD DD DD DD | DD DD DD DD 00 00 00 04 |
 */
function createANSIX923() {
    function appendPaddingANSIX923(data) {
        var len = 16 - ( data.length % 16 );
        for ( var i=0; i<len-1; i++ ) {
            data.push( 0x00 );
        }
        data.push( len );
        return data;
    }
    // trace( "appendPaddingANSIX923:" + base16( appendPaddingANSIX923( [0,1,2,3,4,5,6,7,8,9 ] ) ) );

    function removePaddingANSIX923(data) {
        var len = data.pop();
        if ( 16 < len ) len = 16;
        for ( var i=1; i<len; i++ ) {
            data.pop();
        }
        return data;
    }
    // trace( "removePaddingANSIX923:" + base16( removePaddingANSIX923( [0,1,2,3,4,5,6,7,8,9,0x00,00,00,00,0x05] ) ) );
    return {
        append : appendPaddingANSIX923,
        remove : removePaddingANSIX923
    };
}
PADDINGS.ANSIX923 = createANSIX923();

/*
 * ... | DD DD DD DD DD DD DD DD | DD DD DD DD 81 A6 23 04 |
 */
function createISO10126() {

    function appendPaddingISO10126(data) {
        var len = 16 - ( data.length % 16 );
        for ( var i=0; i<len-1; i++ ) {
            data.push( randByte() );
        }
        data.push( len );
        return data;
    }
    // trace( "appendPaddingISO10126:" + base16( appendPaddingISO10126( [0,1,2,3,4,5,6,7,8,9 ] ) ) );
    function removePaddingISO10126(data) {
        var len = data.pop();
        if ( 16 < len ) len = 16;
        for ( var i=1; i<len; i++ ) {
            data.pop();
        }
        return data;
    }
    // trace( "removePaddingISO10126:" + base16( removePaddingISO10126( [0,1,2,3,4,5,6,7,8,9,0x00,00,00,00,0x05] ) ) );
    return {
        append : appendPaddingISO10126,
        remove : removePaddingISO10126
    };
}
PADDINGS.ISO10126 = createISO10126();


/*
 * 01
 * 02 02
 * 03 03 03
 * 04 04 04 04
 * 05 05 05 05 05
 * etc.
 */
function createPKCS7() {
    function appendPaddingPKCS7(data) {
        // trace( "appendPaddingPKCS7");
        // alert( "appendPaddingPKCS7");
        var len = 16 - ( data.length % 16 );
        for ( var i=0; i<len; i++ ) {
            data.push( len );
        }
        // trace( "data:"+base16(data) );
        // trace( "data.length:"+data.length );
        return data;
    }
    // trace( "appendPaddingPKCS7:" + base16( appendPaddingPKCS7( [0,1,2,3,4,5,6,7,8,9 ] ) ) );
    function removePaddingPKCS7(data) {
        var len = data.pop();
        if ( 16 < len ) len = 0;
        for ( var i=1; i<len; i++ ) {
            data.pop();
        }
        return data;
    }
    // trace( "removePaddingPKCS7:" + base16( removePaddingPKCS7( [0,1,2,3,4,5,6,7,8,9,0x00,04,04,04,0x04] ) ) );
    return {
        append : appendPaddingPKCS7,
        remove : removePaddingPKCS7
    };
}
PADDINGS.PKCS7 = createPKCS7();

/*
 * NO PADDINGS
 */
function createNoPadding() {
    function appendPaddingNone(data) {
        return data;
    }
    // trace( "appendPaddingPKCS7:" + base16( appendPaddingPKCS7( [0,1,2,3,4,5,6,7,8,9 ] ) ) );
    function removePaddingNone(data) {
        return data;
    }
    // trace( "removePaddingPKCS7:" + base16( removePaddingPKCS7( [0,1,2,3,4,5,6,7,8,9,0x00,04,04,04,0x04] ) ) );
    return {
        append : appendPaddingNone,
        remove : removePaddingNone
    };
}
PADDINGS.NO_PADDING = createNoPadding();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ENCRYPT/DECRYPT
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var DIRECTIONS = {
    ENCRYPT : "encrypt",
    DECRYPT : "decrypt"
};



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERFACE
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Cipher( algorithm, direction, mode, padding ) {
    this.algorithm = algorithm;
    this.direction = direction;
    this.mode = mode;
    this.padding = padding;

    this.modeOpen  = mode[ direction ].open;
    this.modeExec  = mode[ direction ].exec;
    this.modeClose = mode[ direction ].close;

    // NOTE : values below are reffered by MODE functions via "this" parameter.
    this.keyBytes  = null;
    this.dataBytes = null;
    this.dataOffset = -1;
    this.dataLength = -1;

}

Cipher.prototype = new Object();
Cipher.prototype.inherit = Cipher;

function open( keyBytes, dataBytes ) {
    if ( keyBytes == null ) throw "keyBytes is null";
    if ( dataBytes == null ) throw "dataBytes is null";

    // BE CAREFUL : THE KEY GENERATING ALGORITHM OF SERPENT HAS SIDE-EFFECT
    // TO MODIFY THE KEY ARRAY.  IT IS NECESSARY TO DUPLICATE IT BEFORE
    // PROCESS THE CIPHER TEXT.
    this.keyBytes = keyBytes.concat();

    // DATA BUFFER IS USUALLY LARGE. DON'T DUPLICATE IT FOR PERFORMANCE REASON.
    this.dataBytes = dataBytes/*.concat()*/;

    this.dataOffset = 0;
    this.dataLength = dataBytes.length;

    //if ( this.direction == Cipher.ENCRYPT ) // fixed 2008/12/31
    if ( this.direction == DIRECTIONS.ENCRYPT ) {
        this.padding.append( this.dataBytes );
    }

    this.modeOpen();
}

function operate() {
    return this.modeExec();
}

function close() {
    this.modeClose();
    // if ( this.direction == Cipher.DECRYPT ) // fixed 2008/12/31
    if ( this.direction == DIRECTIONS.DECRYPT ) {
        this.padding.remove( this.dataBytes );
    }
    return this.dataBytes;
}

function execute( keyBytes, dataBytes ) {
    this.open( keyBytes, dataBytes );
    for(;;) {
        var size = this.operate();
        if ( 0<size ) {
            // trace( size );
            //alert( size );
            continue;
        } else {
            break;
        }
    }
    return this.close();
}

Cipher.prototype.open = open;
Cipher.prototype.close = close;
Cipher.prototype.operate = operate;
Cipher.prototype.execute = execute;

////////////////////////////////////////////////////////////////////////

// this.updateMode = function() {
//     this.modeProcs = this.mode[ this.direction ];
// };


////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


Cipher.ENCRYPT  = "ENCRYPT";
Cipher.DECRYPT  = "DECRYPT";

Cipher.RIJNDAEL = "RIJNDAEL";
Cipher.SERPENT  = "SERPENT";
Cipher.TWOFISH  = "TWOFISH";

Cipher.ECB      = "ECB";
Cipher.CBC      = "CBC";
Cipher.CFB      = "CFB";
Cipher.OFB      = "OFB";
Cipher.CTR      = "CTR";

Cipher.RFC1321    = "RFC1321";
Cipher.ANSIX923   = "ANSIX923";
Cipher.ISO10126   = "ISO10126";
Cipher.PKCS7      = "PKCS7";
Cipher.NO_PADDING = "NO_PADDING";

Cipher.create = function( algorithmName, directionName, modeName, paddingName ) {

    if ( algorithmName == null ) algorithmName = Cipher.RIJNDAEL;
    if ( directionName == null ) directionName = Cipher.ENCRYPT;
    if ( modeName      == null ) modeName      = Cipher.CBC;
    if ( paddingName   == null ) paddingName   = Cipher.PKCS7;

    var algorithm  = ALGORITHMS[ algorithmName ];
    var direction  = DIRECTIONS[ directionName ];
    var mode       = MODES[ modeName ];
    var padding    = PADDINGS[ paddingName ];

    if ( algorithm  == null ) throw "Invalid algorithm name '" + algorithmName + "'.";
    if ( direction  == null ) throw "Invalid direction name '" + directionName + "'.";
    if ( mode       == null ) throw "Invalid mode name '"      + modeName      + "'.";
    if ( padding    == null ) throw "Invalid padding name '"   + paddingName   + "'.";

    return new Cipher( algorithm.create(), direction, mode, padding );
};

Cipher.algorithm = function( algorithmName ) {
    if ( algorithmName == null ) throw "Null Pointer Exception ( algorithmName )";
    var algorithm  = ALGORITHMS[ algorithmName ];
    if ( algorithm  == null ) throw "Invalid algorithm name '" + algorithmName + "'.";
    // trace( "ss" );
    // trace( algorithm );
    return algorithm.create();
}


///////////////////////////////////
// export
///////////////////////////////////
//__export( packageRoot, "titaniumcore.crypto.Cipher", Cipher );
packageRoot.Cipher = Cipher;

} // the end of initBlockCipher();


initBlockCipher( scope );


function _toArray(s) {
	var length = s.length;
	var a = new Array(length);
	for(var i = 0; i < length; ++i)
		a[i] = s.charCodeAt(i);
	return a;
}
function _toString(a) {
	var length = a.length;
	var s = "";
	for(var i = 0; i < length; ++i)
		s += String.fromCharCode(a[i]);
	return s;
}
function _createCipher(directionName, cipherAlgorithm) {
	var algorithm = scope.Cipher[cipherAlgorithm];
	var direction = scope.Cipher[directionName];
	var mode = scope.Cipher.CBC;
	var padding = scope.Cipher.PKCS7;
	var cipher = scope.Cipher.create(algorithm, direction, mode, padding);
	return cipher;
}
function _encrypt(text, pass, algo) {
	var cipher = _createCipher("ENCRYPT", algo);
	//~ todo: don't convert to utf-8 again
	text = scope.str2utf8(text);
	pass = scope.str2utf8(pass);
	text = cipher.execute(pass, text);
	//return scope.base64_encode(text);
	return _toString(text);
}
function _decrypt(text, pass, algo) {
	var cipher = _createCipher("DECRYPT", algo);
	//text = scope.base64_decode(text);
	text = _toArray(text);
	pass = scope.str2utf8(pass);
	text = cipher.execute(pass, text);
	return scope.utf82str(text);
}
scope.twofishRawEncrypt = function(text, pass) { return _encrypt(text, pass, "TWOFISH"); };
scope.serpentRawEncrypt = function(text, pass) { return _encrypt(text, pass, "SERPENT"); };
scope.twofishRawDecrypt = function(text, pass) { return _decrypt(text, pass, "TWOFISH"); };
scope.serpentRawDecrypt = function(text, pass) { return _decrypt(text, pass, "SERPENT"); };

return scope;
})();

var twofishRawEncrypt = _scope.twofishRawEncrypt;
var twofishRawDecrypt = _scope.twofishRawDecrypt;
var serpentRawEncrypt = _scope.serpentRawEncrypt;
var serpentRawDecrypt = _scope.serpentRawDecrypt;

//===================

var ITR_MIN = 0x21;
var ITR_MAX = 0xffff;
var _cache = {};
function getHash(pass, salt, iterations) {
	if(_testMode)
		return "<test mode>";
	if(testSpeed) {
		_cache = {};
		var t = new Date().getTime();
	}
	var hash = _getHash(pass, salt, iterations);
	if(testSpeed) {
		var dt = new Date().getTime() - t;
		getHash._time = getHash._time
			? (getHash._time + dt)/2
			: dt;
	}
	return hash;
}
function _getHash(pass, salt, iterations) {
	if(iterations < ITR_MIN)
		throw "Too small iterations count!\nShould be [" + ITR_MIN + " ... " + ITR_MAX + "]";
	if(iterations > ITR_MAX)
		throw "Too lerge iterations count!\nShould be [" + ITR_MIN + " ... " + ITR_MAX + "]";
	var key = pass + "\x00" + salt + "\x00" + iterations;
	return _cache[key] || (
		_cache[key] = packHex(
			sjcl.codec.hex.fromBits(
				sjcl.misc.pbkdf2(pass, salt, iterations, 64*4)
			)
		)
	);
}
function getSalt() {
	var num = getRandomInt(saltLengthMin, saltLengthMax);
	var rnd = "";
	for(var i = 0; i < num; ++i)
		rnd += String.fromCharCode(getRandomInt(ITR_MIN, ITR_MAX));
	return rnd;
}
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getHeader(iterations, salt) {
	return salt
		+ String.fromCharCode(iterations)
		+ String.fromCharCode(getRandomInt(0, ITR_MIN - 1));
}
function parseHeader(str) {
	if(!/^([^\x00-\x20]{2,})[\x00-\x20]/.test(str))
		throw "Can't decrypt: bad header";
	var header = RegExp.$1;
	return {
		salt: header.slice(0, -1),
		iterations: header.charCodeAt(header.length - 1),
		text: RegExp.rightContext
	};
}
function packHex(hex, n) {
	// May be 2..4
	// Note: there is too huge output with 4
	if(n === undefined)
		n = 2;
	var len = hex.length;
	var r = len % n;
	if(r) {
		var add = n - r;
		hex += new Array(add + 1).join("\x00");
		len += add;
	}
	var out = "";
	for(var i = 0; i < len; i += n)
		out += String.fromCharCode(Number("0x" + hex.substr(i, n)));
	return out;
}
function feedback(msg) {
	if(new Date().getTime() - feedback._start > 150) {
		_feedback && _feedback(msg);
		hWndDialog && AkelPad.SendMessage(hWndDialog, 15 /*WM_PAINT*/, 0, 0);
	}
}
function encrypt(text, pass, encrypters) {
	//var encrypters = Array.prototype.slice.call(arguments, 3);
	var encryptersCount = encrypters.length;

	var n = 4 + encryptersCount*3;
	var s = "/" + n + ": ";
	var i = 0;

	feedback._start = new Date().getTime();
	feedback(++i + s + _localize("Unicode ⇒ UTF-8"));
	text = Utf8.encode(text);
	pass = Utf8.encode(pass);

	feedback(++i + s + _localize("hashing" + (encryptersCount > 1 ? "-%S" : "")).replace("%S", 1));
	var salt = getSalt();
	var iterations = getRandomInt(pbkdf2IterationsMin, pbkdf2IterationsMax);
	var hash = getHash(pass, salt, iterations);

	//text = text.replace(/\x00+$/, "");

	feedback(++i + s + _localize("encryption" + (encryptersCount > 1 ? "-%S" : "")).replace("%S", 1));
	text = getHeader(iterations, salt) + encrypters[0](text, hash);

	for(var j = 1; j < encryptersCount; ++j) {
		feedback(++i + s + _localize("hashing-%S").replace("%S", j + 1));
		var salt2 = getSalt();
		var iterations2 = getRandomInt(pbkdf2IterationsMin, pbkdf2IterationsMax);
		var hash2 = getHash(pass, salt2, iterations2);

		feedback(++i + s + _localize("Unicode ⇒ UTF-8"));
		text = Utf8.encode(text);

		feedback(++i + s + _localize("encryption-%S").replace("%S", j + 1));
		text = getHeader(iterations2, salt2) + encrypters[j](text, hash2);
	}

	feedback(++i + s + _localize("text ⇒ base64"));
	text = base64.encode(text);

	feedback();
	return text;
}
function decrypt(text, pass, decrypters) {
	//var decrypters = Array.prototype.slice.call(arguments, 3);
	var decryptersCount = decrypters.length;

	var n = 5 + decryptersCount*3;
	var s = "/" + n + ": ";
	var i = 0;

	feedback._start = new Date().getTime();
	feedback(++i + s + _localize("Unicode ⇒ UTF-8"));
	pass = Utf8.encode(pass);

	feedback(++i + s + _localize("base64 ⇒ text"));
	text = base64.decode(text);

	var h = parseHeader(text);
	var salt = h.salt;
	var iterations = h.iterations;
	text = h.text;

	feedback(++i + s + _localize("hashing" + (decryptersCount > 1 ? "-%S" : "")).replace("%S", 1));
	var hash = getHash(pass, salt, iterations);

	feedback(++i + s + _localize("decryption" + (decryptersCount > 1 ? "-%S" : "")).replace("%S", 1));
	text = decrypters[0](text, hash);

	for(var j = 1; j < decryptersCount; ++j) {
		feedback(++i + s + _localize("UTF-8"));
		text = Utf8.decode(text);

		feedback(++i + s + _localize("hashing-%S").replace("%S", j + 1));
		var h2 = parseHeader(text);
		var salt2 = h2.salt;
		var iterations2 = h2.iterations;
		text = h2.text;
		var hash2 = getHash(pass, salt2, iterations2);

		feedback(++i + s + _localize("decryption-%S").replace("%S", j + 1));
		text = decrypters[j](text, hash2);
	}

	feedback(++i + s + _localize("UTF-8 ⇒ Unicode"));
	text = Utf8.decode(text);

	feedback();
	return text;
}
function crypt(text, pass, isDecrypt, cryptorsArr) {
	return isDecrypt
		? decrypt(text, pass, getCryptors(cryptorsArr, getDecryptor))
		: encrypt(text, pass, getCryptors(cryptorsArr, getEncryptor));
}

var validCryptors = ["AES-256", "Blowfish", "Twofish", "Serpent"];
function isValidName(name) {
	for(var i = 0, l = validCryptors.length; i < l; ++i)
		if(name == validCryptors[i])
			return true;
	return false;
}
function normalizeName(name) {
	return name.toLowerCase().replace(/-/, "");
}
function getEncryptor(name) {
	var cryptor = cryptors[normalizeName(name)] || {};
	return cryptor.rawEncrypt || null;
}
function getDecryptor(name) {
	var cryptor = cryptors[normalizeName(name)] || {};
	return cryptor.rawDecrypt || null;
}
function getCryptors(names, getter) {
	// Usage:
	// var encryptors = getCryptors(names, getEncryptor)
	// var decryptors = getCryptors(names, getDecryptor)
	if(getter == getDecryptor)
		names = names.slice().reverse();
	var out = [];
	for(var i = 0, l = names.length; i < l; ++i) {
		var c = getter(names[i]);
		c && out.push(c);
	}
	return out;
}
function getPrettyName(cryptorNames) {
	if(typeof cryptorNames == "string")
		cryptorNames = cryptorNames.split(/\s*\+\s*/);
	var out = [];
	for(var i = 0, l = cryptorNames.length; i < l; ++i) {
		var name = normalizeName(cryptorNames[i]);
		out[i] = cryptors[name] && cryptors[name].prettyName || name;
	}
	return out.join("+");
}

var cryptors = {
	// speed: symbols/ms [encryptSpeed, decryptSpeed]
	aes256: {
		prettyName: "AES-256",
		speed: [15.6, 59],
		encrypt: function(text, pass) {
			return encrypt(text, pass, [aesRawEncrypt]);
		},
		decrypt: function(text, pass) {
			return decrypt(text, pass, [aesRawDecrypt]);
		},
		rawEncrypt: aesRawEncrypt,
		rawDecrypt: aesRawDecrypt
	},
	blowfish: {
		prettyName: "Blowfish",
		speed: [63, 120],
		encrypt: function(text, pass) {
			return encrypt(text, pass, [blowfishRawEncrypt]);
		},
		decrypt: function(text, pass) {
			return decrypt(text, pass, [blowfishRawDecrypt]);
		},
		rawEncrypt: blowfishRawEncrypt,
		rawDecrypt: blowfishRawDecrypt
	},
	twofish: {
		prettyName: "Twofish",
		speed: [54, 104],
		encrypt: function(text, pass) {
			return encrypt(text, pass, [twofishRawEncrypt]);
		},
		decrypt: function(text, pass) {
			return decrypt(text, pass, [twofishRawDecrypt]);
		},
		rawEncrypt: twofishRawEncrypt,
		rawDecrypt: twofishRawDecrypt
	},
	serpent: {
		prettyName: "Serpent",
		speed: [26, 49],
		encrypt: function(text, pass) {
			return encrypt(text, pass, [serpentRawEncrypt]);
		},
		decrypt: function(text, pass) {
			return decrypt(text, pass, [serpentRawDecrypt]);
		},
		rawEncrypt: serpentRawEncrypt,
		rawDecrypt: serpentRawDecrypt
	}
};


var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var hWndDialog, _feedback;
var _testMode = false;
var oSys = AkelPad.SystemFunction();
var oSet = AkelPad.ScriptSettings();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

if(hMainWnd && !AkelPad.IsInclude()) {
	if(test || test === undefined && !AkelPad.SendMessage(hMainWnd, 1185 /*AKD_GETTEXTLENGTH*/, hWndEdit, 0)) {
		cryptTest();
		WScript.Quit();
	}

	var isAutoSave = noAutoSave && AkelPad.IsPluginRunning("SaveFile::AutoSave");
	isAutoSave && AkelPad.Call("SaveFile::AutoSave");
	try {
		if(!modalDlg)
			cryptDialog();
		else if(!AkelPad.GetEditReadOnly(hWndEdit))
			encryptOrDecrypt();
	}
	finally {
		isAutoSave && AkelPad.Call("SaveFile::AutoSave");
	}
}

function encryptOrDecrypt(pass) {
	var text = AkelPad.GetSelText();
	var selectAll = false;
	if(!text && !onlySelected) {
		text = getAllText();
		selectAll = true;
	}
	if(!text) {
		var msg = onlySelected
			? _localize("No text selected!")
			: _localize("Nothing to " + (decrypt ? "decrypt" : "encrypt") + "!");
		AkelPad.MessageBox(hMainWnd, msg, dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
		return;
	}

	var cryptorsArr = (cryptor || "").split(/\s*\+\s*/);
	if(checkForWrongCryptors(cryptor)) {
		cryptor = "";
		cryptorsArr = [];
	}

	if(!pass && (mode == MODE_USER_SELECT || !cryptor)) {
		if(mode == MODE_USER_SELECT)
			var decryptObj = { value: isBase64(trimBase64String(text)) };
		if(!cryptor)
			var cryptorObj = { value: [] };
		var pass = _passwordPrompt(
			dialogTitle + (cryptor ? " :: " + getPrettyName(cryptor) : ""),
			_localize(mode == MODE_ENCRYPT ? "Encrypt" : mode == MODE_DECRYPT ? "Decrypt" : "Password"),
			modalDlg,
			decryptObj,
			cryptorObj
		);
		if(!pass) // Cancel
			return;
		if(decryptObj)
			isDecrypt = decryptObj.value;
		if(cryptorObj) {
			cryptorsArr = cryptorObj.value;
			cryptor = cryptorsArr.join("+");
		}
	}

	var prettyName = getPrettyName(cryptorsArr);

	if(isDecrypt) {
		text = trimBase64String(text);
		if(!isBase64(text)) {
			AkelPad.MessageBox(
				hMainWnd,
				_localize("Impossible to decrypt: invalid format!"),
				dialogTitle + " :: " + prettyName,
				16 /*MB_ICONERROR*/
			);
			return;
		}
	}

	if(!pass) {
		pass = _passwordPrompt(
			dialogTitle + " :: " + prettyName,
			_localize(isDecrypt ? "Decrypt" : "Encrypt"),
			modalDlg
		);
	}
	if(!pass) // Cancel
		return;

	//if(isDecrypt)
	//	cryptorsArr.reverse();

	var cryptorsCount = cryptorsArr.length;
	if(warningTime > 0) {
		/*
		var iterationsSpeed = 2.5; // per ms
		var hashingTime = (pbkdf2IterationsMin + pbkdf2IterationsMax)/2
			/iterationsSpeed*cryptorsCount;

		for(var i = 0; i < cryptorsCount; ++i) {
			var name = cryptorsArr[i];
			var crData = cryptors[normalizeName(name)];
			var crSpeed = crData.speed[isDecrypt ? 1 : 0];
		}
		*/

		var len = 400;
		if(isDecrypt && len % 4 != 0)
			len += 4 - len % 4;
		var part = text.substr(0, len);
		var t = new Date().getTime();
		_testMode = true;
		try {
			crypt(part, pass, isDecrypt, cryptorsArr);
		}
		catch(e) {
		}
		_testMode = false;
		var dt = new Date().getTime() - t;
		var remTime = text.length/(part.length/dt);

		if(remTime >= warningTime) {
			var s = Math.round(remTime/1000);
			var m = Math.floor(s/60);
			s -= m*60;
			if(s < 10)
				s = "0" + s;
			if(
				AkelPad.MessageBox(
					hMainWnd,
					_localize("Required time: %S (estimate)\nContinue?\n\nNote: hashing time isn't included.")
						.replace("%S", m + ":" + s),
					dialogTitle + " :: " + prettyName,
					33 /*MB_OKCANCEL|MB_ICONQUESTION*/
				) == 2 /*IDCANCEL*/
			)
				return;
		}
	}

	if(testSpeed)
		var t = new Date().getTime();
	try {
		var res = crypt(text, pass, isDecrypt, cryptorsArr);
	}
	catch(e) {
		if(e.name)
			throw e;
		AkelPad.MessageBox(
			hMainWnd,
			e.name ? e.name + "\n" + e.message : e,
			dialogTitle + " :: " + prettyName,
			16 /*MB_ICONERROR*/
		);
		return;
	}
	if(!isDecrypt && maxLineWidth > 0)
		res = res.replace(new RegExp(".{" + maxLineWidth + "}", "g"), "$&\n");
	if(testSpeed) {
		var _r = function(n) {
			if(n.toFixed)
				return n.toFixed(1).replace(/\.0$/, "");
			return Math.round(n);
		};
		var dt = new Date().getTime() - t;
		var dtReal = dt - getHash._time*cryptorsCount;
		var speed = text.length/dtReal;
		AkelPad.MessageBox(
			hWndDialog || hMainWnd,
			"Encryption speed: " + _r(speed) + " chars/ms"
			+ "\nElapsed time: " + _r(dt) + " ms"
			+ " (hashing: " + _r(getHash._time) + (cryptorsCount > 1 ? "*" + cryptorsCount : "") + " ms)",
			dialogTitle,
			0 /*MB_OK*/
		);
	}

	insertNoScroll(res, selectAll);
}
function checkForWrongCryptors(names) {
	if(!names)
		return false;
	var cryptorsArr = names.split(/\s*\+\s*/);
	var wrongCryptors = [];
	for(var i = 0, l = cryptorsArr.length; i < l; ++i)
		if(!cryptors[normalizeName(cryptorsArr[i])])
			wrongCryptors.push(cryptorsArr[i]);
	if(wrongCryptors.length) {
		var msg = _localize("Cryptor “%S” not found!").replace("%S", getPrettyName(wrongCryptors));
		AkelPad.MessageBox(hMainWnd, msg, dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
		return true;
	}
	return false;
}

function cryptTest() {
	var tl = new TitleLogger(WScript.ScriptName + ": test ");

	var piMin = pbkdf2IterationsMin;
	var piMax = pbkdf2IterationsMax;
	pbkdf2IterationsMin = 33;
	pbkdf2IterationsMax = 40;
	var texts = [
		"Abcdef0123",
		"AbefАбвг015@#$%^&*()-_=+/\\\n!\r\t'\" ",
		"\x00\x01\x02\x05\x00\x00\u0af7\u0bd0\u063a\u0c0c\u00d8\u0467\u0fdb\u0086\u0a5c\u0c90\u0f9c"
			+ "\u0a9c\u087c\u08ff\u0729\u065a\u3a5d\u48bf\u0afa\uedbf\uf122\u0b6d\u6387\u579c\ue8f6\u6de4"
			+ "\u0658\u1a8f\ub279\u46ae\u37bd\u807b\uf08c\u6605\ue7a6\ucedd\u2242\u2775\ua69e\ubf72"
	];
	var passwords = [
		"Qw987-_=+\\|%^$;:'\t !~ *",
		"RtКен\x00 \r\n乛疻פּ"
	];

	var cryptorNames = [];
	for(var name in cryptors)
		cryptorNames.push([name]);
	// Basic test for double encryption
	var prevName;
	for(var name in cryptors) {
		if(prevName)
			cryptorNames.push([prevName, name]);
		prevName = name;
	}

	var ok = 0;
	var fail = [];
	var i = 0;
	var count = texts.length*passwords.length*cryptorNames.length;
	var t = new Date().getTime();
	for(var it = 0, lt = texts.length; it < lt; ++it) {
		var text = texts[it];
		for(var ip = 0, lp = passwords.length; ip < lp; ++ip) {
			var pass = passwords[ip];
			for(var ic = 0, lc = cryptorNames.length; ic < lc; ++ic) {
				tl.log(++i + "/" + count);
				var crNames = cryptorNames[ic];

				var err = function(e) {
					fail[fail.length] = getPrettyName(crNames) + " (" + it + ", " + ip + ") fail:\n"
						+ (e ? "Error:\n" + (e.name ? e.name + "\n" + e.message : e) + "\n" : "")
						+ esc(text) + "\n=>\n"
						+ esc(enc)  + "\n=>\n"
						+ esc(dec);
				}
				try {
					var enc = encrypt(text, pass, getCryptors(crNames, getEncryptor));
				}
				catch(e) {
					err(e);
					continue;
				}
				try {
					var dec = decrypt(enc, pass, getCryptors(crNames, getDecryptor))
				}
				catch(e) {
					err(e);
					continue;
				}
				if(dec == text)
					ok++;
				else {
					err();
				}
			}
		}
	}
	pbkdf2IterationsMin = piMin;
	pbkdf2IterationsMax = piMax;
	tl.restore();
	var elapsedTime = "\nElapsed time: " + (new Date().getTime() - t) + " ms";
	AkelPad.MessageBox(
		hMainWnd,
		fail.length
			? "Failed: " + fail.length + "\nPassed: " + ok + "\n\n" + fail.join("\n\n") + "\n" + elapsedTime
			: "All " + ok + " tests passed!" + elapsedTime,
		dialogTitle,
		fail.length ? 48 /*MB_ICONEXCLAMATION*/ : 64 /*MB_ICONINFORMATION*/
	);
	function esc(s) {
		return s
			.replace(/\n/g, "\\n")
			.replace(/\r/g, "\\r")
			.replace(/\t/g, "\\t")
			.replace(/\x00/g, "\\0");
	}
}
function TitleLogger(prefix) {
	var origTitle;
	var hWndFrame, origFrameTitle;
	function init() {
		init = function() {};
		var isMDI = AkelPad.IsMDI() == 1 /*WMD_MDI*/;
		if(isMDI) {
			hWndFrame = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 1 /*FI_WNDEDITPARENT*/, 0 /*current frame*/);
			if(oSys.Call("User32::IsZoomed", hWndFrame)) {
				origFrameTitle = windowText(hWndFrame);
				windowText(hWndFrame, "");
			}
		}
		origTitle = windowText(hMainWnd);
	}
	this.log = function(s) {
		init();
		windowText(hMainWnd, prefix + s);
	};
	this.restore = function() {
		windowText(hMainWnd, origTitle);
		origFrameTitle && windowText(hWndFrame, origFrameTitle);
	};
}

function cryptDialog() {
	if(checkForWrongCryptors(cryptor))
		cryptor = "";
	var decryptObj = mode != MODE_USER_SELECT
		? null
		: {
			value: isBase64(trimBase64String(
				AkelPad.GetSelText() || (onlySelected ? "" : getAllText())
			))
		};
	var cryptorObj = cryptor
		? null
		: {};
	_passwordPrompt(
		dialogTitle + (cryptor ? " :: " + getPrettyName(cryptor) : ""),
		_localize(mode == MODE_ENCRYPT ? "Encrypt" : mode == MODE_DECRYPT ? "Decrypt" : "Password"),
		false,
		decryptObj,
		cryptorObj
	);
}

function passwordPrompt(decryptObj, cryptorObj) {
	var _cryptor = cryptorObj
		? cryptorObj.value
		: cryptor;
	var caption = dialogTitle + (_cryptor  ? " :: " + getPrettyName(_cryptor) : "");
	var _decrypt = decryptObj ? undefined : isDecrypt;
	var label = _localize(
		_decrypt == undefined
			? "Password"
			: isDecrypt
				? "Decrypt"
				: "Encrypt"
	);
	return _passwordPrompt(caption, label, true, decryptObj, cryptorObj);
}
function _passwordPrompt(caption, label, modal, decryptObj, cryptorObj) {
	var hInstanceDLL = AkelPad.GetInstanceDll();
	var dialogClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");

	_feedback = function(msg) {
		if(_testMode)
			return;
		if(!_feedback._title)
			_feedback._title = windowText(hWndDialog);
		windowText(
			hWndDialog,
			(msg ? msg + " - " : "") + _feedback._title
		);
	};

	hWndDialog = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, dialogClass, 0);
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

	var dlgX, dlgY;
	if((saveOptions || savePosition) && oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/)) {
		if(saveOptions) {
			if(cryptorObj ? !cryptorObj.value : !cryptor)
				cryptor = oSet.Read("cryptor", 3 /*PO_STRING*/);
			if(showPassword === undefined)
				showPassword = oSet.Read("showPassword", 1 /*PO_DWORD*/);
		}
		if(savePosition) {
			dlgX = oSet.Read("windowLeft", 1 /*PO_DWORD*/);
			dlgY = oSet.Read("windowTop",  1 /*PO_DWORD*/);
		}
		oSet.End();
	}
	function saveSettings() {
		if(!saveOptions && !savePosition)
			return;
		if(!oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
			return;
		if(runned ? saveOptions : saveOptions == 2 && readControlsState()) {
			oSet.Write("cryptor", 3 /*PO_STRING*/, cryptorObj ? cryptorObj.value.join("+") : cryptor);
			oSet.Write("showPassword", 1 /*PO_DWORD*/, Number(checked(hWndShowPass)));
		}
		if(savePosition && !oSys.Call("user32::IsIconic", hWndDialog)) {
			var rcWnd = getWindowRect(hWndDialog);
			if(rcWnd) {
				oSet.Write("windowLeft", 1 /*PO_DWORD*/, rcWnd.left);
				oSet.Write("windowTop",  1 /*PO_DWORD*/, rcWnd.top);
			}
		}
		oSet.End();
	}

	if(showPassword === undefined)
		showPassword = false;

	var pass;
	var runned = false;

	var IDC_STATIC       = -1;
	var IDC_ENCRYPT      = 1001;
	var IDC_DECRYPT      = 1002;
	var IDC_COMBOBOX_1   = 1003;
	var IDC_COMBOBOX_2   = 1004;
	var IDC_COMBOBOX_3   = 1005;
	var IDC_PASS         = 1010;
	var IDC_PASS2        = 1011;
	var IDC_PASS2_LABEL  = 1012;
	var IDC_SHOWPASS     = 1013;
	var IDC_OK           = 1014;
	var IDC_APPLY        = 1015;
	var IDC_CANCEL       = 1016;

	var hWndGroupDir, hWndEncrypt, hWndDecrypt;
	var hWndGroupCryptor, hWndCombobox1, hWndCombobox2, hWndCombobox3;
	var hWndGroupPass, hWndPassLabel, hWndPass, hWndPass2Label, hWndPass2, hWndShowPass;
	var hWndOK, hWndApply, hWndCancel;

	var cryptorsLabels = validCryptors.concat();
	cryptorsLabels.unshift(_localize("(none)"));

	var addY = (decryptObj ? 54-8 : 0) + (cryptorObj ? 54 + 18 : 0);
	var p2h = decryptObj || !isDecrypt ? 0 : 52; // Show or hide second password field
	var btnW = modal ? 124 : 79;
	var btnSp = 12;

	var cbW = 72;
	var cbSep = 8;

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
		scale.x(286) + sizeNonClientX,              //nWidth
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
				// Dialog caption
				windowText(hWnd, caption);

				var dy = 0;

				if(decryptObj) {
					dy = 54;

					// GroupBox mode
					hWndGroupDir = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
						14,           //x
						13,           //y
						258,          //nWidth
						44,           //nHeight
						hWnd,         //hWndParent
						IDC_STATIC,   //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndGroupDir, _localize("Direction"));

					// Radiobutton encrypt
					hWndEncrypt = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
						26,           //x
						33,           //y
						113,          //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_ENCRYPT,  //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndEncrypt, _localize("&Encrypt"));
					checked(hWndEncrypt, !decryptObj.value);

					// Radiobutton decrypt
					hWndDecrypt = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
						145,          //x
						33,           //y
						113,          //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_DECRYPT,  //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndDecrypt, _localize("&Decrypt"));
					checked(hWndDecrypt, decryptObj.value);
				}

				if(cryptorObj) {
					// GroupBox cryptor
					hWndGroupCryptor = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
						14,           //x
						dy + 13,      //y
						258,          //nWidth
						54,           //nHeight
						hWnd,         //hWndParent
						IDC_STATIC,   //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndGroupCryptor, _localize("Encryption algorithm"));

					hWndCombobox1 = createWindowEx(
						0,              //dwExStyle
						"COMBOBOX",     //lpClassName
						0,              //lpWindowName
						0x50210003,     //WS_VISIBLE|WS_CHILD|WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWNLIST
						26,             //x
						dy + 34,        //y
						cbW,            //nWidth
						160,            //nHeight
						hWnd,           //hWndParent
						IDC_COMBOBOX_1, //ID
						hInstanceDLL,   //hInstance
						0               //lpParam
					);
					setWindowFont(hWndCombobox1);

					hWndCombobox2 = createWindowEx(
						0,                //dwExStyle
						"COMBOBOX",       //lpClassName
						0,                //lpWindowName
						0x50210003,       //WS_VISIBLE|WS_CHILD|WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWNLIST
						26 + cbW + cbSep, //x
						dy + 34,          //y
						cbW,              //nWidth
						160,              //nHeight
						hWnd,             //hWndParent
						IDC_COMBOBOX_2,   //ID
						hInstanceDLL,     //hInstance
						0                 //lpParam
					);
					setWindowFont(hWndCombobox2);

					hWndCombobox3 = createWindowEx(
						0,                    //dwExStyle
						"COMBOBOX",           //lpClassName
						0,                    //lpWindowName
						0x50210003,           //WS_VISIBLE|WS_CHILD|WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWNLIST
						26 + (cbW + cbSep)*2, //x
						dy + 34,             //y
						cbW,                 //nWidth
						160,                 //nHeight
						hWnd,                //hWndParent
						IDC_COMBOBOX_3,      //ID
						hInstanceDLL,        //hInstance
						0                    //lpParam
					);
					setWindowFont(hWndCombobox3);

					var selected = cryptor
						? getPrettyName(cryptor).split(/\s*\+\s*/)
						: [cryptorsLabels[1], cryptorsLabels[0], cryptorsLabels[0]];
					fillComboboxes(null, selected);
				}

				// GroupBox password
				hWndGroupPass = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					14,           //x
					13 + addY,    //y
					258,          //nWidth
					152 - p2h,    //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndGroupPass, label);

				// Static window: password label
				hWndPassLabel = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					32,           //x
					35 + addY,    //y
					223,          //nWidth
					13,           //nHeight
					hWnd,         //hWndParent
					IDC_STATIC,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndPassLabel, _localize("Enter &password:"));

				// Edit window: password
				hWndPass = createWindowEx(
					0x200,        //WS_EX_CLIENTEDGE
					"EDIT",       //lpClassName
					0,            //lpWindowName
					0x500100A0,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_PASSWORD
					29,           //x
					53 + addY,    //y
					229,          //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_PASS,     //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndPass, "");

				if(decryptObj || !isDecrypt) {
					// Static window: password 2 label
					hWndPass2Label = createWindowEx(
						0,               //dwExStyle
						"STATIC",        //lpClassName
						0,               //lpWindowName
						0x50000000,      //WS_VISIBLE|WS_CHILD
						32,              //x
						86 + addY,       //y
						223,             //nWidth
						13,              //nHeight
						hWnd,            //hWndParent
						IDC_PASS2_LABEL, //ID
						hInstanceDLL,    //hInstance
						0                //lpParam
					);
					setWindowFontAndText(hWndPass2Label, _localize("Reenter p&assword:"));

					// Edit window: password 2
					hWndPass2 = createWindowEx(
						0x200,        //WS_EX_CLIENTEDGE
						"EDIT",       //lpClassName
						0,            //lpWindowName
						0x500100A0,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL|ES_PASSWORD
						29,           //x
						104 + addY,   //y
						229,          //nWidth
						23,           //nHeight
						hWnd,         //hWndParent
						IDC_PASS2,    //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndPass2, "");
				}

				// Checkbox: show password
				hWndShowPass = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50010003,       //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					32,               //x
					138 + addY - p2h, //y
					211,              //nWidth
					16,               //nHeight
					hWnd,             //hWndParent
					IDC_SHOWPASS,     //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndShowPass, _localize("&Show password"));
				checked(hWndShowPass, showPassword);
				setShowPass(showPassword, decryptObj ? !decryptObj.value : !isDecrypt);

				// OK button window
				hWndOK = createWindowEx(
					0,                //dwExStyle
					"BUTTON",         //lpClassName
					0,                //lpWindowName
					0x50010001,       //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					13,               //x
					178 + addY - p2h, //y
					btnW,             //nWidth
					23,               //nHeight
					hWnd,             //hWndParent
					IDC_OK,           //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndOK, _localize("OK"));

				if(!modal) {
					// Apply button window
					hWndApply = createWindowEx(
						0,                 //dwExStyle
						"BUTTON",          //lpClassName
						0,                 //lpWindowName
						0x50010000,        //WS_VISIBLE|WS_CHILD|WS_TABSTOP
						13 + btnW + btnSp, //x
						178 + addY - p2h,  //y
						btnW,              //nWidth
						23,                //nHeight
						hWnd,              //hWndParent
						IDC_APPLY,         //ID
						hInstanceDLL,      //hInstance
						0                  //lpParam
					);
					setWindowFontAndText(hWndApply, _localize("Apply"));
				}

				// Cancel button window
				hWndCancel = createWindowEx(
					0,                                   //dwExStyle
					"BUTTON",                            //lpClassName
					0,                                   //lpWindowName
					0x50010000,                          //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					13 + (btnW + btnSp)*(modal ? 1 : 2), //x
					178 + addY - p2h,                    //y
					btnW,                                //nWidth
					23,                                  //nHeight
					hWnd,                                //hWndParent
					IDC_CANCEL,                          //ID
					hInstanceDLL,                        //hInstance
					0                                    //lpParam
				);
				setWindowFontAndText(hWndCancel, _localize("Cancel"));

				oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_PASS, 0);

				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);
			break;
			case 7: //WM_SETFOCUS
				var hWndFocus = hWndPass;
				if(!focusPass) {
					if(decryptObj) {
						if(checked(hWndEncrypt))      hWndFocus = hWndEncrypt;
						else if(checked(hWndDecrypt)) hWndFocus = hWndDecrypt;
					}
					else if(cryptorObj) {
						hWndFocus = hWndCombobox1;
					}
				}
				oSys.Call("user32::SetFocus", hWndFocus);
			break;
			case 256: //WM_KEYDOWN
				var ctrl = getKeyState(17 /*VK_CONTROL*/);
				var shift = getKeyState(16 /*VK_SHIFT*/);
				if(wParam == 27 /*VK_ESCAPE*/)
					oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
				else if(wParam == 13 /*VK_RETURN*/) {
					if(ctrl || shift) // Ctrl+Enter, Shift+Enter
						cmdApply();
					else // Enter
						oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_OK, 0);
				}
				else if(wParam == 90 /*Z*/) {
					if(ctrl && shift) // Ctrl+Shift+Z
						!editFocused() && AkelPad.Command(4152); // Redo
					else if(ctrl) // Ctrl+Z
						!editFocused() && AkelPad.Command(4151); // Undo
				}
				else if(ctrl && wParam == 67 /*C*/ || ctrl && wParam == 45 /*VK_INSERT*/) // Ctrl+C, Ctrl+Insert
					!editFocused() && AkelPad.Command(4154); //IDM_EDIT_COPY
				else if(ctrl && wParam == 86 /*V*/ || shift && wParam == 45 /*VK_INSERT*/) // Ctrl+V, Shift+Insert
					!editFocused() && noScroll(function() {
						AkelPad.Command(4155); //IDM_EDIT_PASTE
					});
				else if(ctrl && wParam == 88 /*X*/ || shift && wParam == 46 /*VK_DELETE*/) // Ctrl+X, Shift+Del
					!editFocused() && AkelPad.Command(4153); //IDM_EDIT_CUT
				else if(wParam == 46 /*VK_DELETE*/) // Delete
					!editFocused() && AkelPad.Command(4156); //IDM_EDIT_CLEAR
				else if(ctrl && wParam == 65 /*A*/) { // Ctrl+A
					!editFocused() && noScroll(function() {
						AkelPad.Command(4157); //IDM_EDIT_SELECTALL
					});
				}
				else if(ctrl && wParam == 83 /*S*/) // Ctrl+S
					AkelPad.Command(4105); // IDM_FILE_SAVE
				else if(wParam == 113 /*VK_F2*/) // F2
					switchDirection();
				else if(wParam == 114 /*VK_F3*/) // F3
					switchCryptor();
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_OK:
					case IDC_APPLY:
						var pass1 = windowText(hWndPass);
						if(!pass1)
							break;
						if(!readControlsState())
							break;
						var showPass = checked(hWndShowPass);
						var enc = decryptObj ? checked(hWndEncrypt) : !isDecrypt;
						if(!showPass && enc) { // Check second password
							var pass2 = windowText(hWndPass2);
							if(pass1 != pass2) {
								AkelPad.MessageBox(
									hWnd,
									_localize("Passwords do not match!"),
									dialogTitle + " :: " + getPrettyName(cryptorObj ? cryptorObj.value : cryptor),
									16 /*MB_ICONERROR*/
								);
								break;
							}
						}
						runned = true;
						if(idc == IDC_APPLY)
							saveSettings();
						pass = pass1;
						if(!modal) {
							if(decryptObj)
								isDecrypt = decryptObj.value;
							if(cryptorObj)
								cryptor = cryptorObj.value.join("+");
							var hWndFocused = oSys.Call("user32::GetFocus");
							controlsEnabled(false);
							var restoreFocus = !oSys.Call("user32::GetFocus");
							restoreFocus && AkelPad.SendMessage(hWnd, 7 /*WM_SETFOCUS*/, 0, 0);
							encryptOrDecrypt(pass);
							controlsEnabled(true);
							restoreFocus && oSys.Call("user32::SetFocus", hWndFocused);
						}
						if(idc == IDC_OK)
							closeDialog();
					break;
					case IDC_CANCEL:
						closeDialog();
					break;
					case IDC_ENCRYPT:
					case IDC_DECRYPT:
						checked(hWndEncrypt, idc == IDC_ENCRYPT);
						checked(hWndDecrypt, idc == IDC_DECRYPT);
						if((wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/)
							cmdApply();
					case IDC_SHOWPASS:
						setShowPass(checked(hWndShowPass), decryptObj ? checked(hWndEncrypt) : !isDecrypt);
					break;
					case IDC_COMBOBOX_1:
					case IDC_COMBOBOX_2:
					case IDC_COMBOBOX_3:
						if(wParam >> 16 == 1 /*CBN_SELCHANGE*/) {
							fillComboboxes(idc);
							updateControls();
						}
					break;
					case IDC_PASS:
						updateControls();
					case IDC_PASS2:
						var pass1 = windowText(hWndPass);
						var pass2 = windowText(hWndPass2);
						// Note: we don't show (probably annoying) warning while user types
						// correct password, e.g. no warning for "abc123" and "abc"
						var label = pass2 && pass2 != pass1.substr(0, pass2.length)
							? _localize("Reenter p&assword: [passwords do not match!]")
							: _localize("Reenter p&assword:");
						if(label != windowText(hWndPass2Label))
							windowText(hWndPass2Label, label);
				}
			break;
			case 16: //WM_CLOSE
				saveSettings();
				modal && enabled(hMainWnd, true); // Enable main window
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
	function setWindowFont(hWnd, hFont) {
		var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
		setWindowFont = function(hWnd, hFont) {
			AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont || hGuiFont, true);
		};
		setWindowFont(hWnd, hFont);
	}
	function setWindowFontAndText(hWnd, pText, hFont) {
		setWindowFont(hWnd, hFont);
		windowText(hWnd, pText);
	}
	function fillCombobox(hWndCombobox, labels, selected) {
		var c = AkelPad.SendMessage(hWndCombobox, 0x146 /*CB_GETCOUNT*/, 0, 0);
		while(--c >= 0)
			AkelPad.SendMessage(hWndCombobox, 0x144 /*CB_DELETESTRING*/, c, 0);

		for(var i = 0, l = labels.length; i < l; ++i)
			oSys.Call("user32::SendMessage" + _TCHAR, hWndCombobox, 0x143 /*CB_ADDSTRING*/, 0, labels[i]);

		if(selected) {
			oSys.Call("user32::SendMessage" + _TCHAR, hWndCombobox, 0x14D /*CB_SELECTSTRING*/, -1, selected);
		}
	}
	function fillComboboxes(idc, selected) {
		selected = selected || [
			windowText(hWndCombobox1).replace(/^\*/, ""),
			windowText(hWndCombobox2).replace(/^\*/, ""),
			windowText(hWndCombobox3).replace(/^\*/, "")
		];
		if(!isValidName(selected[0]))
			selected[0] = cryptorsLabels[1];
		if(!isValidName(selected[1]))
			selected[1] = selected[2] = cryptorsLabels[0];
		if(!isValidName(selected[2]))
			selected[2] = cryptorsLabels[0];
		function isUsed(s, n) {
			for(var i = 0; i <= 2; ++i)
				if(i != n && s == selected[i] && s != cryptorsLabels[0])
					return "*";
			return "";
		}
		function fill(n, hWndCombobox) {
			var baseLabels = n ? cryptorsLabels : validCryptors;
			var labels = [];
			var sel = selected[n];
			for(var i = 0, l = baseLabels.length; i < l; ++i) {
				var s = baseLabels[i];
				var used = isUsed(s, n);
				if(s == sel)
					sel = used + s;
				labels.push(used + s);
			}
			fillCombobox(hWndCombobox, labels, sel);
		}
		if(idc != IDC_COMBOBOX_1)
			fill(0, hWndCombobox1);
		if(idc != IDC_COMBOBOX_2)
			fill(1, hWndCombobox2);
		if(idc != IDC_COMBOBOX_3)
			fill(2, hWndCombobox3);
	}
	function readControlsState() {
		if(decryptObj) {
			if(checked(hWndEncrypt))
				decryptObj.value = false;
			else if(checked(hWndDecrypt))
				decryptObj.value = true;
			else
				return false;
		}

		if(cryptorObj) {
			var s1 = windowText(hWndCombobox1).replace(/^\*/, "");
			var s2 = windowText(hWndCombobox2).replace(/^\*/, "");
			var s3 = windowText(hWndCombobox3).replace(/^\*/, "");
			var sNone = cryptorsLabels[0];
			if(s1 == s2 || s1 == s3 || s2 == s3 && s2 != sNone)
				return false;
			var names = [s1.toLowerCase()];
			if(s2 != sNone)
				names.push(s2.toLowerCase());
			if(s3 != sNone)
				names.push(s3.toLowerCase());
			cryptorObj.value = names;
		}

		return true;
	}
	function checked(hWnd, val) {
		return arguments.length == 1
			? AkelPad.SendMessage(hWnd, 240 /*BM_GETCHECK*/, 0, 0)
			: AkelPad.SendMessage(hWnd, 241 /*BM_SETCHECK*/, val ? 1 /*BST_CHECKED*/ : 0, 0);
	}
	function enabled(hWnd, val) {
		return arguments.length == 1
			? oSys.Call("user32::IsWindowEnabled", hWnd)
			: oSys.Call("user32::EnableWindow", hWnd, val);
	}
	function controlsEnabled(val) {
		enabled(hWndOK, val);
		hWndApply && enabled(hWndApply, val);
		// Note: main window will be inaccessible anyway
		// (and all user actions will be applied after all our operations)
		!modal && enabled(hMainWnd, val);
	}
	function updateControls() {
		var hasPass = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndPass) > 0;
		var ok = readControlsState();
		enabled(hWndOK, hasPass && ok);
		hWndApply && enabled(hWndApply, hasPass && ok);
		enabled(hWndPass2, hasPass);
	}
	function showWindow(hWnd, val) {
		oSys.Call("user32::ShowWindow", hWnd, val);
	}
	function switchDirection() {
		if(decryptObj)
			switchRadio(hWndEncrypt, hWndDecrypt);
	}
	function switchCryptor() {
		var hWndFocused = oSys.Call("user32::GetFocus");
		var candidates;
		if(hWndFocused == hWndCombobox1)
			candidates = [hWndCombobox2, hWndCombobox3];
		else if(hWndFocused == hWndCombobox2)
			candidates = [hWndCombobox3, hWndCombobox1];
		else
			candidates = [hWndCombobox1, hWndCombobox2, hWndCombobox3];
		for(var i = 0, l = candidates.length; i < l; ++i) {
			var hWndFocus = candidates[i];
			if(enabled(hWndFocus)) {
				oSys.Call("user32::SetFocus", hWndFocus);
				break;
			}
		}
	}
	function switchRadio() {
		var hWndChecked = arguments[0];
		for(var i = 0, l = arguments.length; i < l; ++i) {
			if(checked(arguments[i])) {
				checked(arguments[i], false);
				hWndChecked = arguments[++i == l ? 0 : i];
				break;
			}
		}
		oSys.Call(
			"user32::PostMessage" + _TCHAR,
			hWndDialog,
			273 /*WM_COMMAND*/,
			oSys.Call("user32::GetDlgCtrlID", hWndChecked),
			0
		);
	}
	function cmdApply() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, hWndApply ? IDC_APPLY : IDC_OK, 0);
	}
	function closeDialog() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
	}
	function getKeyState(key) {
		return oSys.Call("user32::GetAsyncKeyState", key) & 0x8000; // Fix 4-byte result in AkelPad x64
	}
	function setShowPass(showPass, showSecondField) {
		showSecondField = !showPass && showSecondField;
		hWndPass2Label && showWindow(hWndPass2Label, showSecondField);
		hWndPass2      && showWindow(hWndPass2,      showSecondField);
		var g = arguments.callee;
		if(!g._passChar)
			g._passChar = AkelPad.SendMessage(hWndPass, 0x00D2/*EM_GETPASSWORDCHAR*/, 0, 0) || 0x002A;
		var passChar = showPass ? 0 : g._passChar;
		AkelPad.SendMessage(hWndPass, 0x00CC/*EM_SETPASSWORDCHAR*/, passChar, 0);
		oSys.Call("user32::InvalidateRect", hWndPass, 0, true);
	}
	function editFocused() {
		var hWndFocused = oSys.Call("user32::GetFocus");
		return hWndFocused == hWndPass || hWndFocused == hWndPass2;
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
	return pass;
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

if(AkelPad.IsInclude()) {
	// this.foo = ... doesn't work:
	// https://akelpad.sourceforge.net/forum/viewtopic.php?p=18304#p18304
	// But declarations without "var" becomes global
	var _exports = {
		cryptors: cryptors,
		encrypt: encrypt,
		decrypt: decrypt,
		getHash: getHash,
		passwordPrompt: passwordPrompt,
		packHex: packHex,
		utf8: Utf8,
		base64: base64,
		trimBase64String: trimBase64String,
		isBase64: isBase64,
		sjcl: sjcl
	};
	var _f = [];
	for(var _p in _exports)
		_f[_f.length] = "if(typeof " + _p + " == 'undefined') " + _p + " = e." + _p + ";";
	// Go to the global scope
	new Function("e", _f.join("\n"))(_exports);
}

})();