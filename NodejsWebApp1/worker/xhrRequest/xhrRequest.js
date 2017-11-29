/// <reference path="../../lib/WinJS/scripts/base.js" />
/// <reference path="../../lib/convey/scripts/strings.js" />
/// <reference path="../../lib/convey/scripts/logging.js" />
/// <reference path="../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../lib/convey/scripts/dataService.js" />


(function () {
    "use strict";
    var subscriptionKey = "a12ee952460d409f9f66d1536dd97318";
    var sourceImageUrl = "http://www.fxencore.de/gallery/tuts/steps/stepid_4_tutid_122_userid_3_text_pfad_6.jpg";
    var uriBase = "https://westeurope.api.cognitive.microsoft.com/vision/v1.0/ocr";

    var imageRecord = {
        url: sourceImageUrl
    };

    var options = {
        type: "POST",
        url: uriBase,
        data: JSON.stringify(imageRecord),
        headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": subscriptionKey
        }
    };

    // Set up the request
    var dispatcher = {
        startup: function () {
            Log.call(Log.l.trace, "xhrRequest.");
            this.timestamp = null;
            this.successCount = 0;
            this.errorCount = 0;
            this.waitTimeMs = 20000;

            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        activity: function () {
            Log.print(Log.l.info, "calling xhr method=POST url=" + sourceImageUrl);
            var that = this;
            return WinJS.xhr(options).then(function (response) {
                var err;
                Log.print(Log.l.trace, "success!");
                try {
                    var obj = response;
                    var myresultJson = JSON.parse(response.responseText);
                    if (obj && obj.responseText) {
                        that.successCount++;
                        Log.print(Log.l.info, "select success! " + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                        complete(obj);
                    } else {
                        that.errorCount++;
                        Log.print(Log.l.error, "select error! " + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                        err = { status: 404, statusText: "no data found" };
                        error(err);
                    }
                } catch (exception) {
                    that.errorCount++;
                    Log.print(Log.l.error, "resource parse error " + (exception && exception.message) + that.successCount + " success / " + that.errorCount + " errors");
                    that.timestamp = new Date();
                    err = { status: 500, statusText: "data parse error " + (exception && exception.message) };
                    error(err);
                }
                return WinJS.Promise.as();
            }, function (errorResponse) {
                that.errorCount++;
                Log.print(Log.l.error, "error status=" + that.errorResponse.status + " statusText=" + that.errorResponse.statusText);
                that.timestamp = new Date();
                error(errorResponse);
            });
        },

        dispose: function () {
            Log.call(Log.l.trace, "xhrRequest.");
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        info: function () {
            Log.call(Log.l.trace, "xhrRequest.");
            var infoText = this.successCount + " success / " + this.errorCount + " errors";
            if (this.timestamp) {
                infoText += "\n" + this.timestamp.toLocaleTimeString();
            }
            Log.ret(Log.l.trace);
            return infoText;
        }
    };
    module.exports = dispatcher;
})();