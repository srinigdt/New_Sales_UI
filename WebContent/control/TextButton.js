sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Text",
	"sap/m/Button",
], function (Control,Text,Button) {
	"use strict";
	return Control.extend("gdt.salesui.control.TextButton", {
		metadata : {
			properties : {
				text   :   {type : "string", defaultValue : ''},
				vendorName : {type:"string",defaultValue:''},
				visible:{type:"boolean",defaultValue:false}
			},
			aggregations : {
				_text : {type : "sap.m.Text", multiple: false, visibility : "hidden"},
				_button : {type : "sap.m.Button", multiple: false, visibility : "hidden"}
				           }			
		},
		init : function () {
			    this.setAggregation("_text",
				    	new Text({
				    		text :this.getText(),
				    		visible:true
				    	})
				    		
				    );
			    this.setAggregation("_button",
				    	new Button({
				    		icon :"sap-icon://pdf-attachment",
				    		visible:!this.getVisible() ,
				    		press:this._handlePOpdf.bind(this),
				    		type:"Reject",
				    		tooltip:'Click to view/Print Document'

				    	})
				    		
				    );			    			    			    
		},

		setText: function (iValue) {
			var vendor = this.getVendorName();
			this.setProperty("text", iValue, true);
			this.getAggregation("_text").setText(iValue);
		},			

		setVendorName: function (iValue) {
			this.setProperty("vendorName", iValue, true);
			if(iValue.split('-')[1] != " "){
				var text =	this.getText() + ' ( ' + iValue  + ' )' ;	
				this.getAggregation("_text").setText( text);
			} 
			
		},	
		
		setVisible: function (iValue) {
			this.setProperty("visible", iValue, true);
			this.getAggregation("_text").setVisible(true);
			this.getAggregation("_button").setVisible(!iValue);
		},	
		
		setIcon:function(iValue){			
			this.setProperty("icon", iValue, true);
			this.getAggregation("_button").setIcon(!iValue);	
		},
		
	
		_handlePOpdf:function(event){
		var contextPropertyVal = this.getText( ).split(' ');
		var docNo =  contextPropertyVal[3] || contextPropertyVal[2] ;
		var rows  =  sap.ui.getCore().getModel('documentFlow').getData( ).DocumentFlow.results;
		var selectedRow  = _.filter(rows, function(row) { return row.Docnum == docNo ; });
		var pernr = selectedRow[0].Vendor;
		if( selectedRow[0].Doctype == 'V'){
		this._doOutput('NEU','P',docNo,pernr);
		}else if(selectedRow[0].Doctype == 'M'){
		this._doOutput('ZRD1','P',docNo,pernr);	
		}
		},
		
		_doOutput: function(outputType, fileType,salesDocumentID,customerID) {
			var docCat = sap.ui.getCore().getModel('currentSalesDocument').getProperty('/DocumentCategory');
			var rows   =  sap.ui.getCore().getModel('documentFlow').getData( ).DocumentFlow.results;
		    var	sRead  = "/PrintDocumentSet(CustomerID='"+customerID+"',DocumentNo='" + salesDocumentID + "',DocCat='" + docCat + "',FileType='"+fileType+"',OutputType='"+outputType+"')/$value";
			 window.open(model.sServiceUrl + sRead );

			},		
		
		
		
		
		
		
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addClass("salesUITextButton");
			oRM.writeClasses();
			oRM.write(">");			
			oRM.renderControl(oControl.getAggregation("_text"));
			oRM.write("</div>");	
			
			oRM.renderControl(oControl.getAggregation("_button"));			
			
		}
	});
});
