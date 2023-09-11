/*global _*/
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/Dialog",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (Controller,
	Dialog,
	MessageBox, MessageToast) {
	"use strict";

	return Controller.extend("hcm.ux.Teamcalendar.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getText: function (sTextCode, aParam) {
			var aTextParam = aParam;
			if (!aTextParam) {
				aTextParam = [];
			}
			return this.getResourceBundle().getText(sTextCode, aTextParam);
		},

		openBusyFragment: function (sTextCode, aMessageParameters) {
			var oDialog = this._getBusyFragment();

			if (sTextCode) {
				oDialog.setText(this.getText(sTextCode, aMessageParameters));
			} else {
				oDialog.setText(this.getText("PLEASE_WAIT"));
			}

			oDialog.open();
		},
		getConfirmDialog: function (sTitle, sState, oContent, oBeginButtonProp, oEndButtonProp) {
			var oEndButton;
			var oBeginButton;
			var oDialog;

			if (oEndButtonProp) {
				oEndButton = new sap.m.Button({
					text: oEndButtonProp.text,
					type: oEndButtonProp.type,
					icon: oEndButtonProp.icon,
					press: function () {
						oDialog.close();
						oEndButtonProp.onPressed();
					}
				});
			} else {
				oEndButton = new sap.m.Button({
					text: "{i18n>CANCEL_ACTION}",
					press: function () {
						oDialog.close();
					}
				});
			}

			oBeginButton = new sap.m.Button({
				text: oBeginButtonProp.text,
				type: oBeginButtonProp.type,
				icon: oBeginButtonProp.icon,
				press: function () {
					oDialog.close();
					oBeginButtonProp.onPressed();
				}
			});

			oDialog = new Dialog({
				title: sTitle,
				state: sState,
				content: oContent,
				beginButton: oBeginButton,
				endButton: oEndButton,
				afterClose: function () {
					oDialog.destroy();
				},
				escapeHandler: function (oPromise) {
					oPromise.reject();
				}
			});
			this.getView().addDependent(oDialog);
			return oDialog;
		},

		getConfirmDialog: function (sTitle, sState, oContent, oBeginButtonProp, oEndButtonProp) {
			var oEndButton;
			var oBeginButton;
			var oDialog;

			if (oEndButtonProp) {
				oEndButton = new sap.m.Button({
					text: oEndButtonProp.text,
					type: oEndButtonProp.type,
					icon: oEndButtonProp.icon,
					press: function () {
						oDialog.close();
						oEndButtonProp.onPressed();
					}
				});
			} else {
				oEndButton = new sap.m.Button({
					text: "{i18n>CANCEL_ACTION}",
					press: function () {
						oDialog.close();
					}
				});
			}

			oBeginButton = new sap.m.Button({
				text: oBeginButtonProp.text,
				type: oBeginButtonProp.type,
				icon: oBeginButtonProp.icon,
				press: function () {
					oDialog.close();
					oBeginButtonProp.onPressed();
				}
			});

			oDialog = new Dialog({
				title: sTitle,
				state: sState,
				content: oContent,
				beginButton: oBeginButton,
				endButton: oEndButton,
				afterClose: function () {
					oDialog.destroy();
				},
				escapeHandler: function (oPromise) {
					oPromise.reject();
				}
			});
			this.getView().addDependent(oDialog);
			return oDialog;
		},
		alertMessage: function (sType, sTitle, sMessage, aParam) {
			var sIcon = sap.m.MessageBox.Icon.NONE;
			switch (sType) {
				case "W":
					sIcon = MessageBox.Icon.WARNING;
					break;
				case "E":
					sIcon = MessageBox.Icon.ERROR;
					break;
				case "S":
					sIcon = MessageBox.Icon.SUCCESS;
					break;
				case "I":
					sIcon = MessageBox.Icon.INFORMATION;
					break;
				default:
					sIcon = MessageBox.Icon.NONE;
			}

			MessageBox.show(this.getText(sMessage, aParam), {
				icon: sIcon, // default
				title: this.getText(sTitle), // default
				actions: sap.m.MessageBox.Action.OK // default
			});
		},
		closeBusyFragment: function () {
			var oDialog = this._getBusyFragment();
			oDialog.close();
		},

		_getBusyFragment: function () {
			if (!this._oBusyDialog) {
				this._oBusyDialog = sap.ui.xmlfragment("hcm.ux.Teamcalendar.fragment.GenericBusyDialog", this);
				this.getView().addDependent(this.oBusyDialog);
			} else {
				this._oBusyDialog.close();
			}

			return this._oBusyDialog;
		},

		addHistoryEntry: (function () {
			var aHistoryEntries = [];

			return function (oEntry, bReset) {
				if (bReset) {
					aHistoryEntries = [];
				}

				var bInHistory = aHistoryEntries.some(function (entry) {
					return entry.intent === oEntry.intent;
				});

				if (!bInHistory) {
					aHistoryEntries.push(oEntry);
					this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
						oService.setHierarchy(aHistoryEntries);
					});
				}
			};
		})()
	});

});