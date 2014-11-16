// http://akelpad.sourceforge.net/forum/viewtopic.php?p=10791#10791
// http://infocatcher.ucoz.net/js/akelpad_scripts/backupVersion.js

// (c) Infocatcher 2011-2012
// version 0.1.5pre2 - 2012-08-27

//===================
// Tries find file version and copy current file to the same directory:
//   file.js      -> file-%version%.js
//   file.user.js -> file-%version%.user.js

// Arguments:
//   -forceDate=true  - force use last modification date
//   -dateType=1      - see dateToString() in settings section
//   -openBackup=true - open created backup file
//   -warnings=false  - skip "Can't detect file version!" warning, just ask for file name

// Usage:
//   Call("Scripts::Main", 1, "backupVersion.js")
//   Call("Scripts::Main", 1, "backupVersion.js", "-forceDate=true -dateType=1")
//===================

//== Settings begin
var getVersionPattern  = /(^|[^a-z])(version|ver\.?|v\.?)[ \t]*[-:=]?[ \t]*(\S+)/i;
var versionBracketsNumber = 3; // We don't use (?:something) for backward compatibility with old JScript
var testVersionPattern = /\d/; // Version string must contain number
var linesLimit = 20; // Check only first 20 lines of file
var addVersionPattern = /(\.user)?\.[^.\s_-]+$/; // {fileName}{versionSeparator}{version}{addVersionPattern}
function getVersionSeparator(version) {
	return /-/.test(version) ? "_" : "-";
}
var dateTypesCount = 3;
function dateToString(date, type) {
	function pad(n) {
		return n < 10 ? "0" + n : n;
	}
	var ret = date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
	if(type == 0)
		return ret;
	ret += "_" + pad(date.getHours()) + "-" + pad(date.getMinutes());
	if(type == 1)
		return ret;
	ret += "-" + pad(date.getSeconds());
	return ret;
}
function trimVersion(version) {
	return version
		.replace(/^v\.?\s*/i, "")
		.replace(/[.,]+$/, "");
}
//== Settings end

