// https://github.com/Infocatcher/AkelPad_scripts/blob/master/openFileIn-options.js
// Additional options for openFileIn.js

appsData["Basilisk"] = {
	paths: [
		"<HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\basilisk.exe\\>",
		"%ProgramFiles%\\Basilisk\\basilisk.exe",
		"%COMMANDER_PATH%\\..\\Basilisk_Portable\\FirefoxPortable.exe",
		"%AkelDir%\\..\\Basilisk_Portable\\FirefoxPortable.exe"
	],
	args: "%f",
	isBrowser: true
};