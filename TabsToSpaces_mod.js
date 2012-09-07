// http://akelpad.sourceforge.net/forum/viewtopic.php?p=7081#7081

/// Convert tabulation to space for AkelPad 4.x.x

// Modified by Infocatcher
// version: 2010-12-29

var hMainWnd=AkelPad.GetMainWnd();
var hWndEdit=AkelPad.GetEditWnd();
var oSys=AkelPad.SystemFunction();
var pScriptName=WScript.ScriptName;
var pSelText;
var pResult;
var pSpaces;
var nSelStart;
var nSelEnd;
var nTabStop;
var nColumn;
var nSpaceCount;
var a;
var b;

if (hMainWnd)
{
  if (AkelPad.IsAkelEdit())
  {
    nSelStart=AkelPad.GetSelStart();
    nSelEnd=AkelPad.GetSelEnd();
    if (nSelStart == nSelEnd)
    {
      //AkelPad.SetSel(0, -1);
      nSelStart = 0;
      nSelEnd = -1;
      pSelText = AkelPad.GetTextRange(0, -1);
    }
    else
    {
      //SelCompleteLine(hWndEdit, nSelStart, nSelEnd);
      var sel = GetCompleteLine(hWndEdit, nSelStart, nSelEnd);
      nSelStart = sel[0];
      nSelEnd   = sel[1];
      pSelText = AkelPad.GetTextRange(nSelStart, nSelEnd);
    }
    //nSelStart=AkelPad.GetSelStart();
    //nSelEnd=AkelPad.GetSelEnd();
    //pSelText=AkelPad.GetSelText();

    nTabStop=AkelPad.SendMessage(hWndEdit, 3239 /*AEM_GETTABSTOP*/, 0, 0);
    pResult="";

    if (pSelText.indexOf("\t") == -1)
    {
      pResult = pSelText.replace(
        new RegExp("^( {" + nTabStop + "})+", "mg"),
        function(s)
        {
          return new Array(s.length/nTabStop + 1).join("\t");
        }
      );
    }
    else
    {
      for (a=0, b=0, nColumn=0; b < pSelText.length; ++b)
      {
        if (pSelText.charAt(b) == '\t')
        {
          nSpaceCount=nTabStop - nColumn % nTabStop;
          nColumn+=nSpaceCount;
          for (pSpaces=""; nSpaceCount; --nSpaceCount)
            pSpaces=pSpaces + " ";
          pResult=pResult + pSelText.substr(a, b - a) + pSpaces;
          a=b + 1;
        }
        else if (pSelText.charAt(b) == '\r')
          nColumn=0;
        else
          ++nColumn;
      }
      pResult=pResult + pSelText.substr(a, b - a);
   }

    //AkelPad.ReplaceSel(pResult);
    insertNoScroll(pResult, nSelStart, nSelEnd);
  }
}


//Functions
function GetCompleteLine(hWnd, nMinSel, nMaxSel)
{
  var nMinLine;
  var nMaxLine;
  var nMinLineIndex;
  var nMaxLineIndex;
  var nMaxLineLength;

  if (nMinSel < nMaxSel)
  {
    nMinLine=AkelPad.SendMessage(hWnd, 1078 /*EM_EXLINEFROMCHAR*/, 0, nMinSel);
    nMaxLine=AkelPad.SendMessage(hWnd, 1078 /*EM_EXLINEFROMCHAR*/, 0, nMaxSel);
    nMinLineIndex=AkelPad.SendMessage(hWnd, 187 /*EM_LINEINDEX*/, nMinLine, 0);
    nMaxLineIndex=AkelPad.SendMessage(hWnd, 187 /*EM_LINEINDEX*/, nMaxLine, 0);
    nMaxLineLength=AkelPad.SendMessage(hWnd, 193 /*EM_LINELENGTH*/, nMaxSel, 0);

    if (nMaxLineIndex == nMaxSel) --nMaxLine;
    else if (nMaxLineLength) nMaxSel=nMaxLineIndex + nMaxLineLength + 1;
    nMinSel=nMinLineIndex;

    //AkelPad.SetSel(nMinSel, nMaxSel);
    //return nMaxLine - nMinLine + 1;
    return [nMinSel, nMaxSel];
  }
  //return 0;
  throw new Error("GetCompleteLine: nMinSel >= nMaxSel");
}
function insertNoScroll(str, nSelStart, nSelEnd) {
	var lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
	if(!lpPoint)
		return;
	//var hWndEdit = AkelPad.GetEditWnd();
	setRedraw(hWndEdit, false);
	AkelPad.SendMessage(hWndEdit, 1245 /*EM_GETSCROLLPOS*/, 0, lpPoint);

	AkelPad.SetSel(nSelStart, nSelEnd);
	//var ss = AkelPad.GetSelStart();
	AkelPad.ReplaceSel(str, true);
	//if(ss != AkelPad.GetSelStart())
	//	AkelPad.SetSel(ss, ss + str.length);

	AkelPad.SendMessage(hWndEdit, 1246 /*EM_SETSCROLLPOS*/, 0, lpPoint);
	setRedraw(hWndEdit, true);
	AkelPad.MemFree(lpPoint);
}
function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}