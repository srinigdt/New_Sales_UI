$.sap.declare("gdt.salesui.data.DataService_SendMail");
$.sap.require("gdt.salesui.util.SAPGatewayHelper");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.data.DataService_SendMail = (function($, core, _, helper) {
	var send = function(MailBodyContent) {
			return $.Deferred(function(defer) {
         		var model = core.getModel();
	    		model.callFunction("/SendMail",'POST', {ActionType:'M',MailContent:MailBodyContent},null,
	            	 function(data, response) { //success
	            		if (response.statusCode >= 200 && response.statusCode <= 299) {
	            			defer.resolve(data);
	            		} else {
	            			defer.reject(helper.ParseError(data,"SalesUI fail to Send mail to MasterData Maintenance Team."));
	            		}
	            	},
				      function(data) { //error
						defer.reject(helper.ParseError(data,"SalesUI fail to send mail to MasterData Maintenance Team."));
					},
					true  // Async
	            );
			}).promise();		
		};

		
	return {
		send: send
	};
	
})($,sap.ui.getCore(),_, gdt.salesui.util.SAPGatewayHelper);