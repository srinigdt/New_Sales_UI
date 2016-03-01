sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Image",
	"sap/m/Text"
], function (Control,Image,Text) {
	"use strict";
	return Control.extend("gdt.salesui.control.IconText", {
		metadata : {
			properties : {
				src1: 	{type : "string", defaultValue : ''},
				src2: 	{type : "string", defaultValue : ''},
				text:   {type : "string", defaultValue : ''}
			},
			aggregations : {
				_icon1 : {type : "sap.m.Image", multiple: false, visibility : "hidden"},
				_icon2 : {type : "sap.m.Image", multiple: false, visibility : "hidden"},
				_text : {type : "sap.m.Text", multiple: false, visibility : "hidden"}	
				           }			
		},
		init : function () {
			    this.setAggregation("_icon1",
			    	new Image({
			    		src : this.getSrc1(),
			    		width:"25px",
			    		 class:"size1"
			    	})
			    		
			    );
			    this.setAggregation("_icon2",
				    	new Image({
				    		src : this.getSrc2(),
				    		width:"20px",
				    		 class:"size1"
				    	})
				    		
				    );
			    this.setAggregation("_text",
				    	new Text({
				    		text : this.getText()				    		
				    	})
				    		
				    );
			    
		},
		setSrc1: function (iValue) {
			this.setProperty("src1", iValue, true);
			this.getAggregation("_icon1").setSrc(iValue);
		},	

		setSrc2: function (iValue) {
			this.setProperty("src2", iValue, true);
			this.getAggregation("_icon2").setSrc(iValue);
		},	
		setText: function (iValue) {
			this.setProperty("text", iValue, true);
			this.getAggregation("_text").setText(iValue);
		},			
		
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addClass("salesUIiconText");
			oRM.writeClasses();
			oRM.write(">");
			oRM.renderControl(oControl.getAggregation("_icon1"));
			oRM.renderControl(oControl.getAggregation("_icon2"));
			oRM.renderControl(oControl.getAggregation("_text"));
			oRM.write("</div>");			
		}
	});
});

//sap.ui.core.Icon
//sap.m.Text