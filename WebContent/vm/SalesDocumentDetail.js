$.sap.declare("gdt.salesui.vm.SalesDocumentDetail");
$.sap.require("gdt.salesui.util.Formatter");
$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");

gdt.salesui.vm.SalesDocumentDetail = (function($, core, _) {
	var _debounceTime = 100,
		timeout = [],
		materialSeries_FinishedGoods = 1,
		materialSeries_Placeholder = 2,
		materialSeries_Hardware = 3,
		materialSeries_ProfessionalServices = 4,
		_debounce = function(func, wait) {
		
		
			return function(event) {
				var source = event.getSource(),
				    context = source.getContext(),
				    path = context.getPath(),
				    later = function() {
						timeout[path] = null;
					};
				
				if (!timeout[path]) {
					timeout[path] = setTimeout(later, wait);
					func(event);
				} else {
					clearTimeout(timeout[path]);
					timeout[path] = setTimeout(later, wait);
				}
			};
		
		},
		_calculateExtendedValue = function(row, qty, unitValue) {
			var extendedValue = unitValue * qty;

			return Math.round(extendedValue * 100.0) / 100.0; // round to pennies
		},
		_calculateUnitValue = function(row, qty, extendedValue) {
			var unitValue;

			if (qty == 0) return 0;

			unitValue = extendedValue / qty;

			return Math.round(unitValue * 100.0) / 100.0; // round to pennies
		},
		_determineMaterialSeries = function(row) {
			var materialSeries = (row && row.MaterialID) ? row.MaterialID : '';

			materialSeries = materialSeries.replace(/^0+/, '');
			if (!!materialSeries && materialSeries.length > 1) {
				materialSeries = materialSeries.substring(0,1);
			}

			return parseInt(materialSeries);
		},
		HandleDetailQtyChange = function(event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				regex = /[+-]?\d*\.*\d+/g,
				extendedPrice,
				copyLines = core.getModel('copies').getProperty('/currentLinesCopy'),
				copyItem,
				extendedCost,
				gp,
				gpp,
				qty;

			if (!row) return;

			console.log('QTY Change');

			// SaaS Product Duration Present
			 copyItem = _.find(copyLines, function(line){ return line.SalesDocumentLineID  == row.SalesDocumentLineID; });
			 if(row.MARAMaterialGroup == 'ZSA'  && (!isNaN(_ensureFloat(row.SmartNetDuration))) && (parseInt(row.SmartNetDuration) != 0)){
			if((!!copyItem) && (copyItem.QTY != source.getValue())){
				qty = ( _ensureFloat(row.SmartNetDuration) * _ensureFloat(source.getValue()) );	
			}
			else if(!copyItem){ // New Line Item : No change record exist
				 qty = ( _ensureFloat(row.SmartNetDuration) * _ensureFloat(source.getValue()) );
			}	 				 
			  }
			 else{	
				 qty = _ensureFloat(source.getValue());
			  }
			 
			extendedCost = _calculateExtendedValue(row, qty, parseFloat(row.UnitCost)); // Re-calculate extended to remove rounding error
			extendedPrice = _calculateExtendedValue(row, qty, parseFloat(row.UnitPrice));
			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.ExtendedCost = extendedCost.toString();
			row.ExtendedPrice = extendedPrice.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.QTY = qty.toString();

			model.setProperty(context.getPath(),row);
		},
		
		HandleDetailListPriceChange = function (event){
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitPrice,
				unitCost,
				extendedPrice,
				extendedCost,
				listPrice,
				gdtDiscount,
				gdtDiscountPercentage,
				gdtDiscountPercentageTest,
				customerDiscount,
				customerDiscountPercentage,
				customerDiscountPercentageTest,
				gp,
				gpp,
				qty,
				materialSeries;

			if (!row) return;

			console.log('List Price Change');

			materialSeries = _determineMaterialSeries(row);

			qty = parseFloat(row.QTY);
			listPrice = _ensureFloat(source.getValue());

			if (!!materialSeries && materialSeries != materialSeries_Placeholder && listPrice < 0) {
				listPrice = -1 * listPrice;
			}
			gdtDiscount = parseFloat(row.GDTDiscount);
			customerDiscount = parseFloat(row.CustomerDiscount);

			gdtDiscountPercentage = Math.round(parseFloat(row.GDTDiscountPercent) * 1000) / 1000; // Discount Percentage to 3 DP
			gdtDiscountPercentageTest = Math.round(((!!listPrice) ? (gdtDiscount / listPrice) : 0) * -100000) / 1000;
			customerDiscountPercentage = Math.round(parseFloat(row.CustomerDiscountPercent) * 1000) / 1000; // Discount Percentage to 3 DP
			customerDiscountPercentageTest = Math.round(((!!listPrice) ? (customerDiscount / listPrice) : 0) * -100000) / 1000;

			unitCost = parseFloat(row.UnitCost);
			unitPrice = parseFloat(row.UnitPrice);

			if (gdtDiscountPercentage != gdtDiscountPercentageTest || gdtDiscount != (unitCost - listPrice)) {
				unitCost =  Math.round(listPrice * (100.0 - gdtDiscountPercentage)) / 100.0;
			}

			if (customerDiscountPercentage != customerDiscountPercentageTest || customerDiscount != (unitPrice - listPrice)) {
				unitPrice = Math.round(listPrice * (100.0 - customerDiscountPercentage)) / 100.0;
			}

			gdtDiscount = unitCost - listPrice;
			customerDiscount = unitPrice - listPrice;
			extendedCost = _calculateExtendedValue(row, qty, unitCost);
			extendedPrice = _calculateExtendedValue(row, qty, unitPrice);
			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.UnitCost = unitCost.toString();
			row.ExtendedCost = extendedCost.toString();
			row.UnitPrice = unitPrice.toString();
			row.ExtendedPrice = extendedPrice.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.ListPrice = listPrice.toString();
			row.GDTDiscount = gdtDiscount.toString();
			row.GDTDiscountPercent = gdtDiscountPercentage.toString();
			row.CustomerDiscount = customerDiscount.toString();
			row.CustomerDiscountPercent = customerDiscountPercentage.toString();
			row.QTY = qty.toString();
				
			model.setProperty(context.getPath(),row);
		},                    
		
		HandleDetailGDTDiscountChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitCost,
				extendedPrice,
				extendedCost,
				listPrice,
				gdtDiscount,
				gdtDiscountPercentage,
				gdtDiscountPercentageTest,
				gp,
				gpp,
				qty;

			if (!row) return;

			console.log('GDT Discount % Change');

			qty = parseFloat(row.QTY);
			listPrice = parseFloat(row.ListPrice);
			gdtDiscountPercentage = Math.round(_ensureFloat(source.getValue()) * 1000) / 1000; // Discount Percentage to 3 DP
			gdtDiscountPercentageTest = Math.round(((!!listPrice) ? (parseFloat(row.GDTDiscount) / listPrice) : 0) * -100000) / 1000;

			if (gdtDiscountPercentage == gdtDiscountPercentageTest) return;

			extendedPrice = parseFloat(row.ExtendedPrice);
			unitCost =  Math.round(listPrice * (100.0 - gdtDiscountPercentage)) / 100.0;
			gdtDiscount = unitCost - listPrice;
			extendedCost = _calculateExtendedValue(row, qty, unitCost); // Re-calculate extended to remove rounding error
			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.UnitCost = unitCost.toString();
			row.ExtendedCost = extendedCost.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.GDTDiscount = gdtDiscount.toString();
			row.GDTDiscountPercent = gdtDiscountPercentage.toString();

			model.setProperty(context.getPath(),row);
		},

		HandleDetailCustomerDiscountChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitPrice,
				extendedPrice,
				extendedCost,
				listPrice,
				customerDiscount,
				customerDiscountPercentage,
				customerDiscountPercentageTest,
				gp,
				gpp,
				qty;

			if (!row) return;

			console.log('Customer Discount % Change');

			qty = parseFloat(row.QTY);
			listPrice = parseFloat(row.ListPrice);
			customerDiscountPercentage = Math.round(_ensureFloat(source.getValue()) * 1000) / 1000; // Discount Percentage to 3 DP
			customerDiscountPercentageTest = Math.round(((!!listPrice) ? (parseFloat(row.CustomerDiscount) / listPrice) : 0) * -100000) / 1000;

			if (customerDiscountPercentage == customerDiscountPercentageTest) return;

			unitPrice = Math.round(listPrice * (100.0 - customerDiscountPercentage)) / 100.0;
			customerDiscount = unitPrice - listPrice;
			extendedCost  = parseFloat(row.ExtendedCost);
			extendedPrice = _calculateExtendedValue(row, qty, unitPrice);
			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.UnitPrice = unitPrice.toString();
			row.ExtendedPrice = extendedPrice.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.CustomerDiscount = customerDiscount.toString();
			row.CustomerDiscountPercent = customerDiscountPercentage.toString();

			model.setProperty(context.getPath(),row);
		},

		HandleDetailUnitCostChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitCost,
				extendedPrice,
				extendedCost,
				listPrice,
				gdtDiscount,
				gdtDiscountPercentage,
				gp,
				gpp,
				qty,
				materialSeries;

			if (!row) return;

			console.log('Unit Cost Change');

			materialSeries = _determineMaterialSeries(row);

			unitCost = Math.round(_ensureFloat(source.getValue()) * 100.0) / 100.0; // Round to pennies
			listPrice = parseFloat(row.ListPrice);
			if (!!materialSeries && materialSeries != materialSeries_Placeholder && unitCost > listPrice) {
				unitCost = listPrice;
				sap.m.MessageToast.show('Unit Cost cannot be higher than List Price.');
			}

			qty = parseFloat(row.QTY);
			extendedCost = _calculateExtendedValue(row, qty, unitCost);
			gdtDiscount = unitCost - listPrice;
			gdtDiscountPercentage = Math.round(((listPrice != 0) ? gdtDiscount * -100.0 / listPrice : 0.00) * 1000.0) / 1000.0; //round to 3 dp
			extendedPrice = parseFloat(row.ExtendedPrice);
			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.UnitCost = unitCost.toString();
			row.ExtendedCost = extendedCost.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.GDTDiscount = gdtDiscount.toString();
			row.GDTDiscountPercent = gdtDiscountPercentage.toString();

			model.setProperty(context.getPath(),row);
		},

		HandleDetailUnitPriceChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitPrice,
				extendedPrice,
				extendedCost,
				listPrice,
				customerDiscount,
				customerDiscountPercentage,
				gp,
				gpp,
				qty,
				materialSeries;

			if (!row) return;

			console.log('Unit Price Change');

			materialSeries = _determineMaterialSeries(row);

			unitPrice = Math.round(_ensureFloat(source.getValue()) * 100.0) / 100.0; // Round to pennies
			listPrice = parseFloat(row.ListPrice);
			if (!!materialSeries && materialSeries != materialSeries_Placeholder && unitPrice > listPrice) {
				unitPrice = listPrice;
				sap.m.MessageToast.show('Unit Price cannot be higher than List Price.');
			}

			qty = parseFloat(row.QTY);
			extendedPrice = _calculateExtendedValue(row, qty, unitPrice);
			extendedCost = parseFloat(row.ExtendedCost);
			customerDiscount = unitPrice - listPrice;
			customerDiscountPercentage = Math.round(((listPrice != 0) ? customerDiscount * -100.0 / listPrice : 0.00) * 1000.0) / 1000.0; //round to 3 dp

			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.UnitPrice = unitPrice.toString();
			row.ExtendedPrice = extendedPrice.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.CustomerDiscount = customerDiscount.toString();
			row.CustomerDiscountPercent = customerDiscountPercentage.toString();

			model.setProperty(context.getPath(),row);
		},

		HandleDetailExtendedCostChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitCost,
				extendedPrice,
				extendedCost,
				listPrice,
				gdtDiscount,
				gdtDiscountPercentage,
				gp,
				gpp,
				qty,
				materialSeries;

			if (!row) return;

			console.log('Extended Cost Change');

			materialSeries = _determineMaterialSeries(row);

			qty = parseFloat(row.QTY);
			listPrice = parseFloat(row.ListPrice);
			extendedCost = _ensureFloat(source.getValue());
			unitCost = _calculateUnitValue(row, qty, extendedCost);
			if (!!materialSeries && materialSeries != materialSeries_Placeholder && unitCost > listPrice) {
				unitCost = listPrice;
				sap.m.MessageToast.show('Unit Cost cannot be higher than List Price.');
			}
			extendedCost = _calculateExtendedValue(row, qty, unitCost); // Round trip to correct for rounding errors
			gdtDiscount = unitCost - listPrice;
			gdtDiscountPercentage = Math.round(((listPrice != 0) ? gdtDiscount * -100.0 / listPrice : 0.00) * 1000.0) / 1000.0; //round to 3 dp
			extendedPrice = parseFloat(row.ExtendedPrice);
			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.UnitCost = unitCost.toString();
			row.ExtendedCost = extendedCost.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.GDTDiscount = gdtDiscount.toString();
			row.GDTDiscountPercent = gdtDiscountPercentage.toString();

			model.setProperty(context.getPath(),row);
		},
		

		HandleDetailExtendedPriceChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitPrice,
				extendedPrice,
				extendedCost,
				listPrice,
				customerDiscount,
				customerDiscountPercentage,
				gp,
				gpp,
				qty,
				materialSeries;

			if (!row) return;

			console.log('Extended Price Change');

			materialSeries = _determineMaterialSeries(row);

			qty = parseFloat(row.QTY);
			listPrice = parseFloat(row.ListPrice);
			extendedCost = parseFloat(row.ExtendedCost);

			extendedPrice = _ensureFloat(source.getValue());
			unitPrice = _calculateUnitValue(row, qty, extendedPrice);
			if (!!materialSeries && materialSeries != materialSeries_Placeholder && unitPrice > listPrice) {
				unitPrice = listPrice;
				sap.m.MessageToast.show('Unit Price cannot be higher than List Price.');
			}
			extendedPrice = _calculateExtendedValue(row, qty, unitPrice); // Round trip to correct for rounding errors
			customerDiscount = unitPrice - listPrice;
			customerDiscountPercentage = Math.round(((listPrice != 0) ? customerDiscount * -100.0 / listPrice : 0.00) * 1000.0) / 1000.0; //round to 3 dp

			gp = extendedPrice - extendedCost;
			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			row.UnitPrice = unitPrice.toString();
			row.ExtendedPrice = extendedPrice.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.CustomerDiscount = customerDiscount.toString();
			row.CustomerDiscountPercent = customerDiscountPercentage.toString();

			model.setProperty(context.getPath(),row);
		},
		
		HandleDetailGrossProfitChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitPrice,
				unitCost,
				extendedPrice,
				extendedCost,
				listPrice,
				extendedList,
				gdtDiscount,
				gdtDiscountExtended,
				gdtDiscountPercentage,
				customerDiscount,
				customerDiscountPercentage,
				gp,
				gpp,
				qty,
				materialSeries;

			if (!row) return;

			console.log('Gross Profit Change');

			materialSeries = _determineMaterialSeries(row);

			qty = parseFloat(row.QTY);
			listPrice = parseFloat(row.ListPrice);
			extendedList = _calculateExtendedValue(row, qty, listPrice);
			gp = _ensureFloat(source.getValue());
			gdtDiscountPercentage = Math.round(parseFloat(row.GDTDiscountPercent) * 1000) / 1000; // Discount Percentage to 3 DP
			gdtDiscountExtended = Math.round(extendedList * gdtDiscountPercentage) / -100.0;
			extendedCost  = extendedList + gdtDiscountExtended;
			unitCost = _calculateUnitValue(row, qty, extendedCost);
			extendedCost = _calculateExtendedValue(row, qty, unitCost); // Re-calculate extended to remove rounding error
			gdtDiscount = unitCost - listPrice;

			extendedPrice = extendedCost + gp;

			if (!!materialSeries && materialSeries != materialSeries_Placeholder && extendedPrice > extendedList) {
				extendedPrice = extendedList;
				gp = extendedPrice - extendedCost;
				sap.m.MessageToast.show('Unit Price cannot be higher than List Price.');
			}

			gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;
			unitPrice = _calculateUnitValue(row, qty, extendedPrice);
			customerDiscount = -1 * (listPrice - unitPrice);
			customerDiscountPercentage = (listPrice != 0) ? Math.round(((customerDiscount * -100.0) / listPrice) * 1000.0) / 1000.0 : 0.00;

			row.UnitCost = unitCost.toString();
			row.ExtendedCost = extendedCost.toString();
			row.UnitPrice = unitPrice.toString();
			row.ExtendedPrice = extendedPrice.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.ListPrice = listPrice.toString();
			row.GDTDiscount = gdtDiscount.toString();
			row.GDTDiscountPercent = gdtDiscountPercentage.toString();
			row.CustomerDiscount = customerDiscount.toString();
			row.CustomerDiscountPercent = customerDiscountPercentage.toString();
			row.QTY = qty.toString();

			model.setProperty(context.getPath(),row);
		},
		
		HandleDetailGrossProfitPercentageChange = function (event) {
			var source = event.getSource(),
				context = source.getContext(),
				path = context.getPath(),
				model = source.getModel(),
				row = model.getProperty(path),
				unitPrice,
				unitCost,
				extendedPrice,
				extendedCost,
				listPrice,
				extendedList,
				gdtDiscount,
				gdtDiscountExtended,
				gdtDiscountPercentage,
				customerDiscount,
				customerDiscountPercentage,
				gp,
				gpp,
				gppTest,
				qty,
				materialSeries;

			if (!row) return;

			console.log('Gross Profit % Change');

			materialSeries = _determineMaterialSeries(row);

			qty = parseFloat(row.QTY);
			listPrice = parseFloat(row.ListPrice);
			extendedList = _calculateExtendedValue(row, qty, listPrice);
			gpp = _ensureFloat(source.getValue());
			extendedPrice = parseFloat(row.ExtendedPrice);
			gp = parseFloat(row.GrossProfit);
			gppTest = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			if (gpp == gppTest) return;

			gdtDiscountPercentage = Math.round(parseFloat(row.GDTDiscountPercent) * 1000) / 1000; // Discount Percentage to 3 DP
			gdtDiscountExtended = Math.round(extendedList * gdtDiscountPercentage) / -100.0;
			extendedCost  = extendedList + gdtDiscountExtended;
			unitCost = _calculateUnitValue(row, qty, extendedCost);
			extendedCost = _calculateExtendedValue(row, qty, unitCost); // Re-calculate extended to remove rounding error
			gdtDiscount = unitCost - listPrice;

			extendedPrice = (gpp != 100) ? Math.round(extendedCost * 100 / (1- (gpp / 100.0))) / 100 : extendedList;

			if (!!materialSeries && materialSeries != materialSeries_Placeholder && extendedPrice > extendedList) {
				extendedPrice = extendedList;
				gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;
				sap.m.MessageToast.show('Unit Price cannot be higher than List Price.');
			}

			unitPrice = _calculateUnitValue(row, qty, extendedPrice);
			gp = extendedPrice - extendedCost;
			customerDiscount = -1 * (listPrice - unitPrice);
			customerDiscountPercentage = (listPrice != 0) ? Math.round(((customerDiscount * -100.0) / listPrice) * 1000.0) / 1000.0 : 0.00;

			row.UnitCost = unitCost.toString();
			row.ExtendedCost = extendedCost.toString();
			row.UnitPrice = unitPrice.toString();
			row.ExtendedPrice = extendedPrice.toString();
			row.GrossProfit = gp.toString();
			row.GrossProfitPercentage = gpp.toString();
			row.ListPrice = listPrice.toString();
			row.GDTDiscount = gdtDiscount.toString();
			row.GDTDiscountPercent = gdtDiscountPercentage.toString();
			row.CustomerDiscount = customerDiscount.toString();
			row.CustomerDiscountPercent = customerDiscountPercentage.toString();
			row.QTY = qty.toString();

			model.setProperty(context.getPath(),row);
		},
		
		_ensureFloat = function(val) {
			if ($.type(val) === "string") {
				return parseFloat(val.replace(/$/g, '').replace(/,/g, '').replace(/%/g, ''));
			}
			
			return val * 1.0;
		},
		
		HandleDetailDurationChange = function(event) {
			 var source = event.getSource(),
			 context = source.getContext(),
			 path = context.getPath(),
			 model = source.getModel(),
			 row = model.getProperty(path),
			 extendedPrice,
			 copyLines = core.getModel('copies').getProperty('/currentLinesCopy'),
			 extendedCost,
			 gp,
			 gpp,
			 qty;
		
             if (!row) return;
			 if(row.MARAMaterialGroup != 'ZSA')return;
			 if(isNaN(_ensureFloat(row.SmartNetDuration))) return;
			 if(parseInt(source.getValue()) == 0)  return;
			 copyItem = _.find(copyLines, function(line){ return line.SalesDocumentLineID  == row.SalesDocumentLineID; });
			 if(!!copyItem && copyItem.SmartNetDuration == source.getValue()) return;
			 console.log('Saas Product Duration & Quantity Change');
             
			 qty = ( _ensureFloat(row.QTY) * _ensureFloat(source.getValue()) );
			 extendedCost = _calculateExtendedValue(row, qty, parseFloat(row.UnitCost)); // Re-calculate extended to remove rounding error
			 extendedPrice = _calculateExtendedValue(row, qty, parseFloat(row.UnitPrice));
			 gp = extendedPrice - extendedCost;
			 gpp = (extendedPrice != 0) ? Math.round(((extendedPrice != 0) ? gp * 100.0 / extendedPrice : 0.0) * 1000.0) / 1000.0 : 0.00;

			 row.ExtendedCost = extendedCost.toString();
			 row.ExtendedPrice = extendedPrice.toString();
			 row.GrossProfit = gp.toString();
			 row.GrossProfitPercentage = gpp.toString();
			 row.QTY = qty.toString();
		
			 model.setProperty(context.getPath(),row);
			 };		
						
		
		
	
	return {
		HandleDetailQtyChange: _debounce(HandleDetailQtyChange, _debounceTime),
		HandleDetailListPriceChange: _debounce(HandleDetailListPriceChange, _debounceTime),
		HandleDetailGDTDiscountChange: _debounce(HandleDetailGDTDiscountChange, _debounceTime),
		HandleDetailUnitCostChange: _debounce(HandleDetailUnitCostChange, _debounceTime),
		HandleDetailExtendedCostChange: _debounce(HandleDetailExtendedCostChange, _debounceTime),
		HandleDetailCustomerDiscountChange: _debounce(HandleDetailCustomerDiscountChange, _debounceTime),
		HandleDetailUnitPriceChange: _debounce(HandleDetailUnitPriceChange, _debounceTime),
		HandleDetailExtendedPriceChange: _debounce(HandleDetailExtendedPriceChange, _debounceTime),
		HandleDetailGrossProfitChange: _debounce(HandleDetailGrossProfitChange, _debounceTime),
		HandleDetailGrossProfitPercentageChange: _debounce(HandleDetailGrossProfitPercentageChange, _debounceTime),
        HandleDetailDurationChange:_debounce(HandleDetailDurationChange, _debounceTime)
	};
})($,sap.ui.getCore(),_);