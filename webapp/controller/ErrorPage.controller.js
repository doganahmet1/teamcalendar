sap.ui.define([
	"hcm/ux/Teamcalendar/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("hcm.ux.Teamcalendar.controller.ErrorPage", {

		/**
		 * Navigates to the worklist when the link is pressed
		 * @public
		 */
		onLinkPressed: function () {
			this.getRouter().navTo("myovertimerequest");
		}

	});

});