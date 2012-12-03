// http://akelpad.sourceforge.net/forum/viewtopic.php?p=12600#12600
// http://infocatcher.ucoz.net/js/akelpad_scripts/unixTime.js

// (c) Infocatcher 2011-2012
// version 0.1.3 - 2012-12-03

var TU_AUTO = 0;
var TU_S    = 1;
var TU_MS   = 2;

var treatAsUTC = getArg("treatAsUTC", true);
var timeUnit = getArg("timeUnit", TU_AUTO);

var date = AkelPad.GetSelText().replace(/^\s+|\s+$/g, "");
if(/^(\d+|0x[0-9a-f]+)$/i.test(date)) {
	date = Number(date);
	if(timeUnit == TU_S || timeUnit == TU_AUTO && date < 3e9)
		date *= 1000;
}
else if(/^([0-3]?\d)\D([01]?\d)\D(\d{4})(\s+([0-2]?\d)\D([0-6]?\d)(\D([0-6]?\d))?)?$/.test(date)) {
	// dd.MM.yyyy[ HH:mm[:ss]]
	with(RegExp)
		date = new Date($3, $2 - 1, $1, $5, $6, $8);
}
else if(/^(\d{4})\D([01]?\d)\D([0-3]?\d)(\s+([0-2]?\d)\D([0-6]?\d)(\D([0-6]?\d))?)?$/.test(date)) {
	// yyyy.MM.dd[ HH:mm[:ss]]
	with(RegExp)
		date = new Date($1, $2 - 1, $3, $5, $6, $8);
}
else if(/^([0-2]?\d)\D([0-6]?\d)(\D([0-6]?\d))?\s+([0-3]?\d)\D([01]?\d)\D(\d{4})$/.test(date)) {
	// HH:mm[:ss] dd.MM.yyyy
	with(RegExp)
		date = new Date($7, $6 - 1, $5, $1, $2, $4);
}
if(!(date instanceof Date))
	date = new Date(date);
else if(treatAsUTC) {
	var tzo = date.getTimezoneOffset();
	date.setMinutes(date.getMinutes() - tzo);
}
var tzo = date.getTimezoneOffset();
var ms = date.getTime();
var s = Math.round(ms/1000);
var tf = function(funcName) {
	if(treatAsUTC)
		return funcName.substr(0, 3) + "UTC" + funcName.substr(3);
	return funcName;
};
var dates = [
	date.toLocaleString(),
	date[tf("getFullYear")]() + "-" + padLeft(date[tf("getMonth")]() + 1) + "-" + padLeft(date[tf("getDate")]()) + " "
		+ padLeft(date[tf("getHours")]()) + ":" + padLeft(date[tf("getMinutes")]()) + ":" + padLeft(date[tf("getSeconds")]())
		+ " UTC" + (treatAsUTC ? "" : getTimezone(tzo)),
	date.toUTCString(),
	date.toString(),
	ms,
	s,
	(s < 0 ? "-" : "") + "0x" + Math.abs(s).toString(16)
].join("\n");
AkelPad.MessageBox(AkelPad.GetMainWnd(), dates, WScript.ScriptName, 64 /*MB_ICONINFORMATION*/);

function padLeft(n) {
	var chr = "0";
	var cnt = 2;
	n = String(n);
	var l = n.length;
	return l < cnt
		? new Array(cnt - n.length + 1).join(chr) + n
		: n;
}
function getTimezone(tzo) {
	var m = Math.abs(tzo);
	var h = Math.floor(m/60);
	m = Math.floor(m - h*60);
	return (tzo > 0 ? "-" : "+") + padLeft(h) + padLeft(m);
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