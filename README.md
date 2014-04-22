Scripts for <a href="http://akelpad.sf.net/">AkelPad</a> text editor with <a href="http://akelpad.sf.net/en/plugins.php">Scripts plugin</a>.
<br>Also see <a href="http://akelpad.sf.net/forum/viewtopic.php?t=240">Scripts collection</a> forum thread.

#### Scripts in alphabetical order

##### [Include/timer.js](Include/timer.js)
Helper functions for <a href="http://msdn.microsoft.com/en-us/library/windows/desktop/ms644906">user32::SetTimer()</a>

##### [adblockPlusChecksum.js](adblockPlusChecksum.js)
Adds checksum to <a href="http://adblockplus.org/en/faq_internal#checksum">Adblock Plus subscription</a>

##### [AESCrypt.js](AESCrypt.js)
Encrypt/decrypt text using <a href="http://en.wikipedia.org/wiki/AES-256">AES-256</a>
<br>[see <a href="#cryptjs">crypt.js</a> and <a href="#cryptextjs">cryptExt.js</a>]

##### [alignWithSpaces.js](alignWithSpaces.js)
Align selected code with spaces to user defined string
<br><img alt="Screenshot: alignWithSpaces.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/alignWithSpaces-en.png">

##### [autoSaveSession.js](autoSaveSession.js)
Automatically saves current session after selection or scroll changes

##### [backupVersion.js](backupVersion.js)
Tries find file version and copy current file to the same directory:
```
file.js      -> file-%version%.js
file.user.js -> file-%version%.user.js
```

##### [closeLeftOrRightTabs.js](closeLeftOrRightTabs.js)
Close tabs to the left or right (temporary check “Switch tabs: right-left” option)

##### [colorsConverter.js](colorsConverter.js)
Convert color between “#fee” and “rgb(255, 238, 238)” formats

##### [converter.js](converter.js)
* Encode/decode HTML entities (&amp; <=> &amp;amp;)
* Convert JavaScript escape sequences like "\u00a9" or "\xa9" (“©” symbol)
* Escape/unescape special RegExp symbols
* Escape/unescape special strings symbols
* Encode/decode Uniform Resource Identifiers (URIs)
* Hexadecimal escape/unescape
* Base64 encode/decode
* Convert charset
<br><img alt="Screenshot: converter.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/converter-en.png">

##### [convertEscapes.js](convertEscapes.js)
Converts JavaScript escape sequences like "\u00a9" or "\xa9" (“©” symbol)
<br>[see <a href="#converterjs">converter.js</a>]

##### [convertHTML.js](convertHTML.js)
Encode/decode HTML entities (&amp; <=> &amp;amp;)
<br>[see <a href="#converterjs">converter.js</a>]

##### [copyPath.js](copyPath.js)
Copy path to file in configurable format

##### [crypt.js](crypt.js)
Encrypt/decrypt text using <a href="http://en.wikipedia.org/wiki/AES-256">AES-256</a> or/and <a href="http://en.wikipedia.org/wiki/Blowfish_(cipher)">Blowfish</a>
<br><img alt="Screenshot: crypt.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/crypt-en.png">
<br>[see <a href="#cryptextjs">cryptExt.js</a>]

##### [cryptExt.js](cryptExt.js)
Encrypt/decrypt text using <a href="http://en.wikipedia.org/wiki/AES-256">AES-256</a>/<a href="http://en.wikipedia.org/wiki/Blowfish_(cipher)">Blowfish</a>/<a href="http://en.wikipedia.org/wiki/Twofish">Twofish</a>/<a href="http://en.wikipedia.org/wiki/Serpent_(cipher)">Serpent</a>
<br><img alt="Screenshot: cryptExt.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/cryptExt-en.png">

##### [decodeHTML.js](decodeHTML.js)
Decode HTML entities (&amp;amp; => &amp;)
<br>[see <a href="#converthtmljs">convertHTML.js</a> and <a href="#converterjs">converter.js</a>]

##### [encodeHTML.js](encodeHTML.js)
Encode HTML entities (&amp; => &amp;amp;)
<br>[see <a href="#converthtmljs">convertHTML.js</a> and <a href="#converterjs">converter.js</a>]

##### [executeScript.js](executeScript.js)
\+ [executeScript.vbs](executeScript.vbs)
<br>Execute selected or all code

##### [forgetAboutTab.js](forgetAboutTab.js)
Close current tab and remove information about it from recent files

##### [fullWindow.js](fullWindow.js)
Just like full screen mode, but preserve window size and position

