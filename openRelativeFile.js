// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11346#11346
// http://infocatcher.ucoz.net/js/akelpad_scripts/openRelativeFile.js

// (c) Infocatcher 2011
// version 0.1.6 - 2011-02-18

//===================
// Tries to open file with relative path
// System association is used for opening binary files
// Supports Mozilla's chrome.manifest files (https://developer.mozilla.org/en/chrome_registration)

// Usage:
//   Call("Scripts::Main", 1, "openRelativeFile.js")
//===================

//== Settings begin
// You can use openRelativeFile-options.js file for override settings

//var paths = ["%ProgramFiles%\\Something"];
var paths = [];

var delimitersStart = {
	'"': true,
	"'": true,
	"<": true,
	"[": true,
	"(": true,
	">": true,
	"=": true
};
var delimitersEnd = {
	'"': true,
	"'": true,
	">": true,
	"]": true,
	")": true,
	"<": true
};
var delimitersSpaces = {
	" ": true,
	"\t": true,
	"\n": true,
	"\r": true,
	"\0": true
};
var delimitersStop = {
	"\n": true,
	"\r": true,
	"\0": true
};

var maxLength = 2000;
//== Settings end

var optionsPath = WScript.ScriptFullName.replace(/(\.[^.]+)?$/, "-options$&");
if(new ActiveXObject("Scripting.FileSystemObject").FileExists(optionsPath))
	eval(AkelPad.ReadFile(optionsPath));

var hMainWnd=AkelPad.GetMainWnd();
var fso = new ActiveXObject("Scripting.FileSystemObject");
var wsh = new ActiveXObject("WScript.Shell");

if(hMainWnd)
	openRelativeFile();

