$.sap.declare("gdt.salesui.data.DataService_Variant");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_Variant = (function($, core, _, helper) {
	var get = function(salesDocumentId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	    		model.read("/VariantSet", {
		            	success: function(data, response) {
		                	defer.resolve(_fixDataDown(data));
		            	},
						error: function(data, response) {
							defer.reject(helper.ParseError(data,"SalesUI could not fetch the Variant from SAP."));
						}
		            });
			}).promise();		
		},
		_fixDataDown = function(dataSet) {
			var columnIds,data,GlobalX;
			var lineItemVariant = [];
		    _.each(dataSet,function(data){
		    	GlobalX = false;
		    	if(data.GlobalX && core.getModel('systemInfo').getProperty('/Uname') != data.Userid) GlobalX=true;
		    	data={
		    		text: data.VariantText,
		    		key : data.VariantId,
		    		global:data.GlobalX,
		    		readonly:GlobalX,
		    		lifecyclePackage:"",
		    		accessoptions:data.VariantId,
		    		layoutColumnIds:data.Columns.split('/'),
		    		columns:data.Columns,
		    		defaultX:data.DefaultX
		    	}
		    	lineItemVariant.push(data);

		    });	
		    
		    core.getModel('lineItemVariant').setData(lineItemVariant);
		return dataSet;	
		},
		_fixDataUp = function(data) {
			
		return data;	
		},

		remove = function(VariantId) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	    		model.remove("/VariantSet(VariantId='" + VariantId + "',Vbtyp='S')", {
		            	success: function(data, response) {
		            		if (response.statusCode >= 200 && response.statusCode <= 299) {
		            			defer.resolve();
		            		} else {
		                		defer.reject(helper.ParseError(data,"SalesUI could not delete the Sales Document from SAP."));
		            		}
		            	},
						error: function(data) {
							defer.reject(helper.ParseError(data,"SalesUI could not delete the Sales Document from SAP."));
						}
		            });
			}).promise();		
		},
		
		update = function(data) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
	    		model.update("/VariantSet(VariantId='" + data.VariantId + "',Vbtyp='S')",data, {
		            	success: function(data, response) {
		            		if (response.statusCode >= 200 && response.statusCode <= 299) {
		            			defer.resolve();
		            		} else {
		                		defer.reject(helper.ParseError(data,"SalesUI could not update the entry."));
		            		}
		            	},
						error: function(data) {
							defer.reject(helper.ParseError(data,"SalesUI could not update the entry."));
						}
		            });
			}).promise();		
		},
		
		
		load = function(id) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				model.read("/VariantSet()", {
	            	success: function(data, response) {
	                	defer.resolve(_fixDataDown(data.results));
	            	},
					error: function(response) {
						defer.reject(helper.ParseError(response, "SalesUI could not fetch Variants from SAP."));
					}
	            });
			}).promise();		
		}; 
			
		create = function(data) {
			return $.Deferred(function(defer) {
				var model = core.getModel();
				_fixDataUp(data);
	    		model.create("/VariantSet", data, {
		            	success: function(data, response) {
		            		if (response.statusCode >= 200 && response.statusCode <= 299) {
		            			defer.resolve(data);
		            		} else {
								defer.reject(helper.ParseError(data,"SalesUI could not create the Variant in SAP."));
		            		}
		            	},
						error: function(data) {
							defer.reject(helper.ParseError(data,"SalesUI could not create the Variant in SAP."));
						},
						async: true
		            });
			}).promise();		
		}; 
	
	return {
	    get: get,
	    load:load,
	    remove: remove,
	    create: create,
	    update:update
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);
