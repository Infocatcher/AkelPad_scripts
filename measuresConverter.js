// https://akelpad.sourceforge.net/forum/viewtopic.php?p=12107#p12107
// https://infocatcher.ucoz.net/js/akelpad_scripts/measuresConverter.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/measuresConverter.js

// (c) Infocatcher 2011-2023
// Version: 0.2.12 - 2023-12-24
// Author: Infocatcher
// [built-in currencies data: 2024-04-07]

//===================
//// Convert measures (internal) and currency (used cached data from exchange-rates.org, fxexchangerate.com and currency.world)
// Can convert numbers and expressions, pick up selected text

// Required timer.js library (only for -updateOnStartup=true):
// https://akelpad.sourceforge.net/forum/viewtopic.php?p=24559#p24559
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/Include/timer.js

// Hotkeys:
//   Enter                             - Ok
//   Ctrl+Enter (Shift+Enter)          - Convert
//   Escape                            - Cancel
//   F1, Ctrl+F1 (Shift+F1)            - Next/previous type
//   F2, Ctrl+F2 (Shift+F2)            - Next/previous source measure
//   F3, Ctrl+F3 (Shift+F3)            - Next/previous target measure
//   F4, Ctrl+U                        - Switch values (left-click on "<=>" button)
//   Ctrl+F4 (Shift+F4), Ctrl+Shift+U  - Switch measures (right-click on "<=>" button)
//   Ctrl+Shift+C                      - Copy result
//   Ctrl+Shift+F                      - Toggle currencies white list (see -currencies argument)
//   F5                                - Update currencies data
//   Ctrl+F5                           - Force update currencies data (right-click or Ctrl+click on "Update" button)
//   Shift+F5                          - Force update data only for current currencies (double click on row)

// Arguments:
//   -preferSources="fx,er,cw"     - priority for currency rate sources (from left to right, comma-separated):
//                                   fx - fxexchangerate.com (faster updates)
//                                   er - exchange-rates.org (better precision, but slow updates)
//                                   cw - currency.world
//   -offlineExpire=22*60*60*1000  - currency ratio expires after this time (in milliseconds)
//                 =Infinity       - prevent auto-updates
//   -updateOnStartup=true         - asynchronous update currency data on startup
//   -updateOnStartupReport=0      - don't show report for startup update (-updateOnStartup=true), sum of flags
//                         =1      - (default) show only errors
//                         =2      - always show
//                         =4      - (default) silently close
//   -updateSelf=false             - (use at your own risk!) update default currencies data
//   -updateMaxErrors=4            - abort update, if reached too many errors (use -1 to ignore errors)
//   -convertNumbers=true          - convert numbers (1234.5 -> 1 234,5)
//   -displayCalcErrors=true       - always display calculation errors (e.g. for "1++2")
//   -roundMeasures=3              - round measures (e.g. for 3: 0.1234 -> 0.123)
//   -roundMeasuresState=0         - don't round measures
//                      =1         - round measures (0.1234 -> 0.12, 0.00019 -> 0.00)
//                      =2         - round and show too small rounded values (e.g. 0.00 -> 0.00019)
//   -roundCurrencies=2            - round currencies (e.g. for 3: 0.1234 -> 0.123)
//   -roundCurrenciesState=0       - see -roundMeasuresState
//   -sortMeasures=true            - sort measures alphabetically
//   -sortByName=true              - sort currencies by name (otherwise - by code)
//   -maxHeight=500                - maximum window height to create listboxes instead of radio buttons
//             =0                  - (default) always use listboxes
//             =-1                 - don't resize window (and use initial window height)
//   -selectContext=7              - show N items before/after selected, 0 to disable (for listboxes)
//   -disableRadios=true           - (see -maxHeight) forbid to select the same on left and right radio buttons
//   -showLastUpdate=0             - don't show last update date for currencies
//                  =1             - show only if selected currencies
//                  =2             - (default) always show
//   -useSelected=true             - pick up selected number or expression
//   -from="Pound"                 - set source measure (you should use English names!)
//   -to="Kilogram"                - set target measure (you should use English names!)
//   -dialog=false                 - don't show dialog
//   -saveOptions=true             - allow store options
//                                   (also will be stored some options, that may be configured using arguments, e.g. -round*)
//   -savePosition=true            - allow store last window position
//   -saveOffline=true             - allow store currencies data
//   -currencies="USD,EUR"         - white list for currencies (comma-separated list)
//              ="-"               - turn off white list on startup (will be used saved white list)
//              ="-USD,EUR"        - turn off white list on startup + specify white list
//              ="+"               - turn on white list on startup (will be used saved white list)
//              ="+USD,EUR"        - turn on white list on startup + specify white list
//   -testSource="fx"              - force update all currencies from given source (see -preferSources for codes)
//                                   (will report errors, only for test purposes!)

// Usage:
//   Call("Scripts::Main", 1, "measuresConverter.js")
//   Call("Scripts::Main", 1, "measuresConverter.js", '-roundMeasuresState=0 -roundCurrencies=2 -roundCurrenciesState=1')
//   Call("Scripts::Main", 1, "measuresConverter.js", '-dialog=false -from="Pound" -to="Kilogram"')
//===================

