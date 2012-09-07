// http://akelpad.sourceforge.net/forum/viewtopic.php?p=12843#12843
// http://infocatcher.ucoz.net/js/akelpad_scripts/crypt.js

// (c) Infocatcher 2010-2012
// version 0.4.1 - 2012-01-04

//===================
// AES-256 and Blowfish encrypt/decrypt
// Based on scripts from http://www.movable-type.co.uk/scripts/aes.html and http://www.farfarfar.com/scripts/encrypt/

// Simple encryption:
//   text = encrypt(text, pass)
//   text = base64(text)

// Double encryption:
//   text = encrypt_1(text, pass)
//   text = encrypt_2(text, hash(pass))
//   text = base64(text)

// Used SHA-512 hash function for AES-256 password (because of Blowfish key length limitations)

// Hotkeys:
//   Enter                    - Ok
//   Ctrl+Enter, Shift+Enter  - Apply
//   Escape                   - Cancel
//   Ctrl+Z                   - Undo
//   Ctrl+Shift+Z             - Redo
//   Ctrl+C, Ctrl+Insert      - Copy
//   Ctrl+V, Shift+Insert     - Paste
//   Ctrl+X, Shift+Del        - Cut
//   Delete                   - Delete selection
//   Ctrl+A                   - Select all
//   Ctrl+S                   - Save file

// Arguments:
//   -mode=0             - (default) ask user about direction (encrypt or decrypt)
//        =1             - encrypt
//        =2             - decrypt
//   -modal=true         - use modal dialog
//   -cryptor="AES256"   - encryption algorithm: "AES256", "Blowfish", "AES256_Blowfish" or "Blowfish_AES256"
//   -maxLineWidth=75    - allow split output to lines with fixed width
//   -showPassword=true  - force show or hide password
//   -onlySelected=true  - use only selected text
//   -warningTime=4000   - show warning for slow calculations
//   -test=true          - run tests
//   -saveOptions=0      - don't store options
//               =1      - (default) save options after encrypt/decrypt
//               =2      - save options on exit
//   -savePosition=true  - allow store last window position

