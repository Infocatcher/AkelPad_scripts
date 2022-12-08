// http://akelpad.sourceforge.net/forum/viewtopic.php?p=12107#12107
// http://infocatcher.ucoz.net/js/akelpad_scripts/measuresConverter.js
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/measuresConverter.js

// (c) Infocatcher 2011-2022
// Version: 0.2.10 - 2022-08-03
// Author: Infocatcher
// [built-in currencies data: 2022-12-06]

//===================
//// Convert measures (internal) and currency (used cached data from exchange-rates.org, fxexchangerate.com and currency.world)
// Can convert numbers and expressions, pick up selected text

// Required timer.js library (only for -updateOnStartup=true):
// http://akelpad.sourceforge.net/forum/viewtopic.php?p=24559#24559
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
//   -preferFXExchangeRate=true    - prefer data from fxexchangerate.com (faster updates)
//   -offlineExpire=22*60*60*1000  - currency ratio expires after this time (in milliseconds)
//                 =Infinity       - prevent auto-updates
//   -updateOnStartup=true         - asynchronous update currency data on startup
//   -updateOnStartupReport=0      - don't show report for startup update (-updateOnStartup=true)
//                         =1      - (default) show only errors
//                         =2      - always show
//   -updateSelf=false             - (use at your own risk!) update default currencies data
//   -updateMaxErrors=4            - abort update, if reached too many errors (use -1 to ignore errors)
//   -convertNumbers=true          - convert numbers (1234.5 -> 1 234,5)
//   -displayCalcErrors=true       - always display calculation errors (e.g. for "1++2")
//   -roundMeasures=3              - round measures (e.g. for 3: 0.1234 -> 0.123)
//   -roundMeasuresState=0         - don't round measures (and override saved value)
//                      =1         - round measures (0.1234 -> 0.12, 0.00019 -> 0.00)
//                      =2         - round and show too small rounded values (e.g. 0.00 -> 0.00019)
//   -roundCurrencies=2            - round currencies (e.g. for 3: 0.1234 -> 0.123)
//   -roundCurrenciesState=0       - see -roundMeasuresState
//   -sortMeasures=true            - sort measures alphabetically
//   -sortByName=true              - sort currencies by name (otherwise - by code)
//   -maxHeight=0                  - maximum window height to create listboxes instead of radio buttons
//                                   -1 => no resize window
//                                    0 => always use listboxes
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
//   -savePosition=true            - allow store last window position
//   -saveOffline=true             - allow store currencies data
//   -currencies="USD,EUR"         - white list for currencies, use "-" prefix to show all on startup: "-USD,EUR"

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
		// Sorted by code (in each "section")
		// https://exchange-rates.org/AddCustomContent/RatesTable/Preview/RT000B8OF
		"United Arab Emirates Dirham":   "AED",
		"Armenian Dram":                 "AMD",
		"Netherlands Antillian Guilder": "ANG",
		"Argentine Peso":                "ARS",
		"Australian Dollar":             "AUD",
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
		"Botswana Pula":                 "BWP",
		"Belarusian Ruble":              "BYN",
		"Belize Dollar":                 "BZD",
		"Canadian Dollar":               "CAD",
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
		"Egyptian Pound":                "EGP",
		"Ethiopian Birr":                "ETB",
		"Euro":                          "EUR",
		"Fiji Dollar":                   "FJD",
		"British Pound":                 "GBP",
		"Ghanaian Cedi":                 "GHS",
		"Gambian Dalasi":                "GMD",
		"Guatemalan Quetzal":            "GTQ",
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
		"Cambodian Riel":                "KHR",
		"Korean Won":                    "KRW",
		"Kuwaiti Dinar":                 "KWD",
		"Cayman Islands Dollar":         "KYD",
		"Kazakhstan Tenge":              "KZT",
		"Lao Kip":                       "LAK",
		"Lebanese Pound":                "LBP",
		"Sri Lanka Rupee":               "LKR",
		"Lesotho Loti":                  "LSL",
		"Lithuanian Litas":              "LTL",
		"Latvian Lats":                  "LVL",
		"Libyan Dinar":                  "LYD",
		"Moroccan Dirham":               "MAD",
		"Moldovan Leu":                  "MDL",
		"Myanmar Kyat":                  "MMK",
		"Macau Pataca":                  "MOP",
		"Mauritius Rupee":               "MUR",
		"Malawi Kwacha":                 "MWK",
		"Mexican Peso":                  "MXN",
		"Malaysian Ringgit":             "MYR",
		"Nigerian Naira":                "NGN",
		"Nicaraguan Cordoba Oro":        "NIO",
		"Norwegian Krone":               "NOK",
		"Nepalese Rupee":                "NPR",
		"New Zealand Dollar":            "NZD",
		"Omani Rial":                    "OMR",
		"Panamanian Balboa":             "PAB",
		"Peruvian Nuevo Sol":            "PEN",
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
		"Seychelles Rupee":              "SCR",
		"Swedish Krona":                 "SEK",
		"Singapore Dollar":              "SGD",
		"Somali Shilling":               "SOS",
		"Syrian Pound":                  "SYP",
		"Swaziland Lilangeni":           "SZL",
		"Thai Baht":                     "THB",
		"Tunisian Dinar":                "TND",
		"Turkish Lira":                  "TRY",
		"Trinidad and Tobago Dollar":    "TTD",
		"Taiwan Dollar":                 "TWD",
		"Tanzanian Shilling":            "TZS",
		"Ukraine Hryvnia":               "UAH",
		"Uganda Shilling":               "UGX",
		"US Dollar":                  1/*"USD"*/,
		"Uruguay Peso":                  "UYU",
		"Venezuelan Bolivar":            "VES",
		"Vietnamese Dong":               "VND",
		"CFA BEAC Franc":                "XAF",
		"East Caribbean Dollar":         "XCD",
		"CFA BCEAO Franc":               "XOF",
		"CFP Franc":                     "XPF",
		"South African Rand":            "ZAR",
		"Zambian Kwacha":                "ZMK",
		"Zimbabwe Dollar":               "ZWD",

		// https://www.fxexchangerate.com/currency-converter-widget.html
		"Albanian Lek":                  "ALL",
		"Aruba Florin":                  "AWG",
		"Bhutan Ngultrum":               "BTN",
		"Estonian Kroon":                "EEK",
		"Falkland Islands Pound":        "FKP",
		"Guinea Franc":                  "GNF",
		"Guyana Dollar":                 "GYD",
		"Kyrgyzstan Som":                "KGS",
		"Comoros Franc":                 "KMF",
		"North Korean Won":              "KPW",
		"Liberian Dollar":               "LRD",
		"Macedonian Denar":              "MKD",
		"Mongolian Tugrik":              "MNT",
		"Mauritania Ougulya":            "MRO",
		"Maldives Rufiyaa":              "MVR",
		"Namibian Dollar":               "NAD",
		"Papua New Guinea Kina":         "PGK",
		"Solomon Islands Dollar":        "SBD",
		"Sudanese Pound":                "SDG",
		"St Helena Pound":               "SHP",
		"Slovak Koruna":                 "SKK",
		"Sierra Leone Leone":            "SLL",
		"Sao Tome Dobra":                "STD",
		"El Salvador Colon":             "SVC",
		"Tonga Pa'ang":                  "TOP",
		"Uzbekistan Sum":                "UZS",
		"Vanuatu Vatu":                  "VUV",
		"Samoa Tala":                    "WST",
		"Yemen Riyal":                   "YER",

		// https://currency.world/convert/
		// https://currency.world/convert/BTC/USD
		"Bitcoin": "BTC",
		"Ethereum": "ETH"
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
		"United Arab Emirates Dirham": {
			ru: "ОАЭ дирхам"
		},
		"Armenian Dram": {
			ru: "Армянский драм"
		},
		"Netherlands Antillian Guilder": {
			ru: "Голландский гульден"
		},
		"Argentine Peso": {
			ru: "Аргентинское песо"
		},
		"Australian Dollar": {
			ru: "Австралийский доллар"
		},
		"Barbados Dollar": {
			ru: "Барбадосский доллар"
		},
		"Bangladeshi Taka": {
			ru: "Бангладеш така"
		},
		"Bulgarian Lev": {
			ru: "Болгарский лев"
		},
		"Bahraini Dinar": {
			ru: "Бахрейнский динар"
		},
		"Burundi Franc": {
			ru: "Бурундийский франк"
		},
		"Bermudian Dollar": {
			ru: "Бермудский доллар"
		},
		"Brunei Dollar": {
			ru: "Брунейский доллар"
		},
		"Bolivian Boliviano": {
			ru: "Боливийский боливиано"
		},
		"Brazilian Real": {
			ru: "Бразильский реал"
		},
		"Bahamian Dollar": {
			ru: "Багамский доллар"
		},
		"Botswana Pula": {
			ru: "Ботсванская пула"
		},
		"Belarusian Ruble": {
			ru: "Белорусский рубль"
		},
		"Belize Dollar": {
			ru: "Белизский доллар"
		},
		"Canadian Dollar": {
			ru: "Канадский доллар"
		},
		"Swiss Franc": {
			ru: "Швейцарский франк"
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
		"Costa Rican Colon": {
			ru: "Коста-Риканский колон"
		},
		"Cuban Peso": {
			ru: "Кубинское песо"
		},
		"Cape Verde Escudo": {
			ru: "Кабо-Верде эскудо"
		},
		"Czech Koruna": {
			ru: "Чешская крона"
		},
		"Djibouti Franc": {
			ru: "Джибути франк"
		},
		"Danish Krone": {
			ru: "Датская крона"
		},
		"Dominican Peso": {
			ru: "Доминиканское песо"
		},
		"Algerian Dinar": {
			ru: "Алжирский динар"
		},
		"Egyptian Pound": {
			ru: "Египетский фунт"
		},
		"Ethiopian Birr": {
			ru: "Эфиопский быр"
		},
		"Euro": {
			ru: "Евро"
		},
		"Fiji Dollar": {
			ru: "Фиджи доллар"
		},
		"British Pound": {
			ru: "Английский фунт"
		},
		"Ghanaian Cedi": {
			ru: "Ганский седи"
		},
		"Gambian Dalasi": {
			ru: "Гамбийский даласи"
		},
		"Guatemalan Quetzal": {
			ru: "Гватемальский кетсаль"
		},
		"Hong Kong Dollar": {
			ru: "Гонконгский доллар"
		},
		"Honduran Lempira": {
			ru: "Гондурасская лемпира"
		},
		"Croatian Kuna": {
			ru: "Хорватская куна"
		},
		"Haitian Gourde": {
			ru: "Гаитянский гурд"
		},
		"Hungarian Forint": {
			ru: "Венгерский форинт"
		},
		"Indonesian Rupiah": {
			ru: "Индонезийская рупия"
		},
		"Israeli New Shekel": {
			ru: "Израильский шекель"
		},
		"Indian Rupee": {
			ru: "Индийская рупия"
		},
		"Iraqi Dinar": {
			ru: "Иракский динар"
		},
		"Iranian Rial": {
			ru: "Иранский риал"
		},
		"Iceland Krona": {
			ru: "Исландская крона"
		},
		"Jamaican Dollar": {
			ru: "Ямайский доллар"
		},
		"Jordanian Dinar": {
			ru: "Иорданский динар"
		},
		"Japanese Yen": {
			ru: "Японская йена"
		},
		"Kenyan Shilling": {
			ru: "Кенийский шиллинг"
		},
		"Cambodian Riel": {
			ru: "Камбоджийский риель"
		},
		"Korean Won": {
			ru: "Корейский вон (южный)"
		},
		"Kuwaiti Dinar": {
			ru: "Кувейтский динар"
		},
		"Cayman Islands Dollar": {
			ru: "Каймановых островов доллар"
		},
		"Kazakhstan Tenge": {
			ru: "Казахский тенге"
		},
		"Lao Kip": {
			ru: "Лаосский кип"
		},
		"Lebanese Pound": {
			ru: "Ливанский фунт"
		},
		"Sri Lanka Rupee": {
			ru: "Шри–Ланкийская рупия"
		},
		"Lesotho Loti": {
			ru: "Лесото лоти"
		},
		"Lithuanian Litas": {
			ru: "Литовский лит"
		},
		"Latvian Lats": {
			ru: "Латвийский лат"
		},
		"Libyan Dinar": {
			ru: "Ливийский динар"
		},
		"Moroccan Dirham": {
			ru: "Марокканский дирхам"
		},
		"Moldovan Leu": {
			ru: "Молдавский лей"
		},
		"Myanmar Kyat": {
			ru: "Мьянма кьят"
		},
		"Macau Pataca": {
			ru: "Макао патака"
		},
		"Mauritius Rupee": {
			ru: "Маврикийская рупия"
		},
		"Malawi Kwacha": {
			ru: "Малавийская квача"
		},
		"Mexican Peso": {
			ru: "Мексиканское песо"
		},
		"Malaysian Ringgit": {
			ru: "Малайзийский рингит"
		},
		"Nigerian Naira": {
			ru: "Нигерийская найра"
		},
		"Nicaraguan Cordoba Oro": {
			ru: "Никарагуанский кордоба"
		},
		"Norwegian Krone": {
			ru: "Норвежская крона"
		},
		"Nepalese Rupee": {
			ru: "Непальская рупия"
		},
		"New Zealand Dollar": {
			ru: "Новозеландский доллар"
		},
		"Omani Rial": {
			ru: "Оманский риал"
		},
		"Panamanian Balboa": {
			ru: "Панамский балбоа"
		},
		"Peruvian Nuevo Sol": {
			ru: "Перуанский сол"
		},
		"Philippine Peso": {
			ru: "Филиппинское песо"
		},
		"Pakistan Rupee": {
			ru: "Пакистанская рупия"
		},
		"Polish Zloty": {
			ru: "Польский злотый"
		},
		"Paraguay Guarani": {
			ru: "Парагвайский гуарани"
		},
		"Qatari Rial": {
			ru: "Катарский риал"
		},
		"Romanian Leu": {
			ru: "Румынский лей"
		},
		"Serbian Dinar": {
			ru: "Сербский динар"
		},
		"Russian Ruble": {
			ru: "Российский рубль"
		},
		"Rwanda Franc": {
			ru: "Руандский франк"
		},
		"Saudi Riyal": {
			ru: "Саудовский риал"
		},
		"Seychelles Rupee": {
			ru: "Сейшелийская рупия"
		},
		"Swedish Krona": {
			ru: "Шведская крона"
		},
		"Singapore Dollar": {
			ru: "Сингапурский доллар"
		},
		"Somali Shilling": {
			ru: "Сомалийский шиллинг"
		},
		"Syrian Pound": {
			ru: "Сирийский фунт"
		},
		"Swaziland Lilangeni": {
			ru: "Свазилендский лилангени"
		},
		"Thai Baht": {
			ru: "Тайский бахт"
		},
		"Tunisian Dinar": {
			ru: "Тунисский динар"
		},
		"Turkish Lira": {
			ru: "Турецкая лира"
		},
		"Trinidad and Tobago Dollar": {
			ru: "Тринидад и Тобаго доллар"
		},
		"Taiwan Dollar": {
			ru: "Тайваньский доллар"
		},
		"Tanzanian Shilling": {
			ru: "Танзанийский шиллинг"
		},
		"Ukraine Hryvnia": {
			ru: "Украинская гривна"
		},
		"Uganda Shilling": {
			ru: "Уганда шиллинг"
		},
		"US Dollar": {
			ru: "США доллар"
		},
		"Uruguay Peso": {
			ru: "Уругвайское песо"
		},
		"Venezuelan Bolivar": {
			ru: "Венессуэльский боливар"
		},
		"Vietnamese Dong": {
			ru: "Вьетнамский донг"
		},
		"CFA BEAC Franc": {
			ru: "КФА BEAC франк"
		},
		"East Caribbean Dollar": {
			ru: "Восточно–карибский доллар"
		},
		"CFA BCEAO Franc": {
			ru: "КФА ВСЕАО франк"
		},
		"CFP Franc": {
			ru: "КФП франк"
		},
		"South African Rand": {
			ru: "ЮАР рэнд"
		},
		"Zambian Kwacha": {
			ru: "Замбийская квача"
		},
		"Zimbabwe Dollar": {
			ru: "Зимбабве доллар"
		},
		// https://www.fxexchangerate.com/preview.php?ws=&fm=EUR&ft=USD&hc=FFFFFF&hb=2D6AB4&bb=F0F0F0&bo=2D6AB4&lg=ru&tz=0s&wh=200x250
		"Albanian Lek": {
			ru: "Албанский лек"
		},
		"Aruba Florin": {
			ru: "Арубанский флорин"
		},
		"Bhutan Ngultrum": {
			ru: "Бутанский нгултрум"
		},
		"Estonian Kroon": {
			ru: "Эстонская крона"
		},
		"Falkland Islands Pound": {
			ru: "Фунт Фолклендских островов"
		},
		"Guinea Franc": {
			ru: "Гвинейский франк"
		},
		"Guyana Dollar": {
			ru: "Гайанский доллар"
		},
		"Kyrgyzstan Som": {
			ru: "Киргизский сом"
		},
		"Comoros Franc": {
			ru: "Франк Комор"
		},
		"North Korean Won": {
			ru: "Северокорейская вона"
		},
		"Liberian Dollar": {
			ru: "Либерийский доллар"
		},
		"Macedonian Denar": {
			ru: "Македонский денар"
		},
		"Mongolian Tugrik": {
			ru: "Монгольский тугрик"
		},
		"Mauritania Ougulya": {
			ru: "Мавританская угия"
		},
		"Maldives Rufiyaa": {
			ru: "Мальдивская руфия"
		},
		"Namibian Dollar": {
			ru: "Намибийский доллар"
		},
		"Papua New Guinea Kina": {
			ru: "Папуа-Новая Гвинея кина"
		},
		"Solomon Islands Dollar": {
			ru: "Соломоновых островов доллар"
		},
		"Sudanese Pound": {
			ru: "Суданский фунт"
		},
		"St Helena Pound": {
			ru: "Святой Елены фунт"
		},
		"Slovak Koruna": {
			ru: "Словацкая крона"
		},
		"Sierra Leone Leone": {
			ru: "Сьерра-леонский леоне"
		},
		"Sao Tome Dobra": {
			ru: "Сан-Томе и Принсипи добра"
		},
		"El Salvador Colon": {
			ru: "Сальвадорский колон"
		},
		"Tonga Pa'ang": {
			ru: "Тонганская паанга"
		},
		"Uzbekistan Sum": {
			ru: "Узбекский сум"
		},
		"Vanuatu Vatu": {
			ru: "Вануатский вату"
		},
		"Samoa Tala": {
			ru: "Самоанская тала"
		},
		"Yemen Riyal": {
			ru: "Йеменский риал"
		},

		"Bitcoin": {
			ru: "Биткоин"
		},
		"Ethereum": {
			ru: "Эфириум"
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

var defaultCurrencyDataTime = 1670275048349; // 2022-12-06
function getDefaultCurrencyData() {
	if(!saveOffline)
		return "";
	// Built-in currencies data:
	return "AED=0.27225649175185345|ALL=0.009049812084271994|AMD=0.0025290900809610546|ANG=0.5550156486662141|\
ARS=0.005911940429443707|AUD=0.6693498671675189|AWG=0.5555555555555556|BBD=0.4954173891503592|\
BDT=0.009697006369284692|BGN=0.5365664682443867|BHD=2.652843583036657|BIF=0.00048590864917395527|\
BMD=1|BND=0.7414157036294523|BOB=0.14475775007661304|BRL=0.18927926053892727|\
BSD=1.0002600676175805|BTC=16947.315051282|BTN=0.01223070210773524|BWP=0.07771877972500453|\
BYN=0.39612777180505126|BZD=0.496255011555298|CAD=0.7354347154603086|CHF=1.0602036651240702|\
CLP=0.0011159095170749356|CNY=0.14363775248285038|COP=0.00020724873163776238|CRC=0.001659117670206443|\
CUP=0.03773584905660377|CVE=0.009541389306430687|CZK=0.043151430062125545|DJF=0.005626832518680521|\
DKK=0.1410288051334485|DOP=0.018281664990938785|DZD=0.007227558344609288|EEK=0.06703901925669012|\
EGP=0.04071544860566282|ETB=0.01873535913650678|ETH=1256.3899995376|EUR=1.0489327109665913|\
FJD=0.45188549221627233|FKP=1.2299321200462947|GBP=1.2183295240230216|GHS=0.07142826020543767|\
GMD=0.016102370368752977|GNF=0.00011251755838748988|GTQ=0.12729166364348965|GYD=0.004781138302299929|\
HKD=0.128725724741921|HNL=0.040395904097699914|HRK=0.13887349707629626|HTG=0.007044060769168608|\
HUF=0.0025355048904995812|IDR=0.00006433743698952265|ILS=0.2939957253021541|INR=0.012212473045698084|\
IQD=0.0006851661527920521|IRR=0.00002386634862013773|ISK=0.007044235183541387|JMD=0.006505919492173948|\
JOD=1.4098426756558235|JPY=0.007310556237780725|KES=0.008149880142565201|KGS=0.011841314029670568|\
KHR=0.00024286238459415366|KMF=0.0021448871069128673|KPW=0.0011111111111111111|KRW=0.0007658964056471726|\
KWD=3.2542549383318686|KYD=1.2003072786633377|KZT=0.002126526873142318|LAK=0.000058139533656706356|\
LBP=0.0006594161956832647|LKR=0.0027217831529341807|LRD=0.006493494518490629|LSL=0.05745470156419276|\
LTL=0.338668490960938|LVL=1.6531904095117964|LYD=0.2065901429231927|MAD=0.0949273302808501|\
MDL=0.051163928202682826|MKD=0.017136662484178576|MMK=0.0004763076238237425|MNT=0.0002919563339047706|\
MOP=0.12502247278948392|MRO=0.002801121797739354|MUR=0.022907840132689542|MVR=0.06546645273102801|\
MWK=0.0009745180876253122|MXN=0.05069066795447998|MYR=0.22888637622511435|NAD=0.05752088439510176|\
NGN=0.0022495153672211802|NIO=0.027466302280389744|NOK=0.10050842185193802|NPR=0.007644186596857509|\
NZD=0.6313749135805587|OMR=2.597571270861744|PAB=1.0002600676175805|PEN=0.26075632894723804|\
PGK=0.28409736584922385|PHP=0.01785506943720446|PKR=0.004454363123289845|PLN=0.22253624559100066|\
PYG=0.00013899850051948202|QAR=0.2746505758049322|RON=0.21328792291262574|RSD=0.008940535861209051|\
RUB=0.015980829397055293|RWF=0.0009297119194646346|SAR=0.2660478040015186|SBD=0.12159704587272875|\
SCR=0.06989072585013331|SDG=0.0017574679408585748|SEK=0.096054992635944|SGD=0.7369441138431267|\
SHP=0.7260028822314425|SKK=0.04503287399801856|SLL=0.000054274084699237264|SOS=0.0017590188595265076|\
STD=0.000048313891080172936|SVC=0.1143201017723274|SYP=0.0003980039973762319|SZL=0.057637977248215406|\
THB=0.02853900581462266|TND=0.3129884576116602|TOP=0.4273325305179527|TRY=0.053646051186594323|\
TTD=0.1473123958225151|TWD=0.03271448112722848|TZS=0.00042844908322191825|UAH=0.02708407047145133|\
UGX=0.00026889519352092233|UYU=0.025591504766916795|UZS=0.0000885739605347702|VES=0.08666|\
VND=0.00004167534903104813|VUV=0.008538992476592594|WST=0.3722022949249101|XAF=0.0016109897441557545|\
XCD=0.37002090618119926|XOF=0.001609013086320648|XPF=0.008783459116274043|YER=0.05768679083825311|\
ZAR=0.05727149218696576|ZMK=0.00011109630207279707|ZWD=0.002763194252555955"
		.replace(/\||$/g, "=" + defaultCurrencyDataTime + "$&");
}

// Read arguments:
// getArg(argName, defaultValue)
var saveOptions  = getArg("saveOptions",  true);
var savePosition = getArg("savePosition", true);
var saveOffline  = getArg("saveOffline",  true);

var preferFXExchangeRate  = getArg("preferFXExchangeRate", true);
var offlineExpire         = getArg("offlineExpire", 22*60*60*1000);
var updateOnStartup       = getArg("updateOnStartup", true);
var updateOnStartupReport = getArg("updateOnStartupReport", 1);
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

var currenciesDefaultWL = currenciesWL || "BYN,CNY,EUR,GBP,RUB,UAH,USD";
if(currenciesWL.charAt(0) == "-")
	currenciesWL = "";

var from   = getArg("from");
var to     = getArg("to");
var dialog = getArg("dialog", true);

if(updateSelf) {
	updateOnStartup = true;
	updateOnStartupReport = 2;
}

if(updateMaxErrors < 0)
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
	var getCurrencyName = function(s) {
		return (s === 1 ? BASE_CURRENCY : s).toLowerCase();
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
			var cName = isCurrency && getCurrencyName(mo[item]);
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
var missingCurrencies = {
	"exchange-rates.org": [
		"AWG", "BTN", "EEK", "FKP", "GYD", "KMF", "KPW", "LRD", "LTL", "LVL", "MNT", "MRO",
		"MVR", "PGK", "SBD", "SHP", "SKK", "SLL", "STD", "SVC", "TOP", "VUV", "WST", "ZMK", "ZWD"
	],
	"fxexchangerate.com": [
		"VES"
	]
};
function available(server, code) {
	var missing = missingCurrencies[server];
	for(var i = 0, l = missing.length; i < l; ++i)
		if(code == missing[i])
			return false;
	return true;
}
function getRequestURL(code) {
	if(code == "BTC" || code == "ETH")
		return "https://currency.world/convert/" + code + "/" + BASE_CURRENCY + "?" +  + new Date().getTime();
	if(
		available("fxexchangerate.com", code)
		&& (preferFXExchangeRate || !available("exchange-rates.org", code))
	) {
		// See https://www.fxexchangerate.com/currency-converter-widget.html
		// -> https://w.fxexchangerate.com/converter.php (not updated?)
		return "https://www.fxexchangerate.com/currency-converter-widget.html?" + new Date().getTime(); // BASE_CURRENCY == "USD" !
	}
	//return "https://exchange-rates.org/converter/" + code + "/" + BASE_CURRENCY + "/1/N";
	// Will use https://translate.google.com/ as proxy
	return "https://www-exchange--rates-org.translate.goog/converter/"
		+ code + "/" + BASE_CURRENCY
		+ "/1/N?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en";
}
function shouldCacheURL(url) {
	if(/^https?:\/\/(\w+\.)*fxexchangerate\.com\//.test(url))
		return "fxexchangerate.com";
	return "";
}
function getRatioFromResponse(response, code) {
	// https://exchange-rates.org/converter/EUR/USD/1/N
	if(/<div class="col-xs-6 result-cur2">\s*<dl>\s*<dt>\s*<strong>\s*<span>([^<>]+)<\/span>/.test(response))
		return validateRatio(stringToNumber(RegExp.$1));

	// https://currency.world/convert/BTC/USD
	if(response.indexOf('<meta name="author" content="Currency World"') != -1) {
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
	cache: {},
	init: function(onProgress, onComplete, total) {
		this.onProgress = onProgress;
		this.onComplete = onComplete;
		this.total = total || 0;
		this.activeRequests = this.processed = this.success = this.errors = this.abortedErrors = this.parseErrors = 0;
		this.aborted = this.stopped = false;
		this.details = [];
		this.cache = {};
		this.queue.length = 0;
	},
	abort: function() {
		this.aborted = true;
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
		++this.processed;
		var request = new ActiveXObject("Microsoft.XMLHTTP");
		this.requests[code] = request;
		var _this = this;
		var onReadyStateChange = request.onreadystatechange = function() {
			if(request.readyState != 4)
				return;
			var err = false;
			if(request.status != 200) {
				err = true;
				if(request.status == 0) {
					++_this.abortedErrors;
					_this.details.push("Aborted: " + code + " " + url);
				}
				else {
					++_this.errors;
					_this.details.push("Network error: " + code + " " + url);
				}
			}
			var cnt = --_this.activeRequests;
			if(_this.errors > _this.maxErrors) { //~ todo: (_this.errors + _this.abortedErrors) ?
				_this.stopped = true;
				_this.queue.length = 0;
			}
			if(!_this.stopped && !_this.aborted)
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
					++_this.parseErrors;
					_this.details.push("Parse error: " + code + " " + url);
				}
				else {
					++_this.success;
					currencyRatios[code] = {
						ratio: ratio,
						timestamp: _timestamp || new Date().getTime()
					};
				}
			}
			if(!_this.activeRequests)
				_this.onComplete && _this.onComplete(_this.getState(), code);
			else
				_this.onProgress && _this.onProgress(_this.getState(), code);
			delete _this.requests[code];
			request = code = _this = null; // Avoid memory leaks in old JScript versions (not tested)
		};
		var url = getRequestURL(code);
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
	},
	getState: function() {
		return {
			total:         this.total || this.processed,
			processed:     this.processed,
			errors:        this.errors,
			abortedErrors: this.abortedErrors,
			parseErrors:   this.parseErrors,
			success:       this.success,
			aborted:       this.aborted,
			stopped:       this.stopped,
			details:       this.details
		};
	}
};
function updateCurrencyDataAsync(force, onStart, onProgress, onComplete, maskInclude) {
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
	asyncUpdater.init(onProgress, onComplete, total);
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
	var IDC_SORT           = 1012;
	var IDC_SORT_BY_NAME   = 1013;
	var IDC_SORT_BY_CODE   = 1014;
	var IDC_UPDATE         = 1015;
	var IDC_UPDATE_STARTUP = 1016;
	var IDC_COPY_RES       = 1017;
	var idcCntr            = 1018;

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
	var hWndGroupCurrency, hWndCurrenciesAll, hWndGroupSortCurrency, hWndSortByName, hWndSortByCode, hWndUpdate;

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
	var msrW = 270;
	var dy = 16;
	var btnW = 130;
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
					btnW - 16,                 //nWidth
					16,                        //nHeight
					hWnd,                      //hWndParent
					IDC_CURRENCIES_ALL,        //ID
					hInstanceDLL,              //hInstance
					0                          //lpParam
				);
				setWindowFontAndText(hWndCurrenciesAll, hGuiFont, _localize("Show all"));
				checked(hWndCurrenciesAll, !currenciesWL);

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
					case IDC_SORT:
						sortMeasures = checked(hWndSortMeasures);
						selectedItems[curType] = [curItem, curItem2];
						draw(curType, hWnd);
					break msgLoop;
					case IDC_SORT_BY_NAME:
					case IDC_SORT_BY_CODE:
						sortByName = idc == IDC_SORT_BY_NAME;
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
						update(force, updateOnStartupReport);
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
				for(var type in hWndTypes) {
					var id = IDCTypes[type];
					if(id == idc) {
						if(curType == type)
							break msgLoop;
						if(curType && curItem && curItem2)
							selectedItems[curType] = [curItem, curItem2];
						//curType = type;
						draw(type, hWnd, true);
						for(var type in hWndTypes)
							checked(hWndTypes[type], IDCTypes[type] == idc);
						convertGUI();
						setDialogTitle(hWnd);
						break msgLoop;
					}
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
				if(cancelUpdate())
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
					setTimeout(function() {
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
		if(isCurrency && currenciesWL) {
			var moWL = {};
			for(var measure in mo) {
				var currencyCode = mo[measure];
				if(currenciesWL.indexOf(currencyCode == 1 ? BASE_CURRENCY : currencyCode) != -1)
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
			for(var measure in mo) {
				var currencyCode = mo[measure];
				if(currencyCode == 1)
					currencyCode = BASE_CURRENCY;
				sortArr.push([measure, _localize(measure), currencyCode]);
			}
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
				var name = isCurrency
					? sortByName
						? _localize(measure) + " (" + (item == 1 ? BASE_CURRENCY : item) + ")"
						: (item == 1 ? BASE_CURRENCY : item) + " (" + _localize(measure) + ")"
					: _localize(measure);
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
				hWndItems[measure] = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					msrX + 8,     //x
					y + 12,       //y
					msrW - 16,    //nWidth
					16,           //nHeight
					hWndDialog,   //hWndParent
					id,           //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndItems[measure], hGuiFont, _localize(measure));

				if(curItem && mo[curItem] ? curItem == measure : item == 1) {
					curItem = measure;
					checked(hWndItems[measure], true);
				}

				y += dy;
			}

			var y = msrY;
			for(var measure in mo) {
				var item = mo[measure];

				var id = IDCItems2[measure] || (IDCItems2[measure] = idcCntr++);
				hWndItems2[measure] = createWindowEx(
					0,            //dwExStyle
					"BUTTON",     //lpClassName
					0,            //lpWindowName
					0x50000004,   //WS_VISIBLE|WS_CHILD|BS_RADIOBUTTON
					msr2X + 8,    //x
					y + 12,       //y
					msrW - 16,    //nWidth
					16,           //nHeight
					hWndDialog,   //hWndParent
					id,           //ID
					hInstanceDLL, //hInstance
					0             //lpParam
				);
				setWindowFontAndText(hWndItems2[measure], hGuiFont, _localize(measure));

				if(curItem2 && mo[curItem2] ? curItem2 == measure && measure != curItem : measure != curItem) {
					curItem2 = measure;
					checked(hWndItems2[measure], true);
				}

				y += dy;
			}

			if(disableRadios) {
				enabled(hWndItems[curItem2], false);
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
				var hWndFocused = oSys.Call("user32::GetFocus");
				for(var item2 in hWndIts2) {
					var hWndRadio = hWndIts2[item2];
					var on = item2 != item;
					enabled(hWndRadio, on);
					if(!on && hWndRadio == hWndFocused)
						oSys.Call("user32::SetFocus", hWndIts2[primary ? curItem2 : curItem]);
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
		enabled(hWndItems[curItem2], !check);
		enabled(hWndItems2[curItem], !check);
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
		update(force, onlyCurrent ? 1 : 2, maskInclude);
	}
	function toggleCurrenciesWL() {
		if(curType != CURRENCY)
			return;
		if(currenciesWL)
			currenciesWL = "";
		else
			currenciesWL = currenciesDefaultWL;
		checked(hWndCurrenciesAll, !currenciesWL);
		selectedItems[curType] = [curItem, curItem2];
		draw(curType, hWndDialog);
	}
	function doPendingUpdate() {
		var pu = update.pendingUpdates && update.pendingUpdates.shift();
		pu && pu.func.apply(this, pu.args);
	}
	function update(force, report, maskInclude) {
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
					var details = state.details.join("\n");
					if(details)
						msg += "\n\n" + _localize("Details:\n%S").replace("%S", details)
					icon |= state.parseErrors
						? 16 /*MB_ICONERROR*/
						: state.errors
							? 48 /*MB_ICONEXCLAMATION*/
							: 64 /*MB_ICONINFORMATION*/;
				}
				else {
					var msg = _localize("No update needed!");
					icon |= 64 /*MB_ICONINFORMATION*/;
				}
				AkelPad.MessageBox(hWndDialog, msg, title, icon);
				updateSelf && selfUpdate();
				doPendingUpdate();
			},
			maskInclude
		);
		setDialogTitle();
	}
	function selfUpdate() {
		var db = [];
		var ts = Infinity;
		for(var code in currencyRatios) {
			var data = currencyRatios[code];
			if(data && data.ratio && data.timestamp) {
				db.push(code + "=" + data.ratio);
				if(data.timestamp < ts)
					ts = data.timestamp;
			}
		}
		if(!db.length)
			return;

		db.sort();
		var selfFile = WScript.ScriptFullName;

		var d = new Date(ts);
		var updDate = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
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

		AkelPad.MessageBox(
			hWndDialog,
			_localize("Default currency data was successfully updated to %d")
				.replace("%d", updDate),
			WScript.ScriptBaseName,
			64 /*MB_ICONINFORMATION*/
		);

		function gts() {
			var d = new Date();
			return "_" + d.getFullYear()   + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
			     + "_" + pad(d.getHours()) + "-" + pad(d.getMinutes())   + "-" + pad(d.getSeconds());
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
	function cancelUpdate() {
		if(!asyncUpdater.activeRequests || asyncUpdater.aborted)
			return false;
		if(
			AkelPad.MessageBox(
				hWndDialog,
				_localize("Cancel update?"),
				dialogTitle,
				33 /*MB_OKCANCEL|MB_ICONQUESTION*/
			) == 1 /*IDOK*/
		) {
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