// Create own scope for internal functions to make eval() more safe
(function(
	evalGlobal, eval, Math,
	String, Number, RegExp, Date, Boolean, Array,
	isFinite, isNaN,
	undefined, NaN, Infinity,
	AkelPad, WScript, ActiveXObject
) {

if(!Array.prototype.indexOf) {
	// Based on code from https://gist.github.com/revolunet/1908355
	Array.prototype.indexOf = function(elt /*, from*/) {
		var len = this.length >>> 0;
		var from = +(arguments[1]) || 0;
		from = from < 0 ? Math.ceil(from) : Math.floor(from);
		if(from < 0)
			from += len;
		for(; from < len; ++from)
			if(from in this && this[from] === elt)
				return from;
		return -1;
	};
}

var measures = {
	//~ todo: https://en.wikipedia.org/wiki/Conversion_of_units
	"Prefi&xes": {
		"Yocto (y)": 1e-24,
		"Zepto (z)": 1e-21,
		"Atto (a)":  1e-18,
		"Femto (f)": 1e-15,
		"Pico (p)":  1e-12,
		"Nano (n)":  1e-9,
		"Micro (μ)": 1e-6,
		"Milli (m)": 1e-3,
		"Centi (c)": 1e-2,
		"Deci (d)":  1e-1,
		"(W/o)": 1,
		"Deсa (da)": 1e+1,
		"Hecto (h)": 1e+2,
		"Kilo (k)":  1e+3,
		"Mega (M)":  1e+6,
		"Giga (G)":  1e+9,
		"Tera (T)":  1e+12,
		"Peta (P)":  1e+15,
		"Exa (E)":   1e+18,
		"Zetta (Z)": 1e+21,
		"Yotta (Y)": 1e+24
	},
	"&Binary prefixes": {
		"(W/o)": 1,
		"Kibi (Ki)": 1024,
		"Mebi (Mi)": Math.pow(1024, 2),
		"Gibi (Gi)": Math.pow(1024, 3),
		"Tebi (Ti)": Math.pow(1024, 4),
		"Pebi (Pi)": Math.pow(1024, 5),
		"Exbi (Ei)": Math.pow(1024, 6),
		"Zebi (Zi)": Math.pow(1024, 7),
		"Yobi (Yi)": Math.pow(1024, 8)
	},
	"&Information": {
		"Bit": 1,

		"Kibibit (Kibit)": 1024,
		"Mebibit (Mibit)": Math.pow(1024, 2),
		"Gibibit (Gibit)": Math.pow(1024, 3),
		"Tebibit (Tibit)": Math.pow(1024, 4),
		"Pebibit (Pibit)": Math.pow(1024, 5),
		"Exbibit (Eibit)": Math.pow(1024, 6),
		"Zebibit (Zibit)": Math.pow(1024, 7),
		"Yobibit (Yibit)": Math.pow(1024, 8),

		"Kilobit (kbit)":  1e+3,
		"Megabit (Mbit)":  1e+6,
		"Gigabit (Gbit)":  1e+9,
		"Terabit (Tbit)":  1e+12,
		"Petabit (Pbit)":  1e+15,
		"Exabit (Ebit)":   1e+18,
		"Zettabit (Zbit)": 1e+21,
		"Yottabit (Ybit)": 1e+24,

		"Byte": 8,

		"Kibibyte (KiB)": 1024*8,
		"Mebibyte (MiB)": Math.pow(1024, 2)*8,
		"Gibibyte (GiB)": Math.pow(1024, 3)*8,
		"Tebibyte (TiB)": Math.pow(1024, 4)*8,
		"Pebibyte (PiB)": Math.pow(1024, 5)*8,
		"Exbibyte (EiB)": Math.pow(1024, 6)*8,
		"Zebibyte (ZiB)": Math.pow(1024, 7)*8,
		"Yobibyte (YiB)": Math.pow(1024, 8)*8,

		"Kilobyte (kB)":  1e+3*8,
		"Megabyte (MB)":  1e+6*8,
		"Gigabyte (GB)":  1e+9*8,
		"Terabyte (TB)":  1e+12*8,
		"Petabyte (PB)":  1e+15*8,
		"Exabyte (EB)":   1e+18*8,
		"Zettabyte (ZB)": 1e+21*8,
		"Yottabyte (YB)": 1e+24*8
	},
	"&Mass": {
		"Milligram (mg)": 1e-6,
		"Gram (g)":       1e-3,
		"Kilogram (kg)": 1,
		"Tonne": 1e3,
		"Atomic mass unit (u, Da)": 1.660538782838383e-27,
		"Carat (ct)": 200e-6,
		"Grain": 64.79891e-6,
		"Ounce (oz)": 0.45359237/16,
		"Pound (lb)": 0.45359237 // 64.79891e-6*7000
	},
	"&Length": {
		"Picometer (pm)":  1e-12,
		"Nanometer (nm)":  1e-9,
		"Micrometer (µm)": 1e-6,
		"Millimeter (mm)": 1e-3,
		"Centimeter (cm)": 1e-2,
		"Decimeter (dm)":  1e-1,
		"Meter (m)": 1,
		"Kilometer (km)":  1e+3,
		"Angstrom (Å)":    1e-10,
		"Astronomical unit (a.u.)": 149597871464,
		"Light-year (ly)":   9460730472580820,
		"Light-day":    9460730472580820/365.25, // Julian year!
		"Light-hour":   9460730472580820/365.25/24,
		"Light-minute": 9460730472580820/365.25/24/60,
		"Light-second": 9460730472580820/365.25/24/60/60,
		"Parsec (pc)": 3.08567782e+16,
		"Kiloparsec (kpc)": 3.08567782e+16*1e3,
		"Megaparsec (Mpc)": 3.08567782e+16*1e6,
		"Gigaparsec (Gpc)": 3.08567782e+16*1e9,
		"Inch (in)": 0.0254,
		"Foot (ft)": 0.0254*12,
		"Yard (yd)": 0.0254*12*3,
		"Mile": 1.609344e+3, // 0.0254*12*3*1760
		"Nautical mile": 1852,
		"Cable": 1852/10
	},
	"S&quare": {
		"Square picometer (pm²)":  Math.pow(1e-12, 2),
		"Square nanometer (nm²)":  Math.pow(1e-9, 2),
		"Square micrometer (µm²)": Math.pow(1e-6, 2),
		"Square millimeter (mm²)": Math.pow(1e-3, 2),
		"Square centimeter (cm²)": Math.pow(1e-2, 2),
		"Square decimeter (dm²)":  Math.pow(1e-1, 2),
		"Square meter (m²)": 1,
		"Square kilometer (km²)":  Math.pow(1e+3, 2),
		"Are": 1e2,
		"Hectare (ha)": 1e4,
		"Square inch (in²)": Math.pow(0.0254, 2),
		"Square foot (ft²)": Math.pow(0.0254*12, 2),
		"Square yard (yd²)": Math.pow(0.0254*12*3, 2),
		"Square mile": Math.pow(0.0254*12*3*1760, 2), // 1609.344
		"Square nautical mile": Math.pow(1852, 2),
		"Acre": Math.pow(0.0254*12*3, 2)*4840
	},
	"&Volume": {
		"Cubic picometer (pm³)":  Math.pow(1e-12, 3),
		"Cubic nanometer (nm³)":  Math.pow(1e-9, 3),
		"Cubic micrometer (µm³)": Math.pow(1e-6, 3),
		"Cubic millimeter (mm³)": Math.pow(1e-3, 3),
		"Cubic centimeter (cm³)": Math.pow(1e-2, 3),
		"Cubic decimeter (dm³)":  Math.pow(1e-1, 3),
		"Cubic meter (m³)": 1,
		"Cubic kilometer (km³)":  Math.pow(1e+3, 3),
		"Litre (l)":              Math.pow(1e-1, 3),
		"Millilitre (ml)":        Math.pow(1e-1, 3)/1e3,
		"Cubic inch (in³)": Math.pow(0.0254, 3),
		"Cubic foot (ft³)": Math.pow(0.0254*12, 3),
		"Cubic yard (yd³)": Math.pow(0.0254*12*3, 3),
		"Cubic mile": Math.pow(0.0254*12*3*1760, 3), // Math.pow(1609.344, 3)
		"Cubic nautical mile": Math.pow(1852, 3),
		"Gallon (USA)": Math.pow(1e-1, 3)*3.785411784,
		"Barrel (USA)": Math.pow(1e-1, 3)*3.785411784*42,
		"Fluid pint (USA)":         Math.pow(1e-1, 3)/1e3*473.176473,
		"Fluid ounce (USA, fl oz)": Math.pow(1e-1, 3)/1e3*29.5735295625
	},
	"Plane &angle": {
		"Radian (rad)": 1,
		"Degree (°)":     Math.PI/180,
		"Arcminute (′)":  Math.PI/180/60,
		"Arcsecond (\″)": Math.PI/180/60/60,
		"Turn": Math.PI*2,
		"Grad": Math.PI/200,
		"Bearing": Math.PI/16
	},
	"&Density": {
		"Kilogram per cubic metre (kg/m³)": 1,
		"Gram per cubic centimeter (g/cm³)": 1e+3,
		"Tonne per cubic meter (t/m³)":      1e+3,
		"Kilogram per litre":                1e+3,
		"Gram per millilitre":               1e+3,
		"Ounce per cubic inch": (0.45359237/16)/Math.pow(0.0254, 2),
		"Pound per cubic inch": 0.45359237/Math.pow(0.0254, 2)
	},
	"&Time": {
		"Nanosecond (ns)":  1e-9,
		"Microsecond (µs)": 1e-6,
		"Millisecond (ms)": 1e-3,
		"Second (s)": 1,
		"Minute": 60,
		"Hour": 3600,
		"Day": 86400,
		"Month*": 86400*(31+28.2425+31+30+31+30+31+31+30+31+30+31)/12,
		"Gregorian year*": 86400*365.2425, // 365 + 1/4 - 1/100 + 1/400
		"Julian year*": 86400*365.25
	},
	"&Speed": {
		"Centimeter per second (cm/s)": 1e-2,
		"Meter per second (m/s)": 1,
		"Kilometer per second (km/s)": 1e+3,
		"Kilometer per hour (km/h)": 1/3.6,
		"Mile per hour (mph)": 0.44704,
		"Knot (kn)": 1.852/3.6,
		"Foot per second (ft/s)": 0.3048,
		"Speed of light in vacuum (c)": 299792458
	},
	"Temperat&ure": {
		"Celsius degree (°C)": 1,
		"Kelvin degree (°K)": {
			toBase:   function(n) { return n - 273.16; },
			fromBase: function(n) { return n + 273.16; }
		},
		"Fahrenheit degree (°F)": {
			toBase:   function(n) { return (n - 32)*5/9; },
			fromBase: function(n) { return n*9/5 + 32; }
		}
	},
	"&Energy": {
		"Joul (J)": 1,
		"Kilojoul (kJ)": 1e+3,
		"Megajoul (MJ)": 1e+6,
		"Gigajoul (GJ)": 1e+9,
		"Erg":           1e-7,
		"Calorie (cal)":      4.1868,
		"Kilocalorie (kcal)": 4.1868*1e+3,
		"Kilowatt hour (kW·h)": 1e+3*3600,
		"Electronvolt (eV)":      1.60217648740404040e-19,
		"Kiloelectronvolt (keV)": 1.60217648740404040e-19*1e+3,
		"Megaelectronvolt (MeV)": 1.60217648740404040e-19*1e+6,
		"Gigaelectronvolt (GeV)": 1.60217648740404040e-19*1e+9,
		"Teraelectronvolt (TeV)": 1.60217648740404040e-19*1e+12
	},
	"&Power": {
		"Milliwatt (mW)": 1e-3,
		"Watt (W)": 1,
		"Kilowatt (kW)": 1e+3,
		"Megawatt (MW)": 1e+6,
		"Gigawatt (GW)": 1e+9,
		"Calorie per second (cal/s)": 4.1868,
		"Horsepower (HP)": 735.49875
	},
	"Te&nsion": {
		"Pascal (Pa)": 1,
		"Kilopascal (kPa)": 1e+3,
		"Megapascal (MPa)": 1e+6,
		"Millibar (mbar)":  1e+2,
		"Bar (bar)":        1e+5,
		"Technical atmosphere (at)": 98066.5,
		"Atmosphere (atm)": 101325,
		"Millimeter of water (mm H2O)": 9.80638,
		"Millimeter of mercury (mm Hg)": 133.3224,
		"Pound-force per square inch (psi)": 6894.757
	},
	"&Currency": {
		// https://www.exchange-rates.org/current-rates/usd
		// http://exchange-rates.org/converter/EUR/USD/1/Y
		// https://www.fxexchangerate.com/currency-converter-widget.html
		// https://currency.world/convert/
		// https://currency.world/convert/EUR/USD
		// Sorted by code
		"United Arab Emirates Dirham":   "AED",
		"Afghan Afghani":                "AFN",
		"Albanian Lek":                  "ALL",
		"Armenian Dram":                 "AMD",
		"Netherlands Antillian Guilder": "ANG",
		"Angolan Kwanza":                "AOA",
		"Argentine Peso":                "ARS",
		"Australian Dollar":             "AUD",
		"Aruba Florin":                  "AWG",
		"Azerbaijani Manat":             "AZN",
		"Bosnia and Herzegovina Marka":  "BAM",
		"Barbados Dollar":               "BBD",
		"Bangladeshi Taka":              "BDT",
		"Bulgarian Lev":                 "BGN",
		"Bahraini Dinar":                "BHD",
		"Burundi Franc":                 "BIF",
		"Bermudian Dollar":              "BMD",
		"Brunei Dollar":                 "BND",
		"Bolivian Boliviano":            "BOB",
		"Brazilian Real":                "BRL",
		"Bahamian Dollar":               "BSD",
		"Bitcoin":                       "BTC",
		"Bhutan Ngultrum":               "BTN",
		"Botswana Pula":                 "BWP",
		"Belarusian Ruble":              "BYN",
		"Belize Dollar":                 "BZD",
		"Canadian Dollar":               "CAD",
		"Congolese Franc":               "CDF",
		"Swiss Franc":                   "CHF",
		"Chilean Peso":                  "CLP",
		"Chinese Yuan Renminbi":         "CNY",
		"Colombian Peso":                "COP",
		"Costa Rican Colon":             "CRC",
		"Cuban Peso":                    "CUP",
		"Cape Verde Escudo":             "CVE",
		"Czech Koruna":                  "CZK",
		"Djibouti Franc":                "DJF",
		"Danish Krone":                  "DKK",
		"Dominican Peso":                "DOP",
		"Algerian Dinar":                "DZD",
		"Estonian Kroon":                "EEK",
		"Egyptian Pound":                "EGP",
		"Eritrean Nakfa":                "ERN",
		"Ethiopian Birr":                "ETB",
		"Ethereum":                      "ETH",
		"Euro":                          "EUR",
		"Fiji Dollar":                   "FJD",
		"Falkland Islands Pound":        "FKP",
		"British Pound":                 "GBP",
		"Georgian Lari":                 "GEL",
		"Ghanaian Cedi":                 "GHS",
		"Gambian Dalasi":                "GMD",
		"Guinea Franc":                  "GNF",
		"Guatemalan Quetzal":            "GTQ",
		"Guyana Dollar":                 "GYD",
		"Hong Kong Dollar":              "HKD",
		"Honduran Lempira":              "HNL",
		"Croatian Kuna":                 "HRK",
		"Haitian Gourde":                "HTG",
		"Hungarian Forint":              "HUF",
		"Indonesian Rupiah":             "IDR",
		"Israeli New Shekel":            "ILS",
		"Indian Rupee":                  "INR",
		"Iraqi Dinar":                   "IQD",
		"Iranian Rial":                  "IRR",
		"Iceland Krona":                 "ISK",
		"Jamaican Dollar":               "JMD",
		"Jordanian Dinar":               "JOD",
		"Japanese Yen":                  "JPY",
		"Kenyan Shilling":               "KES",
		"Kyrgyzstan Som":                "KGS",
		"Cambodian Riel":                "KHR",
		"Comoros Franc":                 "KMF",
		"North Korean Won":              "KPW",
		"Korean Won":                    "KRW",
		"Kuwaiti Dinar":                 "KWD",
		"Cayman Islands Dollar":         "KYD",
		"Kazakhstan Tenge":              "KZT",
		"Lao Kip":                       "LAK",
		"Lebanese Pound":                "LBP",
		"Sri Lanka Rupee":               "LKR",
		"Liberian Dollar":               "LRD",
		"Lesotho Loti":                  "LSL",
		"Lithuanian Litas":              "LTL",
		"Latvian Lats":                  "LVL",
		"Libyan Dinar":                  "LYD",
		"Moroccan Dirham":               "MAD",
		"Moldovan Leu":                  "MDL",
		"Malagasy Ariary":               "MGA",
		"Macedonian Denar":              "MKD",
		"Myanmar Kyat":                  "MMK",
		"Mongolian Tugrik":              "MNT",
		"Macau Pataca":                  "MOP",
		"Mauritania Ouguiya":            "MRU",
		"Mauritius Rupee":               "MUR",
		"Maldives Rufiyaa":              "MVR",
		"Malawi Kwacha":                 "MWK",
		"Mexican Peso":                  "MXN",
		"Malaysian Ringgit":             "MYR",
		"Mozambican Metical":            "MZN",
		"Namibian Dollar":               "NAD",
		"Nigerian Naira":                "NGN",
		"Nicaraguan Cordoba Oro":        "NIO",
		"Norwegian Krone":               "NOK",
		"Nepalese Rupee":                "NPR",
		"New Zealand Dollar":            "NZD",
		"Omani Rial":                    "OMR",
		"Panamanian Balboa":             "PAB",
		"Peruvian Nuevo Sol":            "PEN",
		"Papua New Guinea Kina":         "PGK",
		"Philippine Peso":               "PHP",
		"Pakistan Rupee":                "PKR",
		"Polish Zloty":                  "PLN",
		"Paraguay Guarani":              "PYG",
		"Qatari Rial":                   "QAR",
		"Romanian Leu":                  "RON",
		"Serbian Dinar":                 "RSD",
		"Russian Ruble":                 "RUB",
		"Rwanda Franc":                  "RWF",
		"Saudi Riyal":                   "SAR",
		"Solomon Islands Dollar":        "SBD",
		"Seychelles Rupee":              "SCR",
		"Sudanese Pound":                "SDG",
		"Swedish Krona":                 "SEK",
		"Singapore Dollar":              "SGD",
		"St Helena Pound":               "SHP",
		"Slovak Koruna":                 "SKK",
		"Sierra Leone Leone":            "SLL",
		"Somali Shilling":               "SOS",
		"Surinamese Dollar":             "SRD",
		"Sao Tome Dobra":                "STD",
		"El Salvador Colon":             "SVC",
		"Syrian Pound":                  "SYP",
		"Swaziland Lilangeni":           "SZL",
		"Thai Baht":                     "THB",
		"Tajikistani Somoni":            "TJS",
		"Turkmenistan Manat":            "TMT",
		"Tunisian Dinar":                "TND",
		"Tonga Pa'ang":                  "TOP",
		"Turkish Lira":                  "TRY",
		"Trinidad and Tobago Dollar":    "TTD",
		"Taiwan Dollar":                 "TWD",
		"Tanzanian Shilling":            "TZS",
		"Ukraine Hryvnia":               "UAH",
		"Uganda Shilling":               "UGX",
		"US Dollar":                  1/*"USD"*/,
		"Uruguay Peso":                  "UYU",
		"Uzbekistan Sum":                "UZS",
		"Venezuelan Bolivar":            "VES",
		"Vietnamese Dong":               "VND",
		"Vanuatu Vatu":                  "VUV",
		"Samoa Tala":                    "WST",
		"CFA BEAC Franc":                "XAF",
		"Gold":                          "XAU",
		"East Caribbean Dollar":         "XCD",
		"CFA BCEAO Franc":               "XOF",
		"CFP Franc":                     "XPF",
		"Yemen Riyal":                   "YER",
		"South African Rand":            "ZAR",
		"Zambian Kwacha":                "ZMW",
		"Zimbabwean Dollar":             "ZWL"
	}
};

function _localize(s) {
	var strings = {
		"Prefi&xes": {
			ru: "Пристав&ки"
		},
		"Yocto (y)": {
			ru: "Йокто (и, y)"
		},
		"Zepto (z)": {
			ru: "Зепто (з, z)"
		},
		"Atto (a)": {
			ru: "Атто (а)"
		},
		"Femto (f)": {
			ru: "Фемто (ф, f)"
		},
		"Pico (p)": {
			ru: "Пико (п, p)"
		},
		"Nano (n)": {
			ru: "Нано (н, n)"
		},
		"Micro (μ)": {
			ru: "Микро (мк, μ)"
		},
		"Milli (m)": {
			ru: "Милли (м, m)"
		},
		"Centi (c)": {
			ru: "Санти (с)"
		},
		"Deci (d)": {
			ru: "Деци (д, d)"
		},
		"(W/o)": {
			ru: "(Без приставки)"
		},
		"Deсa (da)": {
			ru: "Дека (да, da)"
		},
		"Hecto (h)": {
			ru: "Гекто (г, h)"
		},
		"Kilo (k)": {
			ru: "Кило (к, k)"
		},
		"Mega (M)": {
			ru: "Мега (М)"
		},
		"Giga (G)": {
			ru: "Гига (Г, G)"
		},
		"Tera (T)": {
			ru: "Тера (Т)"
		},
		"Peta (P)": {
			ru: "Пета (П, P)"
		},
		"Exa (E)": {
			ru: "Экса (Э, E)"
		},
		"Zetta (Z)": {
			ru: "Зетта (З, Z)"
		},
		"Yotta (Y)": {
			ru: "Йотта (И, Y)"
		},

		"&Binary prefixes": {
			ru: "Двои&чные приставки"
		},
		"Kibi (Ki)": {
			ru: "Киби (Ки, Ki)"
		},
		"Mebi (Mi)": {
			ru: "Меби (Ми, Mi)"
		},
		"Gibi (Gi)": {
			ru: "Гиби (Ги, Gi)"
		},
		"Tebi (Ti)": {
			ru: "Теби (Ти, Ti)"
		},
		"Pebi (Pi)": {
			ru: "Пеби (Пи, Pi)"
		},
		"Exbi (Ei)": {
			ru: "Эксби (Эи, Ei)"
		},
		"Zebi (Zi)": {
			ru: "Зеби (Зи, Zi)"
		},
		"Yobi (Yi)": {
			ru: "Йоби (Йи, Yi)"
		},

		"&Information": {
			ru: "&Информация"
		},
		"Bit": {
			ru: "Бит"
		},

		"Kibibit (Kibit)": {
			ru: "Кибибит (Кибит, Kibit)"
		},
		"Mebibit (Mibit)": {
			ru: "Мебибит (Мибит, Mibit)"
		},
		"Gibibit (Gibit)": {
			ru: "Гибибит (Гибит, Gibit)"
		},
		"Tebibit (Tibit)": {
			ru: "Тебибит (Тибит, Tibit)"
		},
		"Pebibit (Pibit)": {
			ru: "Пебибит (Пибит, Pibit)"
		},
		"Exbibit (Eibit)": {
			ru: "Эксибит (Эибит, Eibit)"
		},
		"Zebibit (Zibit)": {
			ru: "Зебибит (Зибит, Zibit)"
		},
		"Yobibit (Yibit)": {
			ru: "Йобибит (Йибит, Yibit)"
		},

		"Kilobit (kbit)": {
			ru: "Килобит (кбит, kbit)"
		},
		"Megabit (Mbit)": {
			ru: "Мегабит (Мбит, Mbit)"
		},
		"Gigabit (Gbit)": {
			ru: "Гигабит (Гбит, Gbit)"
		},
		"Terabit (Tbit)": {
			ru: "Терабит (Тбит, Tbit)"
		},
		"Petabit (Pbit)": {
			ru: "Петабит (Пбит, Pbit)"
		},
		"Exabit (Ebit)": {
			ru: "Эксабит (Эбит, Ebit)"
		},
		"Zettabit (Zbit)": {
			ru: "Зеттабит (Збит, Zbit)"
		},
		"Yottabit (Ybit)": {
			ru: "Йоттабит (Ибит, Ybit)"
		},

		"Byte": {
			ru: "Байт"
		},

		"Kibibyte (KiB)": {
			ru: "Кибибайт (Кбайт, KiB)"
		},
		"Mebibyte (MiB)": {
			ru: "Мебибайт (Мбайт, MiB)"
		},
		"Gibibyte (GiB)": {
			ru: "Гибибайт (Гбайт, GiB)"
		},
		"Tebibyte (TiB)": {
			ru: "Тебибайт (Тбайт, TiB)"
		},
		"Pebibyte (PiB)": {
			ru: "Пебибайт (Пбайт, PiB)"
		},
		"Exbibyte (EiB)": {
			ru: "Эксибайт (Эбайт, EiB)"
		},
		"Zebibyte (ZiB)": {
			ru: "Зебибайт (Збайт, ZiB)"
		},
		"Yobibyte (YiB)": {
			ru: "Йобибайт (Йбайт, YiB)"
		},

		"Kilobyte (kB)": {
			ru: "Килобайт (КБ, kB)"
		},
		"Megabyte (MB)": {
			ru: "Мегабайт (МБ, MB)"
		},
		"Gigabyte (GB)": {
			ru: "Гигабайт (ГБ, GB)"
		},
		"Terabyte (TB)": {
			ru: "Терабайт (ТБ, TB)"
		},
		"Petabyte (PB)": {
			ru: "Петабайт (ПБ, PB)"
		},
		"Exabyte (EB)": {
			ru: "Эксабайт (ЭБ, EB)"
		},
		"Zettabyte (ZB)": {
			ru: "Зеттабайт (ЗБ, ZB)"
		},
		"Yottabyte (YB)": {
			ru: "Йоттабайт (ИБ, YB)"
		},

		"&Mass": {
			ru: "&Масса"
		},
		"Milligram (mg)": {
			ru: "Миллиграмм (мг, mg)"
		},
		"Gram (g)": {
			ru: "Грамм (г, g)"
		},
		"Kilogram (kg)": {
			ru: "Килограмм (кг, kg)"
		},
		"Tonne": {
			ru: "Тонна"
		},
		"Atomic mass unit (u, Da)": {
			ru: "Атомная единица массы (а.е.м., u, Da)"
		},
		"Carat (ct)": {
			ru: "Карат (кар, ct)"
		},
		"Grain": {
			ru: "Гран"
		},
		"Ounce (oz)": {
			ru: "Унция (oz)"
		},
		"Pound (lb)": {
			ru: "Фунт (lb)"
		},

		"&Length": {
			ru: "&Длина"
		},
		"Picometer (pm)": {
			ru: "Пикометр (пм, pm)"
		},
		"Nanometer (nm)": {
			ru: "Нанометр (нм, nm)"
		},
		"Micrometer (µm)": {
			ru: "Микрометр (мкм, µm)"
		},
		"Millimeter (mm)": {
			ru: "Миллиметр (мм, mm)"
		},
		"Centimeter (cm)": {
			ru: "Сантиметр (см, cm)"
		},
		"Decimeter (dm)": {
			ru: "Дециметр (дм, dm)"
		},
		"Meter (m)": {
			ru: "Метр (м, m)"
		},
		"Kilometer (km)": {
			ru: "Километр (км, km)"
		},
		"Angstrom (Å)": {
			ru: "Ангстрем (Å)"
		},
		"Astronomical unit (a.u.)": {
			ru: "Астрономическая единица (а.е., a.u.)"
		},
		"Light-year (ly)": {
			ru: "Световой год (св.г., ly)"
		},
		"Light-day": {
			ru: "Световой день"
		},
		"Light-hour": {
			ru: "Световой час"
		},
		"Light-minute": {
			ru: "Световая минута"
		},
		"Light-second": {
			ru: "Световая секунда"
		},
		"Parsec (pc)": {
			ru: "Парсек (пк, pc)"
		},
		"Kiloparsec (kpc)": {
			ru: "Килопарсек (кпк, kpc)"
		},
		"Megaparsec (Mpc)": {
			ru: "Мегапарсек (Мпк, Mpc)"
		},
		"Gigaparsec (Gpc)": {
			ru: "Гигапарсек (Гпк, Gpc)"
		},
		"Inch (in)": {
			ru: "Дюйм (in)"
		},
		"Foot (ft)": {
			ru: "Фут (ft)"
		},
		"Yard (yd)": {
			ru: "Ярд (yd)"
		},
		"Mile": {
			ru: "Миля"
		},
		"Nautical mile": {
			ru: "Морская миля"
		},
		"Cable": {
			ru: "Кабельтов"
		},

		"S&quare": {
			ru: "&Площадь"
		},
		"Square picometer (pm²)": {
			ru: "Квадратный пикометр (пм², pm²)"
		},
		"Square nanometer (nm²)": {
			ru: "Квадратный нанометр (нм², nm²)"
		},
		"Square micrometer (µm²)": {
			ru: "Квадратный микрометр (мкм², µm²)"
		},
		"Square millimeter (mm²)": {
			ru: "Квадратный миллиметр (мм², mm²)"
		},
		"Square centimeter (cm²)": {
			ru: "Квадратный сантиметр (см², cm²)"
		},
		"Square decimeter (dm²)": {
			ru: "Квадратный дециметр (дм², dm²)"
		},
		"Square meter (m²)": {
			ru: "Квадратный метр (м², m²)"
		},
		"Square kilometer (km²)": {
			ru: "Квадратный километр (км², km²)"
		},
		"Are": {
			ru: "Ар"
		},
		"Hectare (ha)": {
			ru: "Гектар (га, ha)"
		},
		"Square inch (in²)": {
			ru: "Квадратный дюйм (in²)"
		},
		"Square foot (ft²)": {
			ru: "Квадратный фут (ft²)"
		},
		"Square yard (yd²)": {
			ru: "Квадратный ярд (yd²)"
		},
		"Square mile": {
			ru: "Квадратная миля"
		},
		"Square nautical mile": {
			ru: "Квадратная морская миля"
		},
		"Acre": {
			ru: "Акр"
		},

		"&Volume": {
			ru: "&Объём"
		},
		"Cubic picometer (pm³)": {
			ru: "Кубический пикометр (пм³, pm³)"
		},
		"Cubic nanometer (nm³)": {
			ru: "Кубический нанометр (нм³, nm³)"
		},
		"Cubic micrometer (µm³)": {
			ru: "Кубический микрометр (мкм³, µm³)"
		},
		"Cubic millimeter (mm³)": {
			ru: "Кубический миллиметр (мм³, mm³)"
		},
		"Cubic centimeter (cm³)": {
			ru: "Кубический сантиметр (см³, cm³)"
		},
		"Cubic decimeter (dm³)": {
			ru: "Кубический дециметр (дм³, dm³)"
		},
		"Cubic meter (m³)": {
			ru: "Кубический метр (м³, m³)"
		},
		"Cubic kilometer (km³)": {
			ru: "Кубический километр (км³, km³)"
		},
		"Litre (l)": {
			ru: "Литр (л, l)"
		},
		"Millilitre (ml)": {
			ru: "Миллилитр (мл, ml)"
		},
		"Cubic inch (in³)": {
			ru: "Кубический дюйм (in³)"
		},
		"Cubic foot (ft³)": {
			ru: "Кубический фут (ft³)"
		},
		"Cubic yard (yd³)": {
			ru: "Кубический ярд (yd³)"
		},
		"Cubic mile": {
			ru: "Кубическая миля"
		},
		"Cubic nautical mile": {
			ru: "Кубическая морская миля"
		},
		"Gallon (USA)": {
			ru: "Галлон (США)"
		},
		"Barrel (USA)": {
			ru: "Баррель (США)"
		},
		"Fluid pint (USA)": {
			ru: "Жидкая пинта (США)"
		},
		"Fluid ounce (USA, fl oz)": {
			ru: "Жидкая унция (США, fl oz)"
		},

		"Plane &angle": {
			ru: "Плоский &угол"
		},
		"Radian (rad)": {
			ru: "Радиан (рад, rad)"
		},
		"Degree (°)": {
			ru: "Градус (°)"
		},
		"Arcminute (′)": {
			ru: "Угловая минута (′)"
		},
		"Arcsecond (\″)": {
			ru: "Угловая секунда (\″)"
		},
		"Turn": {
			ru: "Оборот"
		},
		"Grad": {
			ru: "Град"
		},
		"Bearing": {
			ru: "Румб"
		},

		"&Density": {
			ru: "Плот&ность"
		},
		"Kilogram per cubic metre (kg/m³)": {
			ru: "Килограмм на кубический метр (кг/м³, kg/m³)"
		},
		"Gram per cubic centimeter (g/cm³)": {
			ru: "Грамм на кубический сантиметр (г/см³, g/cm³)"
		},
		"Tonne per cubic meter (t/m³)": {
			ru: "Тонна на кубический метр (т/м³, t/m³)"
		},
		"Kilogram per litre": {
			ru: "Килограмм на литр"
		},
		"Gram per millilitre": {
			ru: "Грамм на миллилитр"
		},
		"Ounce per cubic inch": {
			ru: "Унция на кубический дюйм"
		},
		"Pound per cubic inch": {
			ru: "Фунт на кубический дюйм"
		},

		"&Time": {
			ru: "&Время"
		},
		"Nanosecond (ns)": {
			ru: "Наносекунда (нс, ns)"
		},
		"Microsecond (µs)": {
			ru: "Микросекунда (мкс, µs)"
		},
		"Millisecond (ms)": {
			ru: "Миллисекунда (мс, ms)"
		},
		"Second (s)": {
			ru: "Секунда (с, s)"
		},
		"Minute": {
			ru: "Минута"
		},
		"Hour": {
			ru: "Час"
		},
		"Day": {
			ru: "Сутки"
		},
		"Month*": {
			ru: "Месяц*"
		},
		"Gregorian year*": {
			ru: "Григорианский год*"
		},
		"Julian year*": {
			ru: "Юлианский год*"
		},

		"&Speed": {
			ru: "&Скорость"
		},
		"Centimeter per second (cm/s)": {
			ru: "Сантиметр в секунду (см/с, cm/s)"
		},
		"Meter per second (m/s)": {
			ru: "Метр в секунду (м/с, m/s)"
		},
		"Kilometer per second (km/s)": {
			ru: "Километр в секунду (км/с, km/s)"
		},
		"Kilometer per hour (km/h)": {
			ru: "Километр в час (км/ч, km/h)"
		},
		"Mile per hour (mph)": {
			ru: "Миля в час (mph)"
		},
		"Knot (kn)": {
			ru: "Узел (kn)"
		},
		"Foot per second (ft/s)": {
			ru: "Фут в секунду (ft/s)"
		},
		"Speed of light in vacuum (c)": {
			ru: "Скорости света в вакууме (c)"
		},

		"Temperat&ure": {
			ru: "&Температура"
		},
		"Celsius degree (°C)": {
			ru: "Градусы Цельсия (°C)"
		},
		"Kelvin degree (°K)": {
			ru: "Градусы Кельвина (°K)"
		},
		"Fahrenheit degree (°F)": {
			ru: "Градусы Фаренгейта (°F)"
		},

		"&Energy": {
			ru: "&Энергия"
		},
		"Joul (J)": {
			ru: "Джоуль (Дж, J)"
		},
		"Kilojoul (kJ)": {
			ru: "Килоджоуль (кДж, kJ)"
		},
		"Megajoul (MJ)": {
			ru: "Мегаджоуль (МДж, MJ)"
		},
		"Gigajoul (GJ)": {
			ru: "Гигаджоуль (ГДж, GJ)"
		},
		"Erg": {
			ru: "Эрг"
		},
		"Calorie (cal)": {
			ru: "Калория (кал, cal)"
		},
		"Kilocalorie (kcal)": {
			ru: "Килокалория (ккал, kcal)"
		},
		"Kilowatt hour (kW·h)": {
			ru: "Киловатт-час (кВт·ч, kW·h)"
		},
		"Electronvolt (eV)": {
			ru: "Электронвольт (эВ, eV)"
		},
		"Kiloelectronvolt (keV)": {
			ru: "Килоэлектронвольт (кэВ, keV)"
		},
		"Megaelectronvolt (MeV)": {
			ru: "Мегаэлектронвольт (МэВ, MeV)"
		},
		"Gigaelectronvolt (GeV)": {
			ru: "Гигаэлектронвольт (ГэВ, GeV)"
		},
		"Teraelectronvolt (TeV)": {
			ru: "Тераэлектронвольт (ТэВ, TeV)"
		},

		"&Power": {
			ru: "Мо&щность"
		},
		"Milliwatt (mW)": {
			ru: "Милливатт (мВт, mW)"
		},
		"Watt (W)": {
			ru: "Ватт (Вт, W)"
		},
		"Kilowatt (kW)": {
			ru: "Киловатт (кВт, kW)"
		},
		"Megawatt (MW)": {
			ru: "Мегаватт (МВт, MW)"
		},
		"Gigawatt (GW)": {
			ru: "Гигаватт (ГВт, GW)"
		},
		"Calorie per second (cal/s)": {
			ru: "Калория в секунду (кал/с, cal/s)"
		},
		"Horsepower (HP)": {
			ru: "Лошадиная сила (л.с., HP)"
		},

		"Te&nsion": {
			ru: "Дав&ление"
		},
		"Pascal (Pa)": {
			ru: "Паскаль (Па, Pa)"
		},
		"Kilopascal (kPa)": {
			ru: "Килопаскаль (кПа, kPa)"
		},
		"Megapascal (MPa)": {
			ru: "Мегапаскаль (МПа, MPa)"
		},
		"Millibar (mbar)": {
			ru: "Миллибар (мбар, mbar)"
		},
		"Bar (bar)": {
			ru: "Бар (бар, bar)"
		},
		"Technical atmosphere (at)": {
			ru: "Техническая атмосфера (ат, at)"
		},
		"Atmosphere (atm)": {
			ru: "Атмосфера (атм, atm)"
		},
		"Millimeter of water (mm H2O)": {
			ru: "Миллиметр водного столба (мм вод. ст., mm H2O)"
		},
		"Millimeter of mercury (mm Hg)": {
			ru: "Миллиметр ртутного столба (мм рт. ст., mm Hg)"
		},
		"Pound-force per square inch (psi)": {
			ru: "Фунт на квадратный дюйм (psi)"
		},

		"&Currency": {
			ru: "Вал&юта"
		},
		// https://ru.exchange-rates.org/AddCustomContent/RatesTable/Preview/RT0007HHO
		// https://www.fxexchangerate.com/currency-converter-widget.html
		"Afghan Afghani": {
			ru: "Афганский афгани"
		},
		"Albanian Lek": {
			ru: "Албанский лек"
		},
		"Algerian Dinar": {
			ru: "Алжирский динар"
		},
		"Angolan Kwanza": {
			ru: "Ангольская кванза"
		},
		"Argentine Peso": {
			ru: "Аргентинское песо"
		},
		"Armenian Dram": {
			ru: "Армянский драм"
		},
		"Aruba Florin": {
			ru: "Арубанский флорин"
		},
		"Australian Dollar": {
			ru: "Австралийский доллар"
		},
		"Azerbaijani Manat": {
			ru: "Азербайджанский манат"
		},
		"Bahamian Dollar": {
			ru: "Багамский доллар"
		},
		"Bahraini Dinar": {
			ru: "Бахрейнский динар"
		},
		"Bangladeshi Taka": {
			ru: "Бангладеш така"
		},
		"Barbados Dollar": {
			ru: "Барбадосский доллар"
		},
		"Belarusian Ruble": {
			ru: "Белорусский рубль"
		},
		"Belize Dollar": {
			ru: "Белизский доллар"
		},
		"Bermudian Dollar": {
			ru: "Бермудский доллар"
		},
		"Bhutan Ngultrum": {
			ru: "Бутанский нгултрум"
		},
		"Bitcoin": {
			ru: "Биткоин"
		},
		"Bolivian Boliviano": {
			ru: "Боливийский боливиано"
		},
		"Bosnia and Herzegovina Marka": {
			ru: "Боснии и Герцеговины марка"
		},
		"Botswana Pula": {
			ru: "Ботсванская пула"
		},
		"Brazilian Real": {
			ru: "Бразильский реал"
		},
		"British Pound": {
			ru: "Английский фунт"
		},
		"Brunei Dollar": {
			ru: "Брунейский доллар"
		},
		"Bulgarian Lev": {
			ru: "Болгарский лев"
		},
		"Burundi Franc": {
			ru: "Бурундийский франк"
		},
		"Cambodian Riel": {
			ru: "Камбоджийский риель"
		},
		"Canadian Dollar": {
			ru: "Канадский доллар"
		},
		"Cape Verde Escudo": {
			ru: "Кабо-Верде эскудо"
		},
		"Cayman Islands Dollar": {
			ru: "Каймановых островов доллар"
		},
		"CFA BCEAO Franc": {
			ru: "КФА ВСЕАО франк"
		},
		"CFA BEAC Franc": {
			ru: "КФА BEAC франк"
		},
		"CFP Franc": {
			ru: "КФП франк"
		},
		"Chilean Peso": {
			ru: "Чилийское песо"
		},
		"Chinese Yuan Renminbi": {
			ru: "Китайский юань"
		},
		"Colombian Peso": {
			ru: "Колумбийское песо"
		},
		"Comoros Franc": {
			ru: "Франк Комор"
		},
		"Congolese Franc": {
			ru: "Конголезский франк"
		},
		"Costa Rican Colon": {
			ru: "Коста-Риканский колон"
		},
		"Croatian Kuna": {
			ru: "Хорватская куна"
		},
		"Cuban Peso": {
			ru: "Кубинское песо"
		},
		"Czech Koruna": {
			ru: "Чешская крона"
		},
		"Danish Krone": {
			ru: "Датская крона"
		},
		"Djibouti Franc": {
			ru: "Джибути франк"
		},
		"Dominican Peso": {
			ru: "Доминиканское песо"
		},
		"East Caribbean Dollar": {
			ru: "Восточно–карибский доллар"
		},
		"Egyptian Pound": {
			ru: "Египетский фунт"
		},
		"El Salvador Colon": {
			ru: "Сальвадорский колон"
		},
		"Eritrean Nakfa": {
			ru: "Эритрейская накфа"
		},
		"Estonian Kroon": {
			ru: "Эстонская крона"
		},
		"Ethereum": {
			ru: "Эфириум"
		},
		"Ethiopian Birr": {
			ru: "Эфиопский быр"
		},
		"Euro": {
			ru: "Евро"
		},
		"Falkland Islands Pound": {
			ru: "Фунт Фолклендских островов"
		},
		"Fiji Dollar": {
			ru: "Фиджи доллар"
		},
		"Gambian Dalasi": {
			ru: "Гамбийский даласи"
		},
		"Georgian Lari": {
			ru: "Грузинский лари"
		},
		"Ghanaian Cedi": {
			ru: "Ганский седи"
		},
		"Gold": {
			ru: "Золото"
		},
		"Guatemalan Quetzal": {
			ru: "Гватемальский кетсаль"
		},
		"Guinea Franc": {
			ru: "Гвинейский франк"
		},
		"Guyana Dollar": {
			ru: "Гайанский доллар"
		},
		"Haitian Gourde": {
			ru: "Гаитянский гурд"
		},
		"Honduran Lempira": {
			ru: "Гондурасская лемпира"
		},
		"Hong Kong Dollar": {
			ru: "Гонконгский доллар"
		},
		"Hungarian Forint": {
			ru: "Венгерский форинт"
		},
		"Iceland Krona": {
			ru: "Исландская крона"
		},
		"Indian Rupee": {
			ru: "Индийская рупия"
		},
		"Indonesian Rupiah": {
			ru: "Индонезийская рупия"
		},
		"Iranian Rial": {
			ru: "Иранский риал"
		},
		"Iraqi Dinar": {
			ru: "Иракский динар"
		},
		"Israeli New Shekel": {
			ru: "Израильский шекель"
		},
		"Jamaican Dollar": {
			ru: "Ямайский доллар"
		},
		"Japanese Yen": {
			ru: "Японская йена"
		},
		"Jordanian Dinar": {
			ru: "Иорданский динар"
		},
		"Kazakhstan Tenge": {
			ru: "Казахский тенге"
		},
		"Kenyan Shilling": {
			ru: "Кенийский шиллинг"
		},
		"Korean Won": {
			ru: "Корейский вон (южный)"
		},
		"Kuwaiti Dinar": {
			ru: "Кувейтский динар"
		},
		"Kyrgyzstan Som": {
			ru: "Киргизский сом"
		},
		"Lao Kip": {
			ru: "Лаосский кип"
		},
		"Latvian Lats": {
			ru: "Латвийский лат"
		},
		"Lebanese Pound": {
			ru: "Ливанский фунт"
		},
		"Lesotho Loti": {
			ru: "Лесото лоти"
		},
		"Liberian Dollar": {
			ru: "Либерийский доллар"
		},
		"Libyan Dinar": {
			ru: "Ливийский динар"
		},
		"Lithuanian Litas": {
			ru: "Литовский лит"
		},
		"Macau Pataca": {
			ru: "Макао патака"
		},
		"Macedonian Denar": {
			ru: "Македонский денар"
		},
		"Malagasy Ariary": {
			ru: "Малагасийский ариари"
		},
		"Malawi Kwacha": {
			ru: "Малавийская квача"
		},
		"Malaysian Ringgit": {
			ru: "Малайзийский рингит"
		},
		"Maldives Rufiyaa": {
			ru: "Мальдивская руфия"
		},
		"Mauritania Ouguiya": {
			ru: "Мавританская угия"
		},
		"Mauritius Rupee": {
			ru: "Маврикийская рупия"
		},
		"Mexican Peso": {
			ru: "Мексиканское песо"
		},
		"Moldovan Leu": {
			ru: "Молдавский лей"
		},
		"Mongolian Tugrik": {
			ru: "Монгольский тугрик"
		},
		"Moroccan Dirham": {
			ru: "Марокканский дирхам"
		},
		"Mozambican Metical": {
			ru: "Мозамбикский метикал"
		},
		"Myanmar Kyat": {
			ru: "Мьянма кьят"
		},
		"Namibian Dollar": {
			ru: "Намибийский доллар"
		},
		"Nepalese Rupee": {
			ru: "Непальская рупия"
		},
		"Netherlands Antillian Guilder": {
			ru: "Голландский гульден"
		},
		"New Zealand Dollar": {
			ru: "Новозеландский доллар"
		},
		"Nicaraguan Cordoba Oro": {
			ru: "Никарагуанский кордоба"
		},
		"Nigerian Naira": {
			ru: "Нигерийская найра"
		},
		"North Korean Won": {
			ru: "Северокорейская вона"
		},
		"Norwegian Krone": {
			ru: "Норвежская крона"
		},
		"Omani Rial": {
			ru: "Оманский риал"
		},
		"Pakistan Rupee": {
			ru: "Пакистанская рупия"
		},
		"Panamanian Balboa": {
			ru: "Панамский балбоа"
		},
		"Papua New Guinea Kina": {
			ru: "Папуа-Новая Гвинея кина"
		},
		"Paraguay Guarani": {
			ru: "Парагвайский гуарани"
		},
		"Peruvian Nuevo Sol": {
			ru: "Перуанский сол"
		},
		"Philippine Peso": {
			ru: "Филиппинское песо"
		},
		"Polish Zloty": {
			ru: "Польский злотый"
		},
		"Qatari Rial": {
			ru: "Катарский риал"
		},
		"Romanian Leu": {
			ru: "Румынский лей"
		},
		"Russian Ruble": {
			ru: "Российский рубль"
		},
		"Rwanda Franc": {
			ru: "Руандский франк"
		},
		"Samoa Tala": {
			ru: "Самоанская тала"
		},
		"Sao Tome Dobra": {
			ru: "Сан-Томе и Принсипи добра"
		},
		"Saudi Riyal": {
			ru: "Саудовский риал"
		},
		"Serbian Dinar": {
			ru: "Сербский динар"
		},
		"Seychelles Rupee": {
			ru: "Сейшелийская рупия"
		},
		"Sierra Leone Leone": {
			ru: "Сьерра-леонский леоне"
		},
		"Singapore Dollar": {
			ru: "Сингапурский доллар"
		},
		"Slovak Koruna": {
			ru: "Словацкая крона"
		},
		"Solomon Islands Dollar": {
			ru: "Соломоновых островов доллар"
		},
		"Somali Shilling": {
			ru: "Сомалийский шиллинг"
		},
		"South African Rand": {
			ru: "ЮАР рэнд"
		},
		"Sri Lanka Rupee": {
			ru: "Шри–Ланкийская рупия"
		},
		"St Helena Pound": {
			ru: "Святой Елены фунт"
		},
		"Sudanese Pound": {
			ru: "Суданский фунт"
		},
		"Surinamese Dollar": {
			ru: "Суринамский доллар"
		},
		"Swaziland Lilangeni": {
			ru: "Свазилендский лилангени"
		},
		"Swedish Krona": {
			ru: "Шведская крона"
		},
		"Swiss Franc": {
			ru: "Швейцарский франк"
		},
		"Syrian Pound": {
			ru: "Сирийский фунт"
		},
		"Taiwan Dollar": {
			ru: "Тайваньский доллар"
		},
		"Tajikistani Somoni": {
			ru: "Таджикский сомони"
		},
		"Tanzanian Shilling": {
			ru: "Танзанийский шиллинг"
		},
		"Thai Baht": {
			ru: "Тайский бахт"
		},
		"Tonga Pa'ang": {
			ru: "Тонганская паанга"
		},
		"Trinidad and Tobago Dollar": {
			ru: "Тринидад и Тобаго доллар"
		},
		"Tunisian Dinar": {
			ru: "Тунисский динар"
		},
		"Turkish Lira": {
			ru: "Турецкая лира"
		},
		"Turkmenistan Manat": {
			ru: "Туркменский манат"
		},
		"Uganda Shilling": {
			ru: "Уганда шиллинг"
		},
		"Ukraine Hryvnia": {
			ru: "Украинская гривна"
		},
		"United Arab Emirates Dirham": {
			ru: "ОАЭ дирхам"
		},
		"Uruguay Peso": {
			ru: "Уругвайское песо"
		},
		"US Dollar": {
			ru: "США доллар"
		},
		"Uzbekistan Sum": {
			ru: "Узбекский сум"
		},
		"Vanuatu Vatu": {
			ru: "Вануатский вату"
		},
		"Venezuelan Bolivar": {
			ru: "Венессуэльский боливар"
		},
		"Vietnamese Dong": {
			ru: "Вьетнамский донг"
		},
		"Yemen Riyal": {
			ru: "Йеменский риал"
		},
		"Zambian Kwacha": {
			ru: "Замбийская квача"
		},
		"Zimbabwean Dollar": {
			ru: "Зимбабвийский доллар"
		},

		"OK": {
			ru: "ОК"
		},
		"Convert": {
			ru: "Конвертировать"
		},
		"Cancel": {
			ru: "Отмена"
		},

		"Error:\n%S": {
			ru: "Ошибка:\n%S"
		},

		"Round:": {
			ru: "Округлять:"
		},
		"Measures": {
			ru: "Величины"
		},
		"Sort": {
			ru: "Сортировать"
		},

		"Currency": {
			ru: "Валюта"
		},
		"Show all": {
			ru: "Показывать все"
		},
		": currencies": {
			ru: ": валюты"
		},
		"Preferred currencies:": {
			ru: "Избранные валюты:"
		},
		"(comma-separated list, example: EUR,USD)": {
			ru: "(разделенный запятыми список, например: EUR,USD)"
		},
		"By name": {
			ru: "По имени"
		},
		"By code": {
			ru: "По коду"
		},
		"Update": {
			ru: "Обновить"
		},
		"Update…": {
			ru: "Обновление…"
		},
		"%S/%T": {
			ru: "%S/%T"
		},
		"%S/%T Fail: %F": {
			ru: "%S/%T Ошибки: %F"
		},
		"No update needed!": {
			ru: "Обновление не требуется!"
		},
		"Successfully updated: %P/%T (%ET s)": {
			ru: "Успешно обновлено: %P/%T (%ET с)"
		},
		"Updated: %P/%T (%ET s)\n  - Success: %S\n  - Net errors: %NE\n  - Parse errors: %PE\n  - Aborted: %A": {
			ru: "Обновлено: %P/%T (%ET с)\n  - Успешно: %S\n  - Ошибки сети: %NE\n  - Ошибки парсера: %PE\n  - Прервано: %A"
		},
		"\n  - Missing update URL: %M": {
			ru: "\n  - Нет источника обновления: %M"
		},
		"Details:\n%S": {
			ru: "Подробности:\n%S"
		},
		"Aborted": {
			ru: "Прервано"
		},
		"Stopped": {
			ru: "Остановлено"
		},
		"Cancel update?": {
			ru: "Отменить обновление?"
		},

		" [last update: %t]": {
			ru: " [последнее обновление: %t]"
		},
		"n/a": {
			ru: "н/д"
		},
		"now…": {
			ru: "сейчас…"
		},
		"never": {
			ru: "никогда"
		},
		"Default currency data not changed!": {
			ru: "Значения по умолчанию для конвертирования валют не изменились!"
		},
		"Can't create backup file:\n": {
			ru: "Не удалось создать резервную копию:\n"
		},
		"Default currency data was successfully updated to %d": {
			ru: "Значения по умолчанию для конвертирования валют успешно обновлены до %d"
		},
		"Warning! Update date of some currencies is too old (%old < %new)": {
			ru: "Внимание! Дата обновления некоторых валют слишком старая (%old < %new)"
		}
	};
	var lng = "en";
	switch(AkelPad.GetLangId(1 /*LANGID_PRIMARY*/)) {
		case 0x19: lng = "ru";
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	return _localize(s);
}

var BASE_CURRENCY = "USD"; // Always "USD" for fxexchangerate.com
var ROUND_OFF = 0xffff; // Legacy
var ROUND_DEFAULT = 2;
var ROUND_MAX = 20; // Built-in Number.prototype.toFixed() throws on numbers > 20
var CURRENCY = "&Currency";

var defaultCurrencyDataTime = 1712444890691; // 2024-04-07
function getDefaultCurrencyData() {
	if(!saveOffline)
		return "";
	// Built-in currencies data:
	return "AED=0.2722937810278763|AFN=0.0140392080544509|ALL=0.010590043886730373|AMD=0.0025770783850475437|\
ANG=0.5556438411880998|AOA=0.00119474260636734|ARS=0.0011620359809776615|AUD=0.6580895659899313|\
AWG=0.5555555555555556|AZN=0.5868647922205203|BAM=0.5547345484238881|BBD=0.49595449915042994|\
BDT=0.009124127467673878|BGN=0.5539552404165744|BHD=2.65593668246949|BIF=0.0003497243980444164|\
BMD=1|BND=0.7429635776965306|BOB=0.14491117597013323|BRL=0.1973908872522991|\
BSD=1.0014310449632524|BTC=69407.64875065538|BTN=0.012023258560848654|BWP=0.0736008424646832|\
BYN=0.3059903423328153|BZD=0.49679468071999466|CAD=0.7358081012471946|CDF=0.00035650619285018117|\
CHF=1.108791273369162|CLP=0.001064062453545361|CNY=0.1382570541514169|COP=0.00026512633793096676|\
CRC=0.001967271077655122|CUP=0.03773584905660377|CVE=0.009839477581990104|CZK=0.04280766209206867|\
DJF=0.005623250747273792|DKK=0.1452980673613464|DOP=0.016910068501672894|DZD=0.007421423452766796|\
EEK=0.06932977107725568|EGP=0.021130257918675087|ERN=0.06666666666666666|ETB=0.017666081036080323|\
ETH=3377.975531972|EUR=1.0847751803438738|FJD=0.4449883190566247|FKP=1.2543415898277914|\
GBP=1.2638007036842318|GEL=0.3730798976716456|GHS=0.07473136689200167|GMD=0.014722111315650312|\
GNF=0.00011652346687271664|GTQ=0.12854858365170532|GYD=0.004782464965945287|HKD=0.12771473636485545|\
HNL=0.040569495098839864|HRK=0.14529867959824916|HTG=0.007552732327427714|HUF=0.0027771798818067793|\
IDR=0.0000629415744834857|ILS=0.2657440034865613|INR=0.012005227075868834|IQD=0.0007644261258183041|\
IRR=0.000023767082391776278|ISK=0.0072108250405360135|JMD=0.006480408535841186|JOD=1.4106282373918048|\
JPY=0.0065960867791730404|KES=0.00770287538555491|KGS=0.011193745329129917|KHR=0.0002478752570465796|\
KMF=0.0021994922586494507|KPW=0.0011111659446812233|KRW=0.0007400472676626395|KWD=3.2517152798100994|\
KYD=1.2016284468711997|KZT=0.002241863828913041|LAK=0.000047342584108702014|LBP=0.00001118241157505503|\
LKR=0.003348817831640521|LRD=0.005185366964945913|LSL=0.05356077093445496|LTL=0.338668490960938|\
LVL=1.6531931425548445|LYD=0.20709104592161107|MAD=0.09932256054355662|MDL=0.05673534499089597|\
MGA=0.0002272146596746245|MKD=0.017607108088134985|MMK=0.0004768591771770864|MNT=0.0002941811492612747|\
MOP=0.12418304630698869|MRU=0.025351668200612|MUR=0.02158411053758292|MVR=0.06468147156557233|\
MWK=0.0005775311403578066|MXN=0.06077695804517965|MYR=0.2106369999898894|MZN=0.01574710675651819|\
NAD=0.05356078240948215|NGN=0.0008014423545231274|NIO=0.027205366291147365|NOK=0.09319226757662081|\
NPR=0.007514544946548554|NZD=0.6014997795503307|OMR=2.5977399662293803|PAB=1.0014310449632524|\
PEN=0.2714954485145534|PGK=0.26124489462164685|PHP=0.017670849504001343|PKR=0.0036030749448668284|\
PLN=0.25320391574791623|PYG=0.00013587351284138836|QAR=0.2746469550716032|RON=0.21813086281226523|\
RSD=0.009260958559405294|RUB=0.010801425481403061|RWF=0.0007781882081596836|SAR=0.26659365555086645|\
SBD=0.11799152466878304|SCR=0.07393147941769792|SDG=0.001706483654440343|SEK=0.09365939916558841|\
SGD=0.7410679084988632|SHP=0.7914836360758242|SKK=0.04503287399801856|SLL=0.00004376884261723258|\
SOS=0.0017497700653403688|SRD=0.028659012150217475|STD=0.000048313891080172936|SVC=0.11444620055781077|\
SYP=0.00007691208916144198|SZL=0.053846343965168304|THB=0.027381979628957196|TJS=0.09136728956011766|\
TMT=0.2857142857142857|TND=0.3203583913395594|TOP=0.4213180175807582|TRY=0.031180327558071492|\
TTD=0.1479544483762517|TWD=0.031127238063980416|TZS=0.0003881336528638973|UAH=0.025785299682038892|\
UGX=0.00026130780344387096|UYU=0.02616859594204106|UZS=0.0000789743776374219|VES=0.0276|\
VND=0.00004005607850991388|VUV=0.008282547512833808|WST=0.3615419184354201|XAF=0.0016539956130247357|\
XAU=2331.0023310023307|XCD=0.37002090618119926|XOF=0.0016539956130247357|XPF=0.00904363251535697|\
YER=0.003992807149574784|ZAR=0.05339128066995379|ZMW=0.04066529231533739|ZWL=0.003105593997150158"
		.replace(/\||$/g, "=" + defaultCurrencyDataTime + "$&");
}

// Read arguments:
// getArg(argName, defaultValue)
var saveOptions  = getArg("saveOptions",  true);
var savePosition = getArg("savePosition", true);
var saveOffline  = getArg("saveOffline",  true);

var preferSources         = getArg("preferSources", "fx,er,cw");
var testSource            = getArg("testSource");
var offlineExpire         = getArg("offlineExpire", 22*60*60*1000);
var updateOnStartup       = getArg("updateOnStartup", true);
var updateOnStartupReport = getArg("updateOnStartupReport", 1|4);
var updateSelf            = getArg("updateSelf", false);
var updateMaxErrors       = getArg("updateMaxErrors", 4);
var convertNumbers        = getArg("convertNumbers", true);
var displayCalcErrors     = getArg("displayCalcErrors");
var sortMeasures          = getArg("sortMeasures");
var sortByName            = getArg("sortByName");
var roundMeasures         = getArg("roundMeasures");
var roundMeasuresState    = getArg("roundMeasuresState");
var roundCurrencies       = getArg("roundCurrencies");
var roundCurrenciesState  = getArg("roundCurrenciesState");
var dlgMaxH               = getArg("maxHeight", 0); // -1 => no resize
var selectContext         = getArg("selectContext", 7);
var disableRadios         = getArg("disableRadios", false);
var useSelected           = getArg("useSelected", true);
var showLastUpdate        = getArg("showLastUpdate", 2);
var currenciesWL          = getArg("currencies", "");

var defaultCurrenciesWL = "BYN,CNY,EUR,GBP,RUB,UAH,USD";
var enableCurrenciesWL;
switch(currenciesWL.charAt(0)) {
	case "-": enableCurrenciesWL = false; break;
	case "+": enableCurrenciesWL = true;
}
if(enableCurrenciesWL !== undefined)
	currenciesWL = currenciesWL.substr(1);

var preferFXExchangeRate = getArg("preferFXExchangeRate"); // Legacy
if(
	preferFXExchangeRate !== undefined
	&& getArg("preferSources") === undefined
) {
	preferSources = preferFXExchangeRate ? "fx,er,cw" : "er,fx,cw";
}

var from   = getArg("from");
var to     = getArg("to");
var dialog = getArg("dialog", true);

if(updateSelf) {
	updateOnStartup = true;
	updateOnStartupReport = 2;
}

if(updateMaxErrors < 0 || testSource)
	updateMaxErrors = Infinity;

var curType, curItem, curItem2;
var selectedItems = {};

if(!Array.prototype.push) {
	Array.prototype.push = function() {
		for(var i = 0, len = arguments.length; i < len; ++i)
			this[this.length] = arguments[i];
		return this.length;
	};
}
if(!Array.prototype.shift) {
	Array.prototype.shift = function() {
		var ret = this[0];
		var len = this.length - 1;
		for(var i = 0; i < len; ++i)
			this[i] = this[i + 1];
		this.length = len < 0 ? 0 : len;
		return ret;
	};
}

if(from && to && from != to) {
	var getName = function(s) {
		return s.toLowerCase()
			.replace(/(^|[^&])&([^&]|$)/, "$1$2")
			.replace(/&&/g, "&")
			.replace(/\s+\(.+\)$/, "");
	};
	from = getName(from);
	to   = getName(to);
	for(var type in measures) {
		var isCurrency = type == CURRENCY;
		var mo = measures[type];
		var foundFrom = false;
		var foundTo   = false;
		for(var item in mo) {
			var name = getName(item);
			var cName = isCurrency && getCurrencyName(mo[item]).toLowerCase();
			if(name == from || cName == from)
				from = foundFrom = item;
			else if(name == to || cName == to)
				to = foundTo = item;
		}
		if(foundFrom && foundTo) {
			if(from != to) {
				curType  = type;
				curItem  = from;
				curItem2 = to;
			}
			break;
		}
	}
}

function toBase(val, from) {
	return typeof from == "number"
		? val*from
		: from.toBase(val);
}
function fromBase(val, from) {
	return typeof from == "number"
		? val/from
		: from.fromBase(val);
}
function convert(val, from, to) {
	if(typeof from == "string")
		from = getCurrencyRatio(from);
	if(typeof to == "string")
		to = getCurrencyRatio(to);
	var base = toBase(val, from);
	return fromBase(base, to);
}
var currencyRatios = {}; // code => ratio
var requestErrors = 0;
function getCurrencyRatio(code) {
	if(
		currencyRatios[code]
		&& (
			dialog // Don't use synchronous updater during dialog creation!
			|| new Date().getTime() - currencyRatios[code].timestamp < offlineExpire
		)
	)
		return currencyRatios[code].ratio;
	if(dialog)
		return NaN;
	var url = getRequestURL(code);
	try {
		var request = new ActiveXObject("Microsoft.XMLHTTP");
		request.open("GET", url, false);
		request.send(null);
		var ratio = getRatioFromResponse(request.responseText, code);
		if(!isNaN(ratio)) {
			currencyRatios[code] = {
				ratio: ratio,
				timestamp: new Date().getTime()
			};
			return ratio;
		}
	}
	catch(e) {
	}
	if(++requestErrors > updateMaxErrors)
		offlineExpire = Infinity; // Disable update
	if(currencyRatios[code]) // Return expired value
		return currencyRatios[code].ratio;
	return NaN;
}
function getCurrencyName(s) {
	return s === 1 ? BASE_CURRENCY : s;
}
var missingCurrencies = {
	// exchange-rates.org
	er: [
		"AFN", "AWG", "BTC", "BTN", "CDF", "EEK", "ERN", "ETH", "FKP", "GYD", "KMF", "KPW",
		"LRD", "LTL", "LVL", "MGA", "MNT", "MRU", "MVR", "MZN", "PGK", "SBD", "SHP", "SKK",
		"SLL", "SRD", "STD", "SVC", "TJS", "TOP", "VUV", "WST", "XAU", "ZWL"
	],
	// fxexchangerate.com
	fx: [
		"ETH", "MRU", "VES"
	],
	// currency.world
	cw: [
		"EEK", "LTL", "SKK", "STD"
	]
};
function notMissing(server, code) {
	return missingCurrencies[server].indexOf(code) == -1;
}
function getRequestURL(code) {
	if(testSource) // Test mode!
		return getURL(testSource, code);
	var sources = preferSources.split(",");
	for(var i = 0, l = sources.length; i < l; ++i) {
		var src = sources[i];
		if(notMissing(src, code))
			return getURL(src, code);
	}
	return undefined;
}
function getURL(src, code) {
	switch(src) {
		case "fx":
			// See https://www.fxexchangerate.com/currency-converter-widget.html
			// -> https://w.fxexchangerate.com/converter.php (not updated?)
			return "https://www.fxexchangerate.com/currency-converter-widget.html?" + new Date().getTime(); // BASE_CURRENCY == "USD" !
		case "er":
			//return "https://exchange-rates.org/converter/" + code + "/" + BASE_CURRENCY + "/1/N";
			// Will use https://translate.google.com/ as proxy
			return "https://www-exchange--rates-org.translate.goog/converter/"
				+ code + "/" + BASE_CURRENCY
				+ "/1/N?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en";
		case "cw":
		default:
			return "https://currency.world/convert/" + code + "/" + BASE_CURRENCY + "?" +  + new Date().getTime();
	}
}
function shouldCacheURL(url) {
	if(/^https?:\/\/(\w+\.)*fxexchangerate\.com\//.test(url))
		return "fxexchangerate.com";
	return "";
}
function getRatioFromResponse(response, code) {
	// https://exchange-rates.org/converter/EUR/USD/1/N
	if(/<span class="to-rate">([^<>]+)<\/span>/.test(response))
		return validateRatio(stringToNumber(RegExp.$1));

	// https://currency.world/convert/BTC/USD
	if(
		response.indexOf('<meta name="author" content="Currency World"') != -1
		&& /<div id="xrate0" class="xrate">[-+.\dE]+ ([A-Z]{3}) = /.test(response)
	) {
		if(RegExp.$1 != code) // Fallback to default currency?
			return NaN;
		// Example:
		// converted_amounts=[1,2.563371E-5]
		if(/converted_amounts=\[[-+.\dE]+,([-+.\dE]+)\]/.test(response))
			return validateRatio(+RegExp.$1);
	}

	// https://w.fxexchangerate.com/converter.php
	// https://www.fxexchangerate.com/currency-converter-widget.html
	if(
		response.indexOf("var fxrates=") != -1
		&& new RegExp(';fxrates\\["' + code + '"\\]=([^;]+);').test(response)
	)
		return 1/validateRatio(+RegExp.$1);

	return NaN;
}
function stringToNumber(s) {
	// Expected English format: 12,345.6
	return +s.replace(/\s+|,/g, "");
}
function validateRatio(n) {
	if(isFinite(n) && n > 0)
		return n;
	return NaN;
}
function loadOfflineCurrencyData(readMode, forceDefault) {
	if(readMode && !oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/))
		return;
	loadOfflineCurrencyData.__loaded = true;
	if(!forceDefault)
		var db = oSet.Read("currencies", 3 /*PO_STRING*/);
	if(!db) {
		var isDefault = true;
		db = getDefaultCurrencyData();
	}
	var ts = Infinity;
	db = db.split("|");
	for(var i = 0, l = db.length; i < l; ++i) {
		var parts = db[i].split("="); // code=ratio=timestamp
		var code = parts[0];
		if( // Obsolete codes
			code == "BYR" // Removed since 2022-03-16
			|| code == "VEF" // Removed since 2022-07-17
			|| code == "ZMK" // Removed since 2023-02-25
			|| code == "ZWD" // Removed since 2023-03-02
			|| code == "MRO" // Removed since 2023-12-09
		)
			continue;
		var ratio = +parts[1];
		var time = +parts[2];
		if(!code || !validateRatio(ratio) || !isFinite(time))
			continue;
		currencyRatios[code] = {
			ratio: ratio,
			timestamp: time
		};
		if(time < ts)
			ts = time;
	}
	if(!isDefault && ts < defaultCurrencyDataTime)
		loadOfflineCurrencyData(false, true);
	readMode && oSet.End();
}
function saveOfflineCurrencyData(saveMode) {
	var db = [];
	for(var code in currencyRatios) {
		var data = currencyRatios[code];
		if(data && data.ratio && data.timestamp)
			db.push(code + "=" + data.ratio + "=" + data.timestamp);
	}
	if(!db.length)
		return;
	db.sort();
	if(saveMode && !oSet.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
		return;
	oSet.Write("currencies", 3 /*PO_STRING*/, db.join("|"));
	saveMode && oSet.End();
}
var asyncUpdater = {
	maxActiveRequests: 4,
	maxErrors: updateMaxErrors,
	queue: [],
	requests: {},
	state: {
		total:         0,
		processed:     0,
		noSource:      0,
		errors:        0,
		abortedErrors: 0,
		parseErrors:   0,
		success:       0,
		hasTotal:      false,
		aborted:       false,
		stopped:       false,
		details:       []
	},
	cache: {},
	init: function(onProgress, onComplete, total, isStartup) {
		this.onProgress = onProgress;
		this.onComplete = onComplete;
		this.isStartup = isStartup;
		this.activeRequests = 0;
		var state = this.state;
		for(var p in state)
			if(typeof state[p] == "number")
				state[p] = 0;
		if((state.hasTotal = total > 0))
			state.total = total;
		state.aborted = state.stopped = false;
		state.details.length = 0;
		this.cache = {};
		this.queue.length = 0;
	},
	abort: function() {
		this.state.aborted = true;
		var requests = this.requests;
		for(var code in requests) {
			requests[code].abort();
			delete requests[code];
		}
		this.queue.length = 0;
	},
	addRequest: function(code) {
		if(this.activeRequests >= this.maxActiveRequests) {
			this.queue.push(code);
			return null;
		}
		var request = new ActiveXObject("Microsoft.XMLHTTP");
		this.requests[code] = request;
		var state = this.state;
		var _this = this;
		var onReadyStateChange = request.onreadystatechange = function() {
			if(request.readyState != 4)
				return;
			var err = false;
			if(request.status != 200) {
				err = true;
				if(request.status == 0) {
					++state.abortedErrors;
					state.details.push("Aborted: " + code + " " + url);
				}
				else {
					++state.errors;
					state.details.push("Network error: " + code + " " + url);
				}
			}
			var cnt = --_this.activeRequests;
			if(state.errors > _this.maxErrors) { //~ todo: (state.errors + state.abortedErrors) ?
				state.stopped = true;
				_this.queue.length = 0;
			}
			if(!state.stopped && !state.aborted)
				while(cnt++ < _this.maxActiveRequests && _this.queue.length > 0)
					_this.nextRequest();
			if(!err) {
				if(cacheKey && !_this.cache[cacheKey]) {
					_this.cache[cacheKey] = {
						request: request,
						timestamp: new Date().getTime()
					};
				}
				var ratio = getRatioFromResponse(request.responseText, code);
				if(isNaN(ratio)) {
					++state.parseErrors;
					state.details.push("Parse error: " + code + " " + url);
				}
				else {
					++state.success;
					currencyRatios[code] = {
						ratio: ratio,
						timestamp: _timestamp || new Date().getTime()
					};
				}
			}
			if(!_this.activeRequests)
				(_this.cache = {}) && _this.onComplete && _this.onComplete(state, code);
			else
				_this.onProgress && _this.onProgress(state, code);
			delete _this.requests[code];
			request = code = state = _this = null; // Avoid memory leaks in old JScript versions (not tested)
		};
		if(!state.hasTotal)
			++state.total;
		var url = getRequestURL(code);
		if(!url) {
			++state.noSource;
			state.details.push("Missing source URL: " + code);
			return null;
		}
		++state.processed;
		var cacheKey = shouldCacheURL(url);
		var cached = cacheKey && this.cache[cacheKey];
		if(cached) {
			++this.activeRequests; // Fake...
			var requestOrig = request;
			var _timestamp = cached.timestamp;
			request = cached.request;
			onReadyStateChange();
			return requestOrig;
		}
		request.open("GET", url, true);
		if(typeof request.setRequestHeader != "undefined") {
			request.setRequestHeader("Accept-Language", "en-us,en;q=0.5");
			request.setRequestHeader("Pragma", "no-cache");
			request.setRequestHeader("Cache-Control", "no-cache");
		}
		++this.activeRequests;
		request.send(null);
		return request;
	},
	nextRequest: function() {
		this.addRequest(this.queue.shift());
	}
};
function updateCurrencyDataAsync(force, onStart, onProgress, onComplete, maskInclude, isStartup) {
	var codes = [];
	var currencies = measures[CURRENCY];
	var now = new Date().getTime();
	for(var currency in currencies) {
		var code = currencies[currency];
		if(typeof code != "string")
			continue;
		if(maskInclude && !maskInclude[currency])
			continue;
		if(
			!force
			&& currencyRatios[code]
			&& now - currencyRatios[code].timestamp < offlineExpire
		)
			continue;
		codes.push(code);
	}
	var total = codes.length;
	if(!total) {
		onComplete && onComplete();
		return;
	}
	onStart && onStart();
	asyncUpdater.init(onProgress, onComplete, total, isStartup);
	for(var i = 0; i < total; ++i)
		asyncUpdater.addRequest(codes[i]);
}

var hMainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();
var oSet = AkelPad.ScriptSettings();
var dialogTitle = WScript.ScriptName.replace(/^[!-\-_]+/, "");
dialogTitle = dialogTitle.charAt(0).toUpperCase() + dialogTitle.substr(1);

Number.prototype._origToFixed = Number.prototype.toFixed;
Number.prototype.toFixed = function(r) {
	if(r >= 0 && this._origToFixed)
		return this._origToFixed(r);
	var n = this;
	if(r >= 0 && n >= 1e+21 && /^(\d+)(\.(\d+))?e[+-]?(\d+)$/i.test(n)) {
		return RegExp.$1 + RegExp.$3 //~ todo: RegExp.$3.length > +RegExp.$4 ?
			+ new Array(+RegExp.$4 - RegExp.$3.length + 1).join("0")
			+ (r ? "." : "")
			+ new Array(r + 1).join("0");
	}
	var d = Math.pow(10, r);
	//n = (Math.round(n*d)/d).toString();
	// (123456789).toFixed(-5) = 123499999.99999998
	n = fixPrecision(Math.round(n*d)/d);
	if(r <= 0)
		return n;
	if(!/\./.test(n))
		n += ".";
	n += new Array(r - n.match(/\.(.*)$/)[1].length + 1).join("0");
	return n;
};

if(hMainWnd) {
	var num = useSelected ? AkelPad.GetSelText() : "";
	var _num = calcNum(num, !dialog);
	if(!dialog && _num != undefined && curType && curItem && curItem2) {
		var isCurrency = curType == CURRENCY;
		isCurrency && saveOffline && loadOfflineCurrencyData(true);
		var mo = measures[curType];
		var from = mo[curItem];
		var to   = mo[curItem2];
		var res = convert(_num, from, to);
		res = numToStr(res);
		AkelPad.ReplaceSel(res);
		isCurrency && saveOffline && saveOfflineCurrencyData(true);
	}
	else {
		if(_num == undefined)
			num = "";
		converterDialog();
	}
}

function converterDialog(modal) {
	var hInstanceDLL = AkelPad.GetInstanceDll();
	var dialogClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");

	var hWndDialog = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, dialogClass, 0);
	if(hWndDialog) {
		if(oSys.Call("user32::IsIconic", hWndDialog))
			showWindow(hWndDialog, 9 /*SW_RESTORE*/);
		AkelPad.SendMessage(hWndDialog, 7 /*WM_SETFOCUS*/, 0, 0);
		return;
	}

	if(
		!AkelPad.WindowRegisterClass(dialogClass)
		&& ( // Previous script instance crashed
			!AkelPad.WindowUnregisterClass(dialogClass)
			|| !AkelPad.WindowRegisterClass(dialogClass)
		)
	)
		return;

	var dlgX, dlgY;
	var lastVal;
	var _cleanup = false;
	if((saveOptions || savePosition || saveOffline) && oSet.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/)) {
		if(saveOptions) {
			lastVal = oSet.Read("value", 3 /*PO_STRING*/);
			if(!curType)
				curType = oSet.Read("type", 3 /*PO_STRING*/);
			if(curType && !measures[curType])
				curType = undefined;
			if(roundMeasures === undefined)
				roundMeasures = oSet.Read("roundMeasures", 1 /*PO_DWORD*/);
			if(roundMeasuresState === undefined)
				roundMeasuresState = oSet.Read("roundMeasuresState", 1 /*PO_DWORD*/);
			if(roundCurrencies === undefined)
				roundCurrencies = oSet.Read("roundCurrencies", 1 /*PO_DWORD*/);
			if(roundCurrenciesState === undefined)
				roundCurrenciesState = oSet.Read("roundCurrenciesState", 1 /*PO_DWORD*/);
			if(enableCurrenciesWL === undefined)
				enableCurrenciesWL = oSet.Read("enableCurrenciesWL", 1 /*PO_DWORD*/);
			if(!currenciesWL)
				currenciesWL = oSet.Read("currenciesWL", 3 /*PO_STRING*/, "");
			if(sortMeasures === undefined)
				sortMeasures = oSet.Read("sortMeasures", 1 /*PO_DWORD*/);
			if(sortByName === undefined)
				sortByName = oSet.Read("sortByName", 1 /*PO_DWORD*/);
			var selected = oSet.Read("selected", 3 /*PO_STRING*/, "").split("|");
			for(var i = 0, l = selected.length; i < l; ++i) {
				var entries = selected[i].split("="); // type=item=item2
				var type  = entries[0];
				var item  = entries[1];
				var item2 = entries[2];
				var mo = measures[type];
				if(mo && mo[item] && mo[item2]) // Don't load obsolete data
					selectedItems[type] = [item, item2];
			}
			if(oSet.Read("item", 3 /*PO_STRING*/) != undefined)
				_cleanup = true;
		}
		saveOffline && loadOfflineCurrencyData();
		if(savePosition) {
			dlgX = oSet.Read("windowLeft", 1 /*PO_DWORD*/);
			dlgY = oSet.Read("windowTop",  1 /*PO_DWORD*/);
		}
		oSet.End();
	}
	saveOffline && !loadOfflineCurrencyData.__loaded && loadOfflineCurrencyData(false, true);

	if(!currenciesWL)
		currenciesWL = defaultCurrenciesWL;

	function saveSettings() {
		if(!saveOptions && !savePosition && !saveOffline)
			return;
		var flags = 0x2; //POB_SAVE
		if(_cleanup)
			flags |= 0x4; //POB_CLEAR
		if(!oSet.Begin(WScript.ScriptBaseName, flags))
			return;
		if(saveOptions) {
			oSet.Write("value", 3 /*PO_STRING*/, lastVal);
			curType && oSet.Write("type",  3 /*PO_STRING*/, curType);
			if(curType && curItem && curItem2)
				selectedItems[curType] = [curItem, curItem2];
			oSet.Write("roundMeasures",        1 /*PO_DWORD*/, roundMeasures);
			oSet.Write("roundMeasuresState",   1 /*PO_DWORD*/, roundMeasuresState);
			oSet.Write("roundCurrencies",      1 /*PO_DWORD*/, roundCurrencies);
			oSet.Write("roundCurrenciesState", 1 /*PO_DWORD*/, roundCurrenciesState);
			oSet.Write("enableCurrenciesWL",   1 /*PO_DWORD*/, enableCurrenciesWL);
			oSet.Write("currenciesWL",         3 /*PO_STRING*/, currenciesWL);
			oSet.Write("sortMeasures",         1 /*PO_DWORD*/, sortMeasures);
			oSet.Write("sortByName",           1 /*PO_DWORD*/, sortByName);
			var selected = [];
			for(var type in selectedItems) {
				var entries = selectedItems[type];
				selected.push(type + "=" + entries[0] + "=" + entries[1]);
			}
			selected.length && oSet.Write("selected", 3 /*PO_STRING*/, selected.join("|"));
			if(_cleanup) {
				oSet.Delete("item");
				oSet.Delete("item2");
			}
		}
		saveOffline && saveOfflineCurrencyData();
		if(savePosition && !oSys.Call("user32::IsIconic", hWndDialog)) {
			var rcWnd = getWindowRect(hWndDialog);
			if(rcWnd) {
				oSet.Write("windowLeft", 1 /*PO_DWORD*/, rcWnd.left);
				oSet.Write("windowTop",  1 /*PO_DWORD*/, rcWnd.top);
			}
		}
		oSet.End();
	}

	if(!isFinite(roundMeasures))
		roundMeasures = ROUND_DEFAULT;
	if(!isFinite(roundCurrencies))
		roundCurrencies = ROUND_DEFAULT;
	if(sortMeasures === undefined)
		sortMeasures = false;
	if(sortByName === undefined)
		sortByName = true;

	var IDC_STATIC         = -1;
	var IDC_VALUE          = 1000;
	var IDC_SWITCH         = 1001;
	var IDC_SWITCH2        = 1002;
	var IDC_RESULT         = 1003;
	var IDC_LISTBOX        = 1004;
	var IDC_LISTBOX2       = 1005;
	var IDC_OK             = 1006;
	var IDC_CONVERT        = 1007;
	var IDC_CANCEL         = 1008;
	var IDC_ROUND          = 1009;
	var IDC_ROUND_VALUE    = 1010;
	var IDC_CURRENCIES_ALL = 1011;
	var IDC_WL             = 1012;
	var IDC_SORT           = 1013;
	var IDC_SORT_BY_NAME   = 1014;
	var IDC_SORT_BY_CODE   = 1015;
	var IDC_UPDATE         = 1016;
	var IDC_UPDATE_STARTUP = 1017;
	var IDC_COPY_RES       = 1018;
	var idcCntr            = 1019;

	// internal name => control ID
	var IDCTypes  = {};
	var IDCItems  = {};
	var IDCItems2 = {};

	// internal name => hWnd
	var hWndTypes  = {};
	var hWndItems  = {};
	var hWndItems2 = {};

	var lbStrings = {}; // index => internal name

	var hWndValue, hWndSwitch, hWndResult;
	var hWndGroupTypes, hWndGroupItems, hWndGroupItems2;
	var hWndListBox, hWndListBox2;
	var hWndOK, hWndConvert, hWndCancel;
	var hWndGroupRound, hWndRound, hWndRoundValue, hWndUpDown;
	var hWndGroupSortMeasures, hWndSortMeasures;
	var hWndGroupCurrency, hWndCurrenciesAll, hWndWL;
	var hWndGroupSortCurrency, hWndSortByName, hWndSortByCode;
	var hWndUpdate;

	var windowsVersion;
	var dwVersion = oSys.Call("kernel32::GetVersion");
	if(dwVersion) {
		dwVersion &= 0x0ffff; // LOWORD()
		windowsVersion = +(
			(dwVersion & 0xff) // LOBYTE()
			+ "."
			+ (dwVersion >> 8 & 0xff) // HIBYTE()
		);
	}

	var typeX = 12;
	var typeY = 8;
	var typeW = 144;
	var msrX = typeX + typeW + 12;
	var msrY = 36;
	var msrW = 282;
	var dy = 16;
	var btnW = 140;
	var roundH = 40;
	var btnH = 23;

	var optsH = roundH + 69 + btnH + dy - 10;

	var dlgMinH = 12 + (btnH + 12)*3 + 8 + optsH; // buttons + options
	var dh = dy + 12;
	var typesCount = 0;

	var hGuiFont = oSys.Call("gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);

	var scale = new Scale(0, hMainWnd);
	var sizeNonClientX = oSys.Call("user32::GetSystemMetrics", 7 /*SM_CXFIXEDFRAME*/)*2;
	var sizeNonClientY = oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/)*2
		+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);

	// Correct dialog width for small monitors
	var getMsr2X = function() {
		return msrX + msrW + 12;
	};
	var getDlgW = function() {
		return msr2X + msrW + 12 + btnW + 12;
	};
	var msr2X = getMsr2X();
	var dlgW = getDlgW();
	var rcDesktop = getWindowRect(oSys.Call("user32::GetDesktopWindow"));
	if(rcDesktop && dlgW + sizeNonClientX > rcDesktop.right - rcDesktop.left) {
		msrW -= Math.round((dlgW + sizeNonClientX - (rcDesktop.right - rcDesktop.left))/2);
		msr2X = getMsr2X();
		dlgW = getDlgW();
	}

	// Create dialog
	hWndDialog = oSys.Call(
		"user32::CreateWindowEx" + _TCHAR,
		0,                                 //dwExStyle
		dialogClass,                       //lpClassName
		0,                                 //lpWindowName
		0x90CA0000,                        //WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX
		scale.x(dlgX || 0),                //x
		scale.y(dlgY || 0),                //y
		scale.x(dlgW) + sizeNonClientX,    //nWidth
		scale.y(dlgMinH) + sizeNonClientY, //nHeight
		hMainWnd,                          //hWndParent
		0,                                 //ID
		hInstanceDLL,                      //hInstance
		dialogCallback                     //Script function callback. To use it class must be registered by WindowRegisterClass.
	);
	if(!hWndDialog)
		return;

	function dialogCallback(hWnd, uMsg, wParam, lParam) {
		msgLoop:
		switch(uMsg) {
			case 1: //WM_CREATE
				setDialogTitle(hWnd);

				//centerWindow(hWnd);
				restoreWindowPosition(hWnd, hMainWnd);

				var y = typeY;
				for(var type in measures) {
					if(!curType)
						curType = type;
					++typesCount;

					var id = IDCTypes[type] = idcCntr++;
					// Radiobutton type
					hWndTypes[type] = createWindowEx(
						0,            //dwExStyle
						"BUTTON",     //lpClassName
						0,            //lpWindowName
						0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
						typeX + 8,    //x
						y + 12,       //y
						typeW - 16,   //nWidth
						16,           //nHeight
						hWnd,         //hWndParent
						id,           //ID
						hInstanceDLL, //hInstance
						0             //lpParam
					);
					setWindowFontAndText(hWndTypes[type], hGuiFont, _localize(type));
					if(type == curType)
						checked(hWndTypes[type], true);
					y += dy;
				}

				// GroupBox types
				hWndGroupTypes = createWindowEx(
					0,              //dwExStyle
					"BUTTON",       //lpClassName
					0,              //lpWindowName
					0x50000007,     //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					typeX,          //x
					typeY,          //y
					typeW,          //nWidth
					y - typeY + dy, //nHeight
					hWnd,           //hWndParent
					IDC_STATIC,     //ID
					hInstanceDLL,   //hInstance
					0               //lpParam
				);
				setWindowFontAndText(hWndGroupTypes, hGuiFont, "");

				dlgMinH = Math.max(dlgMinH, y + dh);

				// Edit value
				hWndValue = createWindowEx(
					0x200,        //WS_EX_CLIENTEDGE
					"EDIT",       //lpClassName
					0,            //lpWindowName
					0x50010080,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL
					msrX,         //x
					12,           //y
					msrW - 12,    //nWidth
					21,           //nHeight
					hWnd,         //hWndParent
					IDC_VALUE,    //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFont(hWndValue, hGuiFont);
				setEditText(hWndValue, num || lastVal || "", true);

				// Button switch
				hWndSwitch = createWindowEx(
					0,               //dwExStyle
					"BUTTON",        //lpClassName
					0,               //lpWindowName
					0x50010000,      //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					msrX + msrW - 8, //x
					12,              //y
					28,              //nWidth
					21,              //nHeight
					hWnd,            //hWndParent
					IDC_SWITCH,      //ID
					hInstanceDLL,    //hInstance
					0                //lpParam
				);
				setWindowFontAndText(hWndSwitch, hGuiFont, _localize("<=>"));

				// Edit result
				hWndResult = createWindowEx(
					0x200,        //WS_EX_CLIENTEDGE
					"EDIT",       //lpClassName
					0,            //lpWindowName
					0x50010080,   //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL
					msr2X + 12,   //x
					12,           //y
					msrW - 12,    //nWidth
					21,           //nHeight
					hWnd,         //hWndParent
					IDC_RESULT,   //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndResult, hGuiFont, "");

				// Button OK
				hWndOK = createWindowEx(
					0,                 //dwExStyle
					"BUTTON",          //lpClassName
					0,                 //lpWindowName
					0x50010001,        //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
					msr2X + msrW + 12, //x
					12,                //y
					btnW,              //nWidth
					btnH,              //nHeight
					hWnd,              //hWndParent
					IDC_OK,            //ID
					hInstanceDLL,      //hInstance
					0                  //lpParam
				);
				setWindowFontAndText(hWndOK, hGuiFont, _localize("OK"));

				// Button Convert
				hWndConvert = createWindowEx(
					0,                 //dwExStyle
					"BUTTON",          //lpClassName
					0,                 //lpWindowName
					0x50010000,        //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					msr2X + msrW + 12, //x
					12 + btnH + 4,     //y
					btnW,              //nWidth
					btnH,              //nHeight
					hWnd,              //hWndParent
					IDC_CONVERT,       //ID
					hInstanceDLL,      //hInstance
					0                  //lpParam
				);
				setWindowFontAndText(hWndConvert, hGuiFont, _localize("Convert"));

				// Button Cancel
				hWndCancel = createWindowEx(
					0,                 //dwExStyle
					"BUTTON",          //lpClassName
					0,                 //lpWindowName
					0x50010000,        //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					msr2X + msrW + 12, //x
					12 + (btnH + 4)*2, //y
					btnW,              //nWidth
					btnH,              //nHeight
					hWnd,              //hWndParent
					IDC_CANCEL,        //ID
					hInstanceDLL,      //hInstance
					0                  //lpParam
				);
				setWindowFontAndText(hWndCancel, hGuiFont, _localize("Cancel"));


				// GroupBox round
				hWndGroupRound = createWindowEx(
					0,                 //dwExStyle
					"BUTTON",          //lpClassName
					0,                 //lpWindowName
					0x50000007,        //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					msr2X + msrW + 12, //x
					12 + btnH*3 + 13,  //y
					btnW,              //nWidth
					roundH,            //nHeight
					hWnd,              //hWndParent
					IDC_STATIC,        //ID
					hInstanceDLL,      //hInstance
					0                  //lpParam
				);
				//setWindowFontAndText(hWndGroupRound, hGuiFont, _localize(""));

				// Checkbox round
				hWndRound = createWindowEx(
					0,                 //dwExStyle
					"BUTTON",          //lpClassName
					0,                 //lpWindowName
					0x50010006,        //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTO3STATE
					msr2X + msrW + 20, //x
					12 + btnH*3 + 28,  //y
					btnW - 54,         //nWidth
					16,                //nHeight
					hWnd,              //hWndParent
					IDC_ROUND,         //ID
					hInstanceDLL,      //hInstance
					0                  //lpParam
				);
				setWindowFontAndText(hWndRound, hGuiFont, _localize("Round:"));

				// Edit round value
				hWndRoundValue = createWindowEx(
					0x200,                         //WS_EX_CLIENTEDGE
					"EDIT",                        //lpClassName
					0,                             //lpWindowName
					0x50012080,                    //WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_NUMBER|ES_AUTOHSCROLL
					msr2X + msrW + 20 + btnW - 54, //x
					12 + btnH*3 + 27,              //y
					22,                            //nWidth
					18,                            //nHeight
					hWnd,                          //hWndParent
					IDC_ROUND_VALUE,               //ID
					hInstanceDLL,                  //hInstance
					0                              //lpParam
				);
				setWindowFont(hWndRoundValue, hGuiFont);

				// Up/down buttons
				hWndUpDown = createWindowEx(
					0,                             //dwExStyle
					"msctls_updown32",             //lpClassName
					0,                             //lpWindowName
					0x500000A2,                    //WS_VISIBLE|WS_CHILD|UDS_SETBUDDYINT|UDS_ARROWKEYS|UDS_NOTHOUSANDS
					msr2X + msrW + 20 + btnW - 32, //x
					12 + btnH*3 + 26,              //y
					16,                            //nWidth
					20,                            //nHeight
					hWnd,                          //hWndParent
					IDC_STATIC,                    //ID
					hInstanceDLL,                  //hInstance
					0                              //lpParam
				);
				AkelPad.SendMessage(hWndUpDown, 0x400 + 105 /*UDM_SETBUDDY*/, hWndRoundValue, 0);
				AkelPad.SendMessage(hWndUpDown, 0x400 + 101 /*UDM_SETRANGE*/, 0, ((-ROUND_MAX & 0xFFFF) << 16) + (ROUND_MAX & 0xFFFF));


				// GroupBox sort measures
				hWndGroupSortMeasures = createWindowEx(
					0,                         //dwExStyle
					"BUTTON",                  //lpClassName
					0,                         //lpWindowName
					0x50000007,                //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					msr2X + msrW + 12,         //x
					12 + btnH*3 + roundH + 22, //y
					btnW,                      //nWidth
					42,                        //nHeight
					hWnd,                      //hWndParent
					IDC_STATIC,                //ID
					hInstanceDLL,              //hInstance
					0                          //lpParam
				);
				setWindowFontAndText(hWndGroupSortMeasures, hGuiFont, _localize("Measures"));

				// Checkbox sort measures
				hWndSortMeasures = createWindowEx(
					0,                         //dwExStyle
					"BUTTON",                  //lpClassName
					0,                         //lpWindowName
					0x50010003,                //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
					msr2X + msrW + 20,         //x
					12 + btnH*3 + roundH + 40, //y
					btnW - 16,                 //nWidth
					16,                        //nHeight
					hWnd,                      //hWndParent
					IDC_SORT,                  //ID
					hInstanceDLL,              //hInstance
					0                          //lpParam
				);
				setWindowFontAndText(hWndSortMeasures, hGuiFont, _localize("Sort"));
				checked(hWndSortMeasures, sortMeasures);


				// GroupBox currency
				hWndGroupCurrency = createWindowEx(
					0,                          //dwExStyle
					"BUTTON",                   //lpClassName
					0,                          //lpWindowName
					0x50000007,                 //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					msr2X + msrW + 12,          //x
					12 + btnH*3 + roundH + 22,  //y
					btnW,                       //nWidth
					89 + btnH + dy,             //nHeight
					hWnd,                       //hWndParent
					IDC_STATIC,                 //ID
					hInstanceDLL,               //hInstance
					0                           //lpParam
				);
				setWindowFontAndText(hWndGroupCurrency, hGuiFont, _localize("Currency"));

				// Checkbox show all
				hWndCurrenciesAll = createWindowEx(
					0,                         //dwExStyle
					"BUTTON",                  //lpClassName
					0,                         //lpWindowName
					0x50010002,                //WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_CHECKBOX
					msr2X + msrW + 20,         //x
					12 + btnH*3 + roundH + 40, //y
					btnW - 16 - 20,            //nWidth
					16,                        //nHeight
					hWnd,                      //hWndParent
					IDC_CURRENCIES_ALL,        //ID
					hInstanceDLL,              //hInstance
					0                          //lpParam
				);
				setWindowFontAndText(hWndCurrenciesAll, hGuiFont, _localize("Show all"));
				checked(hWndCurrenciesAll, !enableCurrenciesWL);

				// Button white list
				hWndWL = createWindowEx(
					0,                                  //dwExStyle
					"BUTTON",                           //lpClassName
					0,                                  //lpWindowName
					0x50010000,                         //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					msr2X + msrW + 20 + btnW - 16 - 20, //x
					12 + btnH*3 + roundH + 39,          //y
					20,                                 //nWidth
					16,                                 //nHeight
					hWnd,                               //hWndParent
					IDC_WL,                             //ID
					hInstanceDLL,                       //hInstance
					0                                   //lpParam
				);
				setWindowFontAndText(hWndWL, hGuiFont, _localize("*"));


				// GroupBox sort currency
				hWndGroupSortCurrency = createWindowEx(
					0,                         //dwExStyle
					"BUTTON",                  //lpClassName
					0,                         //lpWindowName
					0x50000007,                //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
					msr2X + msrW + 20,         //x
					12 + btnH*3 + roundH + 58, //y
					btnW - 16,                 //nWidth
					38 + dy,                   //nHeight
					hWnd,                      //hWndParent
					IDC_STATIC,                //ID
					hInstanceDLL,              //hInstance
					0                          //lpParam
				);
				setWindowFontAndText(hWndGroupSortCurrency, hGuiFont, _localize("Sort"));

				// Radiobutton sort by name
				hWndSortByName = createWindowEx(
					0,                         //dwExStyle
					"BUTTON",                  //lpClassName
					0,                         //lpWindowName
					0x50000004,                //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					msr2X + msrW + 28,         //x
					12 + btnH*3 + roundH + 74, //y
					btnW - 32,                 //nWidth
					16,                        //nHeight
					hWnd,                      //hWndParent
					IDC_SORT_BY_NAME,          //ID
					hInstanceDLL,              //hInstance
					0                          //lpParam
				);
				setWindowFontAndText(hWndSortByName, hGuiFont, _localize("By name"));
				checked(hWndSortByName, sortByName);

				// Radiobutton sort by code
				hWndSortByCode = createWindowEx(
					0,                              //dwExStyle
					"BUTTON",                       //lpClassName
					0,                              //lpWindowName
					0x50000004,                     //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					msr2X + msrW + 28,              //x
					12 + btnH*3 + roundH + 74 + dy, //y
					btnW - 32,                      //nWidth
					16,                             //nHeight
					hWnd,                           //hWndParent
					IDC_SORT_BY_CODE,               //ID
					hInstanceDLL,                   //hInstance
					0                               //lpParam
				);
				setWindowFontAndText(hWndSortByCode, hGuiFont, _localize("By code"));
				checked(hWndSortByCode, !sortByName);

				// Button update
				hWndUpdate = createWindowEx(
					0,                              //dwExStyle
					"BUTTON",                       //lpClassName
					0,                              //lpWindowName
					0x50010000,                     //WS_VISIBLE|WS_CHILD|WS_TABSTOP
					msr2X + msrW + 20,              //x
					12 + btnH*3 + roundH + 102 + dy, //y
					btnW - 16,                      //nWidth
					btnH,                           //nHeight
					hWnd,                           //hWndParent
					IDC_UPDATE,                     //ID
					hInstanceDLL,                   //hInstance
					0                               //lpParam
				);
				setWindowFontAndText(hWndUpdate, hGuiFont, _localize("Update"));

				setRoundValue();

				draw(curType, hWnd);
				//postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_VALUE, 0);
				oSys.Call("user32::SetFocus", hWndValue); // D'oh...

				// Force repaint: our optimizations to redraw only changed parts inside draw() function
				// doesn't work correctly with AkelPad 4.9.2 + Scripts 16.0
				oSys.Call("user32::InvalidateRect", hWnd, 0, true);

				//updateOnStartup && update(false, updateOnStartupReport);
				if(updateOnStartup) {
					var upd = function() {
						postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_UPDATE_STARTUP, 0);
					};
					ensureTimers() ? setTimeout(upd, 800) : upd();
				}
			break;
			case 7: //WM_SETFOCUS
				oSys.Call("user32::SetFocus", hWndValue);
			break;
			case 256: //WM_KEYDOWN
				var ctrl = ctrlPressed();
				var shift = shiftPressed();
				if(wParam == 27 /*VK_ESCAPE*/) { // Escape
					if(!calcNum._hasTipFor)
						postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
					else
						AkelPad.SendMessage(hWndValue, 0x1504 /*EM_HIDEBALLOONTIP*/, 0, 0);
				}
				else if(wParam == 13 /*VK_RETURN*/) {
					if(ctrl || shift) // Ctrl+Enter, Shift+Enter
						postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_CONVERT, 0);
					else // Enter
						postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_OK, 0);
				}
				else if(ctrl && shift && wParam == 85 /*U*/ || (shift || ctrl) && wParam == 115 /*VK_F4*/)
					// Ctrl+Shift+U, Ctrl+F4, Shift+F4
					postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_SWITCH, 0);
				else if(ctrl && wParam == 85 /*U*/ || wParam == 115 /*VK_F4*/)
					// Ctrl+U, F4
					postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_SWITCH2, 0);
				else if(wParam == 112 /*VK_F1*/) // F1, Ctrl+F1, Shift+F1
					navigate(hWndTypes, IDCTypes, curType, !ctrl && !shift);
				else if(wParam == 113 /*VK_F2*/) // F2, Ctrl+F2, Shift+F2
					navigate(hWndItems, IDCItems, curItem, !ctrl && !shift, curItem2);
				else if(wParam == 114 /*VK_F3*/) // F3, Ctrl+F3, Shift+F3
					navigate(hWndItems2, IDCItems2, curItem2, !ctrl && !shift, curItem);
				else if(wParam == 116 /*VK_F5*/) // F5, Ctrl+F5, Shift+F5
					updateCommand(ctrl || shift, shift);
				else if(ctrl && shift && wParam == 67 /*C*/) // Ctrl+Shift+C
					postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_COPY_RES, 0);
				else if(ctrl && shift && wParam == 70 /*F*/) // Ctrl+Shift+F
					toggleCurrenciesWL();
			break;
			case 273: //WM_COMMAND
				var idc = wParam & 0xffff;
				switch(idc) {
					case IDC_OK:
					case IDC_CONVERT:
						convertGUI(true, true, idc == IDC_OK);
					break msgLoop;
					case IDC_CANCEL:
						closeDialog();
					break msgLoop;
					case IDC_VALUE:
						var hasVal = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndValue) > 0;
						enabled(hWndOK,      hasVal);
						enabled(hWndConvert, hasVal);
						if(hasVal)
							convertGUI();
						else
							windowText(hWndResult, "");
					break msgLoop;
					case IDC_SWITCH:
						var hWndFocused = oSys.Call("user32::GetFocus");

						var val = windowText(hWndResult);
						var res = windowText(hWndValue);
						setEditText(hWndValue, val);
						setEditText(hWndResult, res);

						if(!val && (hWndFocused == hWndOK || hWndFocused == hWndConvert))
							oSys.Call("user32::SetFocus", hWndCancel);

						convertGUI();
					break msgLoop;
					case IDC_SWITCH2:
						var hWndFocused = oSys.Call("user32::GetFocus");

						if(hWndListBox) {
							var i1 = AkelPad.SendMessage(hWndListBox,  0x188 /*LB_GETCURSEL*/, 0, 0);
							var i2 = AkelPad.SendMessage(hWndListBox2, 0x188 /*LB_GETCURSEL*/, 0, 0);
							setListBoxSel(hWndListBox,  i2);
							setListBoxSel(hWndListBox2, i1);

							var tmp = curItem;
							curItem = curItem2;
							curItem2 = tmp;
						}
						else {
							checkItems(false);
							var tmp = curItem;
							curItem = curItem2;
							curItem2 = tmp;
							checkItems(true);

							if(hWndFocused == hWndItems[curItem2])
								oSys.Call("user32::SetFocus", hWndItems[curItem]);
							else if(hWndFocused == hWndItems2[curItem])
								oSys.Call("user32::SetFocus", hWndItems2[curItem2]);
						}

						convertGUI();
					break msgLoop;
					case IDC_LISTBOX:
					case IDC_LISTBOX2:
						if((wParam >> 16 & 0xFFFF) == 2 /*LBN_DBLCLK*/) {
							if(curType == CURRENCY)
								updateCommand(true, true);
							break msgLoop;
						}
						if(idc == IDC_LISTBOX)
							curItem = lbStrings[AkelPad.SendMessage(hWndListBox, 0x188 /*LB_GETCURSEL*/, 0, 0)];
						else
							curItem2 = lbStrings[AkelPad.SendMessage(hWndListBox2, 0x188 /*LB_GETCURSEL*/, 0, 0)];
						convertGUI();
						if(curType == CURRENCY)
							setDialogTitle(hWnd);
					break msgLoop;
					case IDC_ROUND:
						enableRoundValue();
					case IDC_ROUND_VALUE:
						readRoundValue();
						convertGUI();
					break msgLoop;
					case IDC_CURRENCIES_ALL:
						toggleCurrenciesWL();
					break msgLoop;
					case IDC_WL:
						setCurrenciesWL();
					break msgLoop;
					case IDC_SORT:
						sortMeasures = checked(hWndSortMeasures);
						selectedItems[curType] = [curItem, curItem2];
						draw(curType, hWnd);
					break msgLoop;
					case IDC_SORT_BY_NAME:
					case IDC_SORT_BY_CODE:
						sortByName = idc == IDC_SORT_BY_NAME;
						if(checked(hWndSortByName) == sortByName)
							return;
						checked(hWndSortByName, sortByName);
						checked(hWndSortByCode, !sortByName);
						selectedItems[curType] = [curItem, curItem2];
						draw(curType, hWnd);
					break msgLoop;
					case IDC_UPDATE:
						if(asyncUpdater.activeRequests)
							cancelUpdate();
						else {
							var shift = shiftPressed();
							updateCommand(shift || ctrlPressed(), shift);
						}
					break msgLoop;
					case IDC_UPDATE_STARTUP:
						var force = !!updateSelf;
						update(force, updateOnStartupReport & ~4, undefined, updateOnStartupReport & 4);
					break msgLoop;
					case IDC_COPY_RES: // Used message to override Ctrl+C
						AkelPad.SetClipboardText(windowText(hWndResult));
					break msgLoop;
				}
				if((wParam >> 16 & 0xFFFF) == 5 /*BN_DOUBLECLICKED*/) {
					if(curType == CURRENCY)
						updateCommand(true, true);
					break;
				}
				for(var type in hWndTypes) { // Command from types checkbox?
					var id = IDCTypes[type];
					if(id != idc)
						continue;
					if(curType == type)
						break msgLoop;
					if(curType && curItem && curItem2)
						selectedItems[curType] = [curItem, curItem2];
					draw(type, hWnd, true); // -> curType = type;
					for(var type in hWndTypes)
						checked(hWndTypes[type], IDCTypes[type] == idc);
					convertGUI();
					setDialogTitle(hWnd);
					break msgLoop;
				}
				checkItem(idc, true) || checkItem(idc, false);
			break;
			case 123: //WM_CONTEXTMENU
				if(wParam == hWndSwitch)
					postMessage(hWnd, 273 /*WM_COMMAND*/, IDC_SWITCH2, 0);
				else if(wParam == hWndUpdate)
					update(true, 2);
			break;
			case 16: //WM_CLOSE
				if(cancelUpdate(true))
					return 1;
				lastVal = windowText(hWndValue);
				saveSettings();
				modal && enabled(hMainWnd, true); // Enable main window
				destroyWindow(hWnd); // Destroy dialog
			break;
			case 2: //WM_DESTROY
				oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
		}
		return 0;
	}

	function setDialogTitle(hWnd) {
		if(setDialogTitle._ignore || false)
			return;
		var caption = dialogTitle;
		if(showLastUpdate > 1 || showLastUpdate == 1 && curType == CURRENCY) {
			var lastUpdate = getLastUpdate();
			var lastUpdateStr;
			if(asyncUpdater.activeRequests && (curType != CURRENCY || !lastUpdate))
				lastUpdateStr = _localize("now…");
			else if(lastUpdate == undefined || lastUpdate == Infinity)
				lastUpdateStr = _localize("n/a");
			else if(lastUpdate == 0)
				lastUpdateStr = _localize("never");
			else {
				var sdt = setDialogTitle;
				var key = curItem + "|" + curItem2;
				var prevLastUpdate = (sdt._lastUpdateKey || "") == key
					&& sdt._lastUpdate || "";
				lastUpdateStr = sdt._lastUpdate = new Date(lastUpdate).toLocaleString();
				sdt._lastUpdateKey = key;
				if(prevLastUpdate && lastUpdateStr != prevLastUpdate && ensureTimers()) {
					lastUpdateStr = prevLastUpdate + " -> " + lastUpdateStr;
					setDialogTitle._ignore = true;
					setTimeout(function restoreTitle() {
						if(
							asyncUpdater.activeRequests
							|| asyncUpdater.endingState
						) {
							setTimeout(restoreTitle, 3e3);
							return;
						}
						setDialogTitle._ignore = false;
						sdt._lastUpdate = sdt._lastUpdateKey = "";
						setDialogTitle(hWnd);
					}, 3e3);
				}
			}
			caption += _localize(" [last update: %t]").replace("%t", lastUpdateStr);
		}
		else if(!showLastUpdate) {
			setDialogTitle = function() {};
		}
		windowText(hWnd || hWndDialog, caption);
	}
	function getLastUpdate() {
		var currencies = measures[CURRENCY];
		var selected = curType == CURRENCY && curItem && curItem2
			? [curItem, curItem2]
			: selectedItems[CURRENCY] || curType != CURRENCY && (function() {
				for(var p in currencies) // Default to first item
					return [p, p];
			})();
		if(!selected)
			return undefined;
		return Math.min(
			getLastUpdateForCurrency(currencies[selected[0]]),
			getLastUpdateForCurrency(currencies[selected[1]])
		);
	}
	function getLastUpdateForCurrency(code) {
		if(typeof code != "string")
			return Infinity;
		if(!currencyRatios[code])
			return 0;
		return currencyRatios[code].timestamp;
	}
	function draw(type, hWndDialog, typeChanged) {
		setRedraw(hWndDialog, false);

		for(var id in hWndItems)
			destroyWindow(hWndItems[id]);
		for(var id in hWndItems2)
			destroyWindow(hWndItems2[id]);
		hWndItems  = {};
		hWndItems2 = {};
		destroyWindow(hWndGroupItems);
		destroyWindow(hWndGroupItems2);

		lbStrings = {};
		hWndListBox  && destroyWindow(hWndListBox);
		hWndListBox2 && destroyWindow(hWndListBox2);
		hWndListBox = hWndListBox2 = undefined;

		var isCurrency = type == CURRENCY;
		var mo = measures[type];
		if(isCurrency && enableCurrenciesWL) {
			var moWL = {};
			for(var measure in mo) {
				var currencyCode = mo[measure];
				if(currenciesWL.indexOf(getCurrencyName(currencyCode)) != -1)
					moWL[measure] = currencyCode;
			}
			mo = moWL;
		}

		if(selectedItems[type] && (arguments.callee._called || !curItem || !curItem2)) {
			curItem  = selectedItems[type][0];
			curItem2 = selectedItems[type][1];
		}
		arguments.callee._called = true;

		var y = msrY;
		for(var measure in mo)
			y += dy;

		var dlgH = Math.max(dlgMinH, y + dh);
		var useListboxes = dlgH > (dlgMaxH == -1 ? dlgMinH : dlgMaxH);

		if(!useListboxes && (isCurrency || sortMeasures)) {
			var sortArr = [];
			for(var measure in mo)
				sortArr.push([measure, _localize(measure), getCurrencyName(mo[measure])]);
			var sortIndx = isCurrency
				? sortByName ? 1 : 2
				: 1;
			sortArr.sort(function(a, b) {
				return a[sortIndx].toLowerCase() > b[sortIndx].toLowerCase() ? 1 : -1;
			});
			var newMo = {};
			for(var i = 0, l = sortArr.length; i < l; ++i) {
				var currencyArr = sortArr[i];
				newMo[currencyArr[0]] = currencyArr[2];
			}
			mo = newMo;
		}

		if(useListboxes) {
			dlgH = dlgMinH;
			var lbStyle = 0x50210101; //WS_VISIBLE|WS_CHILD|WS_VSCROLL|WS_TABSTOP|LBS_NOINTEGRALHEIGHT|LBS_NOTIFY
			if(isCurrency || sortMeasures)
				lbStyle |= 0x2; //LBS_SORT
			hWndListBox = createWindowEx(
				0x204,         //WS_EX_CLIENTEDGE|WS_EX_NOPARENTNOTIFY
				"LISTBOX",     //lpClassName
				0,             //lpWindowName
				lbStyle,
				msrX,          //x
				msrY + 8,      //y
				msrW,          //nWidth
				dlgMinH - 57,  //nHeight
				hWndDialog,    //hWndParent
				IDC_LISTBOX,   //ID
				hInstanceDLL,  //hInstance
				0              //lpParam
			);
			hWndListBox2 = createWindowEx(
				0x204,         //WS_EX_CLIENTEDGE|WS_EX_NOPARENTNOTIFY
				"LISTBOX",     //lpClassName
				0,             //lpWindowName
				lbStyle,
				msr2X,         //x
				msrY + 8,      //y
				msrW,          //nWidth
				dlgMinH - 57,  //nHeight
				hWndDialog,    //hWndParent
				IDC_LISTBOX2,  //ID
				hInstanceDLL,  //hInstance
				0              //lpParam
			);
			setWindowFont(hWndListBox, hGuiFont);
			setWindowFont(hWndListBox2, hGuiFont);

			var lpBuffer = AkelPad.MemAlloc(256*_TSIZE);
			if(!lpBuffer)
				return;
			var lbText = {};
			var lbInternal = {};
			for(var measure in mo) {
				var item = mo[measure];
				var name = getMeasureLabel(isCurrency, measure, item);
				lbText[measure] = name;
				lbInternal[name] = measure;

				AkelPad.MemCopy(lpBuffer, name, _TSTR);
				AkelPad.SendMessage(hWndListBox,  0x180 /*LB_ADDSTRING*/, 0, lpBuffer);
				AkelPad.SendMessage(hWndListBox2, 0x180 /*LB_ADDSTRING*/, 0, lpBuffer);

				if(curItem && mo[curItem] ? curItem == measure : item == 1)
					curItem = measure;
				if(curItem2 && mo[curItem2] ? curItem2 == measure && measure != curItem : measure != curItem)
					curItem2 = measure;
			}
			AkelPad.MemFree(lpBuffer);

			var indx = 0;
			for(var measure in mo) {
				lbStrings[indx] = lbInternal[getStringFromIndex(indx)];
				++indx;
			}

			setListBoxSel(hWndListBox,  getIndexFromString(lbText[curItem])  || 0);
			setListBoxSel(hWndListBox2, getIndexFromString(lbText[curItem2]) || 0);
		}
		else {
			var y = msrY;
			for(var measure in mo) {
				var item = mo[measure];

				var id = IDCItems[measure] || (IDCItems[measure] = idcCntr++);
				var hWndRadio = hWndItems[measure] = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					msrX + 8,     //x
					y + 12,       //y
					msrW - 10,    //nWidth
					16,           //nHeight
					hWndDialog,   //hWndParent
					id,           //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				var name = getMeasureLabel(isCurrency, measure, item);
				setWindowFontAndText(hWndRadio, hGuiFont, name);

				if(curItem && mo[curItem] ? measure == curItem : item == 1) {
					curItem = measure;
					checked(hWndRadio, true);
				}

				y += dy;
			}

			var y = msrY;
			for(var measure in mo) {
				var item = mo[measure];

				var id = IDCItems2[measure] || (IDCItems2[measure] = idcCntr++);
				var hWndRadio = hWndItems2[measure] = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					msr2X + 8,    //x
					y + 12,       //y
					msrW - 10,    //nWidth
					16,           //nHeight
					hWndDialog,   //hWndParent
					id,           //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				var name = getMeasureLabel(isCurrency, measure, item);
				setWindowFontAndText(hWndRadio, hGuiFont, name);

				if(curItem2 && mo[curItem2] ? measure == curItem2 : measure != curItem) {
					curItem2 = measure;
					checked(hWndRadio, true);
				}

				y += dy;
			}

			if(disableRadios) {
				enabled(hWndItems[curItem2], curItem == curItem2);
				enabled(hWndItems2[curItem], false);
			}

			// GroupBox items
			hWndGroupItems = createWindowEx(
				0,             //dwExStyle
				"BUTTON",      //lpClassName
				0,             //lpWindowName
				0x50000007,    //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
				msrX,          //x
				msrY,          //y
				msrW,          //nWidth
				y - msrY + dy, //nHeight
				hWndDialog,    //hWndParent
				IDC_STATIC,    //ID
				hInstanceDLL,  //hInstance
				0              //lpParam
			);
			setWindowFontAndText(hWndGroupItems, hGuiFont, "");

			// GroupBox items 2
			hWndGroupItems2 = createWindowEx(
				0,             //dwExStyle
				"BUTTON",      //lpClassName
				0,             //lpWindowName
				0x50000007,    //WS_VISIBLE|WS_CHILD|BS_GROUPBOX
				msr2X,         //x
				msrY,          //y
				msrW,          //nWidth
				y - msrY + dy, //nHeight
				hWndDialog,    //hWndParent
				IDC_STATIC,    //ID
				hInstanceDLL,  //hInstance
				0              //lpParam
			);
			setWindowFontAndText(hWndGroupItems2, hGuiFont, "");
		}

		showWindow(hWndGroupSortMeasures, !isCurrency);
		showWindow(hWndSortMeasures,      !isCurrency);
		showWindow(hWndGroupCurrency,      isCurrency);
		showWindow(hWndGroupSortCurrency,  isCurrency);
		showWindow(hWndSortByName,         isCurrency);
		showWindow(hWndSortByCode,         isCurrency);
		showWindow(hWndUpdate,             isCurrency);
		showWindow(hWndCurrenciesAll,      isCurrency);
		showWindow(hWndWL,                 isCurrency);

		// We should call it here in Windows XP
		//setRedraw(hWndDialog, true);
		AkelPad.SendMessage(hWndDialog, 11 /*WM_SETREDRAW*/, true, 0);
		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		if(lpRect) {
			// Measures lists
			AkelPad.MemCopy(_PtrAdd(lpRect,  0), scale.x(msrX),         3 /*DT_DWORD*/);
			AkelPad.MemCopy(_PtrAdd(lpRect,  4), scale.y(msrY),         3 /*DT_DWORD*/);
			AkelPad.MemCopy(_PtrAdd(lpRect,  8), scale.x(msr2X + msrW), 3 /*DT_DWORD*/);
			AkelPad.MemCopy(_PtrAdd(lpRect, 12), scale.y(dlgH),         3 /*DT_DWORD*/);
			oSys.Call("user32::InvalidateRect", hWndDialog, lpRect, true);

			// Round and sort controls
			if(isCurrency + (curType == CURRENCY) == 1 || type == curType) {
				AkelPad.MemCopy(_PtrAdd(lpRect,  0), scale.x(msr2X + msrW),     3 /*DT_DWORD*/);
				AkelPad.MemCopy(_PtrAdd(lpRect,  4), scale.y(12 + btnH*3 + 13), 3 /*DT_DWORD*/);
				AkelPad.MemCopy(_PtrAdd(lpRect,  8), scale.x(dlgW),             3 /*DT_DWORD*/);
				AkelPad.MemCopy(_PtrAdd(lpRect, 12), scale.y(dlgH),             3 /*DT_DWORD*/);
				oSys.Call("user32::InvalidateRect", hWndDialog, lpRect, true);
			}

			if(typeChanged && (!windowsVersion || windowsVersion < 6.1)) {
				// Only for Windows XP? Not needed on Windows 7
				AkelPad.MemCopy(_PtrAdd(lpRect,  0), scale.x(typeX + 8),     3 /*DT_DWORD*/);
				AkelPad.MemCopy(_PtrAdd(lpRect,  4), scale.y(typeY + 12),    3 /*DT_DWORD*/);
				AkelPad.MemCopy(_PtrAdd(lpRect,  8), scale.x(typeW - 16),    3 /*DT_DWORD*/);
				AkelPad.MemCopy(_PtrAdd(lpRect, 12), scale.y(typesCount*dy), 3 /*DT_DWORD*/);
				oSys.Call("user32::InvalidateRect", hWndDialog, lpRect, true);
			}

			AkelPad.MemFree(lpRect);
		}

		curType = type;

		setRoundValue();

		//var dlgH = Math.max(dlgMinH, y + dh);
		setWindowHeight(dlgH, hWndDialog);
	}
	function getMeasureLabel(isCurrency, measure, item) {
		return isCurrency
			? sortByName
				? _localize(measure) + " (" + getCurrencyName(item) + ")"
				: getCurrencyName(item) + " (" + _localize(measure) + ")"
			: _localize(measure);
	}
	function setWindowHeight(dlgH, hWnd) {
		oSys.Call(
			"user32::SetWindowPos",
			hWnd, 0, 0, 0,
			scale.x(dlgW) + sizeNonClientX,
			scale.y(dlgH) + sizeNonClientY,
			0x16 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOMOVE*/
		);
	}
	function checkItem(idc, primary) {
		if(primary) {
			var hWndIts  = hWndItems;
			var IDCIts   = IDCItems;
			var hWndIts2 = hWndItems2;
		}
		else {
			var hWndIts  = hWndItems2;
			var IDCIts   = IDCItems2;
			var hWndIts2 = hWndItems;
		}
		for(var item in hWndIts) {
			var id = IDCIts[item];
			if(id == idc) {
				if(primary)
					curItem = item;
				else
					curItem2 = item;
				for(var item1 in hWndIts)
					checked(hWndIts[item1], IDCIts[item1] == idc);
				if(disableRadios) {
					var hWndFocused = oSys.Call("user32::GetFocus");
					for(var item2 in hWndIts2) {
						var hWndRadio = hWndIts2[item2];
						var on = item2 != item;
						enabled(hWndRadio, on);
						if(!on && hWndRadio == hWndFocused)
							oSys.Call("user32::SetFocus", hWndIts2[primary ? curItem2 : curItem]);
					}
				}
				convertGUI();
				setDialogTitle();
				return true;
			}
		}
		return false;
	}
	function checkItems(check) {
		checked(hWndItems[curItem], check);
		checked(hWndItems2[curItem2], check);
		if(disableRadios) {
			enabled(hWndItems[curItem2], !check);
			enabled(hWndItems2[curItem], !check);
		}
	}
	function validateRoundValue(roundVal) {
		return Math.max(-ROUND_MAX, Math.min(ROUND_MAX, roundVal));
	}
	function setRoundValue() {
		var isCurrency = curType == CURRENCY;
		var roundVal = isCurrency ? roundCurrencies : roundMeasures;
		var roundState = isCurrency ? roundCurrenciesState : roundMeasuresState;
		var dontRound = roundVal == ROUND_OFF;
		checked(hWndRound, roundState);
		setEditText(hWndRoundValue, "" + (dontRound ? ROUND_DEFAULT : validateRoundValue(roundVal)));
		enableRoundValue();
	}
	function readRoundValue() {
		var ch = checked(hWndRound);
		var r = Math.ceil(+windowText(hWndRoundValue));
		var r2 = isFinite(r) ? validateRoundValue(r) : ROUND_DEFAULT;
		if(r2 != r) {
			r = r2;
			setEditText(hWndRoundValue, "" + r);
		}
		if(curType == CURRENCY) {
			roundCurrencies = r;
			roundCurrenciesState = ch;
		}
		else {
			roundMeasures = r;
			roundMeasuresState = ch;
		}
	}
	function enableRoundValue() {
		var on = checked(hWndRound);
		if(!on) {
			var hWndFocused = oSys.Call("user32::GetFocus");
			if(hWndFocused == hWndRoundValue || hWndFocused == hWndUpDown)
				AkelPad.SendMessage(hWndDialog, 7 /*WM_SETFOCUS*/, 0, 0);
		}
		enabled(hWndRoundValue, on);
		enabled(hWndUpDown, on);
	}
	function convertGUI(showErrors, convertInput, closeFlag) {
		var mo = measures[curType];
		if(!mo)
			return;
		var from = mo[curItem];
		var to   = mo[curItem2];
		if(!from || !to)
			return;
		var val = windowText(hWndValue);
		var num = calcNum(val, showErrors, hWndDialog, hWndValue);
		if(num == undefined)
			return;
		if(convertInput) {
			var _num = numToStr(num);
			if(_num != val)
				setEditText(hWndValue, _num);
		}
		var res = convert(num, from, to);
		res = numToStr(res);
		if(closeFlag) {
			AkelPad.ReplaceSel(res);
			closeDialog();
		}
		else if(windowText(hWndResult) != res) {
			setEditText(hWndResult, res);
			if(typeof from == "string" || typeof to == "string")
				updateCommand(false, true);
		}
	}
	function navigate(hWnds, idcs, selected, down, disabled) {
		if(hWndListBox && (hWnds == hWndItems || hWnds == hWndItems2)) {
			if(hWnds == hWndItems) {
				var hWndLB = hWndListBox;
				var idc    = IDC_LISTBOX;
			}
			else {
				var hWndLB = hWndListBox2;
				var idc    = IDC_LISTBOX2;
			}
			var i = AkelPad.SendMessage(hWndLB,  0x188 /*LB_GETCURSEL*/, 0, 0);
			var max = AkelPad.SendMessage(hWndLB,  0x18B /*LB_GETCOUNT*/, 0, 0) - 1;
			if(down) {
				if(++i > max)
					i = 0;
			}
			else {
				if(--i < 0)
					i = max;
			}
			setListBoxSel(hWndLB, i);
			postMessage(hWndDialog, 273 /*WM_COMMAND*/, idc, 0);
			return;
		}

		var _sid;
		for(var sid in hWnds) {
			if(sid == selected) {
				var _found = true;
				continue;
			}
			else if(!_first && sid != disabled)
				var _first = sid;
			if(down && _found && sid != disabled) {
				_sid = sid;
				break;
			}
			if(!down && !_found && sid != disabled)
				_sid = sid;
			if(sid != disabled)
				var _last = sid;
		}
		if(!_sid)
			_sid = down ? _first : _last;
		postMessage(hWndDialog, 273 /*WM_COMMAND*/, idcs[_sid], 0);
	}
	function setListBoxSel(hWndListBox, i) {
		var context = selectContext;
		if(context > 0) { // Trick to show context (items before/after selected)
			var cur = AkelPad.SendMessage(hWndListBox, 0x188 /*LB_GETCURSEL*/, 0, 0);
			var max = AkelPad.SendMessage(hWndListBox, 0x18B /*LB_GETCOUNT*/, 0, 0) - 1;

			var lpRect = max > 0 && AkelPad.MemAlloc(16); //sizeof(RECT)
			var rcLB;
			if(
				lpRect
				&& AkelPad.SendMessage(hWndListBox, 0x198 /*LB_GETITEMRECT*/, Math.max(0, cur), lpRect) != -1 /*LB_ERR*/
				&& (rcLB = getWindowRect(hWndListBox))
			) {
				var rcItem = parseRect(lpRect);
				var itemH = rcItem.top - rcItem.bottom;
				var lbH = rcLB.top - rcLB.bottom;
				var maxContext = Math.round(lbH/itemH/2) - 1;
				if(context > maxContext)
					context = maxContext;
			}
			lpRect && AkelPad.MemFree(lpRect);

			var ni = Math.max(0, Math.min(max, i + (i > cur ? 1 : -1)*context));
			if(ni != i)
				AkelPad.SendMessage(hWndListBox, 0x186 /*LB_SETCURSEL*/, ni, 0);
		}
		AkelPad.SendMessage(hWndListBox, 0x186 /*LB_SETCURSEL*/, i, 0);
	}
	function updateCommand(force, onlyCurrent) {
		if(onlyCurrent) {
			var maskInclude = {};
			maskInclude[curItem] = maskInclude[curItem2] = true;
		}
		update(force, onlyCurrent ? 1 : 2, maskInclude, onlyCurrent);
	}
	function toggleCurrenciesWL() {
		if(curType != CURRENCY)
			return;
		enableCurrenciesWL = !enableCurrenciesWL;
		checked(hWndCurrenciesAll, !enableCurrenciesWL);
		if(enableCurrenciesWL)
			ensureCurrenciesVisibility();
		updateCurrenciesWL();
	}
	function updateCurrenciesWL() {
		selectedItems[curType] = [curItem, curItem2];
		draw(curType, hWndDialog);
	}
	function setCurrenciesWL() {
		var wl = currenciesWL;
		var msg = "", wlTmp;
		for(;;) {
			var title = dialogTitle + _localize(": currencies");
			var wl2 = AkelPad.InputBox(hWndDialog, title, _localize("Preferred currencies:") + msg, wlTmp || wl);
			if(!wl2 || /^[A-Z]{3}( *, *[A-Z]{3})+$/.test(wl2)) {
				if(wl2 == "")
					wl2 = defaultCurrenciesWL;
				break;
			}
			else {
				msg = "\n" + _localize("(comma-separated list, example: EUR,USD)");
				wlTmp = wl2;
			}
		}
		if(!wl2)
			return;
		var showAll = checked(hWndCurrenciesAll);
		if(!showAll && wl2 == wl)
			return;
		currenciesWL = wl2;
		if(!showAll)
			ensureCurrenciesVisibility();
		if(showAll)
			toggleCurrenciesWL();
		else
			updateCurrenciesWL();
	}
	function ensureCurrenciesVisibility() {
		var wl = currenciesWL;
		var currencies = measures[CURRENCY];
		var code = getCurrencyName(currencies[curItem]);
		var code2 = getCurrencyName(currencies[curItem2]);
		var nearestVisible = function(code, skip) {
			var found, prevVisible;
			for(var currency in currencies) {
				var c = currencies[currency];
				if(c == code) {
					found = true;
				}
				else if(wl.indexOf(c) != -1) {
					if(currency == skip)
						continue;
					if(found)
						return currency;
					prevVisible = currency;
				}
			}
			return prevVisible;
		};
		if(wl.indexOf(code) == -1)
			curItem = nearestVisible(code, curItem2);
		if(wl.indexOf(code2) == -1)
			curItem2 = nearestVisible(code2, curItem);
	}

	function doPendingUpdate() {
		var pu = update.pendingUpdates && update.pendingUpdates.shift();
		pu && pu.func.apply(this, pu.args);
	}
	function update(force, report, maskInclude, isStartup) {
		var pendingUpdates = update.pendingUpdates || (update.pendingUpdates = []);
		if(asyncUpdater.activeRequests) {
			pendingUpdates.push({ func: update, args: arguments });
			return;
		}
		if(report == undefined)
			report = 2;
		var btnLabel = update._btnLabel || (update._btnLabel = windowText(hWndUpdate));
		var startTime = new Date().getTime();
		updateCurrencyDataAsync(
			force,
			function onStart() {
				windowText(hWndUpdate, _localize("Update…"));
			},
			function onProgress(state, code) {
				onCodeUpdated(code);
				var errors = state.errors + state.parseErrors;
				windowText(
					hWndUpdate,
					_localize(errors ? "%S/%T Fail: %F" : "%S/%T")
						.replace("%S", state.success)
						.replace("%T", state.total)
						.replace("%F", errors)
				);
			},
			function onComplete(state, code) {
				onCodeUpdated(code);
				if(btnLabel && !pendingUpdates.length) {
					windowText(hWndUpdate, btnLabel);
					//if(curType != CURRENCY)
					setDialogTitle();
					saveOffline && saveOfflineCurrencyData(true);
				}
				if(
					!report
					|| (
						report == 1
						&& (!state || !state.errors && !state.parseErrors && !state.abortedErrors)
					)
					|| asyncUpdater.noReport
				) {
					doPendingUpdate();
					return;
				}
				var title = dialogTitle;
				var icon = 0 /*MB_OK*/;
				if(state) {
					if(state.aborted)
						title += " :: " + _localize("Aborted");
					else if(state.stopped)
						title += " :: " + _localize("Stopped");
					var elapsedTime = ((new Date().getTime() - startTime)/1000).toLocaleString();
					var msg = _localize(
						state.success == state.total
							? "Successfully updated: %P/%T (%ET s)"
							: "Updated: %P/%T (%ET s)\n  - Success: %S\n  - Net errors: %NE\n  - Parse errors: %PE\n  - Aborted: %A"
						)
						.replace("%P",  state.processed)
						.replace("%T",  state.total)
						.replace("%S",  state.success)
						.replace("%NE", state.errors)
						.replace("%PE", state.parseErrors)
						.replace("%A",  state.abortedErrors)
						.replace("%ET", elapsedTime);
					if(state.noSource)
						msg += _localize("\n  - Missing update URL: %M").replace("%M", state.noSource);
					var details = state.details.join("\n");
					if(details)
						msg += "\n\n" + _localize("Details:\n%S").replace("%S", details)
					icon |= state.parseErrors
						? 16 /*MB_ICONERROR*/
						: state.errors || state.noSource
							? 48 /*MB_ICONEXCLAMATION*/
							: 64 /*MB_ICONINFORMATION*/;
				}
				else {
					var msg = _localize("No update needed!");
					icon |= 64 /*MB_ICONINFORMATION*/;
				}
				asyncUpdater.endingState = true;
				AkelPad.MessageBox(hWndDialog, msg, title, icon);
				asyncUpdater.endingState = false;
				updateSelf && selfUpdate();
				doPendingUpdate();
			},
			maskInclude,
			isStartup
		);
		setDialogTitle();
	}
	function selfUpdate() {
		var db = [];
		var ts = Infinity;
		var tsMax = 0;
		for(var code in currencyRatios) {
			var data = currencyRatios[code];
			var t = data && data.timestamp;
			if(t && data.ratio) {
				db.push(code + "=" + data.ratio);
				if(t < ts)
					ts = t;
				if(t > tsMax)
					tsMax = t;
			}
		}
		if(!db.length)
			return;

		db.sort();
		var selfFile = WScript.ScriptFullName;

		var updDate = formatDate(ts);
		var updated;
		var selfCode = AkelPad.ReadFile(selfFile, 0, 65001, 1)
			.replace(
				/^\/\/ \[built-in currencies data: [^\r\n]+\]$/m,
				"// [built-in currencies data: " + updDate + "]"
			)
			.replace(
				/^var defaultCurrencyDataTime = [^\r\n]+/m,
				"var defaultCurrencyDataTime = " + ts + "; // " + updDate
			)
			.replace(
				/^([ \t]*\/\/ Built-in currencies data:[\r\n]+\s*return )"([A-Z]+=[^"]+)"/m,
				function(code, start, oldData) {
					var newData = db.join("|")
						.replace(/([^|]+\|){4}/g, "$&\\\r\n");
					updated = newData != oldData;
					return start + '"' + newData + '"';
				}
			);

		if(!updated) {
			AkelPad.MessageBox(
				hMainWnd,
				_localize("Default currency data not changed!"),
				WScript.ScriptBaseName,
				48 /*MB_ICONEXCLAMATION*/
			);
			return;
		}

		// Create backup
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var bakExt = gts() + ".js.bak";
		var selfFileBak = selfFile.slice(0, -3) + bakExt;
		try {
			fso.CopyFile(selfFile, selfFileBak, true);
		}
		catch(e) {
			AkelPad.MessageBox(
				hMainWnd,
				_localize("Can't create backup file:\n") + [e.message, selfFileBak].join("\n"),
				WScript.ScriptBaseName,
				16 /*MB_ICONERROR*/
			);
			return;
		}

		saveFile(selfFile, selfCode);

		var updWarn = tsMax - ts > 20*60*60*1000
			? "\n\n" + _localize("Warning! Update date of some currencies is too old (%old < %new)")
				.replace("%old", updDate)
				.replace("%new", formatDate(tsMax))
			: "";
		AkelPad.MessageBox(
			hWndDialog,
			_localize("Default currency data was successfully updated to %d")
				.replace("%d", updDate)
				+ updWarn,
			WScript.ScriptBaseName,
			updWarn ? 48 /*MB_ICONEXCLAMATION*/ : 64 /*MB_ICONINFORMATION*/
		);

		function gts() {
			var d = new Date();
			return "_" + d.getFullYear()   + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
			     + "_" + pad(d.getHours()) + "-" + pad(d.getMinutes())   + "-" + pad(d.getSeconds());
		}
		function formatDate(ts) {
			var d = new Date(ts);
			return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
		}
		function pad(n) {
			return n > 9 ? n : "0" + n;
		}
		function saveFile(file, code) {
			AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 0);
			AkelPad.SetSel(0, -1);
			AkelPad.ReplaceSel(code);
			AkelPad.Command(4184); // IDM_EDIT_NEWLINE_WIN
			AkelPad.SaveFile(AkelPad.GetEditWnd(), file, 65001, 1);
			AkelPad.TextFind(0, "(?<=^// \\[built-in currencies data: )[\\d\\-]+", 0x280001 /*FRF_DOWN|FRF_BEGINNING|FRF_REGEXP*/);
		}
	}
	function cancelUpdate(force) {
		if(!asyncUpdater.activeRequests || asyncUpdater.state.aborted)
			return false;
		if(
			asyncUpdater.isStartup
			|| AkelPad.MessageBox(
				hWndDialog,
				_localize("Cancel update?"),
				dialogTitle,
				33 /*MB_OKCANCEL|MB_ICONQUESTION*/
			) == 1 /*IDOK*/
		) {
			asyncUpdater.noReport = true;
			asyncUpdater.abort();
			return false;
		}
		return true;
	}
	function onCodeUpdated(code) {
		if(code && curType == CURRENCY && (measures[curType][curItem] == code || measures[curType][curItem2] == code)) {
			convertGUI();
			setDialogTitle();
		}
	}

	function restoreWindowPosition(hWnd, hWndParent) {
		if(dlgX == undefined || dlgY == undefined) {
			centerWindow(hWnd, hWndParent);
			return;
		}

		var rcWnd = getWindowRect(hWnd);
		if(!rcWnd)
			return;

		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		if(!lpRect)
			return;
		AkelPad.MemCopy(_PtrAdd(lpRect,  0), dlgX,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect,  4), dlgY,                              3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect,  8), dlgX + (rcWnd.right - rcWnd.left), 3 /*DT_DWORD*/);
		AkelPad.MemCopy(_PtrAdd(lpRect, 12), dlgY + (rcWnd.top - rcWnd.bottom), 3 /*DT_DWORD*/);
		var hMonitor = oSys.Call("user32::MonitorFromRect", lpRect, 0x2 /*MONITOR_DEFAULTTONEAREST*/);

		if(hMonitor) {
			//typedef struct tagMONITORINFO {
			//  DWORD cbSize;
			//  RECT  rcMonitor;
			//  RECT  rcWork;
			//  DWORD dwFlags;
			//} MONITORINFO, *LPMONITORINFO;
			var sizeofMonitorInfo = 4 + 16 + 16 + 4;
			var lpMi = AkelPad.MemAlloc(sizeofMonitorInfo);
			if(lpMi) {
				AkelPad.MemCopy(lpMi, sizeofMonitorInfo, 3 /*DT_DWORD*/);
				oSys.Call("user32::GetMonitorInfo" + _TCHAR, hMonitor, lpMi);
				var rcWork = parseRect(_PtrAdd(lpMi, 4 + 16));
				AkelPad.MemFree(lpMi);
			}
		}
		else { //?
			oSys.Call("user32::SystemParametersInfo" + _TCHAR, 48 /*SPI_GETWORKAREA*/, 0, lpRect, 0);
			var rcWork = parseRect(lpRect);
		}
		AkelPad.MemFree(lpRect);

		if(rcWork) {
			var edge = Math.max(
				16,
				oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYFIXEDFRAME*/)
					+ oSys.Call("user32::GetSystemMetrics", 4 /*SM_CYCAPTION*/)
			);

			var minX = rcWork.left - (rcWnd.right - rcWnd.left) + edge;
			var minY = rcWork.top;
			var maxX = rcWork.right - edge;
			var maxY = rcWork.bottom - edge;

			dlgX = Math.max(minX, Math.min(maxX, dlgX));
			dlgY = Math.max(minY, Math.min(maxY, dlgY));
		}

		oSys.Call("user32::SetWindowPos", hWnd, 0, dlgX, dlgY, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
	}
	function centerWindow(hWnd, hWndParent) {
		var rcWnd = getWindowRect(hWnd);
		var rcWndParent = getWindowRect(hWndParent || oSys.Call("user32::GetDesktopWindow"));
		if(!rcWndParent || !rcWnd)
			return;
		var x = rcWndParent.left + ((rcWndParent.right  - rcWndParent.left) / 2 - (rcWnd.right  - rcWnd.left) / 2);
		var y = rcWndParent.top  + ((rcWndParent.bottom - rcWndParent.top)  / 2 - (rcWnd.bottom - rcWnd.top)  / 2);
		oSys.Call("user32::SetWindowPos", hWnd, 0, x, y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
	}
	function getWindowRect(hWnd, hWndParent) {
		var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
		getRect: if(lpRect) {
			if(!oSys.Call("user32::GetWindowRect", hWnd, lpRect))
				break getRect;
			if(hWndParent && !oSys.Call("user32::ScreenToClient", hWndParent, lpRect))
				break getRect;
			var rcWnd = parseRect(lpRect);
		}
		lpRect && AkelPad.MemFree(lpRect);
		return rcWnd;
	}
	function parseRect(lpRect) {
		return {
			left:   AkelPad.MemRead(_PtrAdd(lpRect,  0), 3 /*DT_DWORD*/),
			top:    AkelPad.MemRead(_PtrAdd(lpRect,  4), 3 /*DT_DWORD*/),
			right:  AkelPad.MemRead(_PtrAdd(lpRect,  8), 3 /*DT_DWORD*/),
			bottom: AkelPad.MemRead(_PtrAdd(lpRect, 12), 3 /*DT_DWORD*/)
		};
	}

	function getStringFromIndex(i) {
		if(i == -1 || i == undefined)
			return "";
		var len = AkelPad.SendMessage(hWndListBox, 0x18A /*LB_GETTEXTLEN*/, i, 0);
		var lpString = AkelPad.MemAlloc((len + 1)*_TSIZE);
		if(!lpString)
			return "";
		AkelPad.SendMessage(hWndListBox, 0x189 /*LB_GETTEXT*/, i, lpString);
		var str = AkelPad.MemRead(lpString, _TSTR);
		AkelPad.MemFree(lpString);
		return str;
	}
	function getIndexFromString(str) {
		// Note: not case sensitive!
		return AkelPad.SendMessage(hWndListBox, 0x1A2 /*LB_FINDSTRINGEXACT*/, -1, str);
	}

	function windowText(hWnd, pText) {
		if(arguments.length > 1)
			return oSys.Call("user32::SetWindowText" + _TCHAR, hWnd, pText);
		var len = oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWnd);
		var lpText = AkelPad.MemAlloc((len + 1)*_TSIZE);
		if(!lpText)
			return "";
		oSys.Call("user32::GetWindowText" + _TCHAR, hWnd, lpText, len + 1);
		pText = AkelPad.MemRead(lpText, _TSTR);
		AkelPad.MemFree(lpText);
		return pText;
	}
	function setWindowFont(hWnd, hFont) {
		AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
	}
	function setWindowFontAndText(hWnd, hFont, pText) {
		setWindowFont(hWnd, hFont);
		windowText(hWnd, pText);
	}
	function setEditText(hWnd, pText, selectAll) {
		windowText(hWnd, pText);
		pText && AkelPad.SendMessage(hWnd, 177 /*EM_SETSEL*/, selectAll ? 0 : pText.length, -1);
	}
	function checked(hWnd, checked) {
		// BST_UNCHECKED:     0
		// BST_CHECKED:       1
		// BST_INDETERMINATE: 2
		return arguments.length == 1
			? AkelPad.SendMessage(hWnd, 240 /*BM_GETCHECK*/, 0, 0)
			: AkelPad.SendMessage(hWnd, 241 /*BM_SETCHECK*/, +checked, 0);
	}
	function enabled(hWnd, val) {
		return arguments.length == 1
			? oSys.Call("user32::IsWindowEnabled", hWnd) //?
			: oSys.Call("user32::EnableWindow", hWnd, val);
	}
	function showWindow(hWnd, val) {
		oSys.Call("user32::ShowWindow", hWnd, val);
	}
	function destroyWindow(hWnd) {
		oSys.Call("user32::DestroyWindow", hWnd);
	}
	function closeDialog() {
		postMessage(hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
	}
	function ctrlPressed() {
		return keyPressed(17 /*VK_CONTROL*/);
	}
	function shiftPressed() {
		return keyPressed(16 /*VK_SHIFT*/);
	}
	function keyPressed(key) {
		return !!(oSys.Call("user32::GetAsyncKeyState", key) & 0x8000); // Fix possible 4-byte result
	}
	function postMessage(hWnd, msg, wParam, lParam) {
		oSys.Call("user32::PostMessage" + _TCHAR, hWnd, msg, wParam, lParam);
	}

	function Scale(hDC, hWnd) {
		var hNewDC = hDC || oSys.Call("user32::GetDC", hWnd);
		if(hNewDC) {
			this._x = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 88 /*LOGPIXELSX*/);
			this._y = oSys.Call("gdi32::GetDeviceCaps", hNewDC, 90 /*LOGPIXELSY*/);

			//Align to 16 pixel
			this._x += (16 - this._x % 16) % 16;
			this._y += (16 - this._y % 16) % 16;

			!hDC && oSys.Call("user32::ReleaseDC", hWnd, hNewDC);

			this.x = function(x) {
				return oSys.Call("kernel32::MulDiv", x, this._x, 96);
			};
			this.y = function(y) {
				return oSys.Call("kernel32::MulDiv", y, this._y, 96);
			};
		}
		else {
			this.x = this.y = function(n) {
				return n;
			};
		}
	}
	function createWindowEx(
		dwExStyle, lpClassName, lpWindowName, dwStyle,
		x, y, w, h,
		hWndParent, id, hInstance, callback
	) {
		return oSys.Call(
			"user32::CreateWindowEx" + _TCHAR,
			dwExStyle, lpClassName, lpWindowName, dwStyle,
			scale.x(x), scale.y(y),
			scale.x(w), scale.y(h),
			hWndParent, id, hInstance, callback || 0
		);
	}

	modal && enabled(hMainWnd, false); // Disable main window, to make dialog modal

	AkelPad.ScriptNoMutex(); // Allow other scripts running
	AkelPad.WindowGetMessage(); // Message loop

	AkelPad.WindowUnregisterClass(dialogClass);
}