// Usage:
//   Call("Scripts::Main", 1, "crypt.js")
//   Call("Scripts::Main", 1, "crypt.js", "-mode=1 -cryptor='AES256'")     - encrypt
//   Call("Scripts::Main", 1, "crypt.js", "-mode=2 -cryptor='AES256'")     - decrypt
//   Call("Scripts::Main", 1, "crypt.js", "-mode=0 -maxLineWidth=0 -showPassword=true -saveOptions=0")
//===================

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
		"Required time: %S (estimate)\nContinue?": {
			ru: "Требуется времени: %S (оценочно)\n Продолжить?"
		},
		"Passwords do not match!": {
			ru: "Пароли не совпадают!"
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
		"AES-&256": {
			ru: "AES-&256"
		},
		"&Blowfish": {
			ru: "&Blowfish"
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
var mode         = getArg("mode", MODE_USER_SELECT);
var modalDlg     = getArg("modal", false);
var cryptor      = getArg("cryptor", "").toLowerCase();
var maxLineWidth = getArg("maxLineWidth", 75);
var showPassword = getArg("showPassword");
var onlySelected = getArg("onlySelected", false);
var warningTime  = getArg("warningTime", 4000);
var test         = getArg("test");
var saveOptions  = getArg("saveOptions", 1);
var savePosition = getArg("savePosition", true);

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
Aes.Ctr.encrypt = function(plaintext, password, nBits, rawOutput) {
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
  if(!rawOutput)
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
Aes.Ctr.decrypt = function(ciphertext, password, nBits, rawInput) {
  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  if (!(nBits==128 || nBits==192 || nBits==256)) return '';  // standard allows 128/192/256 bit keys
  if(!rawInput)
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
function addPadding(str, divisible, len) {
	var standardPadding = false;
	var paddingLen;
	if (len % divisible !== 0) {
		paddingLen = divisible - (len % divisible);
	} else {
		paddingLen = 0;
	}
	if (standardPadding) {
		for (var i = 0; i < paddingLen; i++) {
			str += String.fromCharCode(paddingLen);
		}
	} else {
		for (var i = 0; i < paddingLen; i++) {
			str += "\x00";
		}
	}
	return str;
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
		throw "Your key length must be between 0 and 448 bits long";
	this.resetKey();
	var data;
	var keys = strToBytes(key);
	var keyBytes = keys.length;
	var i = 0,
		j = 0;
	for (i = 0; i < 18; i++) {
		data = 0x00000000;
		for (var k = 0; k < 4; k++) {
			data = ((data << 8) | (keys[j]));
			j++;
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
	for (i = 0; i < 4; i++) {
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
		throw "You must initialize a key!";
	}
	var out = [];
	str = addPadding(str, 8, str.length);
	str = strToBigEndianArray(str);
	var t = str;
	var t2;
	for (var i = 0; i < t.length; i += 2) {
		t2 = this.encipher(t[i], t[i + 1]);
		out.push(t2[0], t2[1]);
	}
	return hexToStr(bigEndianArrayToHex(out));
};
Blowfish.prototype.decrypt = function (str) {
	var out = [];
	var t = strToBigEndianArray(str);
	var t2;
	for (var i = 0; i < t.length; i += 2) {
		t2 = this.decipher(t[i], t[i + 1]);
		out.push(t2[0], t2[1]);
	}
	return hexToStr(bigEndianArrayToHex(out));
};
Blowfish.prototype.encipher = function (xl, xr) {
	xl ^= this.pArray[0];
	xr ^= this.f(xl) ^ this.pArray[1];
	xl ^= this.f(xr) ^ this.pArray[2];
	xr ^= this.f(xl) ^ this.pArray[3];
	xl ^= this.f(xr) ^ this.pArray[4];
	xr ^= this.f(xl) ^ this.pArray[5];
	xl ^= this.f(xr) ^ this.pArray[6];
	xr ^= this.f(xl) ^ this.pArray[7];
	xl ^= this.f(xr) ^ this.pArray[8];
	xr ^= this.f(xl) ^ this.pArray[9];
	xl ^= this.f(xr) ^ this.pArray[10];
	xr ^= this.f(xl) ^ this.pArray[11];
	xl ^= this.f(xr) ^ this.pArray[12];
	xr ^= this.f(xl) ^ this.pArray[13];
	xl ^= this.f(xr) ^ this.pArray[14];
	xr ^= this.f(xl) ^ this.pArray[15];
	xl ^= this.f(xr);
	return [xr ^ this.pArray[17], xl ^ this.pArray[16]];
};
Blowfish.prototype.decipher = function (xl, xr) {
	xl ^= this.pArray[17];
	xr ^= this.f(xl) ^ this.pArray[16];
	xl ^= this.f(xr) ^ this.pArray[15];
	xr ^= this.f(xl) ^ this.pArray[14];
	xl ^= this.f(xr) ^ this.pArray[13];
	xr ^= this.f(xl) ^ this.pArray[12];
	xl ^= this.f(xr) ^ this.pArray[11];
	xr ^= this.f(xl) ^ this.pArray[10];
	xl ^= this.f(xr) ^ this.pArray[9];
	xr ^= this.f(xl) ^ this.pArray[8];
	xl ^= this.f(xr) ^ this.pArray[7];
	xr ^= this.f(xl) ^ this.pArray[6];
	xl ^= this.f(xr) ^ this.pArray[5];
	xr ^= this.f(xl) ^ this.pArray[4];
	xl ^= this.f(xr) ^ this.pArray[3];
	xr ^= this.f(xl) ^ this.pArray[2];
	xl ^= this.f(xr);
	return [(xr ^ this.pArray[0]), xl ^ this.pArray[1]];
};
Blowfish.prototype.f = function (x) {
	var str = ((this.sBox[0][(x >>> 24) & 0xff] + this.sBox[1][(x >>> 16) & 0xff]) ^ this.sBox[2][(x >>> 8) & 0xff])
		+ this.sBox[3][x & 0xff];
	return str;
};

function blowfishEncrypt(text, pass, rawOutput) {
	text = Utf8.encode(text.replace(/\x00+$/, "")); // We can get \0 at end after decrypt sometimes
	pass = Utf8.encode(pass);
	var bf = new Blowfish();
	bf.setKey(pass);
	text = bf.encrypt(text);
	if(!rawOutput)
		text = Base64.encode(text);
	return text;
}
function blowfishDecrypt(text, pass, rawInput) {
	if(!rawInput)
		text = Base64.decode(text);
	pass = Utf8.encode(pass);
	var bf = new Blowfish();
	bf.setKey(pass);
	return Utf8.decode(bf.decrypt(text)).replace(/\x00+$/, "");
}

//===================

function SHA512(str, variant) {
	// http://www.farfarfar.com/scripts/encrypt/
	//str_sha(val, "SHA-224")
	//str_sha(val, "SHA-384")
	//str_sha(val, "SHA-512")

	//str = convertFromUnicode(str, codePage);
	str = Utf8.encode(str);

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

//===================

var hashStaticSalt = "ji&Qm1t0I2,eZF1G"; // Say hello to rainbow tables :)
var cryptors = {
	// speed: symbols/ms [encryptSpeed, decryptSpeed]
	aes256: {
		prettyName: "AES-256",
		speed: [19.3, 28.3],
		encrypt: function(text, pass) {
			return Aes.Ctr.encrypt(text, pass, 256);
		},
		decrypt: function(text, pass) {
			return Aes.Ctr.decrypt(text, pass, 256);
		}
	},
	blowfish: {
		prettyName: "Blowfish",
		speed: [78.5, 113.2],
		encrypt: blowfishEncrypt,
		decrypt: blowfishDecrypt
	},
	aes256_blowfish: {
		prettyName: "AES-256 + Blowfish",
		speed: [14.3, 31.5],
		encrypt: function(text, pass) {
			text = Aes.Ctr.encrypt(text, SHA512(pass + hashStaticSalt, "SHA-512"), 256, true);
			text = blowfishEncrypt(text, pass);
			return text;
		},
		decrypt: function(text, pass) {
			text = blowfishDecrypt(text, pass);
			text = Aes.Ctr.decrypt(text, SHA512(pass + hashStaticSalt, "SHA-512"), 256, true);
			return text;
		}
	},
	blowfish_aes256: {
		prettyName: "Blowfish + AES-256",
		speed: [11.1, 24.4],
		encrypt: function(text, pass) {
			text = blowfishEncrypt(text, pass, true);
			text = Aes.Ctr.encrypt(text, SHA512(pass + hashStaticSalt, "SHA-512"), 256);
			return text;
		},
		decrypt: function(text, pass) {
			text = Aes.Ctr.decrypt(text, SHA512(pass + hashStaticSalt, "SHA-512"), 256);
			text = blowfishDecrypt(text, pass, true);
			return text;
		}
	}
};


var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var oSet = AkelPad.ScriptSettings();
var hWndEdit = AkelPad.GetEditWnd();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

if(hMainWnd && (typeof AkelPad.IsInclude == "undefined" || !AkelPad.IsInclude())) {
	if(test || test === undefined && !AkelPad.SendMessage(hMainWnd, 1185 /*AKD_GETTEXTLENGTH*/, hWndEdit, 0))
		cryptTest();
	else if(!modalDlg)
		cryptDialog();
	else if(!AkelPad.GetEditReadOnly(hWndEdit))
		encryptOrDecrypt();
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

	if(!pass && cryptor && !cryptors[cryptor]) {
		var msg = _localize("Cryptor “%S” not found!").replace("%S", cryptor);
		AkelPad.MessageBox(hMainWnd, msg, dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
		cryptor = "";
	}

	if(!pass && (mode == MODE_USER_SELECT || !cryptor)) {
		if(mode == MODE_USER_SELECT)
			var decryptObj = { value: isBase64(trimBase64String(text)) };
		if(!cryptor)
			var cryptorObj = { value: "" };
		var pass = passwordPrompt(
			dialogTitle + (cryptor ? " :: " + cryptors[cryptor].prettyName : ""),
			_localize(mode == MODE_ENCRYPT ? "Encrypt" : mode == MODE_DECRYPT ? "Decrypt" : "Password"),
			modalDlg,
			decryptObj,
			cryptorObj
		);
		if(!pass) // Cancel
			return;
		if(decryptObj)
			decrypt = decryptObj.value;
		if(cryptorObj)
			cryptor = cryptorObj.value;
	}

	var cryptorData = cryptors[cryptor];

	if(decrypt) {
		text = trimBase64String(text);
		if(!isBase64(text)) {
			AkelPad.MessageBox(
				hMainWnd,
				_localize("Impossible to decrypt: invalid format!"),
				dialogTitle + " :: " + cryptorData.prettyName,
				16 /*MB_ICONERROR*/
			);
			return;
		}
	}

	if(!pass) {
		pass = passwordPrompt(
			dialogTitle + " :: " + cryptorData.prettyName,
			_localize(decrypt ? "Decrypt" : "Encrypt"),
			modalDlg
		);
	}
	if(!pass) // Cancel
		return;

	if(warningTime > 0) {
		var speed = cryptorData.speed[decrypt ? 1 : 0];
		//var remTime = text.length/speed;

		var part = text.substr(0, Math.max(500, 60*speed));
		var t = new Date().getTime();
		try {
			cryptorData[decrypt ? "decrypt" : "encrypt"](part, pass);
		}
		catch(e) {
		}
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
					hMainWnd,
					_localize("Required time: %S (estimate)\nContinue?").replace("%S", m + ":" + s),
					dialogTitle + " :: " + cryptorData.prettyName,
					33 /*MB_OKCANCEL|MB_ICONQUESTION*/
				) == 2 /*IDCANCEL*/
			)
				return;
		}
	}

	//var t = new Date().getTime();
	try {
		var res = cryptorData[decrypt ? "decrypt" : "encrypt"](text, pass);
	}
	catch(e) {
		AkelPad.MessageBox(
			hMainWnd,
			e.name ? e.name + "\n" + e.message : e,
			dialogTitle + " :: " + cryptorData.prettyName,
			16 /*MB_ICONERROR*/
		);
		return;
	}
	if(!decrypt && maxLineWidth > 0)
		res = res.replace(new RegExp(".{" + maxLineWidth + "}", "g"), "$&\n");
	//WScript.Echo(text.length/(new Date().getTime() - t));

	insertNoScroll(res, selectAll);
}
function trimBase64String(str) {
	return str.replace(/^\s+|[\n\r]+|[\s\x00]+$/g, "");
}
function isBase64(str) {
	return str.length % 4 == 0 && !/[^a-zA-Z0-9+\/]/.test(str.replace(/=+$/, ""));
}

function cryptTest() {
	//var u = "";
	//for(var i = 0; i <= 0xffff; i++)
	//	u += String.fromCharCode(i);
	var texts = [
		"Abcdef0123",
		"Abef015@#$%^&*()-_=+/\\\n!\r\t'\" ",
		"Qw\u0419\u0446\u0443\u043a\uffe0\uffe1\uf900\x00\uff4d\n5\r\u210c\t\u215e\uffc7\uac06\u0e04\uff66"
	];
	var passwords = [
		"ab01",
		"Qw987-_=+\\|%^$;:'\t !~ *",
		"Af46\u0424\u044b\u0432\u0430\u0107\u03b1\u05dc\uac03\t\uff25\uff3d\uffed\u8030\u0108\u01b6 \u4e42",
		"Rt\u041a\u0435\u043d\x00 \r\n\u4e5b\u75bb\ufb44"
	];
	var ok = 0;
	var fail = [];
	var t = new Date().getTime();
	for(var it = 0, lt = texts.length; it < lt; it++) {
		var text = texts[it];
		for(var ip = 0, lp = passwords.length; ip < lp; ip++) {
			var pass = passwords[ip];
			for(var cr in cryptors) {
				var crData = cryptors[cr];
				var enc = crData.encrypt(text, pass);
				var dec = crData.decrypt(enc, pass);
				if(dec == text)
					ok++;
				else {
					fail[fail.length] = (crData.prettyName || cr) + " (" + it + ", " + ip + ") fail:\n"
						+ esc(text) + "\n=>\n"
						+ esc(enc)  + "\n=>\n"
						+ esc(dec);
				}
			}
		}
	}
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

function cryptDialog() {
	var decryptObj = mode != MODE_USER_SELECT
		? null
		: {
			value: isBase64(trimBase64String(
				AkelPad.GetSelText() || (onlySelected ? "" : getAllText())
			))
		};
	var cryptorObj = cryptor && cryptors[cryptor]
		? null
		: {};
	passwordPrompt(
		dialogTitle + (cryptor && cryptors[cryptor] ? " :: " + cryptors[cryptor].prettyName : ""),
		_localize(mode == MODE_ENCRYPT ? "Encrypt" : mode == MODE_DECRYPT ? "Decrypt" : "Password"),
		false,
		decryptObj,
		cryptorObj
	);
}

function passwordPrompt(caption, label, modal, decryptObj, cryptorObj) {
	var hInstanceDLL = AkelPad.GetInstanceDll();
	var dialogClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");

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
	function saveSettings(runned) {
		if(!saveOptions && !savePosition)
			return;
		if(!oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
			return;
		if(runned ? saveOptions : saveOptions == 2 && readRadiosState()) {
			oSet.Write("cryptor", 3 /*PO_STRING*/, cryptorObj ? cryptorObj.value : cryptor);
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

	if(!cryptors[cryptor])
		cryptor = "aes256";
	if(showPassword === undefined)
		showPassword = false;

	var pass;

	var IDC_STATIC       = -1;
	var IDC_ENCRYPT      = 1001;
	var IDC_DECRYPT      = 1002;
	var IDC_AES256       = 1003;
	var IDC_BLOWFISH     = 1004;
	var IDC_AES_BLOWFISH = 1005;
	var IDC_BLOWFISH_AES = 1006;
	var IDC_PASS         = 1007;
	var IDC_PASS2        = 1008;
	var IDC_PASS2_LABEL  = 1009;
	var IDC_SHOWPASS     = 1010;
	var IDC_OK           = 1011;
	var IDC_APPLY        = 1012;
	var IDC_CANCEL       = 1013;

	var hWndGroupDir, hWndEncrypt, hWndDecrypt;
	var hWndGroupCryptor, hWndAES256, hWndBlowfish, hWndAESBlowfish, hWndBlowfishAES;
	var hWndGroupPass, hWndPassLabel, hWndPass, hWndPass2Label, hWndPass2, hWndShowPass;
	var hWndOK, hWndApply, hWndCancel;

	var addY = (decryptObj ? 54 : 0) + (cryptorObj ? 54 + 18 : 0);
	var p2h = decryptObj || !decrypt ? 0 : 52; // Show or hide second password field
	var btnW = modal ? 124 : 79;
	var btnSp = 12;

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
				function setWindowFontAndText(hWnd, hFont, pText) {
					AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
					windowText(hWnd, pText);
				}

				var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);

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
					setWindowFontAndText(hWndGroupDir, hGuiFont, _localize("Direction"));

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
					setWindowFontAndText(hWndEncrypt, hGuiFont, _localize("&Encrypt"));
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
					setWindowFontAndText(hWndDecrypt, hGuiFont, _localize("&Decrypt"));
					checked(hWndDecrypt, decryptObj.value);
				}

				if(cryptorObj) {
					var cr = cryptorObj.value || cryptor;
					if(!cryptors[cr])
						cr = "aes256";

					// GroupBox cryptor
					hWndGroupCryptor = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000007,   //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
						14,           //x
						dy + 13,      //y
						258,          //nWidth
						44 + 18,           //nHeight
						hWnd,         //hWndParent
						IDC_STATIC,   //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndGroupCryptor, hGuiFont, _localize("Encryption algorithm"));

					// Radiobutton AES256
					hWndAES256 = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
						26,           //x
						dy + 33,      //y
						113,          //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_AES256,   //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndAES256, hGuiFont, _localize("AES-&256"));
					checked(hWndAES256, cr == "aes256");

					// Radiobutton Blowfish
					hWndBlowfish = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
						145,          //x
						dy + 33,      //y
						113,          //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_BLOWFISH, //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndBlowfish, hGuiFont, _localize("&Blowfish"));
					checked(hWndBlowfish, cr == "blowfish");

					// Radiobutton AES256 + Blowfish
					hWndAESBlowfish = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
						26,           //x
						dy + 32 + 19,      //y
						113,          //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_AES_BLOWFISH,   //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndAESBlowfish, hGuiFont, _localize("AES-2&56 + Blowfish"));
					checked(hWndAESBlowfish, cr == "aes256_blowfish");

					// Radiobutton Blowfish + AES256
					hWndBlowfishAES = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
						145,          //x
						dy + 32 + 19,      //y
						113,          //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						IDC_BLOWFISH_AES, //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndBlowfishAES, hGuiFont, _localize("Blowfish + AES-25&6"));
					checked(hWndBlowfishAES, cr == "blowfish_aes256");
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
				setWindowFontAndText(hWndGroupPass, hGuiFont, label);

				// Static window: password label
				hWndPassLabel = createWindowEx(
					0,            //dwExStyle
					"STATIC",     //lpClassName
					0,            //lpWindowName
					0x50000000,   //WS_VISIBLE|WS_CHILD
					32,           //x
					35 + addY,    //y
					211,          //nWidth
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
					229,          //nWidth
					23,           //nHeight
					hWnd,         //hWndParent
					IDC_PASS,     //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndPass, hGuiFont, "");

				if(decryptObj || !decrypt) {
					// Static window: password 2 label
					hWndPass2Label = createWindowEx(
						0,               //dwExStyle
						"STATIC",        //lpClassName
						0,               //lpWindowName
						0x50000000,      //WS_VISIBLE|WS_CHILD
						32,              //x
						86 + addY,       //y
						211,             //nWidth
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
						229,          //nWidth
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
					211,              //nWidth
					16,               //nHeight
					hWnd,             //hWndParent
					IDC_SHOWPASS,     //ID
					hInstanceDLL,     //hInstance
					0                 //lpParam
				);
				setWindowFontAndText(hWndShowPass, hGuiFont, _localize("&Show password"));
				checked(hWndShowPass, showPassword);
				setShowPass(showPassword, decryptObj ? !decryptObj.value : !decrypt);

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
				setWindowFontAndText(hWndOK, hGuiFont, _localize("OK"));

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
					setWindowFontAndText(hWndApply, hGuiFont, _localize("Apply"));
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
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));

				oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 273 /*WM_COMMAND*/, IDC_PASS, 0);

				//centerWindow(hWnd, hMainWnd);
				restoreWindowPosition(hWnd, hMainWnd);
			break;
			case 7: //WM_SETFOCUS
				var hWndFocus = hWndPass;
				if(decryptObj) {
					if(checked(hWndEncrypt))      hWndFocus = hWndEncrypt;
					else if(checked(hWndDecrypt)) hWndFocus = hWndDecrypt;
				}
				oSys.Call("user32::SetFocus", hWndFocus);
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
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_OK:
					case IDC_APPLY:
						var pass1 = windowText(hWndPass);
						if(!pass1)
							break;
						if(!readRadiosState())
							break;
						var showPass = checked(hWndShowPass);
						var enc = decryptObj ? checked(hWndEncrypt) : !decrypt;
						if(!showPass && enc) { // Check second password
							var pass2 = windowText(hWndPass2);
							if(pass1 != pass2) {
								AkelPad.MessageBox(
									hWnd,
									_localize("Passwords do not match!"),
									dialogTitle + " :: " + cryptors[cryptorObj && cryptorObj.value || cryptor].prettyName,
									16 /*MB_ICONERROR*/
								);
								break;
							}
						}
						if(idc == IDC_APPLY)
							saveSettings(true);
						pass = pass1;
						if(!modal) {
							if(decryptObj)
								decrypt = decryptObj.value;
							if(cryptorObj)
								cryptor = cryptorObj.value;
							controlsEnabled(false);
							encryptOrDecrypt(pass);
							controlsEnabled(true);
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
						setShowPass(checked(hWndShowPass), decryptObj ? checked(hWndEncrypt) : !decrypt);
					break;
					case IDC_AES256:
					case IDC_BLOWFISH:
					case IDC_AES_BLOWFISH:
					case IDC_BLOWFISH_AES:
						checked(hWndAES256,      idc == IDC_AES256);
						checked(hWndBlowfish,    idc == IDC_BLOWFISH);
						checked(hWndAESBlowfish, idc == IDC_AES_BLOWFISH);
						checked(hWndBlowfishAES, idc == IDC_BLOWFISH_AES);
						if((wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/)
							cmdApply();
					break;
					case IDC_PASS:
					case IDC_PASS2:
						var hasPass = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndPass) > 0;
						enabled(hWndOK, hasPass);
						hWndApply && enabled(hWndApply, hasPass);
						enabled(hWndPass2, hasPass);
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
	function readRadiosState() {
		if(decryptObj) {
			if(checked(hWndEncrypt))
				decryptObj.value = false;
			else if(checked(hWndDecrypt))
				decryptObj.value = true;
			else
				return false;
		}

		if(cryptorObj) {
			if(checked(hWndAES256))
				cryptorObj.value = "aes256";
			else if(checked(hWndBlowfish))
				cryptorObj.value = "blowfish";
			else if(checked(hWndAESBlowfish))
				cryptorObj.value = "aes256_blowfish";
			else if(checked(hWndBlowfishAES))
				cryptorObj.value = "blowfish_aes256";
			else
				return false;
		}

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
	function controlsEnabled(val) {
		enabled(hWndOK, val);
		enabled(hWndApply, val);
		!modal && enabled(hMainWnd, val);
	}
	function showWindow(hWnd, val) {
		oSys.Call("user32::ShowWindow", hWnd, val);
	}
	function cmdApply() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, hWndApply ? IDC_APPLY : IDC_OK, 0);
	}
	function closeDialog() {
		oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
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