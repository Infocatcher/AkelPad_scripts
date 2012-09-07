' http://akelpad.sourceforge.net/forum/viewtopic.php?p=11863#11863
' http://infocatcher.ucoz.net/js/akelpad_scripts/executeScript.js
' http://infocatcher.ucoz.net/js/akelpad_scripts/executeScript.vbs

' version 0.1.2 - 2011-04-11

' Supplemental script for runScript.js
' Executes selected or all code

option explicit
dim onlySelected
if WScript.Arguments.length then
	onlySelected = WScript.Arguments(0) = "-onlySelected=true"
else
	onlySelected = false
end if

if onlySelected <> true and AkelPad.GetSelStart = AkelPad.GetSelEnd then
	executeGlobal AkelPad.GetTextRange(0, -1)
else
	executeGlobal AkelPad.GetSelText
end if