function openRelativeFile() {
	var pathStart, pathEnd;

	var ss = AkelPad.GetSelStart();
	var se = AkelPad.GetSelEnd();

	if(ss != se)
		ss++, se--;

	var startsWithSpace = false;
	var cnt = 0;
	for(;;) {
		var chr = AkelPad.GetTextRange(--ss, ss + 1);
		if(chr in delimitersSpaces && pathStart == undefined) {
			startsWithSpace = true;
			pathStart = ss + 1;
		}
		else if(chr in delimitersStart) {
			startsWithSpace = false;
			pathStart = ss + 1;
			break;
		}
		if(chr in delimitersStop)
			break;
		if(ss == 0) // Start of file
			break;
		if(++cnt > maxLength)
			break;
	}
	if(pathStart == undefined)
		return false;

	for(;;) {
		var chr = AkelPad.GetTextRange(se, ++se);
		if(!chr) // End of file
			break;
		if(chr in delimitersSpaces && pathEnd == undefined) {
			pathEnd = se - 1;
			if(startsWithSpace)
				break;
		}
		else if(chr in delimitersEnd) {
			pathEnd = se - 1;
			break;
		}
		if(chr in delimitersStop)
			break;
		if(++cnt > maxLength)
			break;
	}
	if(pathEnd == undefined)
		return false;

	var relPath = AkelPad.GetTextRange(pathStart, pathEnd)
		.replace(/#.*$/, "")
		.replace(/\?.*$/, "");
	try {
		relPath = decodeURIComponent(relPath);
	}
	catch(e) {
	}

	var path;

	var curPath = AkelPad.GetEditFile(0);
	var curDir = fso.GetParentFolderName(curPath);
	var tmp = curDir + "\\" + relPath;
	if(fso.FileExists(tmp))
		path = tmp;
	else {
		if(/^(chrome|resource):\/\//.test(relPath)) {
			tmp = parseChromePath(curDir, relPath);
			if(tmp)
				path = tmp;
		}
		if(!path && /^\w+:\//.test(relPath)) {
			var tokens = relPath.replace(/^\w+:/, "").split(/[\\\/]+/);
			for(;;) {
				tmp = getFile(curDir, tokens.concat());
				if(tmp) {
					path = tmp;
					break;
				}
				var newDir = curDir.replace(/[\\\/]+[^\\\/]+$/, "");
				if(!newDir || newDir == curDir)
					break;
				curDir = newDir;
			}
		}
		if(!path) {
			for(var i = 0, l = paths.length; i < l; i++) {
				tmp = wsh.ExpandEnvironmentStrings(paths[i]) + "\\" + relPath;
				if(fso.FileExists(tmp)) {
					path = tmp;
					break;
				}
			}
		}
	}
	if(!path)
		return false;

	AkelPad.SetSel(pathStart, pathEnd);
	if(isFileBinary(path)) // Use system association for binary files
		wsh.Exec('rundll32.exe shell32.dll,ShellExec_RunDLL "' + path + '"');
	else
		AkelPad.OpenFile(path);

	return true;
}
function parseChromePath(curDir, chromePath) {
	if(/^(resource):\/+([^\/]+)(\/.*)?/.test(chromePath)) {
		var protocol = RegExp.$1;
		var domain   = RegExp.$2;
		var path     = RegExp.$3;
	}
	else if(/^(\w+):\/+([^\/]+)\/([^\/]+)(\/.*)?/.test(chromePath)) {
		var protocol = RegExp.$1;
		var domain   = RegExp.$2;
		var type     = RegExp.$3;
		var path     = RegExp.$4;
	}
	else
		return false;

	for(;;) { // See https://developer.mozilla.org/en/chrome_registration
		var tmp = curDir + "\\chrome.manifest";
		if(fso.FileExists(tmp)) {
			var manifest = AkelPad.ReadFile(tmp);
			break;
		}
		var newDir = curDir.replace(/[\\\/]+[^\\\/]+$/, "");
		if(!newDir || newDir == curDir)
			return false;
		curDir = newDir;
	}
	if(!manifest)
		return false;

	var pattern;
	switch(protocol) {
		case "chrome":
			switch(type) {
				case "content":
					// content extensionname chrome/content/
					pattern = new RegExp("(^|[\\n\\r])content[ \\t]+" + escapeRegExp(domain) + "[ \\t]+(\\S+)");
				break;
				case "skin":
					// skin extensionname classic/1.0 chrome/skin/
					pattern = new RegExp("(^|[\\n\\r])skin[ \\t]+" + escapeRegExp(domain) + "[ \\t]+\\S+[ \\t]+(\\S+)");
				break;
				case "locale":
					// locale extensionname en-US chrome/locale/en-US/
					pattern = new RegExp("(^|[\\n\\r])locale[ \\t]+" + escapeRegExp(domain) + "[ \\t]+\\S+[ \\t]+(\\S+)");
			}
		break;
		case "resource":
			// resource extensionname resource/
			pattern = new RegExp("(^|[\\n\\r])resource[ \\t]+" + escapeRegExp(domain) + "[ \\t]+(\\S+)");
	}

	if(!pattern)
		return false;

	tmp = getManifestInfo(pattern, manifest, curDir, path);
	if(tmp)
		return tmp;

	// https://developer.mozilla.org/en/chrome_registration#manifest
	var lines = manifest.split(/[\n\r]+/);
	for(var i = 0, l = lines.length; i < l; i++) {
		var line = lines[i];
		if(!/^manifest[ \t]+(\S+)/.test(line))
			continue;
		var manifestPath = curDir + "\\" + RegExp.$1;
		if(!fso.FileExists(manifestPath))
			continue;
		manifest = AkelPad.ReadFile(manifestPath);
		tmp = getManifestInfo(pattern, manifest, fso.GetParentFolderName(manifestPath), path);
		if(tmp)
			return tmp;
	}

	return false;
}
function getManifestInfo(pattern, manifest, curDir, path) {
	if(!pattern.test(manifest))
		return false;
	var fullPath = curDir + "\\" + unwrapChromePath(RegExp.$2) + path;
	if(fso.FileExists(fullPath))
		return fullPath;
	return false;
}
function unwrapChromePath(path) {
	if(/^jar:/.test(path))
		path = path.substr(4).replace(/[^\/]+!\//, "");
	return path;
}
function escapeRegExp(str) {
	return str.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&");
}
function getFile(curDir, tokens) {
	var parts = [];
	for(;;) {
		parts.unshift(tokens.pop());
		tmp = curDir + "\\" + parts.join("\\");
		if(fso.FileExists(tmp))
			return tmp;
		if(!tokens.length)
			break;
	}
	return null;
}
function isFileBinary(pFile) {
	// Thanks to Instructor
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11344#11344
	var lpDetectCodepage;
	var bResult=false;

	if (lpDetectCodepage=AkelPad.MemAlloc(_X64?24:20 /*sizeof(DETECTCODEPAGEW)*/))
	{
		AkelPad.MemCopy(lpDetectCodepage /*offsetof(DETECTCODEPAGEW, pFile)*/, AkelPad.MemStrPtr(pFile), 2 /*DT_QWORD*/);
		AkelPad.MemCopy(lpDetectCodepage + (_X64?8:4) /*offsetof(DETECTCODEPAGEW, dwBytesToCheck)*/, 1024, 3 /*DT_DWORD*/);
		AkelPad.MemCopy(lpDetectCodepage + (_X64?12:8) /*offsetof(DETECTCODEPAGEW, dwFlags)*/, 0x11 /*ADT_BINARY_ERROR|ADT_NOMESSAGES*/, 3 /*DT_DWORD*/);
		if (AkelPad.SendMessage(hMainWnd, 1177 /*AKD_DETECTCODEPAGEW*/, 0, lpDetectCodepage) == -4 /*EDT_BINARY*/)
			bResult=true;

		AkelPad.MemFree(lpDetectCodepage);
	}
	return bResult;
}