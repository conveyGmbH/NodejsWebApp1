﻿// Collection of String utility functions
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/appbar.js" />

/**
 * Use the functions in this namespace to access Windows resource loader interface.
 * @namespace Resources
 */

(function () {
    "use strict";

    WinJS.Utilities._require([
        'WinJS/Core/_Global',
        'WinJS/Core/_Base'
    ], function resourcesInit(_Global, _Base) {

        /**
         * @function get 
         * @memberof Resources
         * @returns {Object} {@link https://docs.microsoft.com/en-us/uwp/api/Windows.ApplicationModel.Resources.Core Windows.ApplicationModel.Resources.Core}
         * @description Used to access Windows resource loader interface. Use this function to access the Windows resource loader interface. The interface provides classes that enable advanced resource loading.
         */
        function get() {
            var resources = null;
            try {
                resources = _Global.Windows.ApplicationModel.Resources.Core;
            } catch (e) { }
            return resources;
        }

        /**
         * @function getLanguages 
         * @memberof Resources
         * @returns {Array<string>} {@link https://msdn.microsoft.com/de-de/library/windows/apps/windows.globalization.applicationlanguages.languages.aspx Windows.Globalization.ApplicationLanguages.languages}
         * @description Used to access list of languages supported by Windows in current user context. Use this function to access the languages list. Specifies the language-related preferences that the app can use and maintain.
         */
        function getLanguages() {
            var languages = [];
            try {
                languages = _Global.Windows.Globalization.ApplicationLanguages.languages;
            } catch (e) { }
            return languages;
        }

        /**
         * @function primaryLanguageOverride
         * @memberof Resources
         * @param {string} language - a BCP-47 language tag. 
         * @returns {boolean} The return value is true if the override was successfull. Otherwise the return value is false.
         * @description Used to access native Windows.Globalization.ApplicationLanguages.languages object. See reference to {@link https://tools.ietf.org/html/bcp47 BCP-47} for supported language parameter.
         */
        function primaryLanguageOverride(language) {
            var ret;
            var lowerCase = language.toLowerCase();
            var bFound = false;
            var languages = getLanguages();
            for (var i = 0; i < languages.length; i++) {
                if (lowerCase === languages[i].toLowerCase()) {
                    language = languages[i];
                    bFound = true;
                    break;
                }
            }
            if (!bFound) {
                language = "en-US";
            }
            try {
                _Global.Windows.Globalization.ApplicationLanguages.primaryLanguageOverride = language;
                ret = true;
            } catch (e) {
                Log.print(Log.l.error, "Error in primaryLanguageOverride: " + e);
                ret = false;
            }
            return ret;
        }

        WinJS.Namespace.define("Resources", {
            get: get,
            primaryLanguageOverride: primaryLanguageOverride,
            languages: getLanguages()
        });


        /**
         * @function getResourceText
         * @param {string} resourceName - A string containing the resource ID of the string to retrieve. 
         * @global
         * @returns {string} The requested resource string or null if the string cannot be loaded.
         * @description Retrieves the resource string that has the specified resource identifier. For further documentation, see {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh701590.aspx WinJS.Resources.getString function}. The getResourceText() function returns the language specific string value using the primary language selected in current user context.
         */
        _Global.getResourceText = function(resourceName) {
            Log.call(Log.l.u1);
            var string = WinJS.Resources.getString(resourceName);
            if (string) {
                Log.ret(Log.l.u1, string.value);
                return string.value;
            } else {
                Log.ret(Log.l.u1);
                return null;
            }
        }

        /**
         * @function getResourceTextSection
         * @param {string} sectionName - The section part of the resource ID to retrieve. 
         * @global
         * @returns {Object} An object with resource ID members and string values. The return value is always present. 
         * @description Retrieves the resource string that has the specified resource identifier. The object is filled with all resource IDs that can be retrieved from resources given the naming convention <sectionName>.<resource ID> using the primary language selected in current user context.
         */
        _Global.getResourceTextSection = function(sectionName) {
            Log.call(Log.l.u1);
            var ret = {};
            var strings = window.strings;
            if (sectionName && strings) {
                for (var prop in strings) {
                    if (strings.hasOwnProperty(prop)) {
                        if (prop.substr(0, sectionName.length + 1) === sectionName + ".") {
                            var newProp = prop.substr(sectionName.length + 1, prop.length - sectionName.length - 1);
                            ret[newProp] = strings[prop];
                            Log.print(Log.l.u1, newProp + ": " + ret[newProp]);
                        }
                    }
                }
            }
            Log.ret(Log.l.u1);
            return ret;
        }

        /**
         * @function getEmptyDefaultValue
         * @param {Object} defaultValue - An Object wich members should be used as a template. 
         * @global
         * @returns {Object} An object which members are set to default. 
         * @description Returns an object with String and Number members of defaultValue set to "" rsp. 0. 
         */
        _Global.getEmptyDefaultValue = function(defaultValue) {
            var ret = {};
            Log.call(Log.l.u1);
            for (var prop in defaultValue) {
                if (defaultValue.hasOwnProperty(prop)) {
                    var type = typeof defaultValue[prop];
                    if (type === "string") {
                        ret[prop] = "";
                    } else if (type === "number") {
                        ret[prop] = 0;
                    }
                }
            }
            Log.ret(Log.l.u1);
            return ret;
        }

        _Global.bindResource = function(element, resourceName) {
            Log.call(Log.l.u2);
            if (element) {
                element.textContent = getResourceText(resourceName);
            }
            Log.ret(Log.l.u2);
        }

        /** 
         * @function jsonParse
         * @param {string} text - The text to parse. 
         * @global
         * @returns {Object} An JSON object parsed from text or null if the test param is invalid. 
         * @description Use this function to eliminate bad characters before parsing JSON. 
         */
        _Global.jsonParse = function(text) {
            if (text && typeof text === "string") {
                var cleanText = text.replace(/\x1a/g, "?");
                return JSON.parse(cleanText);
            } else {
                return null;
            }
        }

    });


})();



