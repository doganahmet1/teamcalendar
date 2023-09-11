sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox"
], function (UI5Object, MessageBox) {
	"use strict";

	return UI5Object.extend("hcm.ux.Teamcalendar.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias hcm.ux.Teamcalendar.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				this._showServiceError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
						"Cannot POST") === 0)) {
					this._showServiceError(oParams.response);
				}
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			var sMsgContent = "";
			var sDetailContent = "";

			if (this._bMessageOpen) {
				return;
			}

			try {
				var oMessageModel = this._oComponent.getModel("messageModel");
				var oMessage = JSON.parse(sDetails.responseText);

				sMsgContent = oMessage.error.message.value;
				sDetailContent = "Hata kodu: " + oMessage.error.code + ", Hata mesajı: " + sMsgContent;
				oMessageModel.setProperty("/messageText", sMsgContent);
				oMessageModel.setProperty("/messageIcon", "sap-icon://error");
				oMessageModel.setProperty("/messageDescription", sDetailContent);
				this._oComponent.getRouter().navTo("errorpage");
			} catch (oEx) {
				this._bMessageOpen = true;
				sMsgContent = this._sErrorText;
				MessageBox.error(
					sMsgContent, {
						id: "serviceErrorMessageBox",
						details: oMessage,
						styleClass: this._oComponent.getContentDensityClass(),
						actions: [MessageBox.Action.CLOSE],
						onClose: function () {
							this._bMessageOpen = false;
						}.bind(this)
					}
				);
			}
		}
	});
});