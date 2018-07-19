/// <reference path="../../lib/WinJS/scripts/base.js" />
/// <reference path="../../lib/convey/scripts/strings.js" />
/// <reference path="../../lib/convey/scripts/logging.js" />
/// <reference path="../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    var UUID = require("uuid-js");
    var b64js = require("base64-js");
    //var zlib = require("zlib");
   // var polyfills = require("mdn-polyfills/String.prototype.startsWith");

    var crypto = require("crypto");
    var algorithm = "bf-ecb";
    //public key
    var key = [0xad, 0x00, 0xe0, 0x7b, 0x4b, 0xf0, 0xde, 0x4a];
    //var decipher = crypto.createDecipheriv(algorithm, new Buffer(key), '');
    //decipher.setAutoPadding(false);

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

        activity: function () {
            var startOk = false;
            var finishedOk = false;
            var myResult = "";
            var vCard = "";
            var myvCardResult = "";
            var name = "";

            var nachname = "";
            var vorname = "";
            var weiterename = "";
            var geschlecht = "";

            var companyname = "";

            var poBox = "";
            var extendedAddress = "";
            var street = "";
            var state = "";
            var residence = "";
            var postCode = "";
            var country = "";

            var telefone = "";
            var email = "";
            var url = "";
            var title = "";

            var dataVCard = {};
            var importcardscanid = 0;
            //var cardscanbulkid = 0;
            //var dataImportCardscan = {};
            var that = this;
            var pAktionStatus = "VCARD_START" + this.ocrUuid; //"OCR_START" + this.ocrUuid;

            var ret = AppData.call("PRC_STARTVCARD", {
                pAktionStatus: pAktionStatus
            },
            function (json) {
                Log.print(Log.l.trace, "PRC_STARTVCARD success!");
                startOk = true;
            },
            function (error) {
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
                        importcardscanid = json.d.results[0].IMPORT_CARDSCANVIEWID;
                        Log.print(Log.l.trace, "importcardscanid=" + importcardscanid);
                        var barcode2 = json.d.results[0].Barcode2;
                        if (barcode2) {
                            myResult = barcode2;
                        }
                    }
                    if (myResult.substr(0, "#LSAD01".length) === "#LSAD01") {
                        myResult = myResult.substring("#LSAD01".length, that.myResult.length);
                        console.log(myResult);
                        console.log(new Buffer(myResult, 'base64').toString('binary').length);

                        // decrypt
                        var decipher = crypto.createDecipheriv('bf-ecb', new Buffer(key), '');
                        myResult = decipher.update(myResult, "base64", "base64");
                        // unzip
                        var buffer = new Buffer(myResult, 'base64');
                        return zlib.unzip(buffer, function (err, buffer) {
                            if (!err) {
                                //flag für ist entschlüsselt und unzip
                                dataVCard = buffer.toString();
                                finishedOk = true;
                            } else {
                                finishedOk = false;
                            }
                            return WinJS.Promise.as();
                        });
                    }
                    return WinJS.Promise.as();
                }, function (error) {
                    that.errorCount++;
                    Log.print(Log.l.error, "select error! " + that.successCount + " success / " + that.errorCount + " errors");
                    that.timestamp = new Date();
                }, { Button: pAktionStatus });
            }).then(function unzipResult() {
                Log.call(Log.l.trace, "callBcr.", "dataVCard=" + dataVCard);
                if (myResult && myResult.substr(0, "#LSAD00".length) === "#LSAD00") {
                    myResult = myResult.substring(7, myResult.length);
                    var buffer = new Buffer(myResult, 'base64');
                    Log.ret(Log.l.trace);
                    return zlib.unzip(buffer,
                        function(err, buffer) {
                            if (!err) {
                                //flag für ist unzip
                                dataVCard = buffer.toString();
                                finishedOk = true;

                            } else {
                                finishedOk = false;
                            }
                            return WinJS.Promise.as();
                        });
                } else {
                    Log.ret(Log.l.trace);
                    return WinJS.Promise.as();
                }
            }).then(function updateImportCardscan() {
                Log.call(Log.l.trace, "callBcr.", "dataVCard=" + dataVCard);

                var tagVcard = "BEGIN:VCARD";
                var tagVersion3 = "VERSION:3.0";
                var tagVersion4 = "VERSION:4.0";

                var tagName = "N:";
                var tagformatedName = "FN:";
                var tagOrganisation = "ORG:";
                var tagAddress = "ADR:";
                var tagTelefone = "TEL:";
                var tagTeleFax = "TEL;TYPE=FAX";
                var tagEmail = "EMAIL:";
                var tagXGender = "X-GENDER:";
                var tagTitle = "TITLE:";
                var tagUrl = "URL:";
                //var tagXrefcode
                if (dataVCard) {
                    var splittedData = dataVCard.split("\n");
                    for (var i = 0; i < splittedData.length; i++) {
                        //row data
                        var rowData = splittedData[i].split(":");
                        //split ;
                        var tmp = rowData[1].split(";");
                        switch (rowData[0] + ":") {
                            case tagName:
                                name = rowData[1];
                                nachname = tmp[0];
                                vorname = tmp[1];
                                weiterename = tmp[2];
                                geschlecht = tmp[3];
                                break;

                            case tagformatedName:
                                // formatierte Name
                                //ignore
                                //rowData[1]
                                break;
                            case tagOrganisation:
                                companyname = rowData[1];
                                break;
                            case tagAddress:
                                //rowData[1]
                                poBox = tmp[0];
                                extendedAddress = tmp[1];
                                street = tmp[2];
                                residence = tmp[3];
                                state = tmp[4];
                                postCode = tmp[5];
                                country = tmp[6];
                                break;
                            case tagTelefone:
                                telefone = rowData[1];
                                break;
                            case tagTeleFax:
                                email = rowData[1];
                                break;
                            case tagEmail:
                                email = rowData[1];
                                break;
                            case tagXGender:
                                //rowData[1]
                                break;
                            case tagTitle:
                                title = rowData[1];
                                break;
                            case tagUrl:
                                url = rowData[1];
                                break;
                            default:
                        }
                    }
                }
                var dataImportCardscanVcard = {
                    FIRSTNAME: vorname,
                    LASTNAME: nachname,
                    TITLE: title,
                    COMPANY: companyname,
                    STREETADDRESS: street,
                    CITY: residence,
                    STATE: state,
                    POSTALCODE: postCode,
                    COUNTRY: country,
                    PHONE: telefone,
                    FAX: telefone,
                    EMAIL: email,
                    WEBSITE: url,
                    MOBILEPHONE: telefone
                }; //that.myvCardResult
                //Log.print(Log.l.info, "dataImportCardscanVcard=" + that.myvCardResult);
                if (!importcardscanid) {
                    Log.ret(Log.l.trace, "no record found!");
                    return WinJS.Promise.as();
                }
                if (dataImportCardscanVcard !== {}) {
                    pAktionStatus = "OCR_DONE";
                } else {
                    pAktionStatus = "OCR_ERROR";
                }
                dataImportCardscanVcard.Button = pAktionStatus;
                dataImportCardscanVcard.SCANTS = null;
                Log.ret(Log.l.trace);
                return that._importCardscan_ODataView.update(function (json) {
                    that.successCount++;
                    Log.print(Log.l.info, "_importCardscan_ODataView update: success! " + that.successCount + " success / " + that.errorCount + " errors");
                    that.timestamp = new Date();
                }, function (error) {
                    that.errorCount++;
                    Log.print(Log.l.error, "_importCardscan_ODataView error! " + that.successCount + " success / " + that.errorCount + " errors");
                    that.timestamp = new Date();
                }, importcardscanid, dataImportCardscanVcard);
                //return WinJS.Promise.as();
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