##### [getHash.js](getHash.js)
Calculates hash sum of text
<br><img alt="Screenshot: getHash.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/getHash-en.png">

##### [getLinks.js](getLinks.js)
Tries to extract links from any text

##### [goToLongestLine.js](goToLongestLine.js)
Go to longest line below or above current
<br><img alt="Screenshot: goToLongestLine.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/goToLongestLine-en.png">

##### [highlighter.js](highlighter.js)
Allow set extension manually for Coder plugin with basic autodetection

##### [insertDateTemplateExample.js](insertDateTemplateExample.js)
Insert current date

##### [insertEval.js](insertEval.js)
Script like built-in Calculator.js

##### [insertTag.js](insertTag.js)
Simplify tags insertion

##### [jsBeautifier.js](jsBeautifier.js)
JavaScript unpacker and beautifier

##### [measuresConverter.js](measuresConverter.js)
Convert measures (internal) and currency (used cached data from <a href="http://exchange-rates.org/">exchange-rates.org</a>, <a href="http://fxexchangerate.com/">fxexchangerate.com</a> and <a href="http://bitcoincharts.com/">bitcoincharts.com</a>)
<br><img alt="Screenshot: measuresConverter.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/measuresConverter-en.png">

##### [moveResizeWindow.js](moveResizeWindow.js)
Move or/and align AkelPad's main window

##### [newFileTemplate.js](newFileTemplate.js)
\+ [newFileTemplate-test.js](newFileTemplate-test.js)
<br>Create new file from template

##### [openFileIn.js](openFileIn.js)
Example for open file in other application

##### [openRelativeFile.js](openRelativeFile.js)
Tries to open file with relative path.
<br>System association is used for opening binary files.
<br>Supports <a href="https://developer.mozilla.org/en/chrome_registration">Mozilla's chrome.manifest files</a>.

##### [punctuationFixer.js](punctuationFixer.js)
Fix some issues in Russian punctuation

##### [replaceDiacriticLetters.js](replaceDiacriticLetters.js)
Replace diacritic letters with “simple” latin characters

##### [restart.js](restart.js)
Restart AkelPad

##### [runScript.js](runScript.js)
Run script from AkelFiles\Plugs\Scripts\ directory with arguments
<br><img alt="Screenshot: runScript.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/runScript-en.png">

##### [saveStoreTime.js](saveStoreTime.js)
Temporary check “save file time” option and save current document

##### [scriptToBookmarklet.js](scriptToBookmarklet.js)
\+ [scriptToBookmarklet_w2k.js](scriptToBookmarklet_w2k.js)
<br>Convert JavaScript code to one line <a href="http://en.wikipedia.org/wiki/Bookmarklet">bookmarklet</a> (javascript: ...).

##### [tabsNextPrevious.js](tabsNextPrevious.js)
Switch between tabs in order of them usage (temporary check “Switch tabs: next-previous” option)

##### [tabsRightLeft.js](tabsRightLeft.js)
Switch between tabs in order of them arrangement (temporary check “Switch tabs: right-left” option)

##### [tabsSwitchAlt.js](tabsSwitchAlt.js)
Switch between tabs using alternative way (temporary check “Switch tabs: right-left” or “Switch tabs: next-previous” option)

##### [TabsToSpaces_mod.js](TabsToSpaces_mod.js)
Convert tabulation to space, modified version of <a href="http://akelpad.sourceforge.net/forum/viewtopic.php?p=7081#7081">TabsToSpaces.js</a>

##### [textStatistics.js](textStatistics.js)
Provide some statistic for English and Russian texts

##### [tileTabs.js](tileTabs.js)
Tile current tab with next selected: select first tab, call script and then select second tab

##### [toggleComments.js](toggleComments.js)
Adds/removes comments

##### [undoableReopen.js](undoableReopen.js)
Reopen file and preserve undo/redo buffer (just replace all text, if it was changed)

##### [undoRedoAll.js](undoRedoAll.js)
Undo/redo all shanges (or undo/redo to saved state)

##### [unixTime.js](unixTime.js)
Convert <a href="http://en.wikipedia.org/wiki/Unix_time">Unix time</a>
<br><img alt="Screenshot: unixTime.js" src="https://github.com/Infocatcher/AkelPad_scripts/raw/master/unixTime.png">

##### [winMergeTabs.js](winMergeTabs.js)
Compare contents of current and next selected tab using <a href="http://winmerge.org/">WinMerge</a> or any other compare tool