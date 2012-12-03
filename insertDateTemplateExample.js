// http://akelpad.sourceforge.net/forum/viewtopic.php?p=4311#4311

// (c) Infocatcher 2008-2009, 2012
// version 0.1.2 - 2012-12-03

// Insert current date

//== User settings:
var dateTemplate = "<fullYear>-<month>-<date>";
// You can use <day>, <date>, <month>, <monthName>, <year>, <fullYear>, <hours>, <minutes>, <seconds>, <timezone>
// Days of week:
var daysOfWeek = "sunday,monday,tuesday,wednesday,thursday,friday,saturday";
var monthNames = "jan,feb,mar,apr,may,jun,jul,avg,sep,oct,nov,dec";
// Use "," as separator

// Or you can specified dateTemplate, daysOfWeek and monthNames in command line arguments:
// Call("Scripts::Main", 1, "insertDate.js", "/t=dateTemplate /w=daysOfWeek /m=monthNames", 0)
// \s - " " (space), \n - line feed
// For example:
// Call("Scripts::Main", 1, "insertDate.js", "/t=<monthName>,\s<day> /w=su,mo,tu,we,th,fr,sa /m=jan,feb,mar,apr,may,jun,jul,avg,sep,oct,nov,dec", 0)
//== End of user settings

var argsCount = WScript.Arguments.length;
var args = {};
for(var i = 0; i < argsCount; ++i) // read arguments
	if(/^\/([a-z]+)=(.+)$/i.test(WScript.Arguments(i)))
		args[RegExp.$1] = RegExp.$2;

dateTemplate = (args.t && convertArg(args.t)) || dateTemplate;
daysOfWeek = ((args.w && convertArg(args.w)) || daysOfWeek).split(/\s*,\s*/);
monthNames = ((args.m && convertArg(args.m)) || monthNames).split(/\s*,\s*/);

function convertArg(s) {
	return s
		.replace(/\\s/g, " ")
		.replace(/\\n/g, "\n");
}
function addZero(n) {
	return n > 9 ? n : "0" + n;
}
function getTimezone(tzo) {
	var m = Math.abs(tzo);
	var h = Math.floor(m/60);
	m = Math.floor(m - h*60);
	return (tzo > 0 ? "-" : "+") + addZero(h) + addZero(m);
}
function getFormattedDate(template, days, months) {
	var d = new Date();
	var y = d.getFullYear().toString();
	var m = d.getMonth();
	return template
		.replace(/<day>/g, days[d.getDay()])
		.replace(/<date>/g, addZero(d.getDate()))
		.replace(/<month>/g, addZero(m + 1))
		.replace(/<monthName>/g, months[m])
		.replace(/<fullYear>/g, y)
		.replace(/<year>/g, y.substring(2, y.length))
		.replace(/<hours?>/g, addZero(d.getHours()))
		.replace(/<minutes>|<min>/g, addZero(d.getMinutes()))
		.replace(/<seconds>|<sec>/g, addZero(d.getSeconds()))
		.replace(/<timezone>/g, getTimezone(d.getTimezoneOffset()));
}

//var AkelPad = new ActiveXObject("AkelPad.document");
AkelPad.ReplaceSel(getFormattedDate(dateTemplate, daysOfWeek, monthNames));