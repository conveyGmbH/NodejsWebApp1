/// <reference path="../../lib/WinJS/scripts/base.js" />
/// <reference path="../../lib/convey/scripts/strings.js" />
/// <reference path="../../lib/convey/scripts/logging.js" />
/// <reference path="../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    var successCount = 0;
    var errorCount = 0;
    var timestamp = null;

    var dbEngine = null;
    var results = [];

    var dispatcher = {
        startup: function() {
            Log.call(Log.l.trace, "veranstaltungSelect.");
            dbEngine = AppData.getFormatView("Veranstaltung", 0, false);
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        activity: function () {
            var ret = null;
            Log.call(Log.l.trace, "veranstaltungSelect.");
            if (dbEngine) {
                ret = dbEngine.select(function(json) {
                    results = [];
                    if (json && json.d && json.d.results) {
                        for (var i = 0; i < json.d.results.length; i++) {
                            Log.print(Log.l.info, "[" + i + "]: " + json.d.results[i].Name);
                            results.push(json.d.results[i].Name);
                        }
                    }
                    successCount++;
                    Log.print(Log.l.info, "select success! " + successCount + " success / " + errorCount + " errors");
                    timestamp = new Date();
                }, function(error) {
                    results = [];
                    errorCount++;
                    Log.print(Log.l.error, "select error! " + successCount + " success / " + errorCount + " errors");
                    timestamp = new Date();
                });
            } else {
                Log.Print(Log.l.error, "not initialized!");
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.trace);
            return ret;
        },

        dispose: function() {
            Log.call(Log.l.trace, "veranstaltungSelect.");
            dbEngine = null;
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        //waitTimeMs: 5000,

        info: function () {
            var infoText = successCount + " success / " + errorCount + " errors";
            if (timestamp) {
                infoText += "\n" + timestamp.toLocaleTimeString();
            }
            Log.call(Log.l.trace, "mitarbeiterSelect.");
            for (var i = 0; i < results.length; i++) {
                infoText += "\n" + "[" + i + "]: " + results[i];
            }
            Log.ret(Log.l.trace);
            return infoText;
        }
    };
    module.exports = dispatcher;
})();