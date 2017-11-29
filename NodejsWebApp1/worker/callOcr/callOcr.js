/// <reference path="../../lib/WinJS/scripts/base.js" />
/// <reference path="../../lib/convey/scripts/strings.js" />
/// <reference path="../../lib/convey/scripts/logging.js" />
/// <reference path="../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../lib/convey/scripts/dataService.js" />


(function () {
    "use strict";


    var UUID = require("uuid-js");

    var dispatcher = {

        startup: function() {
            Log.call(Log.l.trace, "callOcr.");
            this.successCount = 0;
            this.errorCount = 0;
            this.timestamp = null;
            var uuid = UUID.create();
            this.ocrUuid = uuid.toString();
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        activity: function () {
            var ret = null;
            var that = this;
            Log.call(Log.l.trace, "callOcr.");
            ret = AppData.call("PRC_STARTCARDOCREX", {
                pAktionStatus: "OCR_START" + this.ocrUuid
            }, function(json) {
                that.successCount++;
                Log.print(Log.l.info, "select success! " + that.successCount + " success / " + that.errorCount + " errors");
                that.timestamp = new Date();
            }, function (error) {
                that.errorCount++;
                Log.print(Log.l.error, "select error! " + that.successCount + " success / " + that.errorCount + " errors");
                that.timestamp = new Date();
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
            var infoText = this.successCount + " success / " + this.errorCount + " errors";
            if (timestamp) {
                infoText += "\n" + timestamp.toLocaleTimeString();
            }
            Log.ret(Log.l.trace);
            return infoText;
        }
    };
    module.exports = dispatcher;
})();