/**
 * Use the methods and properties in this namespace for application control.
 * @namespace Application
 */

// alert box via Flyout
(function () {
    "use strict";

    WinJS.Namespace.define("Application", {
        _alertHandler: null,
        /**
         * @property {function} alertHandler - Read/Write
         * @memberof Application
         * @description Retrieves or sets the handler function for interactive user notification alert box.
         */
        alertHandler: {
            get: function() {
                return Application._alertHandler;
            },
            set: function(aHandler) {
                Application._alertHandler = aHandler;
            }
        },
        _initAlert: function () {
            Log.call(Log.l.trace, "Application.", "");
            var okButton = document.querySelector("#okButton");
            if (okButton) {
                okButton.addEventListener("click", function(event) {
                    Application._closeAlert();
                    if (typeof Application.alertHandler === "function") {
                        Application.alertHandler(true);
                        Application.alertHandler = null;
                    }
                }, false);
            }
            var cancelButton = document.querySelector("#cancelButton");
            if (cancelButton) {
                cancelButton.addEventListener("click", function(event) {
                    Application._closeAlert();
                    if (typeof Application.alertHandler === "function") {
                        Application.alertHandler(false);
                        Application.alertHandler = null;
                    }
                }, false);
            }
            Log.ret(Log.l.trace);
        },
        _closeAlert: function () {
            Log.call(Log.l.trace, "Application.", "");
            var alertFlyout = document.querySelector("#alertFlyout");
            if (alertFlyout && alertFlyout.winControl) {
                var alertText = document.querySelector("#alertText");
                if (alertText) {
                    alertText.textContent = "";
                }
                alertFlyout.winControl.hide();
            }
            Log.ret(Log.l.trace);
        },
        /**
         * @memberof Application
         * @function alert
         * @param {string} text - Message box text
         * @param {function} handler - Handler function(boolean) to be called.
         * @description Implements the alert box functionality. The handler function is called with true value by Ok button of the message box.
         */
        alert: function (text, handler) {
            Log.call(Log.l.trace, "Application.", "text=" + text);
            var alertFlyout = document.querySelector("#alertFlyout");
            if (alertFlyout && alertFlyout.winControl) {
                var alertText = document.querySelector("#alertText");
                if (alertText) {
                    alertText.textContent = text;
                }
                if (alertFlyout.winControl.hidden) {
                    Application.alertHandler = handler;
                    var context = { flyoutOk: getResourceText('flyout.ok') };
                    var cancelButton = document.querySelector("#cancelButton");
                    if (cancelButton && cancelButton.style.display !== "none") {
                        cancelButton.style.display = "none";
                    }
                    var okButton = document.querySelector("#okButton");
                    if (okButton) {
                        WinJS.Binding.processAll(okButton, context);
                        var anchor = (AppBar && AppBar.scope && AppBar.scope.element) ? AppBar.scope.element : document.body;
                        alertFlyout.winControl.show(anchor);
                    }
                }
            }
            Log.ret(Log.l.trace);
        },
        /**
         * @memberof Application
         * @function confirm
         * @param {string} text - Message box text
         * @param {function} handler - Handler function(boolean) to be called.
         * @description Implements the alert box functionality. The handler function is called with true value by Ok and false by the Cancel button of the message box.
         */
        confirm: function (text, handler) {
            Log.call(Log.l.trace, "Application.", "text=" + text);
            var alertFlyout = document.querySelector("#alertFlyout");
            if (alertFlyout && alertFlyout.winControl) {
                var alertText = document.querySelector("#alertText");
                if (alertText) {
                    alertText.textContent = text;
                }
                if (alertFlyout.winControl.hidden) {
                    Application.alertHandler = handler;
                    var context = {
                        flyoutOk: getResourceText('flyout.ok'),
                        flyoutCancel: getResourceText('flyout.cancel')
                    };
                    var cancelButton = document.querySelector("#cancelButton");
                    if (cancelButton && cancelButton.style.display === "none") {
                        cancelButton.style.display = "";
                        WinJS.Binding.processAll(cancelButton, context);
                    }
                    var okButton = document.querySelector("#okButton");
                    if (okButton) {
                        WinJS.Binding.processAll(okButton, context);
                        var anchor = (AppBar && AppBar.scope && AppBar.scope.element) ? AppBar.scope.element : document.body;
                        alertFlyout.winControl.show(anchor);
                    }
                }
            }
            Log.ret(Log.l.trace);
        }
    });
})();

