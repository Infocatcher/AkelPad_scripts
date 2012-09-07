// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9926#9926

// (c) Infocatcher 2009-2011
// version 0.3.2 - 2011-12-20

// Works with ShowMenuEx.js http://akelpad.sourceforge.net/forum/viewtopic.php?p=8153#8153

// Usage:
// Call("Scripts::Main", 1, "newFileTemplate.js", "html")
//   - use template for "html"
// Call("Scripts::Main", 1, "newFileTemplate.js")
//   - use template for extension of current file
// Call("Scripts::Main", 1, "newFileTemplate.js", "?")
//   - ask user about extension
// Call("Scripts::Main", 1, "newFileTemplate.js", `"%f"`)
//   - use active file (e.g. in ContextMenu plugin)
//   - or `"c:\\path\to\my\file\myFile.ext"` instead of `"%f"`
// Call("Scripts::Main", 1, "newFileTemplate.js", "?edit")
//   - edit template
// Call("Scripts::Main", 1, "newFileTemplate.js", "?edit:html")
//   - edit template for "html"

//== Settings begin
var templatesDir = "%a\\AkelFiles\\Plugs\\Scripts\\Params\\" + getScriptDirName();
// For "script.js" getScriptDirName() return "script".
var templateFileName = "template";
var selFlag = "%|";
var selTextFlag = "%s";
//== Settings end

function _localize(s) {
	var strings = {
		"Extension of new file:": {
			ru: "Расширение нового файла:"
		},
		"Edit template for extension:": {
			ru: "Редактировать шаблон для расширения:"
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

var argAsk = "?";
var argEdit = "?edit";

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var wsh = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");

function TemplateMaker(tDir, tFileName, selFlag, selTextFlag, argAsk, argEdit) {
	this.tDir = tDir;
	this.tFileName = tFileName;
	this.selFlag = selFlag;
	this.selTextFlag = selTextFlag;
	this.argAsk = argAsk;
	this.argEdit = argEdit;
}
TemplateMaker.prototype = {
	initTemplate: function() {
		this.ext = this.getExt();
		return this.getTemplate();
	},
	getExt: function() {
		var ext;
		if(WScript.Arguments.length) {
			ext = this.parseSpecialExts(WScript.Arguments(0));
			return ext && ext.toLowerCase();
		}
		ext = ext || this.getCurrentExt() || this.askUserExt();
		return ext && ext.toLowerCase();
	},
	parseSpecialExts: function(ext, retExt) {
		if(ext == this.argAsk)
			return this.askUserExtInput();
		else if(ext && ext.indexOf(this.argEdit) == 0) {
			this.createTemplate(ext.substr(this.argEdit.length + 1));
			return "";
		}
		else if(ext && /\\.*\.([^.]+)$/.test(ext)) { // ...\filename.ext
			this.tPath = ext;
			ext = RegExp.$1;
			this.precessTemplate = false;
			return ext && ext.toLowerCase();
		}
		return retExt ? ext : "";
	},
	askUserExt: function() {
		if(this.asked)
			return "";
		var ext;
		var showMenuPath = AkelPad.GetAkelDir() + "\\AkelFiles\\Plugs\\Scripts\\ShowMenuEx.js";
		if(fso.FileExists(showMenuPath)) {
			eval(AkelPad.ReadFile(showMenuPath));
			ext = getSelectedMenuItem(POS_CURSOR, "INI", 0);
			ext = this.parseSpecialExts(ext, true);
		}
		else {
			ext = this.askUserExtInput();
		}
		return ext && ext.toLowerCase();
	},
	asked: false,
	askUserExtInput: function(newFlag) {
		this.asked = true;
		var ext = AkelPad.InputBox(
			hMainWnd, WScript.ScriptName,
			_localize(
				newFlag
					? "Edit template for extension:"
					: "Extension of new file:"
			),
			this.getCurrentExt() || regVal("lastExt") || ""
		);
		return ext && ext.toLowerCase();
	},
	getCurrentExt: function() {
		if(!this._getCurrentExt) {
			var cFile = AkelPad.GetEditFile(0);
			this._getCurrentExt = cFile && /\.([^.]+)$/i.test(cFile) && RegExp.$1;
		}
		return this._getCurrentExt;
	},
	createTemplate: function(ext) {
		ext = ext || this.askUserExtInput(true /* newFlag */);
		if(!ext)
			return;
		var path = this.getTemplatePath(ext);

		var dir = fso.GetParentFolderName(path);
		if(!fso.FolderExists(dir))
			fso.CreateFolder(dir);

		AkelPad.OpenFile(path);
	},
	tPath: "",
	tmpl: "",
	precessTemplate: true,
	selParams: null,
	getTemplate: function() {
		if(!this.ext)
			return false;
		var pFile = this.tPath || this.getTemplatePath(this.ext);
		if(!fso.FileExists(pFile))
			return true;
		this.tmpl = AkelPad.ReadFile(pFile)
			.replace(/\r\n/g, "\n"); // For AkelPad 4.4.4+
		if(!this.precessTemplate)
			return true;
		if(this.tmpl.indexOf(this.selTextFlag) != -1)
			this.tmpl = this.tmpl.replace(this.selTextFlag, AkelPad.GetSelText());
		var selStart = this.tmpl.indexOf(this.selFlag);
		this.delFlag(selStart);
		var selEnd = this.tmpl.lastIndexOf(this.selFlag);
		this.delFlag(selEnd);
		if(selStart != -1 && selEnd == -1)
			selEnd = selStart;
		this.selParams = selStart != -1
			? [selStart, selEnd]
			: null;
		return true;
	},
	getTemplatePath: function(ext) {
		return wsh.ExpandEnvironmentStrings(
			this.tDir
				.replace(/^%a/, AkelPad.GetAkelDir())
				.replace(/\\$/, "")
				+ "\\" + this.tFileName + "." + ext
		);
	},
	delFlag: function(pos) {
		if(pos != -1)
			this.tmpl = this.tmpl.substring(0, pos)
				+ this.tmpl.substring(pos + this.selFlag.length, this.tmpl.length);
	},
	insTemplate: function() {
		AkelPad.ReplaceSel(this.tmpl);
		this.formatTemplate();
		regVal("lastExt", this.ext);
	},
	formatTemplate: function() {
		var ext = this.ext;
		if (ext && AkelPad.IsPluginRunning("Coder::HighLight") == true) {
			AkelPad.Call("Coder::Settings", 1, ext);
		}
		var sp = this.selParams;
		if(sp)
			AkelPad.SetSel(sp[0], sp[1]);
		else
			AkelPad.SetSel(0, 0);
	}
};

if(hMainWnd) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(lpPoint) {
		var tm = new TemplateMaker(templatesDir, templateFileName, selFlag, selTextFlag, argAsk, argEdit);
		if(tm.initTemplate()) {
			AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
			var hWndEditNew = AkelPad.GetEditWnd();
			setRedraw(hWndEditNew, false);
			AkelPad.SendMessage(hWndEditNew, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

			tm.insTemplate();

			AkelPad.SendMessage(hWndEditNew, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
			setRedraw(hWndEditNew, true);
			AkelPad.MemFree(lpPoint);
		}
	}
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}
function getScriptDirName() {
	return WScript.ScriptName.replace(/\.js$/i, "");
}
function regVal(name, val) {
	name = "HKCU\\Software\\Akelsoft\\AkelPad\\Plugs\\Scripts\\newFileTemplate\\" + name;
	if(arguments.length == 2)
		return wsh.RegWrite(name, val, "REG_SZ");
	try { return wsh.RegRead(name); }
	catch(e) { return ""; }
}