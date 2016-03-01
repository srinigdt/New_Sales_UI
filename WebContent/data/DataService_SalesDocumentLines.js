$.sap.declare("gdt.salesui.data.DataService_SalesDocumentLines");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_SalesDocumentLines = (function($, core, _, helper) {
	var _fixDataDown = function(row) {
			if (!row) return row;
			row.MaterialID = row.MaterialID.replace(/^0+/, '');
			if (!!row.CreatedOn) row.CreatedOn = new Date(row.CreatedOn.getTime() + (row.CreatedOn.getTimezoneOffset() * 60 * 1000));
			if (!!row.DeliveryDate) row.DeliveryDate = new Date(row.DeliveryDate.getTime() + (row.DeliveryDate.getTimezoneOffset() * 60 * 1000));
			if (!!row.SmartNetBeginDate) row.SmartNetBeginDate = new Date(row.SmartNetBeginDate.getTime() + (row.SmartNetBeginDate.getTimezoneOffset() * 60 * 1000));
			if (!!row.SmartNetEndDate) row.SmartNetEndDate = new Date(row.SmartNetEndDate.getTime() + (row.SmartNetEndDate.getTimezoneOffset() * 60 * 1000));
			if (!!row.SmartNetDuration && parseInt(row.SmartNetDuration) == 0) row.SmartNetDuration = '';
			if (!row.StructuredLineID) row.StructuredLineID = parseInt(row.SalesDocumentLineID) + '.0';

	        if (!row.LastUpdatedOn && row.CreatedOn) {
	        	row.LastUpdatedOn = row.CreatedOn;
	        } else {
	        	row.LastUpdatedOn = new Date(row.LastUpdatedOn.getTime() + (row.LastUpdatedOn.getTimezoneOffset() * 60 * 1000));
	        }
			
			return row;
		},
		getByForeignKey = function(salesDocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
            	model.read("/SalesDocumentSet(SalesDocumentID='" + salesDocumentId + "')/LineItems", {
	            	success: function(data, response) {
	            		_.each(data.results, function (result) { result = _fixDataDown(result);});
	                	defer.resolve(data.results);
	            	},
					error: function(data) {
						defer.reject(helper.ParseError(data, "SalesUI Could not fetch the Details for Sales Document from SAP."));
					}
	            });
			}).promise();		
		}; 
	
	return {
	    getByForeignKey: getByForeignKey,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);