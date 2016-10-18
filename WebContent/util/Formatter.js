jQuery.sap.declare("gdt.salesui.util.Formatter");

$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");
$.sap.require("sap.ui.core.format.DateFormat");

gdt.salesui.util.Formatter = (function($, core, _) {

    var _statusStateMap = {
        // "O" : "Warning",
        // "S" : "Warning",
        // "B" : "Warning",
        // "C" : "Success",
        "P" : "Success",
        "N" : "Warning",

    },

	stripZeros = function(value) {
		return parseInt(value, 10).toString();
	},

	docFlowVisibility = function(value) {
		if( parseInt(value) == 0 && core.getModel('currentSalesDocument').getProperty('/ReferencedBy') == "" ){
			return false;
			}else{
				return true;
				}
	},	

	pdfButtonVisibility = function(value) {
		
		if (value =='V' || value =='M'){
			return false;
		}else{
			return true;
		}
		
	},
	
	SoAvailableQtyVisibility=function(value){
		if( value == true && parseInt(core.getModel('currentSalesDocument').getProperty('/SalesDocumentID') ) != 0 )
			return true;
		    return false;
			
	},
	
	isRejected=function(value){
	if(value != '') return 'Yes' ;
	return value;	
	},
	
	PoSupplement=function(value){
		if(value == 'Z000') return true;
		return false;
	},
	
	isEditableOnItemCategory=function(value){
		if(value == 'YTAO' || value == 'ZTAO' || value == 'ZPFS') return false;
	return true;	
	},
	
	totalitems = function(value) {
	return 2;	
		
	},
	
    statusText = function(value) {
	    var core = sap.ui.getCore(),
	    	bundle = core.getModel("i18n").getResourceBundle();
	    // return bundle.getText("StatusText" + value, "?");
	    return bundle.getText("StatusText" + value, "?");
    },
    
    mfrName = function(value) {
	    var core = sap.ui.getCore(),
    		mfrs = core.getModel("globalSelectItems").getProperty("/Manufacturers") || [],
    		mfr = $.grep(mfrs, function(n, i){
    				return n.ManufacturerID && n.ManufacturerID == value;
    			});
    	
    	return (mfr[0] && mfr[0].ManufacturerName) ? mfr[0].ManufacturerName : ((value == 0) ? '' : value);
    },
    
    vdrName = function(value) {
	    var core = sap.ui.getCore(),
    		vdrs = core.getModel("globalSelectItems").getProperty("/Vendors") || [],
    		vdr = $.grep(vdrs, function(n, i){
    				return n.ManufacturerID && n.ManufacturerID == value;
    			});
    	
    	return (vdr[0] && vdr[0].ManufacturerName) ? vdr[0].ManufacturerName : ((value == 0) ? '' : value);
    },

	_concatPartnerInfo = function(partner) {
		var retVal;

		retVal = (!!partner.PartnerID) ? ('' + parseInt(partner.PartnerID, 10) + ' - ') : '';
		retVal += (!!partner.PartnerName) ? '' + partner.PartnerName : '';
		retVal += (!!partner.Street) ? ', ' + partner.Street : '';
		retVal += (!!partner.Street2) ? ', ' + partner.Street2 : '';
		retVal += (!!partner.Street3) ? ', ' + partner.Street3 : '';
		retVal += (!!partner.Street4) ? ', ' + partner.Street4 : '';
		retVal += (!!partner.City) ? ', ' + partner.City : '';
		retVal += (!!partner.State) ? ', ' + partner.State : '';
		retVal += (!!partner.Zip) ? ', ' + partner.Zip : '';
		retVal += (!!partner.Country) ? ', ' + partner.Country : '';

		return retVal;
	},
    
    shipTo = function(value) {
	    var core = sap.ui.getCore(),
    		partners = core.getModel("customerSelectItems").getProperty("/ShipTos") || [],
    		partner = $.grep(partners, function(n, i){
    				return n.PartnerID && n.PartnerID == value;
    			});

    	return (!!partner[0]) ? _concatPartnerInfo(partner[0]) : ((value == 'ONETIME') ? 'Auto Generated (See VIA)' : '' );
    },
    
    billTo = function(value) {
	    var core = sap.ui.getCore(),
    		partners = core.getModel("customerSelectItems").getProperty("/BillTos") || [],
    		partner = $.grep(partners, function(n, i){
    				return n.PartnerID && n.PartnerID == value;
    			});
	    
		return (!!partner[0]) ? _concatPartnerInfo(partner[0]) : '';
    },
    
    payer = function(value) {
	    var core = sap.ui.getCore(),
    		partners = core.getModel("customerSelectItems").getProperty("/Payers") || [],
    		partner = $.grep(partners, function(n, i){
    				return n.PartnerID && n.PartnerID == value;
    			});


		return (!!partner[0]) ? _concatPartnerInfo(partner[0]) : '';
	},
    
    endCustomer = function(value) {
	    var core = sap.ui.getCore(),
    		partners = core.getModel("customerSelectItems").getProperty("/EndCustomers") || [],
    		partner = $.grep(partners, function(n, i){
    				return n.PartnerID && n.PartnerID == value;
    			});

		return (!!partner[0]) ? _concatPartnerInfo(partner[0]) : '';
    },

	canEdit = function(v1, v2) {
		return (!!v1 && !v2);
	},
    
    isEnabled = function (value) {
    	return  (value) ? '#F0AB00' : 'black';
    },

	via = function(value) {

		return (!!value && (!!value.OTSTName || !!value.OTSTCity || !!value.OTSTStreet || !!value.OTSTState || !!value.OTSTZip)) ? value.OTSTName + " - " + value.OTSTCity : 'Add Via ...';
	},

	viatt = function(value) {

		var out = (!!value && (!!value.OTSTName || !!value.OTSTCity || !!value.OTSTStreet || !!value.OTSTState || !!value.OTSTZip)) ? value.OTSTName + ", " + value.OTSTStreet + ((!!value.OTSTStreet2) ? ", " + value.OTSTStreet2 : "") + ((!!value.OTSTStreet3) ? ", " + value.OTSTStreet3 : "") + ", " + value.OTSTCity + ((!!value.OTSTState) ? ", " + value.OTSTState  : "") + ((!!value.OTSTZip) ? ", " + value.OTSTZip : "") + ((!!value.OTSTCountry) ?  ", " + value.OTSTCountry : "") : null;
        return out;
	},

	viaColor = function(value) {
		// Just use OTSTZip to change the color of Addvia button to blue
		//return (value && (!!value.OTSTAddressID || !!value.OTSTName || !!value.OTSTCity || !!value.OTSTStreet || !!value.OTSTState || !!value.OTSTZip)) ? "Emphasized" : "Default";
		return (value && (!!value.OTSTZip)) ? "Emphasized" : "Default";
	},
	
	rejectionDescription = function(value) {
		var reason = (!!value) ? _.findWhere(sap.ui.getCore().getModel('rejectionReasons').getData(), {ReasonCode : value}) : null;

		return (!!reason) ? 'Rejected: ' + reason.Description : 'Submitted';
	},


	itemCategoryToStaging = function(value) {
    	var retVal = false;
    	
    	if (!value) return retVal;
    	
    	switch (value) {
    		case 'ZBAC':
    		case 'YBAC':
    		case 'ZHBC':
    			retVal = true;
    			break;
    		default :
    			break;
    	}
	    return retVal;
    },

    itemCategoryToDropShip = function(value) {
    	var retVal = false;
    	
    	if (!value) return retVal;
    	
    	switch (value) {
    		case 'ZB1':
    		case 'YB1':
    		case 'ZA1':
    			retVal = true;
    			break;
    		case 'YA1':		
    		case 'ZHDS':
    			retVal = true;
    			break;
    		default :
    			break;
    	}
	    return retVal;
    },

    statusState = function(value) {
	    var map = gdt.salesui.util.Formatter._statusStateMap;
	    return (value && map[value]) ? map[value] : "None";
    },

    date = function(value) {
	    if (value) {
		    var oDateFormat = sap.ui.core.format.DateFormat
		            .getDateTimeInstance({
			            pattern : "yyyy-MM-dd"
		            });
		    return oDateFormat.format(new Date(value));
	    }

	    return value;
    },
    
    isOdd = function(value) {
    	return (value == parseFloat(value)) && !!(value % 2);
    },

    isEven = function(value) {
    	return (value == parseFloat(value)) && !(value % 2);
    },

    isNotNull = function(value) {
    	return (value) ? (value != null) : false;
    },

    not = function(value) {
    	return !value;
    },

    isNull = function(value) {
    	return (value) ? (value == null) : true;
    },

    blockText = function(value) {
    	if (!value) return 'Enabled';
    	return 'Blocked';
    },

    blockButtonType = function(value) {
    	if (!value) return 'Accept';
    	return 'Reject';
    },
    
    customerpts = function(line) {
    	var data = line, n = 0, s = 0, i = 0, c = 2, d = '.', t = ',', j = 0;
    	
    	if (!data || !data.ListPrice || !data.CustomerDiscount) return 0;
    	
    	n = ((Math.abs(data.CustomerDiscount)*100)/data.ListPrice);
    	
    	s = n < 0 ? "-" : "";
    	i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "";
    	j = (j = i.length) > 3 ? j % 3 : 0;
    	
    	return s + (j ? i.substr(0, j) + t : "")
        + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t)
        + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    	//return data.CustomerDiscount; //Venkat
    },
    
    qty = function(value) {
    	return parseFloat(value);
    },

    money = function(n) {
	    var c = 2, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math
	            .abs(+n || 0).toFixed(c))
	            + "", j = (j = i.length) > 3 ? j % 3 : 0;
	    return "$ " + s + (j ? i.substr(0, j) + t : "")
	            + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t)
	            + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    },

    moneyNoDollar = function(n) {
	    var c = 2, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math
	            .abs(+n || 0).toFixed(c))
	            + "", j = (j = i.length) > 3 ? j % 3 : 0;
	    return  s + (j ? i.substr(0, j) + t : "")
	            + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t)
	            + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    },

    moneyNoDecimals = function(n) {
	    var c = 0, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math
	            .abs(+n || 0).toFixed(c))
	            + "", j = (j = i.length) > 3 ? j % 3 : 0;
	    return "$ " + s + (j ? i.substr(0, j) + t : "")
	            + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t)
	            + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    },

    percent = function(n) {
	    var c = 2, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math
	            .abs(+n || 0).toFixed(c))
	            + "", j = (j = i.length) > 3 ? j % 3 : 0;
	    return s + (j ? i.substr(0, j) + t : "")
	            + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t)
	            + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") + "%";
    },

    percentNoSign = function(n) {
	    var c = 2, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math
	            .abs(+n || 0).toFixed(c))
	            + "", j = (j = i.length) > 3 ? j % 3 : 0;
	    return s + (j ? i.substr(0, j) + t : "")
	            + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t)
	            + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    },

    documentCategory = function(value) {
	    if (!value) return '';
	    if (value.toUpperCase() === 'B') return 'Quote';
	    return 'Sales Order';
    },

    date = function(value) {
	    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
		    pattern : "MM/dd/yyyy"
	    });
	    if (!value) return '';
	    return dateFormat.format(new Date(value));
    },

    quantity = function(value) {
	    try {
		    return (value) ? parseFloat(value).toFixed(0) : value;
	    } catch (err) {
		    return "Not-A-Number";
	    }
    };

	statusText = function(value) {
		var core = sap.ui.getCore(),
			bundle = core.getModel("i18n").getResourceBundle();
		// return bundle.getText("StatusText" + value, "?");
		return bundle.getText("StatusText" + value, "?");
	};

		return {
			mfrName: mfrName,
			vdrName: vdrName,
			shipTo: shipTo,
			billTo: billTo,
			payer: payer,
			endCustomer: endCustomer,
			canEdit: canEdit,
			isEnabled: isEnabled,
			via: via,
            viatt: viatt,
			viaColor: viaColor,
			rejectionDescription: rejectionDescription,
			itemCategoryToStaging: itemCategoryToStaging,
			itemCategoryToDropShip: itemCategoryToDropShip,
			statusState: statusState,
			date: date,
			isOdd: isOdd,
			isEven: isEven,
			isNotNull: isNotNull,
			not: not,
			isNull: isNull,
			blockText: blockText,
			blockButtonType: blockButtonType,
			customerpts: customerpts,
			qty: qty,
			money: money,
			moneyNoDollar: moneyNoDollar,
			moneyNoDecimals: moneyNoDecimals,
			percent: percent,
			percentNoSign: percentNoSign,
			documentCategory: documentCategory,
			date: date,
			quantity: quantity,
			statusText : statusText,
			stripZeros : stripZeros,
			docFlowVisibility:docFlowVisibility,
			totalitems:totalitems,
			pdfButtonVisibility:pdfButtonVisibility,
			isRejected:isRejected,
			SoAvailableQtyVisibility:SoAvailableQtyVisibility,
			PoSupplement:PoSupplement,
			isEditableOnItemCategory:isEditableOnItemCategory
		};


})($,sap.ui.getCore(), _, gdt.salesui.data.DataLoader);
