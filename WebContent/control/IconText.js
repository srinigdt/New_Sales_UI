sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Link",
	"sap/m/Text"
], function (Control,Link,Text) {
	"use strict";
	return Control.extend("gdt.salesui.control.IconText", {
		metadata : {
			properties : {
				linkText: 	{type : "string", defaultValue : ''},
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
			    		text : this.getlinkText(),
			    		visible:this.getvisible(),
			    		press:this._handlePOpdf.bind(this)

			    	})
			    		
			    );
			    this.setAggregation("_text",
				    	new Text({
				    		text : this.getText(),
				    		visible:!this.getvisible( )
				    	})
				    		
				    );
			    
		},
		setLinkText: function (iValue) {
			this.setProperty("linkText", iValue, true);
			this.getAggregation("_link").setText(iValue);
		},	


		setText: function (iValue) {
			this.setProperty("text", iValue, true);
			this.getAggregation("_text").setText(iValue);
		},			
		
		setVisible: function (iValue) {
			this.setProperty("visible", iValue, true);
			this.getAggregation("_text").setVisible(iValue);
			this.getAggregation("_link").setVisible(iValue);
		},			
		
		_handlePOpdf:function(event){
			
			
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
