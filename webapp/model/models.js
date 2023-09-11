sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createGlobalOverTimeRequestModel: function () {
			var oModel = new JSONModel({
				busy: false,
				currentOverTimeRequest: null,
				currentPersonList: null,
				currentSelectedPersonList: null,
				overTimeRequestData: [],
				tableTitle: "",
				minSelectableDate: null,
				overTimeStatusLegend: [{
					"Status": "NEW",
					"Icon": "sap-icon://write-new",
					"Color": "#6c757d",
					"Text": "OVER_TIME_STATUS_NEW"
				}]
			});

			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		},
		createFLPModel: function () {
			var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
				bIsShareInJamActive = fnGetUser ? fnGetUser().isJamActive() : false,
				oModel = new JSONModel({
					isShareInJamActive: bIsShareInJamActive
				});
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}
	};
});