/** 
 * @function alert
 * @param {string} text - Message box text
 * @param {function} handler - Handler function(boolean) to be called.
 * @global
 * @description Overrides the alert box functionality. The handler function is called with true value by Ok button of the message box.
 */
function alert(text, handler) {
    Application.alert(text, handler);
}

/** 
 * @function confirm
 * @param {string} text - Message box text
 * @param {function} handler - Handler function(boolean) to be called.
 * @global
 * @description Overrides the confirm box functionality. The handler function is called with true value by Ok and false by the Cancel button of the message box.
 */
function confirm(text, handler) {
    Application.confirm(text, handler);
}


function getDatum() {
    // current date
    var date = new Date();
    // getMonth() returns an integer between 0 and 11. 0 corresponds to January, 11 to December.
    var month = date.getMonth() + 1;
    var monthStr = month.toString();
    if (month >= 1 && month <= 9) {
        monthStr = "0" + monthStr;
    }
    var day = date.getDate();
    var dayStr = day.toString();
    if (day >= 1 && day <= 9) {
        dayStr = "0" + dayStr;
    }
    var year = date.getFullYear();
    var yearStr = year.toString();
    // string result for date
    return dayStr + "." + monthStr + "." + yearStr;
}


function getClock() {
    // current date
    var date = new Date();
    var hour = date.getHours();
    var hourStr = hour.toString();
    if (hour >= 0 && hour <= 9) {
        hourStr = "0" + hourStr;
    }
    var minute = date.getMinutes();
    var minuteStr = minute.toString();
    if (minute >= 0 && minute <= 9) {
        minuteStr = "0" + minuteStr;
    }
    return hourStr + ":" + minuteStr;
}

