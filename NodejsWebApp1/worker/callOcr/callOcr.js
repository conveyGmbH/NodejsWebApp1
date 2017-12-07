/// <reference path="../../lib/WinJS/scripts/base.js" />
/// <reference path="../../lib/convey/scripts/strings.js" />
/// <reference path="../../lib/convey/scripts/logging.js" />
/// <reference path="../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    var subscriptionKey = "a12ee952460d409f9f66d1536dd97318";
    var sourceImageUrl = "http://www.prinux.com/wp-content/uploads/2015/12/4Schriftarten.jpg";
    var uriBase = "https://westeurope.api.cognitive.microsoft.com/vision/v1.0/ocr?language=de";
    var UUID = require("uuid-js");

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

    var myResult = "";
    var importcardscanid = "";

    var dispatcher = {

        startup: function () {
            Log.call(Log.l.trace, "callOcr.");
            this.successCount = 0;
            this.errorCount = 0;
            this.waitTimeMs = 5000;
            this.timestamp = null;
            this.dbEngine = AppData.getFormatView("IMPORT_CARDSCAN", 20507, false);
            this._importCardscanBulk_ODataView = AppData.getFormatView("ImportCardScanBulk", 0, false);
            this.results = [];
            var uuid = UUID.create();
            this.ocrUuid = uuid.toString();
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        activity: function () {
            var ret = null;
            var that = this;
            var pAktionStatus = "OCR_START" + this.ocrUuid; //"OCR_START" + this.ocrUuid;
            Log.call(Log.l.trace, "callOcr.");
            ret = AppData.call("PRC_STARTCARDOCREX", {
                pAktionStatus: pAktionStatus
            }, function (json) {
                that.successCount++;
                Log.print(Log.l.info, "PRC_STARTCARDOCREX success! " + that.successCount + " success / " + that.errorCount + " errors");
                that.timestamp = new Date();
            }, function (error) {
                that.errorCount++;
                Log.print(Log.l.error, "PRC_STARTCARDOCREX error! " + that.successCount + " success / " + that.errorCount + " errors");
                that.timestamp = new Date();
            }).then(function () {
                //return importCardsvanView.select... { Button: pAktionStatus }
                if (that.dbEngine) {
                    ret = that.dbEngine.select(function (json) {
                        that.results = [];
                        if (json && json.d && json.d.results) {
                            for (var i = 0; i < json.d.results.length; i++) {
                                Log.print(Log.l.info, "[" + i + "]: " + json.d.results[i].Name);
                                that.results.push(json.d.results[i]);
                            }
                        }
                        that.successCount++;
                        Log.print(Log.l.info, "select success! " + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                    }, function (error) {
                        that.results = [];
                        that.errorCount++;
                        Log.print(Log.l.error, "select error! " + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                    }, { Button: pAktionStatus });
                } else {
                    Log.Print(Log.l.error, "not initialized!");
                    ret = WinJS.Promise.as();
                }
                return ret;
            }).then(function () {
                //return azure Post...
                return WinJS.xhr(options).then(function (response) {
                    var err;
                    Log.print(Log.l.trace, "success!");
                    try {
                        var obj = response;
                        //console.log(obj);
                        var myresultJson = JSON.parse(response.responseText);
                        if (obj && obj.responseText) {
                            that.successCount++;
                            Log.print(Log.l.info, "select success! " + that.successCount + " success / " + that.errorCount + " errors");
                            that.timestamp = new Date();
                        } else {
                            that.errorCount++;
                            Log.print(Log.l.error, "select error! " + that.successCount + " success / " + that.errorCount + " errors");
                            that.timestamp = new Date();
                            err = { status: 404, statusText: "no data found" };
                        }
                        if (that.results.length > 0 && myresultJson && myresultJson.regions.length > 0) {
                            for (var i = 0; i < myresultJson.regions.length; i++) {
                                for (var j = 0; j < myresultJson.regions[i].lines.length; j++) {
                                    for (var k = 0; k < myresultJson.regions[i].lines[j].words.length; k++) {
                                        var myBoundingBox = myresultJson.regions[i].lines[j].words[k].boundingBox;
                                        var myNewboundingBox = myBoundingBox.split(",");
                                        importcardscanid = parseInt(that.results[0].IMPORT_CARDSCANVIEWID);
                                        var x = parseInt(myNewboundingBox[0]);
                                        var y = parseInt(myNewboundingBox[1]);
                                        var width = parseInt(myNewboundingBox[2]);
                                        var height = parseInt(myNewboundingBox[3]);
                                        var lfHeight = 15;
                                        var text = (myresultJson.regions[i].lines[j].words[k].text);

                                        if (importcardscanid && x && y && width && height && text) {
                                            myResult = myResult + x + "," + y + "," + width + "," + height + "," + lfHeight + "," + text + "\n";
                                        }
                                    }
                                }
                            }
                        }
                        if (myResult) {
                            myResult = myResult.replace(/\n$/, " ");
                        }
                    } catch (exception) {
                        that.errorCount++;
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message) + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                        err = { status: 500, statusText: "data parse error " + (exception && exception.message) };
                    }
                    return WinJS.Promise.as();
                }, function (errorResponse) {
                    that.errorCount++;
                    Log.print(Log.l.error, "error status=" + that.errorResponse.status + " statusText=" + that.errorResponse.statusText);
                    that.timestamp = new Date();
                });
            }).then(function () {
                var dataImportCardscanBulk = {
                    IMPORT_CARDSCANID: importcardscanid,
                    OCRData: myResult
                };
                //return neue insert Tabelle!... 
                if (importcardscanid && myResult && that._importCardscanBulk_ODataView) {
                    ret = that._importCardscanBulk_ODataView.insert(function (json) {
                        Log.print(Log.l.info, "importcardscanBulk insert: success!");
                        if (json && json.d) {
                            Log.print(Log.l.info, "IMPORT_CARDSCANID=" + json.d.IMPORT_CARDSCANID);
                        }
                        that.successCount++;
                        Log.print(Log.l.info, "PRC_STARTCARDOCREX success! " + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                    }, function (error) {
                        that.errorCount++;
                        Log.print(Log.l.error, "select error! " + that.successCount + " success / " + that.errorCount + " errors");
                        that.timestamp = new Date();
                    }, dataImportCardscanBulk);
                }
                return WinJS.Promise.as();
            });
            Log.ret(Log.l.trace);
            return ret;
        },

        dispose: function () {
            Log.call(Log.l.trace, "callOcr.");
            this.dbEngine = null;
            Log.ret(Log.l.trace);
            return WinJS.Promise.as();
        },

        info: function () {
            Log.call(Log.l.trace, "callOcr.");
            var infoText = this.successCount + " success / " + this.errorCount + " errors";
            if (this.timestamp) {
                infoText += "\n" + this.timestamp.toLocaleTimeString();
            }
            Log.call(Log.l.trace, "importCardscanView.select.");
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