// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11346#11346
// http://infocatcher.ucoz.net/js/akelpad_scripts/openRelativeFile.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/openRelativeFile.js

// (c) Infocatcher 2011, 2014
// Version: 0.1.7 - 2014-08-01
// Author: Infocatcher

//===================
//// Tries to open file with relative path
// (will be used system association to open binary files)
// Supports Mozilla's chrome.manifest files (https://developer.mozilla.org/en/chrome_registration)
// Priorities: selected path (if any) or autodetected path (you can just place caret anywhere inside path)

// Usage:
//   Call("Scripts::Main", 1, "openRelativeFile.js")
// Also you can use -showPath argument for debug purposes:
//   Call("Scripts::Main", 1, "openRelativeFile.js", "-showPath=true")
//===================

//== Settings begin
// You can use openRelativeFile-options.js file to override settings

//var paths = ["%ProgramFiles%\\Something"];
var paths = [];

var delimitersStart = {
	'"': true,
	"'": true,
	"<": true,
	"[": true,
	"(": true,
	">": true,
	"=": true,
	"\n": true,
	"\r": true,
	"": true
};
var delimitersEnd = {
	'"': true,
	"'": true,
	">": true,
	"]": true,
	")": true,
	"<": true,
	"\n": true,
	"\r": true,
	"": true
};
var delimitersSpaces = {
	" ": true,
	"\t": true,
	"\n": true,
	"\r": true,
	"\0": true,
	"\u00a0": true, // &nbsp;
	"\u2002": true, // &ensp;
	"\u2003": true, // &emsp;
	"\u2009": true // &thinsp;
};
var delimitersStop = {
	"\n": true,
	"\r": true,
	"\0": true,
	"" : true
};

var maxLength = 2000;
//== Settings end

var hMainWnd = AkelPad.GetMainWnd();
var fso = new ActiveXObject("Scripting.FileSystemObject");
var wsh = new ActiveXObject("WScript.Shell");

var optionsPath = WScript.ScriptFullName.replace(/(\.[^.]+)?$/, "-options$&");
if(fso.FileExists(optionsPath))
	AkelPad.Include(".." + optionsPath.replace(/^.*(\\|\/)/, "$1"));

var showPath = AkelPad.GetArgValue("showPath", false);
if(hMainWnd)
	openRelative();