function setRedraw(hWnd, bRedraw) {
	AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
	bRedraw && oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}
function calcNum(val, showErrors, hWnd, hWndEdit) {
	var origVal = val;
	val = val.replace(/^\s+|\s+$/g, "");
	if(!val)
		return undefined;
	//var num = +val;

	if(isExpression(val))
		val = prepareExpression(val);

	try {
		var num = calculate(val);
		if(typeof num != "number" || !isFinite(num))
			return undefined;
	}
	catch(e) {
		showErrors && AkelPad.MessageBox(
			hWnd || hMainWnd,
			_localize("Error:\n%S")
				.replace("%S", e.name ? e.name + "\n" + e.message : e),
			dialogTitle,
			16 /*MB_ICONERROR*/
		);
		if(hWndEdit && displayCalcErrors && calcNum._hasTipFor != origVal) {
			//hWndEdit && AkelPad.SendMessage(hWndEdit, 0x1504 /*EM_HIDEBALLOONTIP*/, 0, 0);
			//typedef struct tagEDITBALLOONTIP {
			//  DWORD   cbStruct;
			//  LPCWSTR pszTitle;
			//  LPCWSTR pszText;
			//  INT     ttiIcon;
			//} EDITBALLOONTIP, *PEDITBALLOONTIP;
			var lpTitle = AkelPad.MemStrPtr(_localize("Error"));
			var lpText = AkelPad.MemStrPtr(e.name ? e.name + "\n" + e.message : e);
			var sizeofEditBalloonTip = 4 + 4 + 4 + 4;
			var lpTip = AkelPad.MemAlloc(sizeofEditBalloonTip);
			AkelPad.MemCopy(_PtrAdd(lpTip,  0), sizeofEditBalloonTip, 3 /*DT_DWORD*/);
			AkelPad.MemCopy(_PtrAdd(lpTip,  4), lpTitle,              3 /*DT_DWORD*/);
			AkelPad.MemCopy(_PtrAdd(lpTip,  8), lpText,               3 /*DT_DWORD*/);
			AkelPad.MemCopy(_PtrAdd(lpTip, 12), 2 /*TTI_WARNING*/,    3 /*DT_DWORD*/);
			if(AkelPad.SendMessage(hWndEdit, 0x1503 /*EM_SHOWBALLOONTIP*/, 0, lpTip))
				calcNum._hasTipFor = origVal;
			AkelPad.MemFree(lpTitle);
			AkelPad.MemFree(lpText);
			AkelPad.MemFree(lpTip);
		}
		return undefined;
	}
	calcNum._hasTipFor = undefined;
	return num;
}
function isExpression(str) {
	// Detect simple expressions like
	// 1 234,12 + 6 -> 1234.12 + 6
	var nums = str.split(/\s*[-+*\/()]+\s*/);
	for(var i = 0, l = nums.length; i < l; ++i)
		if(nums[i] && !/^\d[\d\s\xa0]*([,.][\d\s\xa0]*\d)?(e[+-]?\d+)?$/i.test(nums[i]))
			return false;
	return true;
}
function prepareExpression(str) {
	return str
		.replace(/(\d)[\s\xa0]+/g, "$1") // 12 345 -> 12345
		.replace(/(\d),/g, "$1.") // 1,23 -> 1.23
		.replace(/([.,]|[-+*\/\s](\([-\s]?)*)\s*$/, ""); // Looks like non-terminated expression (e.g. "2+2*")
}
function numToStr(n) {
	var isCurrency = curType == CURRENCY;
	var roundVal = isCurrency ? roundCurrencies : roundMeasures;
	var roundState = isCurrency ? roundCurrenciesState : roundMeasuresState;
	var roundEnabled = roundState > 0 && roundVal != ROUND_OFF && roundVal != undefined;
	var ns = roundEnabled
		? n.toFixed(roundVal)
		: fixPrecision(n);
	if(roundState == 2 /*BST_INDETERMINATE*/ && roundVal >= 0 && /^[0.]+$/.test(ns))
		ns = fixPrecision(n, Math.max(1, roundVal));
	if(convertNumbers)
		return toLocaleNum(formatNum(ns));
	return ns;
}
function fixPrecision(n, prec) {
	// Try fix "bugs" with floating point operations
	// E.g. 0.3/0.1 = 2.9999999999999995
	return n.toPrecision(prec || 13)
		.replace(/\.0+(e|$)/, "$1") // 1.000 and 1.000e5 => 1
		.replace(/(\.\d*[^0])0+(e|$)/, "$1$2"); // 1.200 and 1.200e5 => 1.2
}
function formatNum(n) {
	// 1234567.1234567 -> 1 234 567.1 234 567
	//return Number(n).toLocaleString().replace(/\s*[^\d\s\xa0\u2002\u2003\u2009].*$/, "");
	return ("" + n).replace(/(\d)(?=(\d{3})+(\D|$))/g, "$1\xa0");
}
function toLocaleNum(n) {
	// Apply locale settings: 1 234 567,1 234 567 (Russian), 1,234,567.1,234,567 (English), etc.
	if(!localeNumbers.delimiter)
		localeNumbers();
	return ("" + n)
		// We may have \xa0 in localeNumbers.delimiter
		.replace(/\./g,   "\0.\0")
		.replace(/\xa0/g, "\0 \0")
		.replace(/\0\.\0/g, localeNumbers.delimiter)
		.replace(/\0 \0/g,  localeNumbers.separator);
}
function localeNumbers() {
	// Detect locale delimiter (e.g. 0.1 -> 0,1)
	if(/(\D+)\d+\D*$/.test((1.1).toLocaleString()))
		var ld = RegExp.$1;
	// Detect locale separator (e.g. 123456 -> 123 456 or 123,456)
	if(/^\D*\d+(\D+)/.test((1234567890123).toLocaleString()))
		var ls = RegExp.$1;
	localeNumbers.delimiter = ld && ls ? ld : ".";
	localeNumbers.separator = ld && ls ? ls : "\xa0";
}

function ensureTimers() {
	var lib = AkelPad.GetAkelDir(6 /*ADTYPE_INCLUDE*/);
	if(oSys.Call("kernel32::GetFileAttributes" + _TCHAR, lib + "\\timer.js") != -1) {
		AkelPad.Include("timer.js");
		var hasTimers = true;
	}
	return (ensureTimers = function() {
		return hasTimers;
	})();
}

function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; ++i)
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

function calculate(code) {
	if(calculate._prevCode == code) {
		if(calculate._prevError)
			throw calculate._prevError;
		return calculate._prevResult;
	}
	calculate._prevCode = code;
	calculate._prevError = calculate._prevResult = null;
	try {
		return calculate._prevResult = evalInGlobalContext(code);
	}
	catch(e) {
		throw calculate._prevError = e;
	}
}
function evalInGlobalContext(code) {
	return evalGlobal(code, eval, Math);
}

})(
	function evalGlobal(code, eval, Math) {
		var WScript, // Prevent WScript.Quit();
			ActiveXObject,
			Function, // new Function("WScript.Quit();")();
			AkelPad; // Forbid AkelPad API
		with(Math)
			return eval(code);
	},
	eval, Math,
	String, Number, RegExp, Date, Boolean, Array,
	isFinite, isNaN,
	undefined, NaN, Infinity,
	AkelPad, WScript, ActiveXObject
);