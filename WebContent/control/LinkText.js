sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Link",
	"sap/m/Text"
], function (Control,Link,Text) {
	"use strict";
	return Control.extend("gdt.salesui.control.LinkText", {
		metadata : {
			properties : {
				text:   {type : "string", defaultValue : ''},
				visible:{type:"boolean",defaultValue:false}
			},
			aggregations : {
				_link : {type : "sap.m.Link", multiple: false, visibility : "hidden"},
				_text : {type : "sap.m.Text", multiple: false, visibility : "hidden"}	
				           }			
		},
		init : function () {
			    this.setAggregation("_link",
			    	new Link({
			    		text : this.getText(),
			    		visible:!this.getVisible() ,
			    		press:this._handlePOpdf.bind(this)

			    	})
			    		
			    );
			    this.setAggregation("_text",
				    	new Text({
				    		text : this.getText(),
				    		visible:this.getVisible( )
				    	})
				    		
				    );
			    
		},

		setText: function (iValue) {
			this.setProperty("text", iValue, true);
			this.getAggregation("_text").setText(iValue);
			this.getAggregation("_link").setText(iValue);
		},			
		
		setVisible: function (iValue) {
			this.setProperty("visible", iValue, true);
			this.getAggregation("_text").setVisible(iValue);
			this.getAggregation("_link").setVisible(!iValue);
		},			
		
		_handlePOpdf:function(event){
		var contextPropertyVal = this.getText( ).split(' ');
		var POno = contextPropertyVal[3];
		this._doOutput('NEU','P',POno);
//		_doOutput('ZBA5','P',POno);
		},
		
		_doOutput: function(outputType, fileType,salesDocumentID) {
			var salesDocument = sap.ui.getCore().getModel('currentSalesDocument'),
			customerID = salesDocument.getProperty('/CustomerID'),
			shipToID = salesDocument.getProperty('/ShipToID'),
			docCat = salesDocument.getProperty('/DocumentCategory');
			//docCat = view.getModel('currentSalesDocument').getProperty('/DocumentCategory');

		var	sRead = "/PrintDocumentSet(CustomerID='"+customerID+"',DocumentNo='" + salesDocumentID + "',DocCat='" + docCat + "',FileType='"+fileType+"',OutputType='"+outputType+"')/$value";
			 window.open(model.sServiceUrl + sRead );

			},		
		
		
		
		
		
		
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addClass("salesUIiconText");
			oRM.writeClasses();
			oRM.write(">");
			oRM.renderControl(oControl.getAggregation("_link"));
			oRM.renderControl(oControl.getAggregation("_text"));
			oRM.write("</div>");			
		}
	});
});
