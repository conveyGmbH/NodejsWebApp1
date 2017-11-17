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

    var UUID = require("uuid-js");
    var ocrUuid = null;

    var dispatcher = {
        //blub
        startup: function() {
            Log.call(Log.l.trace, "callOcr.");
            var uuid = UUID.create();
            ocrUuid = uuid.toString();
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        activity: function () {
            var ret = null;
            Log.call(Log.l.trace, "callOcr.");
            ret = AppData.call("PRC_STARTCARDOCREX", {
                pAktionStatus: "OCR_START" + ocrUuid
            }, function(json) {
                successCount++;
                Log.print(Log.l.info, "select success! " + successCount + " success / " + errorCount + " errors");
                timestamp = new Date();
            }, function (error) {
                errorCount++;
                Log.print(Log.l.error, "select error! " + successCount + " success / " + errorCount + " errors");
                timestamp = new Date();
            });
            Log.ret(Log.l.trace);
            return ret;
        },

        dispose: function() {
            Log.call(Log.l.trace, "callOcr.");
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        info: function () {
            Log.call(Log.l.trace, "callOcr.");
            var infoText = successCount + " success / " + errorCount + " errors";
            if (timestamp) {
                infoText += "\n" + timestamp.toLocaleTimeString();
            }
            Log.ret(Log.l.trace);
            return infoText;
        }
    };
    module.exports = dispatcher;
})();