$.sap.declare("gdt.salesui.data.DataService_SalesDocumentAttachments");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_SalesDocumentAttachments = (function($, core, _, helper) {
	var getByForeignKey = function(salesDocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	          	model.read("/SalesDocumentSet(SalesDocumentID='" + salesDocumentId + "')/AttachmentsLink", {
	            	success: function(data, response) {
	                	defer.resolve(data.results);
	            	},
					error: function(data) {
						defer.reject(helper.ParseError(data, "SalesUI Could not fetch the Attachments for Sales Document from SAP."));
					}
	            });
	          	console.log('---docs fetched ---');
			}).promise();		
		}; 
	
	return {
	    getByForeignKey: getByForeignKey,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);