/// <reference path="../../lib/WinJS/scripts/base.js" />
/// <reference path="../../lib/convey/scripts/strings.js" />
/// <reference path="../../lib/convey/scripts/logging.js" />
/// <reference path="../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    var UUID = require("uuid-js");
    var b64js = require("base64-js");

    var dispatcher = {
        startup: function () {
            Log.call(Log.l.trace, "bcrService.");
            this.successCount = 0;
            this.errorCount = 0;
            this.waitTimeMs = 5000;
            this.timestamp = null;

            this._importCardscan_ODataView = AppData.getFormatView("IMPORT_CARDSCAN", 0, false);

            this.results = [];
            var uuid = UUID.create();
            this.ocrUuid = uuid.toString();
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        activity: function() {
            var startOk = false;
            var finishedOk = false;
            var myResult = "";
            var importcardscanid = 0;
            //var cardscanbulkid = 0;
            //var dataImportCardscan = {};
            var that = this;
            var pAktionStatus = "VCARD_START" + this.ocrUuid; //"OCR_START" + this.ocrUuid;

            var ret = AppData.call("PRC_STARTVCARD",
                {
                    pAktionStatus: pAktionStatus
                },
                function(json) {
                    Log.print(Log.l.trace, "PRC_STARTVCARD success!");
                    startOk = true;
                },
                function(error) {
                    that.errorCount++;
                    Log.print(Log.l.error,
                        "PRC_STARTVCARD error! " + that.successCount + " success / " + that.errorCount + " errors");
                    that.timestamp = new Date();
                }).then(function selectimportCardscanODataView() {
                    Log.call(Log.l.trace, "bcrService.", "pAktionStatus=" + pAktionStatus);
                    if (!startOk) {
                        Log.ret(Log.l.trace, "PRC_STARTVCARD failed!");
                        return WinJS.Promise.as();
                    }
                    if (!that._importCardscan_ODataView) {
                        that.errorCount++;
                        that.timestamp = new Date();
                        Log.ret(Log.l.error, "_importCardscan_ODataView not initialized! " + that.successCount + " success / " + that.errorCount + " errors");
                        return WinJS.Promise.as();
                    }
                    Log.ret(Log.l.trace);
                    return that._importCardscan_ODataView.select(function (json) {
                        if (json && json.d && json.d.results && json.d.results.length > 0) {
                            importcardscanid = json.d.results[0].IMPORT_CARDSCANID;
                            Log.print(Log.l.trace, "importcardscanid=" + importcardscanid);
                            var barcode2 = json.d.results[0].Barcode2;
                            if (barcode2) {
                                /*var sub = docContent.search("\r\n\r\n");
                                options.data = b64js.toByteArray(docContent.substr(sub + 4));*/
                                that.myResult = barcode2;
                            }
                        }
                    }, function (error) {
                        that.errorCount++;
                        Log.print(Log.l.error, "select error! " + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                    }, { Button: pAktionStatus });
                });
            return ret;
        },

        dispose: function () {
            Log.call(Log.l.trace, "bcrService.");
            this.dbEngine = null;
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        info: function () {
            Log.call(Log.l.trace, "bcrService.");
            var infoText = this.successCount + " success / " + this.errorCount + " errors";
            if (this.timestamp) {
                infoText += "\n" + this.timestamp.toLocaleTimeString();
            }
            if (this.results) {
                for (var i = 0; i < this.results.length; i++) {
                    infoText += "\n" + "[" + i + "]: " + this.results[i];
                }
            }
            Log.ret(Log.l.trace);
            return infoText;
        }
    };
module.exports = dispatcher;
})();