/** 
 * @function fireEvent
 * @global
 * @param {string} eventName - Name of event
 * @param {Object} element - A HTML element object
 * @returns {boolean} The return value is true if event is cancelable and at least one of the event handlers which handled this event called event.preventDefault(). Otherwise it returns false.
 * @description Use this function to fire an event of given name to the given element.
 */
function fireEvent(eventName, element) {
    if (!element) {
        element = document;
    }
    // Gecko-style approach (now the standard) takes more work
    var eventClass;

    // Different events have different event classes.
    // If this switch statement can't map an eventName to an eventClass,
    // the event firing is going to fail.
    switch (eventName) {
        case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
        case "mousedown":
        case "mouseup":
            eventClass = "MouseEvents";
            break;

        case "focus":
        case "change":
        case "blur":
        case "select":
            eventClass = "HTMLEvents";
            break;

        default:
            eventClass = "HTMLEvents";
            break;
    }
    // dispatch for firefox + others
    var evt = document.createEvent(eventClass);
    evt.initEvent(event, true, true); // event type,bubbling,cancelable
    return !element.dispatchEvent(evt);
}

/** 
 * @function utf8_encode
 * @global
 * @param {string} argString - Single byte string to encode
 * @returns {string} Encoded string.
 * @description Use this function to encode a single byte string to UTF-8 character set. For further informations read {@link http://locutus.io/php/xml/utf8_encode/ here}.
 */
function utf8_encode(argString) {
    //  discuss at: http://phpjs.org/functions/utf8_encode/ 
    // original by: Webtoolkit.info (http://www.webtoolkit.info/) 
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net) 
    // improved by: sowberry 
    // improved by: Jack 
    // improved by: Yves Sucaet 
    // improved by: kirilloid 
    // bugfixed by: Onno Marsman 
    // bugfixed by: Onno Marsman 
    // bugfixed by: Ulrich 
    // bugfixed by: Rafal Kukawski 
    // bugfixed by: kirilloid 
    //   example 1: utf8_encode('Kevin van Zonneveld'); 
    //   returns 1: 'Kevin van Zonneveld' 


    if (argString === null || typeof argString === 'undefined') {
        return '';
    }


    // .replace(/\r\n/g, "\n").replace(/\r/g, "\n"); 
    var string = (argString + '');
    var utftext = '',
      start, end, stringl = 0;


    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;


        if (c1 < 128) {
            end++;
        } else if (c1 > 127 && c1 < 2048) {
            enc = String.fromCharCode(
              (c1 >> 6) | 192, (c1 & 63) | 128
            );
        } else if ((c1 & 0xF800) !== 0xD800) {
            enc = String.fromCharCode(
              (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        } else {
            // surrogate pairs 
            if ((c1 & 0xFC00) !== 0xD800) {
                throw new RangeError('Unmatched trail surrogate at ' + n);
            }
            var c2 = string.charCodeAt(++n);
            if ((c2 & 0xFC00) !== 0xDC00) {
                throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
            }
            c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
            enc = String.fromCharCode(
              (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.slice(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }


    if (end > start) {
        utftext += string.slice(start, stringl);
    }


    return utftext;
}

/** 
 * @function getSubDocument
 * @global
 * @param {Object} embeddingElement - A HTML element embedding a SVG graphics document
 * @returns {Object} Embedded document.
 * @description Use this function to get access to an embedded SVG graphics document.
 *  For further informations read about {@link https://msdn.microsoft.com/en-us/library/hh772865.aspx getSVGDocument()}
 */
function getSubDocument(embeddingElement) {
    if (embeddingElement.nodeName === "svg" ||
        embeddingElement.nodeName === "SVG") {
        return embeddingElement;
    }
    if (embeddingElement.contentDocument) {
        return embeddingElement.contentDocument;
    } else {
        var subdoc = null;
        try {
            subdoc = embeddingElement.getSVGDocument();
        } catch (e) {
        }
        return subdoc;
    }
}