function _localize(s) {
	var strings = {
		"Save file first!": {
			ru: "Сначала сохраните файл!"
		},
		"Can't detect file version!": {
			ru: "Не удалось определить версию файла!"
		},
		"Can't use original file name!": {
			ru: "Нельзя использовать имя исходного файла!"
		},
		"File “%S” already exists!\nOverwrite?": {
			ru: "Файл «%S» уже существует!\nПерезаписать?"
		},
		"Can't copy current file to “%F”\nError:\n%E": {
			ru: "Не удалось копировать текущий файл в «%F»\nОшибка:\n%E"
		},
		"Backup file was succefully created:\n%S": {
			ru: "Файл резервной копии успешно создан:\n%S"
		},
		"Name of backup file:": {
			ru: "Имя файла резервной копии:"
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

var hMainWnd = AkelPad.GetMainWnd();
if(!hMainWnd)
	WScript.Quit();

var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();
var fso = new ActiveXObject("Scripting.FileSystemObject");
var curPath = AkelPad.GetEditFile(0);
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

if(!curPath) {
	AkelPad.MessageBox(hMainWnd, _localize("Save file first!"), dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
	WScript.Quit();
}

copyFile();

function copyFile() {
	var forceDate = AkelPad.GetArgValue("forceDate", false);

	var curName = fso.GetFileName(curPath);
	var curDir  = fso.GetParentFolderName(curPath);
	var newName;
	var overwrite = false;
	var exists = function(name) {
		var path = curDir + "\\" + name;
		return fso.FileExists(path) || fso.FolderExists(path);
	};
	if(!forceDate)
		var version = getVersion();
	if(version)
		newName = curName.replace(addVersionPattern, getVersionSeparator(version) + version + "$&");
	else {
		var dateType = AkelPad.GetArgValue("dateType", 0);

		var askName = curName;
		var lastMod = new Date(fso.GetFile(curPath).DateLastModified);
		for(var i = dateType; i < dateTypesCount; ++i) {
			var lastModStr = dateToString(lastMod, i);
			var testName = curName.replace(addVersionPattern, getVersionSeparator(lastModStr) + lastModStr + "$&");
			if(!exists(testName)) {
				askName = testName;
				break;
			}
		}
		if(!forceDate && AkelPad.GetArgValue("warnings", true))
			AkelPad.MessageBox(hMainWnd, _localize("Can't detect file version!"), dialogTitle, 48 /*MB_ICONEXCLAMATION*/);
		newName = !forceDate || i > dateType
			? askFileName(forceDate ? testName || askName : askName)
			: askName;
		if(!newName)
			return;
	}
	for(;;) {
		if(newName == curName) {
			AkelPad.MessageBox(
				hMainWnd,
				_localize("Can't use original file name!"),
				dialogTitle,
				48 /*MB_ICONEXCLAMATION*/
			);
		}
		else {
			if(!exists(newName) && _copy(curPath, curDir, newName, overwrite))
				break;

			var btn = AkelPad.MessageBox(
				hMainWnd,
				_localize("File “%S” already exists!\nOverwrite?").replace("%S", newName),
				dialogTitle,
				35 /*MB_YESNOCANCEL|MB_ICONQUESTION*/
			);
			if(btn == 2 /*IDCANCEL*/)
				return;
			overwrite = btn == 6 /*IDYES*/;
			if(overwrite && _copy(curPath, curDir, newName, overwrite))
				break;
		}
		newName = askFileName(newName);
		if(!newName)
			return;
	}
}
function askFileName(fileName) {
	return AkelPad.InputBox(hMainWnd, dialogTitle, _localize("Name of backup file:"), fileName);
}
function _copy(curPath, curDir, newName, overwrite) {
	try {
		fso.CopyFile(curPath, curDir + "\\" + newName, overwrite);
		if(AkelPad.GetArgValue("openBackup", false)) {
			var lpFrame = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
			AkelPad.OpenFile(curDir + "\\" + newName, 0, AkelPad.GetEditCodePage(hWndEdit), AkelPad.GetEditBOM(hWndEdit));
			lpFrame && AkelPad.SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame);
		}
	}
	catch(e) {
		AkelPad.MessageBox(
			hMainWnd,
			_localize("Can't copy current file to “%F”\nError:\n%E")
				.replace("%F", newName)
				.replace("%E", e.message || e),
			dialogTitle,
			16 /*MB_ICONQUESTION*/
		);
		return false;
	}
	//if(overwrite)
	//	return true;
	new ActiveXObject("WScript.Shell").Popup(
		_localize("Backup file was succefully created:\n%S").replace("%S", newName),
		2, // Autoclose after 2 seconds
		dialogTitle,
		64 /*MB_ICONINFORMATION*/
	);
	return true;
}
function getVersion() {
	var version = "";

	var ww = AkelPad.SendMessage(hWndEdit, 3241 /*AEM_GETWORDWRAP*/, 0, 0);
	if(ww) {
		setRedraw(hWndEdit, false);
		AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);
	}

	var lineStart = 0;
	var line = 0;
	var linesCount = AkelPad.SendMessage(hWndEdit, 3129 /*AEM_GETLINENUMBER*/, 0 /*AEGL_LINECOUNT*/, 0);
	var maxLine = Math.min(linesLimit, linesCount) - 1;
	for(;;) {
		var lineLength = AkelPad.SendMessage(hWndEdit, 193 /*EM_LINELENGTH*/, lineStart, 0);
		var lineEnd    = lineStart + lineLength;
		var lineText   = AkelPad.GetTextRange(lineStart, lineEnd);

		lineText = lineText.replace(/(http|ftp)s?:\/\S+/, "");
		if(getVersionPattern.test(lineText)) {
			var tmp = RegExp["$" + versionBracketsNumber];
			if(testVersionPattern.test(tmp)) {
				version = trimVersion(tmp);
				break;
			}
		}

		lineStart = lineEnd + 1;
		if(++line > maxLine)
			break;
	}

	if(ww) {
		AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);
		setRedraw(hWndEdit, true);
	}

	return version;
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}