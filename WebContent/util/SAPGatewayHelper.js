$.sap.declare("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.util.SAPGatewayHelper = (function($, core, _) {
	var ParseError = function(data, message) {
        	var response = null,
	    		error = null,
	    		errordetails = null,
	    		msg = message;
	
	    	if (data) {
	    		
	    		if (($.type(data) === "string")) {
	    			msg += ((!!msg) ? '\n' : '') + data;
	    			return msg;
	    		}
	    		
		    	if (data.response && data.response.body) {
		    		response = $.parseJSON(data.response.body);
		    	} else {
		    		if (data.message) {
		    			msg += ((!!msg) ? '\n' : '') + data.message;
		    		}
		    	}
			}
		
	    	if (response && response.error) {
	    		error = response.error;
	    		if (error.innererror && error.innererror.errordetails && error.innererror.errordetails.length > 0) {
	    			errordetails = error.innererror.errordetails;
	    			for (var i = 0, len = errordetails.length; i < len; i++) {
	    				if (errordetails[i].message && errordetails[i].message.length > 0) {
	    					if (msg.length != 0) msg += '\n';
	    					msg += errordetails[i].message;
	    				}
	    			}
	    		} else { 
	    			if (response.error.message && response.error.message.value) {
	    				msg += ((!!msg) ? '\n' : '') + response.error.message.value;
	    			}
	    		}
			}
	    	
	    	return msg;
    	},
    	
        Pad = function (n, width, z) {
      	  var 	paddingChar = z || '0',
      	  		stringToPad = n + '';
      	  return stringToPad.length >= width ? stringToPad : new Array(width - stringToPad.length + 1).join(paddingChar) + stringToPad;
    	};
    	
    	return {
    		ParseError: ParseError,
    		Pad : Pad,
    	};
    })($,sap.ui.getCore(), _);