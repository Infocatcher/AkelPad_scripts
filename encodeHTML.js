// (c) Infocatcher 2009-2010
// version 0.1.5.2 - 2010-07-08

// Convert:
// & => &amp;
// < => &lt;
// > => &gt;
// " => &quot;

//var AkelPad = new ActiveXObject("AkelPad.document");

var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oFunction = AkelPad.SystemFunction();

if(hMainWnd && !AkelPad.GetEditReadOnly(hWndEdit)) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(lpPoint) {
		toggleRedraw(hWndEdit, false);
		var selParams = getSelParams();
		AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);
		selParams = encodeHTML(selParams);
		restoreSelParams(selParams);
		AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
		toggleRedraw(hWndEdit, true);
		AkelPad.MemFree(lpPoint);
	}
}

function encodeHTML(selParams) {
	// Get selection or all text
	var txt = AkelPad.GetSelText() || AkelPad.SetSel(0, -1) || AkelPad.GetSelText();
	var selStart = AkelPad.GetSelStart();

	txt = txt
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
	AkelPad.ReplaceSel(txt);

	return [selStart, selStart + txt.length];
}

function toggleRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	if(!bRedraw)
		return;
	oFunction.AddParameter(hWnd);
	oFunction.AddParameter(0);
	oFunction.AddParameter(true);
	oFunction.Call("user32::InvalidateRect");
}
function getSelParams() {
	return [AkelPad.GetSelStart(), AkelPad.GetSelEnd()];
}
function restoreSelParams(selParams) {
	AkelPad.SetSel(selParams[0], selParams[1]);
}