/*global location history moment _*/
sap.ui.define([
    "hcm/ux/Teamcalendar/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
], function (BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox
) {
    "use strict";
    return BaseController.extend("hcm.ux.Teamcalendar.controller.CalendarDasboard", {
        onInit: function (oEvent) {
            var oModel = new JSONModel();
            this.getRouter().getRoute("CalendarDasboard").attachPatternMatched(this._onOfferListMatched, this);
        },

        _onOfferListMatched: function (oEvent) {
            this._IsMNG();
            this._initiateModel();
            this._loginRequest()
            this._ExpandcalendarRequest(oEvent);

            var sPath = "/OrgList"
            this._refreshHierarchy(sPath)
        },

        _initiateModel: function () {
            var oViewModel = new JSONModel({
                startDate: new Date(),
                orgEnabled: false,
                aCat: [],

                orgList: {},
                busy: false,
                aSelecteds: [],
                selected: [],
                aOrgehKeys: [],
                orgehAll: [],
                aCheck: [],
                checkBox: false,
                check: 1,
                aIndexesSelectedOrgeh: [],
                selectedPositionList: [],
                queryParameters: {
                    beginDate: moment().subtract(1, 'year').toDate(),
                    endDate: moment().add(1, 'days').toDate(),
                    Orgeh: null,
                    empCheck: null
                },


            });
            this.setModel(oViewModel, "calendarModel");
        },

        _loginRequest: function () {
            try {
                for (var a of this.byId("CBoxCheck").mAggregations.items) {
                    var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle(), num;
                    if( i18n.sLocale == 'en'){
                    a.mProperties.text == 'Ay' ? a.mProperties.text = 'Month' : null
                    }
                }
            } catch (error) { }

            this.byId("CBoxCheck").open()
            this.byId("CBoxCheck").close() 
        },
        _IsMNG: function () {
            var that = this;
            var oModel = this.getModel();
            oModel.callFunction("/CheckManager", {
                method: "GET",
                success: function (oData) {
                    that.getModel("calendarModel").setProperty("/checkFirstReq", false)

                    if (oData.Type == 'S') {
                        that.getModel("calendarModel").setProperty("/orgEnabled", true)
                    } else {
                        that.getModel("calendarModel").setProperty("/orgEnabled", false)
                    }
                },
                error: function () { }
            });
        },


        _refreshHierarchy: function (sPath) {
            var that = this;
            var oViewModel = this.getModel("calendarModel");
            var oModel = this.getView().getModel()
            var oHierarchy = {
                "children": []
            };
            var oUrlParameters = {};
            oViewModel.setProperty(sPath, oHierarchy);
            var _generateHierarchy = function (aHierarchy) {
                var aRooto = _.filter(aHierarchy, "Rooto");

                var _getChild = function (oParent) {
                    var oLine = oParent;
                    oLine.children = [];
                    if (oLine.Otype === "O") {
                        oLine.children = _.filter(aHierarchy, {
                            "Loopc": oParent.Loopc,
                            "Pupsq": oParent.Seqnr
                        });
                    }
                    _.forEach(oLine.children, function (oChild) {
                        if (oChild.Otype === "O") {
                            _getChild(oChild);
                        }
                    });

                    if (oParent.Rooto) {
                        oHierarchy.children.push(oLine);
                    }
                };
                _.forEach(aRooto, function (oRooto) {
                    _getChild(oRooto);
                });
                oViewModel.setProperty(sPath, oHierarchy);
            };

            oModel.read("/TeamCalendarOrganizationSet", {
                method: "GET",
                success: function (oData, oResponse) {
                    oViewModel.setProperty("/orgehAll", oData.results)
                    _generateHierarchy(oData.results);
                },
                error: function (oError) {
                    jQuery.sap.log.error("Manager hierarchy could not be retrieved!");
                }
            });
        },

        onPositionValueRequest: function (oEvent) {
            var oThis = this;
            var oViewModel = this.getModel("calendarModel");

            if (!this._oOrgehSearchDialog) {
                this._oOrgehSearchDialog = sap.ui.xmlfragment("hcm.ux.Teamcalendar.fragment.OrgehSearchDialog", this);
                this.getView().addDependent(this._oOrgehSearchDialog);
            }
            this._oOrgehSearchDialog.open();
            this._oOrgehSearchDialog.setEscapeHandler(function (e) { e.reject(); })
        },

        onPositionRowSelected: function (oEvent) {
            var oContext = oEvent.getParameters("rowContext");
            var oViewModel = this.getModel("calendarModel");
            var aIndexesSelectedOrgeh = [];
            oViewModel.setProperty("/aIndexesSelectedOrgeh", []);
            var oSource = oEvent.getSource();
            var aAllOrgeh = oViewModel.getProperty("/check")
            var oPosition = null;
            try {
                oPosition = oViewModel.getProperty(oContext.rowContext.sPath);

                this._positionHelpTree = oEvent.getSource();

                var sIds = oViewModel.getProperty("/aOrgehKeys");
                sIds.push(oPosition.Objid)

                _.pullAll(sIds, _.remove(sIds, (value, index) => _.includes(sIds, value, index + 1)));
            } catch (oErr) {
            }

        },
        onPositionAdd: function (oEvent) {
            this.getView().setBusyIndicatorDelay(0)
            this.getView().setBusy(true)
            var oViewModel = this.getModel("calendarModel");
            var sOrgeh = null

            var OrgKeys = oViewModel.getProperty("/aOrgehKeys");

            OrgKeys.forEach(keys => {
                if (sOrgeh == null) {
                    sOrgeh = keys
                } else {
                    sOrgeh = sOrgeh + "," + keys
                }
            });
            oViewModel.setProperty("/OrgKeys", sOrgeh)
            if (oViewModel.getProperty("/OrgKeys") == null) {
                this.onCancelPositionAdd(oEvent)
            } else {
                this.startDateChange(sOrgeh)
            }
            this._oOrgehSearchDialog.close();

        },

        fireEvent: function (oEvent) {
            this.getView().setBusyIndicatorDelay(0)
            this.getView().setBusy(true)
            this._ExpandcalendarRequest(oEvent)
        },

        onCancelPositionAdd: function (oEvent) {
            var oViewModel = this.getModel("calendarModel");
            this._oOrgehSearchDialog.close();
            oViewModel.setProperty("/OrgKeys", []);
            oViewModel.setProperty("/aOrgehKeys", []);
            this.startDateChange(oEvent)
            if (this._positionHelpTree) {
                this._positionHelpTree.clearSelection();
                this._positionSelected = null;
            }
        },

        startDateChange: function (e) {
            var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle(), num;

            i18n.sLocale != 'en' ? num = 1 : num = 0
            try {

                var sToday = this.byId("PC1").mProperties.startDate.getDay()
                if (sToday != num) {
                    var d = this.byId("PC1").mProperties.startDate,
                        day = d.getDay();
                    d = new Date(d.setDate(d.getDate() + day + (day == 0 ? -6 : 2)));
                    this.byId("PC1").mProperties.startDate = d
                }

            } catch (error) { }


            var aChk = this.getView().getModel("calendarModel").getProperty("/aCheck")
            switch (true) {

                case e.sId == 'press':
                    this.getView().setBusyIndicatorDelay(0)
                    this._ExpandcalendarRequest(e)
                    break;
                case e.length > 7:
                    this.getView().setBusyIndicatorDelay(0)
                    this._ExpandcalendarRequest(e)
                    break;
                case e.oSource._dateNav._start.getFullYear() != '9999':
                    try {
                        aChk.push(this.byId("PC1")._dateNav['_start'].getFullYear())
                        aChk.length == 3 ? aChk.splice(0, 1) : null
                        if (aChk[1] != aChk[0]) {
                            this._ExpandcalendarRequest(e)
                            this.getView().setBusyIndicatorDelay(0)
                            this.getView().setBusy(true)
                        } else {

                        }
                    } catch (error) {
                        this._ExpandcalendarRequest(e)
                    }
                    break;
                default:
                    this._ExpandcalendarRequest(e)



            }



        },
        _ExpandcalendarRequest: function (oEvent) {
            var oViewModel = this.getView().getModel("calendarModel");
            var that = this;
            var oModel = this.getModel()
            oViewModel.setProperty("/busy", true);
            var empCheckVal = oViewModel.getProperty("/checkBox");
            oViewModel.setProperty("/queryParameters/empCheck", empCheckVal)

            switch (true) {
                //Logged Personel/Manager
                case oEvent.sId == 'patternMatched' || oEvent.sId == 'select' || oEvent.sId == 'press':
                    var sOrgeh = null
                    var sOrgehOld = oViewModel.getProperty("/OrgKeys")
                    try {
                        sOrgehOld.length == 0 ? sOrgehOld = null : sOrgehOld
                    } catch { }
                    sOrgehOld == undefined ? oViewModel.setProperty("/queryParameters/Orgeh", sOrgeh) :
                        oViewModel.setProperty("/queryParameters/Orgeh", sOrgehOld)
                    var queryParam = this.getModel("calendarModel").getProperty("/queryParameters")
                    var aFilters = [new Filter("Orgeh", FilterOperator.EQ, queryParam.Orgeh, "")];
                    aFilters.push(new Filter("Check", FilterOperator.EQ, queryParam.empCheck));
                    aFilters.push(new Filter("Datum", FilterOperator.BT, queryParam.beginDate, queryParam.endDate));
                    break;

                //Manager click back or forward button
                case oEvent != undefined:
                    var queryParam = this.getModel("calendarModel").getProperty("/queryParameters")
                    var sOrgeh = null
                    try { var CheckTimeType = oEvent.oSource._dateNav['_unit'] } catch { }
                    if (oEvent.length > 7) {
                        var begindate = this.getModel("calendarModel").oData.queryParameters.beginDate
                        var endDate

                        switch (true) {
                            case CheckTimeType == 'One Month':
                                endDate = moment(begindate).add(1, 'month')._d
                                break;
                            case CheckTimeType == 'Week':
                                endDate = moment(begindate).add(7, 'days')._d
                                break;
                            case CheckTimeType == 'Day':
                                endDate = moment(begindate).add(1, 'day')._d
                                break;
                            default:
                                endDate = new Date((begindate.getFullYear() + 1) + ' ' +
                                    (begindate.getMonth() + 1) + ' ' + begindate.getDate())
                        }
                    } else {
                        var begindate = oEvent.oSource._oTimesRow.mProperties.startDate
                        switch (true) {
                            case CheckTimeType == 'One Month':
                                endDate = moment(begindate).add(1, 'month')._d
                                break;
                            case CheckTimeType == 'Week':
                                endDate = moment(begindate).add(7, 'days')._d
                                break;
                            case CheckTimeType == 'Day':
                                endDate = moment(begindate).add(14, 'days')._d
                                break;
                            default:
                                endDate = new Date((begindate.getFullYear() + 1) + ' ' + (begindate.getMonth() + 1) + ' ' + begindate.getDate())
                        }

                    }
                    oViewModel.setProperty("/queryParameters/beginDate", begindate)
                    oViewModel.setProperty("/queryParameters/endDate", endDate)
                    var sOrgehOld = oViewModel.getProperty("/OrgKeys")
                    oViewModel.getProperty("/OrgKeys") == undefined ? sOrgeh : oViewModel.setProperty("/queryParameters/Orgeh", sOrgehOld)
                    var aFilters = [new Filter("Orgeh", FilterOperator.EQ, queryParam.Orgeh, "")];
                    aFilters.push(new Filter("Check", FilterOperator.EQ, queryParam.empCheck));
                    aFilters.push(new Filter("Datum", FilterOperator.BT, queryParam.beginDate, queryParam.endDate));
                    break;
                default:
                    var queryParam = this.getModel("calendarModel").getProperty("/queryParameters")
                    var aFilters = [new Filter("Orgeh", FilterOperator.EQ, queryParam.Orgeh, "")];
                    aFilters.push(new Filter("Check", FilterOperator.EQ, queryParam.empCheck));
                    aFilters.push(new Filter("Datum", FilterOperator.BT, queryParam.beginDate, queryParam.endDate));
                    break;
            }
            this.getView().setBusy(true)
            var sExpand = "TeamCalenderLeaveSet";
            oModel.read("/TeamCalendarEmployeeSet", {
                urlParameters: {
                    "$expand": "TeamCalendarLeaveSet",
                },
                filters: aFilters,
                success: function (oData, oResponse) {
                    that._changeSetHoursFormat(oData.results)
                    that.getModel("calendarModel").setProperty("/Category", oData.results);
                    that.getModel("calendarModel").setProperty("/Count", oData.results.length);
                    that.getView().setBusy(false)
                    that._buildData(oData.results);


                },
                error: function (oError) {
                    that.getView().setBusy(false)

                }
            });
        },
        _changeSetHoursFormat: function (e) {
            for (var i of e) {
                var aLeave = i.TeamCalendarLeaveSet.results
                for (var a of aLeave) {
                    a.Endda = new Date(a.Endda.setHours(23, 59, 59, 59))
                }
            }
        },

        leaveType: function (e) {
            var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            if (i18n.sLocale == 'tr')
                if (e == 'AL') {
                    return 'Yıllık izin'
                } else if (e == 'PL') {
                    return 'Planlanan İzin'

                } else if (e == 'CM') {
                    return 'Zorunlu İzin'

                } else {
                    return 'N/A'
                } else {
                if (e == 'AL') {
                    return 'Annual Leave'
                } else if (e == 'PL') {
                    return 'Planned leave'

                }
                else if (e == 'CM') {
                    return 'Compulsory Leave'

                } else {
                    return 'N/A'
                }
            }
        },

        CheckName: function (e) {
            var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            if (i18n.sLocale == 'tr') {
                try {
                    if (e == '') {
                        return 'N/A'
                    } else {
                        return e
                    }
                } catch (error) { }
            } else {
                if (e == '') {
                    return 'N/A'
                } else if (e == 'Çalışan') {
                    return 'Worker'
                } else if (e == 'Unvan') {
                    return 'Title'
                } else {
                    return e
                }

            }

        },

        _buildData(oEvent) {
            var aData = this.getModel("calendarModel").getProperty("/Category")
            var that = this
            var aCat = []
            aData.forEach(i => {
                delete i.__metadata
                var metdel = i.TeamCalendarLeaveSet.results
                try {
                    for (var e = 0; e < metdel.length; e++) {
                        delete metdel[e].__metadata
                        delete metdel[e].Pernr
                    }
                } catch (error) { }
                aCat.push({
                    Ename: i.Ename,
                    Plans: i.Plans,
                    Plans: i.Plstx,
                    LeaveSet: _.cloneDeep(i.TeamCalendarLeaveSet.results),
                }
                )
            });
            this.getModel("calendarModel").setProperty("/PersonSet", aCat)
            this.getView().setBusy(false)

            // if (this.getModel("calendarModel").getProperty("/check") == 1) {
            //     // this.byId("CBoxCheck").open()
            //     // this.byId("CBoxCheck").close()
            //     that.getModel("calendarModel").setProperty("/check", this.getModel("calendarModel").getProperty("/check") - 1)
            // }
        },

        handleAppointmentSelect: function (oEvent) {
            var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var oAppointment = oEvent.getParameter("appointment"),
                aAppointments,
                sValue;
            var oAppointments = oEvent.getParameter("appointments")
            var aText = null
            var oNumber = 0



            function Check(oText) {
                aText = oText
                if (i18n.sLocale == 'tr')
                    if (aText == 'AL') {
                        aText = 'Yıllık izin'
                    } else if (aText == 'PL') {
                        aText = 'Planlanan İzin'

                    }
                    else if (aText == 'CM') {
                        aText = 'Zorunlu İzin'

                    } else {
                        return 'N/A'
                    } else {
                    if (aText == 'AL') {
                        aText = 'Annual Leave'
                    } else if (aText == 'PL') {
                        aText = 'Planned leave'

                    } else if (aText == 'CM') {
                        aText = 'Compulsory Leave'

                    } else {
                        return 'N/A'
                    }
                }

            }




            function mBOx(oText, aText, oNumber) {
                MessageBox.show(`${i18n.sLocale == 'tr' ? 'İzin Türü' : 'Leave Type'}: ` +
                    aText + " \n" + `${i18n.sLocale == 'tr' ? 'Başlangıç' : 'Start'}: ` +
                    oText.startDate.binding.oValue.toLocaleDateString('en-GB', { timeZone: 'UTC' }) + " \n" +
                    `${i18n.sLocale == 'tr' ? 'Bitiş' : 'End'}: ` +
                    oText.endDate.binding.oValue.toLocaleDateString('en-GB', { timeZone: 'UTC' }));
            }



            if (oEvent.mParameters.appointment != undefined) {
                var sText = oEvent.mParameters.appointment.mBindingInfos.text.binding.oValue
                var oText = oEvent.mParameters.appointment.mBindingInfos
                Check(sText)
                mBOx(oText, aText, oNumber)
                oAppointment.setSelected(false)
            } else {

                var oText = oEvent.mParameters.appointments
                for (let i = 0; i < oEvent.mParameters.appointments.length; i++) {
                    sText = oEvent.mParameters.appointments[i].mBindingInfos.text.binding.oValue
                    Check(sText)

                    var aData = oEvent.mParameters.appointments[i].mBindingInfos
                    oNumber = i
                    mBOx(aData, aText, oNumber)
                    oAppointments[i].setSelected(false)

                }

            }


        },

        handleSelectionFinish: function (oEvent) {
            try {

            } catch (error) {

            }
            var aSelectedKeys = oEvent.getSource().getSelectedKeys();
            this.byId("PC1").setBuiltInViews(aSelectedKeys);
        },

    });
});