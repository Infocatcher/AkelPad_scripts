// http://akelpad.sourceforge.net/forum/viewtopic.php?p=24559#24559
// http://infocatcher.ucoz.net/js/akelpad_scripts/Include/timer.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/Include/timer.js

// (c) Infocatcher 2014
// version 0.1.0 - 2014-04-06

// Helper functions for user32::SetTimer()
// Usage example:
/*
var hMainWnd = AkelPad.GetMainWnd();
if(AkelPad.Include("timer.js")) {
	_log("Started");
	setTimeout(function() {
		_log("Finished");
		oSys.Call("user32::PostQuitMessage", 0);
	}, 2000);
	AkelPad.ScriptNoMutex();
	AkelPad.WindowGetMessage();
}
function _log(s) {
	oSys.Call("user32::SetWindowText" + _TCHAR, hMainWnd, WScript.ScriptName + ": " + s);
}
*/

// Be careful: 3rd argument is an ID of already created timer!
function setTimeout(fn, delay, id) {
	return timers.set(fn, delay, true, id);
}
function setInterval(fn, delay, id) {
	return timers.set(fn, delay, false, id);
}
function clearTimeout(id) {
	timers.clear(id);
}
function clearInterval(id) {
	timers.clear(id);
}

if(!hMainWnd)
	var hMainWnd = AkelPad.GetMainWnd();
if(!oSys)
	var oSys = AkelPad.SystemFunction();

var timers = {
	_id: 1000,
	getId: function() {
		return AkelPad.SendMessage(hMainWnd, 1319 /*AKD_UNIQUEID*/, 0, 0) // AkelPad 4.8.8+
			|| ++this._id;
	},
	funcs: {}, // IDs of all timers
	timeouts: {}, // IDs of single-time timers
	lpTimerCallback: 0,
	init: function() {
		if(!this.lpTimerCallback) try { // AkelPad 4.8.8+
			this.lpTimerCallback = oSys.RegisterCallback(timerProc);
		}
		catch(e) {
			this.lpTimerCallback = oSys.RegisterCallback("", timerProc, timerProc.length);
		}
		this.hWndTimer = AkelPad.ScriptHandle(0, 17 /*SH_GETSERVICEWINDOW*/) || hMainWnd;
		return this.lpTimerCallback;
	},
	destroy: function() {
		if(!this.lpTimerCallback)
			return;
		for(var id in this.funcs)
			this._clear(id);
		oSys.UnregisterCallback(this.lpTimerCallback);
		this.lpTimerCallback = 0;
		this._log("destroy");
	},
	has: function() {
		for(var id in this.funcs)
			return true;
		return false;
	},
	set: function(fn, delay, isSingle, id) {
		if(!this.init()) {
			AkelPad.MessageBox(hMainWnd, "oSys.RegisterCallback() failed!", WScript.ScriptName, 16 /*MB_ICONERROR*/);
			return 0;
		}
		if(!id)
			id = this.getId();
		this.funcs[id] = fn;
		if(isSingle)
			this.timeouts[id] = true;
		this._log("set(" + isSingle + ") " + id);
		oSys.Call("user32::SetTimer", this.hWndTimer, id, delay, this.lpTimerCallback);
		return id;
	},
	clear: function(id, isSingle) {
		this._clear(id);
		if(!this.has())
			this.destroy();
	},
	_clear: function(id) {
		this._log("_clear(" + id + ")");
		oSys.Call("user32::KillTimer", this.hWndTimer, id);
		delete this.funcs[id];
		delete this.timeouts[id];
	},
	_log: function(s) {
		//oSys.Call("user32::SetWindowText" + _TCHAR, hMainWnd, WScript.ScriptName + ": " + s);
	}
};

function timerProc(hWnd, uMsg, nIDEvent, dwTime) {
	var fn = timers.funcs[nIDEvent];
	if(timers.timeouts[nIDEvent])
		timers.clear(nIDEvent);
	fn();
}