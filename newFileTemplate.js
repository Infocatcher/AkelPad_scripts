// (c) Infocatcher 2009
// version 0.2.5 - 2010-06-21

// Usage:
// Call("Scripts::Main", 1, "newFileTemplate.js", "html", 0)
//   - use template for "html"
// Call("Scripts::Main", 1, "newFileTemplate.js", "", 0)
//   - use template for extension of current file
// Call("Scripts::Main", 1, "newFileTemplate.js", "?", 0)
//   - ask user about extension
// Call("Scripts::Main", 1, "newFileTemplate.js", `"%f"`, 0)
//   - use active file (e.g. in ContextMenu plugin)
//   - or `"c:\\path\to\my\file\myFile.ext"` instead of `"%f"`

// Settings begin
var templatesDir = "%a\\AkelFiles\\Plugs\\Scripts\\Params\\" + getScriptDirName();
// For "script.js" getScriptDirName() return "script".
var templateFileName = "template";
var selFlag = "%|";
var selTextFlag = "%s";
// Settings end

//var AkelPad = new ActiveXObject("AkelPad.document");
var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

var locale = {
	lng: null,
	strings: {
		extRequired: {
			ru: "Расширение нового файла: ",
			en: "Extension of new file: "
		}
	},
	getStr: function(name) {
		if(!this.lng) {
			var nLangID = oSys.Call("kernel32::GetUserDefaultLangID");
			nLangID = nLangID & 0x3ff; //PRIMARYLANGID
			switch(nLangID) {
				case 0x19: this.lng = "ru"; break;
				default:   this.lng = "en";
			}
		}
		return this.strings[name][this.lng];
	}
};

function TemplateMaker(tDir, tFileName, selFlag, selTextFlag) {
	this.tDir = tDir;
	this.tFileName = tFileName;
	this.selFlag = selFlag;
	this.selTextFlag = selTextFlag;
}
TemplateMaker.prototype = {
	initTemplate: function() {
		this.ext = this.getExt();
		return this.getTemplate();
	},
	getExt: function() {
		var ext;
		if(WScript.Arguments.length) {
			ext = WScript.Arguments(0);
			if(ext == "?")
				return this.ackUserExt();
			else if(ext && /\\.*\.([^.]+)$/.test(ext)) { // ...\filename.ext
				this.tPath = ext;
				ext = RegExp.$1;
				this.precessTemplate = false;
			}
		}
		ext = ext || this.getCurrentExt() || this.ackUserExt();
		return ext && ext.toLowerCase();
	},
	ackUserExt: function() {
		var ext = AkelPad.InputBox(
			hMainWnd, WScript.ScriptName,
			locale.getStr("extRequired"),
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
	tPath: null,
	tmpl: "",
	precessTemplate: true,
	selParams: null,
	getTemplate: function() {
		if(!this.ext)
			return false;
		var pFile = this.tPath
			|| this.tDir
				.replace("%a", AkelPad.GetAkelDir())
				.replace(/\\?$/, "\\")
				+ this.tFileName + "." + this.ext;
		if(!this.fileExist(pFile))
			return true;
		this.tmpl = AkelPad.ReadFile(pFile)
			.replace(/\r\n/g, "\n"); // For AkelPad 4.4.4
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
	fileExist: function(fName) {
		return new ActiveXObject("Scripting.FileSystemObject")
			.FileExists(fName);
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
		if(ext) {
			//AkelPad.Call("HighLight::Main", 1, ext);
			//AkelPad.Call("AutoComplete::Main", 1, ext);
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
		var tm = new TemplateMaker(templatesDir, templateFileName, selFlag, selTextFlag);
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
	if(bRedraw)
		oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}
function getScriptDirName() {
	return WScript.ScriptName.replace(/\.js$/i, "");
}
function regVal(name, val) {
	name = "HKCU\\Software\\Akelsoft\\AkelPad\\Plugs\\Scripts\\newFileTemplate\\" + name;
	var ws = new ActiveXObject("WScript.shell");
	if(typeof val != "undefined")
		return ws.RegWrite(name, val, "REG_SZ");
	try { return ws.RegRead(name); }
	catch(e) { return ""; }
}