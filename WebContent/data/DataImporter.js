$.sap.declare("gdt.salesui.data.DataImporter");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.data.DataContext");
$.sap.require("gdt.salesui.util.AddressHelper");
$.sap.require("gdt.salesui.lib.underscore-min");
$.sap.require("gdt.salesui.lib.papaparse-min");

gdt.salesui.data.DataImporter = (function($, core, _, Papa, datacontext, addressHelper) {
	var Defaults = [],
        templateName = '',
		CiscoMfrID = null,
		CiscoVdrID = null,
		IngramVdrID = null,
		TechDataVdrID = null,
		HeaderFields = [{label : 'Deal ID:' , field : 'DealID', lineItem :  true},
//	MG Don't use Deal Expiration as Quote Expiration                {label : 'Deal Expiration:', field : 'ValidTo', converter : function (val) {return new Date(Date.parse(val));}},
// MG Don't import Qoute Name into Description field			{label : 'Quote Name:', field : 'HeaderText'},
			{label : 'Quote ID:', field : 'ExternalQuoteID', lineItem : true}],
		DetailLineTemplateNames = ['Cisco Credit','SalesUI Export', 'Solomon Export', 'OIP / DealID', 'Estimate (Build and Price)', 'SmartNet'],
		DetailLineTemplates = [
		          [
		           //Cisco Credit Template
		            {column : '#', field : 'StructuredLineID'},
		            {column : 'Part Number', field : 'ManufacturerPartID'},
		            {column : 'Part Description', field : 'Description', converter : function (val) {return val.substring(0, 40);}},		
		            {column : 'Service Duration',  field : 'SmartNetDuration', optional : true},
		            {column : 'Buy Method',  field : 'VendorID', lookup : [{from : 'Cisco', to : CiscoVdrID}, {from : 'INGRAM MICRO', to : IngramVdrID}]},	
		            {column : 'Unit List Price', field : 'ListPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
		            {column : 'Quantity', field : 'QTY', converter : function (val) {var amt = val.replace(/,/g, ''); return parseInt(amt).toString();}},
		            {column : 'Lead Time (in Days)', field : 'CCWLeadTimeDays', converter : function (val) {var amt = val.replace(/,/g, ''); amt = ((!amt || amt == 'N/A') ? 0 : parseInt(amt.split(' ')[0])); return ((!amt) ? 0 : amt);}},
		            {column : 'Effective Discount %', field : 'GDTDiscountPercent', converter : function (val) {var amt = val.replace(/%/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 1000.0) / 1000.0).toString() : '0.00';}},
		          ], 		                       
				[ // SalesUI Export
					{column : 'Line', field : 'StructuredLineID'},
					{column : 'Ref Ln', field : 'CustomerPOLineID', optional : true},
					{column : 'Qty', field : 'QTY', converter : function (val) {var amt = val.replace(/,/g, ''); return parseInt(amt).toString();}},
					{column : 'Manufacturer', field : 'ManufacturerID', optional : true},
					{column : 'Part # Requested', field : 'ManufacturerPartID'},
					{column : 'Description', field : 'Description', converter : function (val) {return val.substring(0, 40);}},
					{column : 'Vendor', field : 'VendorID', optional : true},
					{column : 'Part # To Order', field : 'CustomerManufacturerPartID'},
					{column : 'List Price', field : 'ListPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'GDT Disc.', field : 'GDTDiscount', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'GDT Disc. %', field : 'GDTDiscountPercent', converter : function (val) {var amt = val.replace(/%/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 1000.0) / 1000.0).toString() : '0.00';}},
					{column : 'Unit Cost', field : 'UnitCost', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'Cust. Disc.', field : 'CustomerDiscount', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'Cust. Disc. %', field : 'CustomerDiscountPercent', converter : function (val) {var amt = val.replace(/%/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 1000.0) / 1000.0).toString() : '0.00';}},
					{column : 'Unit Price', field : 'UnitPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'ItemCategory', field : 'ItemCategory', optional : true},
					//{column : 'ShipToID', field : 'ShipToID', optional : true}, MG 8/13/15 Don't re-import Delivery Addresses
					{column : 'Deal ID / DART', field : 'DealID', optional : true},
					//{column : 'Delivery Date', field : 'DeliveryDate', optional : true}, MG 8/13/15 Don't re-import delivery dates
					{column : 'CCW Quote #', field : 'ExternalQuoteID', optional : true},
					{column : 'SmartNet Line Type', field : 'SmartNetLineType', optional : true},
					{column : 'SmartNet Part # Covered', field : 'SmartNetCoveredMaterial', optional : true},
					{column : 'SmartNet S/N', field : 'SmartNetCoveredSerialNumber', optional : true},
					{column : 'SmartNet Old S/N', field : 'SmartNetReplacedSerialNumber', optional : true},
					{column : 'SmartNet Contract #', field : 'SmartNetContractNumber', optional : true},
					{column : 'SmartNet Service Level', field : 'SmartNetServiceLevel', optional : true},
					{column : 'SmartNet Begin Date', field : 'SmartNetBeginDate', converter: function (val) {var dt; try {
						dt =  new Date(Date.parse(val));
					} catch(e) {
						console.error('Bad date in SmartNet Begin Date import field');
						dt = null;
					};
						return dt;
					}, optional : true},
					{column : 'SmartNet End Date', field : 'SmartNetEndDate', converter: function (val) {
						var dt;
						try {
							dt =  new Date(Date.parse(val));
						} catch(e) {
							console.error('Bad date in SmartNet End Date import field');
							dt = null;
						};
						return dt;
					}, optional : true},
					{column : 'SmartNet Duration', field : 'SmartNetDuration', optional : true},
					{column : 'WBSElement', field : 'WBSElement', optional : true},
				],
				[ // Solomon Export
					{column : 'Qty', field : 'QTY', converter : function (val) {var amt = val.replace(/,/g, ''); return parseInt(amt).toString();}},
					{column : 'Inventory ID', field : 'ManufacturerPartID'},
					{column : 'DSA/DART', field : 'DealID', optional : true},
					{column : 'Description', field : 'Description', converter : function (val) {return val.substring(0, 40);}},
					{column : 'Unit Price', field : 'ListPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'Extension', field : 'ExtendedPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'Extended Cost', field : 'ExtendedCost', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
				],
				[ // OIP / DealID
					{column : '#', field : 'StructuredLineID'},
					{column : 'Quantity', field : 'QTY', converter : function (val) {var amt = val.replace(/,/g, ''); return parseInt(amt).toString();}},
					{column : 'Part Number', field : 'ManufacturerPartID'},
					{column : 'Part Description', field : 'Description', converter : function (val) {return val.substring(0, 40);}},
					{column : 'SERVICE DURATION', field : 'SmartNetDuration', optional : true},
					{column : 'Buy Method', field : 'VendorID', lookup : [{from : 'Cisco', to : CiscoVdrID}, {from : 'INGRAM MICRO', to : IngramVdrID}]},
					{column : 'Extended List Price', field : 'ExtendedListPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'Discount %', field : 'GDTDiscountPercent', converter : function (val) {var amt = val.replace(/%/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 1000.0) / 1000.0).toString() : '0.00';}},
				],
				[ // Build & Price (Estimate)
					{column : 'LineNumber', field : 'StructuredLineID'},
					{column : 'Quantity', field : 'QTY', converter : function (val) {var amt = val.replace(/,/g, ''); return parseInt(amt).toString();}},
					{column : 'Item Name', field : 'ManufacturerPartID'},
					{column : 'Description', field : 'Description', converter : function (val) {return val.substring(0, 40);}},
					{column : 'SERVICE DURATION', field : 'SmartNetDuration', optional : true},
					{column : 'LeadTime', field : 'CCWLeadTimeDays', converter : function (val) {var amt = val.replace(/,/g, ''); amt = ((!amt || amt == 'N/A') ? 0 : parseInt(amt.split(' ')[0])); return ((!amt) ? 0 : amt);}},
					{column : 'Extended ListPrice', field : 'ExtendedListPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'Discount%', field : 'CustomerDiscountPercent', converter : function (val) {var amt = val.replace(/%/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 1000.0) / 1000.0).toString() : '0.00';}},
					{column : 'Selling Price', field : 'Dummy'},
				],
				[ // SmartNet
					{column : 'QUANTITY', field : 'QTY', converter : function (val) {var amt = val.replace(/,/g, ''); return parseInt(amt).toString();}},
					{column : 'SERVICE SKU', field : 'ManufacturerPartID'},
					{column : 'PRO RATED LIST PRICE', field : 'ListPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'PRODUCT NUMBER', field : 'SmartNetCoveredMaterial'},
					{column : 'TARGET CONTRACT NUMBER', field : 'SmartNetContractNumber', optional : true},
					{column : 'TARGET SERVICE LEVEL', field : 'SmartNetServiceLevel', optional : true},
					{column : 'LINE TYPE', field : 'SmartNetLineType', optional : true},
					{column : 'BEGIN DATE(DD-MON-YYYY)', field : 'SmartNetBeginDate', converter: function (val) {
																									var dt;
																									try {
																										dt =  new Date(Date.parse(val));
																									} catch(e) {
																										console.error('Bad date in SmartNet Begin Date import field');
																										dt = null;
																									};
																									return dt;
																								}, optional : true},
					{column : 'END DATE(DD-MON-YYYY)', field : 'SmartNetEndDate', converter: function (val) {var dt; try {
																										dt =  new Date(Date.parse(val));
																									} catch(e) {
																										console.error('Bad date in SmartNet End Date import field');
																										dt = null;
																									};
																									return dt;
																								},optional : true},
					{column : 'SERIAL NUMBER', field : 'SmartNetCoveredSerialNumber', optional : true},
					{column : 'OLD/REPLACED SN', field : 'SmartNetReplacedSerialNumber', optional : true},
					{column : 'CUSTOMER PRICE', field : 'CustomerPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'PRO RATED SERVICE NET PRICE', field : 'GDTPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
					{column : 'INSTALL SITE NAME', field : 'OTSTName'},
					{column : 'SITE ADDRESS LINE 1', field : 'OTSTStreet'},
					{column : 'SITE ADDRESS LINE 2', field : 'OTSTStreet2'},
					{column : 'SITE ADDRESS LINE 3', field : 'OTSTStreet3'},
					{column : 'SITE CITY', field : 'OTSTCity'},
					{column : 'SITE STATE/PROVINCE', field : 'OTSTState'},
					{column : 'SITE POSTAL CODE', field : 'OTSTZip'},
					{column : 'SITE COUNTRY', field : 'OTSTCountry'},
					{column : 'QUOTE', field : 'ExternalQuoteID', optional : true},
					{column : 'INSTANCE NUMBER', field : 'SmartNetInstanceNumber', optional : true},
				],
                [ // SmartNet Summarized
                    {column : 'QUANTITY', field : 'QTY', converter : function (val) {var amt = val.replace(/,/g, ''); return parseInt(amt).toString();}},
                    {column : 'SERVICE SKU', field : 'ManufacturerPartID'},
                    {column : 'PRO RATED LIST PRICE', field : 'ListPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
                    {column : 'CUSTOMER PRICE', field : 'CustomerPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
                    {column : 'PRO RATED SERVICE NET PRICE', field : 'GDTPrice', converter : function (val) {var amt = val.replace(/$/g, '').replace(/,/g, ''); return (parseFloat(amt) > 0) ? (Math.round(parseFloat(amt) * 100.0) / 100.0).toString() : '0.00';}},
                    {column : 'INSTALL SITE NAME', field : 'OTSTName'},
                    {column : 'SITE ADDRESS LINE 1', field : 'OTSTStreet'},
                    {column : 'SITE ADDRESS LINE 2', field : 'OTSTStreet2', optional : true},
                    {column : 'SITE ADDRESS LINE 3', field : 'OTSTStreet3', optional : true},
                    {column : 'SITE CITY', field : 'OTSTCity'},
                    {column : 'SITE STATE/PROVINCE', field : 'OTSTState'},
                    {column : 'SITE POSTAL CODE', field : 'OTSTZip'},
                    {column : 'SITE COUNTRY', field : 'OTSTCountry'},
                    {column : 'QUOTE', field : 'ExternalQuoteID', optional : true},
                ]
		],

		ImportFromCCW = function(csv, salesOrderHeader, salesOrderDetails, errors, missingAddresses, _createNewLine, _lookupPartID, _determineItemCategory, append) {
			var def = null,
				header = true,
				template = null,
				headerField = null,
				headerValue = null,
				fieldCount = 0,
				optionalCount = 0,
				nextLineNum = 10,
				parsed = Papa.parse(csv),
				line = [],
				newline = {},
				templates = [],
				salesOrderDetailsArray = (append) ? salesOrderDetails.getData() : [],
				customerID = core.getModel('currentCustomer').getProperty('/CustomerID'),
				i = 0,
				j = 0,
				k = 0,
				l = 0,
				l2 = 0,
				l3 = Defaults.length;

        	def = $.Deferred(function(defer) {
				var searchAddress = '',
                    parentNode,
                    childNode,
					newRows = [],
					keys = [],
					mfrs = core.getModel('globalSelectItems').getProperty('/Manufacturers') || [],
					vdrs = core.getModel('globalSelectItems').getProperty('/Vendors') || [],
					ciscoMfr = _.findWhere(mfrs, {SortL: 'CIS001'}),
					ciscoVdr = _.findWhere(vdrs, {SortL: 'CIS001'}),
					techDataVdr = _.findWhere(vdrs, {SortL: 'TEC001'}),
					shipTos = core.getModel('customerSelectItems').getProperty('/ShipTos'),
					ingramVdr = _.findWhere(vdrs, {SortL: 'ING001'});

				if (!missingAddresses) missingAddresses = [];
				if (!errors) errors = [];
                salesOrderDetailsArray = _.filter(salesOrderDetailsArray, function(line) {
                    return (!!line.MaterialID);
                });

				CiscoMfrID = (ciscoMfr) ? ciscoMfr.ManufacturerID : null;
				CiscoVdrID = (ciscoVdr) ? ciscoVdr.ManufacturerID : null;
				IngramVdrID = (ingramVdr) ? ingramVdr.ManufacturerID : null;
				TechDataVdrID = (techDataVdr) ? techDataVdr.ManufacturerID : null;

				Defaults.push({field: 'VendorID', value: CiscoVdrID});
				Defaults.push({field: 'ManufacturerID', value: CiscoMfrID});

				if (parsed && parsed.data && parsed.data.length) {
					l = parsed.data.length;
				}

				for (i = 0; i < l; i++) {
					line = parsed.data[i];
					if (line.length) {
						if (header) {
							templates = [];
							for (j = 0; j < DetailLineTemplates.length; j++) {
								templates.push(DetailLineTemplates[j].length);
							}
						}

						l2 = line.length;
						if (header) {
							for (j = 0; j < l2; j++) {
								var fieldMatched = false;
								for (k = 0; k < DetailLineTemplates.length; k++) {
									column = _.find(DetailLineTemplates[k], function (val) {
										return val.column.toLowerCase().replace(/ /g, '') == line[j].replace(/ /g, '').replace(/\n/g, "").replace(/\r/g, "").toLowerCase();
									});
									if (column && templates[k] > 0) {
										console.log('Template '+DetailLineTemplateNames[k]+' field '+column.field + ' matched');
										fieldMatched = true;
										column.position = j;
										templates[k]--;
									}
									if (templates[k] == 0) {
										header = false;
										template = DetailLineTemplates[k];
                                        templateName = DetailLineTemplateNames[k];
										console.log('Template '+DetailLineTemplateNames[k]+' selected.');
									}
									if (!header) break;
								}
								if (line[j] && !fieldMatched) console.log('Possible column header '+ line[j] + ' not found in any template - ignored.');
								headerField = _.find(HeaderFields, function (val) {
									return val.label == line[j];
								});
								if (headerField) {
									if (j < l2 + 1) headerValue = line[j + 1];
									if (!headerValue && j < l2 + 2) headerValue = line[j + 2];
									if (headerValue && headerValue != 'NA') {
										if (headerField.converter) {
											headerValue = headerField.converter(headerValue);
										}

										if (!headerField.lineItem) {
											if (!salesOrderHeader.getProperty('/' + headerField.field)) {
												salesOrderHeader.setProperty('/' + headerField.field, headerValue);
											}
										} else {
											Defaults.push({field: headerField.field, value: headerValue});
											l3 = Defaults.length;
										}
										headerField = null;
										headerValue = null;
									}
								}
							}
						} else {
							newline = _createNewLine((newRows.length == 0) ? salesOrderDetailsArray : newRows);

							newline.CustomerPOLineID = newline.SalesDocumentLineID;

							for (k = 0; k < l3; k++) {
								newline[Defaults[k].field] = Defaults[k].value;
							}

							fieldCount = template.length;
							optionalCount = _.where(template, {optional : true}).length;
							for (j = 0; j < l2; j++) {
								var column = _.find(template, function (val) {
									return val.position == j;
								});
								if (column && line[j]) {
									fieldCount--;
									if (column.converter) {
										newline[column.field] = column.converter(line[j]);
									} else {
										if (!!column.lookup) {
											switch (line[j].toUpperCase().replace(/ /g, '')) {
												case 'CISCO' :
													newline[column.field] = CiscoVdrID;
													break;
												case 'INGRAMMICRO' :
													newline[column.field] = IngramVdrID;
													break;
												case 'TECHDATA' :
													newline[column.field] = TechDataVdrID;
													break;
											}
//											 lookupValue = _.find(column.lookup, function(val) {return val.from == line[j];});
//											 if (lookupValue) newline[column.field] = lookupValue.to;

										} else { // Transform input if necessary for Field Type.
											switch (column.field) {
												case 'StructuredLineID' :
													//if (!!line[j].indexOf) {
													//	parentNode = parseInt(newline.StructuredLineID.substring(0, newline.StructuredLineID.indexOf('.')));
													//	if (line[j].indexOf('.') > 0 && line[j].length > line[j].indexOf('.')) {
													//		childNode = line[j].substring(line[j].indexOf('.'));
													//		if (childNode !== '.0') parentNode = (parentNode > 1) ? parentNode - 1 : 1;
													//	} else {
													//		childNode = '.0';
													//	}
													//	newline.StructuredLineID = parentNode.toString() + childNode;
													//}
													// Begin of Change : Line Numbering and Assigning proper Parent ID : SXVASAMSETTI
													
													if(salesOrderDetailsArray.length == 0)  // Checking whether it is not in append Mode
													{
													newline.StructuredLineID = line[j];
													}
													else{ //Append Mode
													   if(parseInt((parsed.data[i-1])[j]) == parseInt(line[j])){
														   newline.StructuredLineID = newline.StructuredLineID - 1;
													       lineLevels = line[j].split('.');
													  for(n = 1;n < lineLevels.length; n++){
														newline.StructuredLineID = newline.StructuredLineID + '.' + lineLevels[n]	;
													     }
													  }
													newline.StructuredLineID = newline.StructuredLineID.toString( );
													}
										          // End of Change:	
													break;
												case 'SmartNetBeginDate' :
													try {
														newline.SmartNetBeginDate = new Date(line[j]);
													} catch (ex) { // Convert Date failed
														console.error('Bad date in SmartNet Begin Date import field');
														newline.SmartNetBeginDate = null;
													}
													break;
												case 'SmartNetEndDate' :
													try {
														newline.SmartNetEndDate = new Date(line[j]);
													} catch (ex) { // Convert Date failed
														console.error('Bad date in SmartNet End Date import field');
														newline.SmartNetEndDate = null;
													}
													break;
												default :
													newline[column.field] = line[j];
													break;
											}
										}
									}
									column = null;
								}
								if (fieldCount == 0) break;
							}
							if (fieldCount <= optionalCount  && !newline.WBSElement) {
								nextLineNum += 10;
								if ((newline.VendorID != ciscoVdr.ManufacturerID) && (!!newline.DealID)) {
									//Per Karen, do not import DealID if not purchasing from Cisco
									newline.DealID = '';
								}

								if (!!newline.GDTPrice) {
                                    newline.GDTDiscount = (parseFloat(newline.GDTPrice) - parseFloat(newline.ListPrice)).toString();
									delete newline.GDTPrice;
								}

								if (!!newline.CustomerPrice) {
                                    newline.CustomerDiscount = (parseFloat(newline.CustomerPrice) - parseFloat(newline.ListPrice)).toString();
									delete newline.CustomerPrice;
								}

								if (!!newline.Dummy) {
									delete newline.Dummy;
								}

								if (!!newline.CustomerManufacturerPartID) {
									delete newline.CustomerManufacturerPartID;
								}

								if (!!newline.ExtendedListPrice) {
									if (!!newline.QTY) {
										newline.ListPrice = newline.ExtendedListPrice / newline.QTY;
									} else {
										newline.ListPrice = newline.ExtendedListPrice;
									}
									delete newline.ExtendedListPrice;
								}
								if (!!newline.ExtendedPrice && parseFloat(newline.ExtendedPrice) != 0) {
									if (!!newline.QTY) {
										newline.UnitPrice = Math.round(newline.ExtendedPrice * 100.0 / newline.QTY) / 100.0;
									} else {
										newline.UnitPrice = newline.ExtendedPrice;
									}
								}
								if (!!newline.ExtendedCost && parseFloat(newline.ExtendedCost) != 0) {
									if (!!newline.QTY) {
										newline.UnitCost = Math.round(newline.ExtendedCost * 100.0 / newline.QTY) / 100.0;
									} else {
										newline.UnitCost = newline.ExtendedCost;
									}
								}
								if (!!newline.UnitPrice && (parseFloat(newline.UnitPrice) != 0) && (newline.UnitPrice != newline.ListPrice) && (!newline.CustomerDiscount || (parseFloat(newline.CustomerDiscount) == 0))) {
									newline.CustomerDiscount = newline.UnitPrice - newline.ListPrice;
								}
								if (!!newline.UnitCost && (parseFloat(newline.UnitCost) != 0) && (newline.UnitCost != newline.ListPrice) && (!newline.GDTDiscount || (parseFloat(newline.GDTDiscount) == 0))) {
									newline.GDTDiscount = newline.UnitCost - newline.ListPrice;
								}
								if (!newline.CustomerPartID && !!newline.ManufacturerPartID) newline.CustomerPartID = newline.ManufacturerPartID;
								if (!!newline.GDTDiscountPercent && (!newline.GDTDiscount || (parseFloat(newline.GDTDiscount) == 0 && parseFloat(newline.GDTDiscountPercent) != 0))) {
									newline.GDTDiscount = Math.round(newline.ListPrice * newline.GDTDiscountPercent) / -100.0;
								}
								if (!!newline.GDTDiscount && (!newline.GDTDiscountPercent || (parseFloat(newline.GDTDiscount) != 0 && parseFloat(newline.GDTDiscountPercent) == 0))) {
									newline.GDTDiscountPercent = Math.round((newline.GDTDiscount / newline.ListPrice) * -100000.0) / 1000.0;  // Discounts to 3 DP
								}
								if (!!newline.CustomerDiscountPercent && (!newline.CustomerDiscount || (parseFloat(newline.CustomerDiscount) == 0 && parseFloat(newline.CustomerDiscountPercent) != 0))) {
									newline.CustomerDiscount = Math.round(newline.ListPrice * newline.CustomerDiscountPercent) / -100.0;
								}
								if (!!newline.CustomerDiscount && (!newline.CustomerDiscountPercent || (parseFloat(newline.CustomerDiscount) != 0 && parseFloat(newline.CustomerDiscountPercent) == 0))) {
									newline.CustomerDiscountPercent = Math.round((newline.CustomerDiscount / newline.ListPrice) * -100000.0) / 1000.0;  // Discounts to 3 DP
								}
								newline.Selected = true;

								newRows.push(newline)
							}
						}
					}
				}

                // All lines parsed...now process import

                if (!template) {
                    defer.reject("Import file did not match any known template.  File ignored.");
                } else {
                    if (newRows.length == 0){
                        defer.reject("No recognisable parts were found in Import file.  File ignored.");
                    } else {
                        _.each(newRows, function (row) {
                            var address = '',
                                addressMatch,
                                key = {
                                    CustomerID: customerID,
                                    ManufacturerID: row.ManufacturerID,
                                    MaterialID: '',
                                    MfrPartID: ($.isNumeric(row.ManufacturerPartID)) ?  row.ManufacturerPartID.toUpperCase().trim().replace(/^0+/, '') : row.ManufacturerPartID.toUpperCase().trim(),
                                };

                            keys.push(key);

                            if (templateName == 'SmartNet') {
                                row.ShipToID = 'ONETIME';
                            }

                            if (!!row.PartnerName) {
                                address = row.PartnerName;
                                delete row.PartnerName;
                            }

                            if (!!row.Street) {
                                address += ((address.length != 0) ? ', ' : '') + row.Street;
                                delete row.Street;
                            }

                            if (!!row.City) {
                                address += ((address.length != 0) ? ', ' : '') + row.City;
                                delete row.City;
                            }

                            if (!!row.State) {
                                address += ((address.length != 0) ? ', ' : '') + row.State;
                                delete row.State;
                            }

                            if (!!row.Zip) {
                                address += ((address.length != 0) ? ', ' : '') + row.Zip;
                                delete row.Zip;
                            }

                            if (!!address) {
                                addressMatch = addressHelper.find(address, shipTos);
                                if (!!addressMatch) {
                                    row.ShipToID = addressMatch.PartnerID;
                                } else {
                                    missingAddresses.push(address);
                                }
                            }

                        });

                        keys = _.uniq(keys, function (key) {
                            return key.MaterialID + key.MfrPartID;
                        });
                        keys = _.filter(keys, function (key) {
                            return !datacontext.materials.getLocal(key);
                        });

                        datacontext.materials.load(keys).done(function () {
							var duration;
                            _.each(newRows, function(newline, idx) {
                                _lookupPartID(newline, newline.ManufacturerPartID, false, true, null, null, true);

								if (parseFloat(newline.ListPrice) == 0) newline.GDTDiscountPercent = '00.00';
								newline.ItemCategory = _determineItemCategory(newline);
								if (!!newline.SmartNetDuration && (parseInt(newline.SmartNetDuration).toString() != newline.SmartNetDuration)) {
									duration = newline.SmartNetDuration.split(' ')[0];
									if (parseInt(duration).toString() == duration) {
										newline.SmartNetDuration = duration;
									} else {
										newline.SmartNetDuration = '';
									}
								}
								if (!!newline.SmartNetDuration) {
									newline.Description = ('' + newline.Description).substring(0,30) + ' (' + newline.SmartNetDuration.substring(0,2) + ' mnth)';
								}

								if (newline.MaterialID) {
									newline.CustomerMaterialID = newline.MaterialID;
									newRows[idx] = newline;
								} else {
									errors.push(newline);
								}
                            });

// Restrict Materials with 4 series to add in UI(4 Series will have itemCategory (ZPFS,ZTAO,YTAO) ,Only launch team/Admin Team will maintain from GUI not from UI
                            var Seeries4Material = _.find(newRows, function(row){ return ( row.ItemCategory == 'ZPFS' ||  row.ItemCategory == 'YTAO' ||  row.ItemCategory == 'ZTAO' ); });                          
                           if( Seeries4Material == undefined || ( !!Seeries4Material && Seeries4Material.length == 0) ){
                            
                            Array.prototype.push.apply(salesOrderDetailsArray, newRows);
                            _setParentChildRelationships(salesOrderDetailsArray);
                            if ((!errors || errors.length == 0) && (!missingAddresses || missingAddresses.length == 0)) {
								if (salesOrderDetailsArray.length > 100) {
									salesOrderDetails.setSizeLimit(salesOrderDetailsArray.length + 100);
								}
                                salesOrderDetails.setData(salesOrderDetailsArray);
                            }
                            
                           }else{
                        	   errors.length = 0;
                        	   sap.m.MessageBox.show( "Sales UI does not allow you to add materials starts with 4 Series(Professional Services). \n These materials are maintained from SAP GUI by Projects/Launch team", {
           						icon: sap.m.MessageBox.Icon.ERROR,
           						title: "Authorizaton Issue",
           						actions: sap.m.MessageBox.Action.OK,
           						onClose: null});  
                        	   
                           }
                            defer.resolve();
                        }).fail(function (msg) {
                            defer.reject(msg);
                        });
                    }
                }

			});
        	
        	return def.promise();
		},

		_setParentChildRelationships = function(lines) {
			var l = lines.length,
				parentLineID = 0,
				i = 0;
			
			for (i = 0; i < l; i++ ) {
				parentLineID = _findParentOf(lines[i], lines);
				lines[i].ParentLineID = parentLineID;
			}
			
		},
		
		_findParentOf = function(line, lines) {
			var parent = null,
				lastNode = 0,
				lastNodeIdx = 0,
				topParent = _pad(0,6),
				parentNode = '';
			
			if (!line.StructuredLineID) return topParent;  // No structured line id so assume this has no parent
			
			lastNodeIdx = line.StructuredLineID.lastIndexOf('.');
			if (lastNodeIdx == -1 || lastNodeIdx >= (line.StructuredLineID.length - 1)) return topParent; // No '.' in structured line id so must be top level, no parent

			lastNode = parseInt(line.StructuredLineID.substring(lastNodeIdx + 1));
			parentNode = line.StructuredLineID.substring(0,lastNodeIdx);
			
			if (!lastNode) { // ends in .0 so move up the tree for parent 
				lastNodeIdx = parentNode.lastIndexOf('.');
				if (lastNodeIdx == -1 || lastNodeIdx >= (parentNode.length - 1)) return topParent; // there isn't anything further up the tree
				
				lastNode = parseInt(parentNode.substring(lastNodeIdx + 1));
				parentNode = parentNode.substring(0,lastNodeIdx);
			}
			
			// ensure parent node does not end in .0
			lastNodeIdx = parentNode.lastIndexOf('.');
			if (lastNodeIdx > -1 && lastNodeIdx < (parentNode.length)) {
				lastNode = parseInt(parentNode.substring(lastNodeIdx + 1));
				if (!lastNode) parentNode = parentNode.substring(0, lastNodeIdx);
			} 
			
			parent = _.find(lines, function(candidate) {return (candidate.StructuredLineID == parentNode) || candidate.StructuredLineID == parentNode + '.0';});
			
			if (!parent) return topParent;
			
			return parent.SalesDocumentLineID;
						
		},

        _pad = function (n, width, z) {
      	  var 	paddingChar = z || '0',
      	  		stringToPad = n + '';
      	  return stringToPad.length >= width ? stringToPad : new Array(width - stringToPad.length + 1).join(paddingChar) + stringToPad;
		};
	
	return {
		ImportFromCCW: ImportFromCCW,
	};
})($,sap.ui.getCore(),_, Papa, gdt.salesui.data.DataContext, gdt.salesui.util.AddressHelper);
