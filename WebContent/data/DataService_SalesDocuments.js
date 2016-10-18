$.sap.declare("gdt.salesui.data.DataService_SalesDocuments");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_SalesDocuments = (function($, core, _, helper) {
	var get = function(salesDocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	    		model.read("/SalesDocumentSet(SalesDocumentID='" + salesDocumentId + "')", {
		            	success: function(data, response) {
		                	defer.resolve(_fixDataDown(data));
		            	},
						error: function(data, response) {
							defer.reject(helper.ParseError(data,"SalesUI Could not fetch the Sales Document from SAP."));
						}
		            });
			}).promise();		
		},
		_fixDataDown = function(data) {
			if (!data) return data;
    		if (!data.DocumentCategory) {
            	data.DocumentCategory = 'B';
            }
            
            if (data.WBSElement == '000000000000000000000000') {
            	data.WBSElement = '';
            }
            
            if (data.CartonNotes) data.CartonNotes = data.CartonNotes.replace(/(\r\n|\n|\r)/gm,"");
            
            /* Take care of SAP Date to Timestamp, timezone issue */
            if (data.ValidFrom) data.ValidFrom = new Date(data.ValidFrom.getTime() + (data.ValidFrom.getTimezoneOffset() * 60 * 1000));
            if (data.ValidTo) data.ValidTo = new Date(data.ValidTo.getTime() + (data.ValidTo.getTimezoneOffset() * 60 * 1000));
            if (data.CreatedOn) data.CreatedOn = new Date(data.CreatedOn.getTime() + (data.CreatedOn.getTimezoneOffset() * 60 * 1000));
            if (data.RequestedDeliveryDate) data.RequestedDeliveryDate = new Date(data.RequestedDeliveryDate.getTime() + (data.RequestedDeliveryDate.getTimezoneOffset() * 60 * 1000));

            if (!data.LastChangedOn && data.CreatedOn) {
            	data.LastChangedOn = data.CreatedOn;
            } else {
                data.LastChangedOn = new Date(data.LastChangedOn.getTime() + (data.LastChangedOn.getTimezoneOffset() * 60 * 1000));
            }		                	
			
			return data;
		},
		fixDataUp = function(data) {
			if (!data) return data;

			if (!!data.DeliveryBlock && data.DeliveryBlock == '90') data.DeliveryBlock = "";

			if (data.LineItems) {
				_.each(data.LineItems, function(line) {
					// Due to XML Parse Error at the backend, convert raw numbers to strings: 02/12/16
					line.GDTDiscountPercent      = line.GDTDiscountPercent.toString();
					line.CustomerDiscountPercent = line.CustomerDiscountPercent.toString();
					line.GrossProfitPercentage   = line.GrossProfitPercentage.toString();

					//Due to XML Parse Error at the backend, convert raw numbers to strings: 03/15/16 
					line.ListPrice       = line.ListPrice.toString();
					line.UnitCost        = line.UnitCost.toString();
					line.UnitPrice       = line.UnitPrice.toString();
					line.QTY             = line.QTY.toString();
					line.QtyBilled       = line.QtyBilled.toString();					
					line.ExtendedPrice   = line.ExtendedPrice.toString();
					line.ExtendedCost    = line.ExtendedCost.toString();
					
					if ($.type(line.VendorID) !== "string") {
						if (!line.VendorID || parseInt(line.VendorID) == 0) {
							line.VendorID = '';
						} else {
							line.VendorID = line.VendorID.toString();
						}
					}
					if ($.type(line.SmartNetDuration) !== "string") {
						if (!line.SmartNetDuration || parseInt(line.SmartNetDuration) == 0) {
							line.SmartNetDuration = '';
						} else {
							line.SmartNetDuration = line.SmartNetDuration.toString();
						}
					}
				});
			}
		},
		getByForeignKey = function(customerId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
            	model.read("/CustomerSet(CustomerID='" + customerId + "')/SalesDocuments", {
	            	success: function(data, response) {
	            		_.each(data.results, function (result) { result = _fixDataDown(result);})
	                	defer.resolve(data.results, response);
	            	},
					error: function(data) {
						defer.reject(helper.ParseError(data, "SalesUI Could not fetch the Sales Documents for Customer from SAP."));
					}
	            });
			}).promise();		
		},
		remove = function(salesDocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	    		model.remove("/SalesDocumentSet(SalesDocumentID='" + salesDocumentId + "')", {
		            	success: function(data, response) {
		            		if (response.statusCode >= 200 && response.statusCode <= 299) {
		            			defer.resolve();
		            		} else {
		                		defer.reject(helper.ParseError(data,"SalesUI Could not delete the Sales Document from SAP."));
		            		}
		            	},
						error: function(data) {
							defer.reject(helper.ParseError(data,"SalesUI Could not delete the Sales Document from SAP."));
						}
		            });
			}).promise();		
		},
		
		create = function(salesDocument) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				fixDataUp(salesDocument);
	    		model.create("/SalesDocumentSet", salesDocument, {
		            	success: function(data, response) {
		            		if (response.statusCode >= 200 && response.statusCode <= 299) {
		            			defer.resolve(_fixDataDown(data));
		            		} else {
								defer.reject(helper.ParseError(data,"SalesUI Could not create/update the Sales Document in SAP."));
		            		}
		            	},
						error: function(data) {
							defer.reject(helper.ParseError(data,"SalesUI Could not create/update the Sales Document in SAP."));
						},
						async: true
		            });
			}).promise();		
		}; 
	
	return {
	    get: get,
	    getByForeignKey: getByForeignKey,
	    remove: remove,
	    create: create,
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);