function openRelative() {
	var pathStarts = [];
	var pathEnds = [];

	var ss = AkelPad.GetSelStart();
	var se = AkelPad.GetSelEnd();

	if(ss != se) {
		checkPrefix(ss);
		var relPath = decodePathURI(AkelPad.GetSelText());
		if(openRelativePath(relPath))
			return true;
		++ss, --se;
	}

	var cnt = 0;
	for(;;) {
		var chr = --ss < 0 ? "" : AkelPad.GetTextRange(ss, ss + 1);
		if(chr in delimitersSpaces && !pathStarts.length)
			pathStarts.push(ss + 1);
		else if(chr in delimitersStart) {
			pathStarts.push(ss + 1);
			break;
		}
		if(chr in delimitersStop)
			break;
		if(++cnt > maxLength)
			break;
	}
	if(!pathStarts.length)
		return false;

	for(var i = 0, l = pathStarts.length; i < l; ++i)
		if(checkPrefix(pathStarts[i]))
			break;

	cnt = 0;
	for(;;) {
		var chr = AkelPad.GetTextRange(se, ++se);
		if(chr in delimitersSpaces && !pathEnds.length)
			pathEnds.push(se - 1);
		else if(chr in delimitersEnd) {
			pathEnds.push(se - 1);
			break;
		}
		if(chr in delimitersStop)
			break;
		if(++cnt > maxLength)
			break;
	}
	if(!pathEnds.length)
		return false;

	for(var i = Math.max(pathStarts.length, pathEnds.length) - 1; i >= 0; --i) {
		// Use corresponding points: 1 - delimitersStart/End, 0 - delimitersSpaces
		var pathStart = pathStarts[i] || pathStarts[pathStarts.length - 1];
		var pathEnd = pathEnds[i] || pathEnds[pathEnds.length - 1];
		var relPathRaw = AkelPad.GetTextRange(pathStart, pathEnd);
		var relPath = decodePathURI(relPathRaw);
		if(openRelativePath(relPath, pathStart, pathEnd))
			return true;
	}
	return false;
}
function checkPrefix(pathStart) {
	if(pathStart > 0) { // Detect AkelPad.Include()
		var before = AkelPad.GetTextRange(Math.max(0, pathStart - 40), pathStart);
		if(/\bAkelPad\s*\.\s*Include\s*\(\s*["']$/.test(before)) {
			var includeDir = AkelPad.GetAkelDir(6 /*ADTYPE_INCLUDE*/);
			if(arrayIndexOf(paths, includeDir) == -1)
				paths.push(includeDir);
			return true;
		}
	}
	return false;
}
function arrayIndexOf(arr, item) {
	for(var i = 0, l = arr.length; i < l; ++i)
		if(arr[i] === item)
			return i;
	return -1;
}
function openRelativePath(relPath, pathStart, pathEnd) {
	var path;

	var curPath = AkelPad.GetEditFile(0);
	var curDir = fso.GetParentFolderName(curPath);
	var tmp = curDir + "\\" + relPath;
	if(fso.FileExists(tmp))
		path = tmp;
	else {
		tmp = wsh.ExpandEnvironmentStrings(relPath);
		if(fso.FileExists(tmp))
			path = tmp;
		if(!path && /^(chrome|resource):\/\//.test(relPath)) {
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
				var newDir = getParentDir(curDir);
				if(!newDir || newDir == curDir)
					break;
				curDir = newDir;
			}
		}
		if(!path) {
			for(var i = 0, l = paths.length; i < l; ++i) {
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

	if(showPath) {
		var msg = "Relative path:\n" + relPath
			+ "\nDetected path:";
		path = AkelPad.InputBox(hMainWnd, WScript.ScriptName, msg, path);
		if(!path)
			return false;
	}

	if(pathStart && pathEnd)
		AkelPad.SetSel(pathStart, pathEnd);
	if(isFileBinary(path)) // Use system association for binary files
		wsh.Exec('rundll32.exe shell32.dll,ShellExec_RunDLL "' + path + '"');
	else
		AkelPad.OpenFile(path);

	return true;
}
function decodePathURI(path) {
	path = path
		.replace(/^file:\/+/i, "")
		.replace(/[?#].*$/, "");
	try {
		path = decodeURIComponent(path);
	}
	catch(e) {
	}
	return path;
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
		var newDir = getParentDir(curDir);
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
	for(var i = 0, l = lines.length; i < l; ++i) {
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
		var tmp = curDir + "\\" + parts.join("\\");
		if(fso.FileExists(tmp))
			return tmp;
		if(!tokens.length)
			break;
	}
	return null;
}
function getParentDir(dir) {
	return dir.replace(/[\\\/]+[^\\\/]+$/, "");
}
function isFileBinary(pFile) {
	// Thanks to Instructor
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11344#11344
	var lpDetectCodepage;
	var bResult=false;

	if (lpDetectCodepage=AkelPad.MemAlloc(_X64?24:20 /*sizeof(DETECTCODEPAGEW)*/))
	{
		AkelPad.MemCopy(_PtrAdd(lpDetectCodepage,             0 /*offsetof(DETECTCODEPAGEW, pFile)*/), AkelPad.MemStrPtr(pFile), 2 /*DT_QWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpDetectCodepage, _X64 ?  8 : 4 /*offsetof(DETECTCODEPAGEW, dwBytesToCheck)*/), 1024, 3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpDetectCodepage, _X64 ? 12 : 8 /*offsetof(DETECTCODEPAGEW, dwFlags)*/), 0x11 /*ADT_BINARY_ERROR|ADT_NOMESSAGES*/, 3 /*DT_DWORD*/);
		if (AkelPad.SendMessage(hMainWnd, 1177 /*AKD_DETECTCODEPAGEW*/, 0, lpDetectCodepage) == -4 /*EDT_BINARY*/)
			bResult=true;

		AkelPad.MemFree(lpDetectCodepage);
	}
	return bResult;
}