jQuery.sap.declare("gdt.salesui.util.VariantHandler");

$.sap.require("sap.ui.core.Core");
$.sap.require("gdt.salesui.lib.underscore-min");
$.sap.require("sap.ui.core.format.DateFormat");
$.sap.require("gdt.salesui.data.DataContext");
gdt.salesui.util.VariantHandler = (function($, core, _, datacontext) {

	var initialize_variant = function(view, that) {

		variantToolbar = sap.ui.getCore().byId("__toolbar3");
		defaultVariantContents = variantToolbar.removeAllContent();

		oVCreate = new sap.m.Button({
			id : "cv",
			text : "Create Variant",
			press : function() {
				_handleCreateVariant(view, that)
			}
		});

		oVManage = new sap.m.Button({
			id : "mv",
			text : "Manage Variant",
			press : function() {
				_handleManageVariant(view, that)
			}
		});

		variantToolbar.addContent(defaultVariantContents[0]);
		variantToolbar.addContent(oVCreate);
		variantToolbar.addContent(defaultVariantContents[1]);

		// setting standard variant Columns
		var table = view.byId("lineItemsTable");
		var model = core.getModel("variantColumns");
		var data = model.getData();
		var columns = table.getColumns();
		var newRow = {
			"standard" : columns
		};
		data.push(newRow);
		model.setData(data);
		var runtimeColumns = [],runtimeColumn;
		_.each(columns,function(column,order){
			runtimeColumn = {
					 "fieldText":column.getLabel( ).getText( ),	                       
                     "fieldName":"",
                     "fieldKey":column.sId.split('--')[1],
                     "visibility":true,
                     "updown": 0,
                     "order":order					
			}
			runtimeColumns.push(runtimeColumn);
		});
		core.getModel("layoutFields").setData(runtimeColumns);
		_loadAndSetVariants(false, view);
	},

	_loadAndSetVariants = function(setInfo, view) {
		busyDlg = view.byId('busyDlg');
		var deferred = $.Deferred(
				function(defer) {
					if (setInfo) {
						busyDlg.setText('Reloading Variant from SAP');
						busyDlg.open();
					}
					;

					datacontext.variant.load().done(
							function(data) {
								defaultVariant = _.find(view.getModel(
										'lineItemVariant').getData(), function(
										line) {
									return line.defaultX == true;
								})
								if (defaultVariant)
									var key = defaultVariant.key;
								_setDefaultVariantLayout(null, key, view);
								defer.resolve(data);
							}).fail(function(msg) {
						defer.reject(msg);
					})
				}).done(function() {
			// sap.m.MessageToast.show("Variants loaded");
			busyDlg.close();
		}).fail();

		return deferred;
	},

	_setDefaultVariantLayout = function(columns, key, view) {
		if (key) {
			var variantColumns = _.find(view.getModel('lineItemVariant').getData(), function(line) {
				return line.key == key;
			});
		}
		var column;
		var table = view.byId("lineItemsTable");
		var data = core.getModel("variantColumns").getData();
		var standardVariantColumns = _.pluck(data, "standard")[0];
		var removedColumns = table.removeAllColumns();
		if (variantColumns) {
			for (i = 0; i < variantColumns.layoutColumnIds.length; i++) {
				column = _.find(
								standardVariantColumns,
								function(variantColumn) {
									return (variantColumn.sId.indexOf(variantColumns.layoutColumnIds[i]) >= 0);
								});
				if (column)
					table.addColumn(column);
			}
		} else {
			_.each(standardVariantColumns, function(column) {
				table.addColumn(column)
			});
		}

		view.byId("variantManagement").setDefaultVariantKey(key);
		view.byId("variantManagement").setInitialSelectionKey(key);
	},

	_handleCreateVariant = function(view, that) {
		if (!that._oVariantCreateDialog) {
			that._oVariantCreateDialog = sap.ui.xmlfragment(
					"gdt.salesui.fragment.DetailLineItemsCreateVariantDialog",
					that);
			view.addDependent(that._oVariantCreateDialog);
		}
		view.setModel(_.clone(core.getModel('layoutFields')), "layoutFields"); // cleaning the previous data
		view.getModel("variantFields").setData([]); // cleaning the previous data
		that._oVariantCreateDialog.open();

	},

	manageVariant = function(event, view) {
		var params = event.getParameters();
		var renamed = params.renamed;
		var deleted = params.deleted;
		var def = params.def;
		// Deleting Variants
		if (deleted.length > 0) {
			for (i = 0; i < deleted.length; i++)
				datacontext.variant.remove(deleted[i]);
		}
		// updating Variants
		if (renamed.length > 0) {
			var data;
			var lines = view.getModel('lineItemVariant').getData();
			for (i = 0; i < renamed.length; i++) {
				var renamedElement = _.find(lines, function(line) {
					return line.key == renamed[i].key;
				});
				data = {
					"DefaultX" : false,
					"VariantId" : renamedElement.key,
					"Vbtyp" : "S",
					"VariantText" : renamed[i].name,
					"Columns" : renamedElement.columns
				};
				datacontext.variant.update(data);
			}
		}

		if (def) {
			var data;
			var defData = _.find(view.getModel('lineItemVariant').getData(),
					function(line) {
						return line.key == def;
					});
			if (defData) {
				data = {
					"DefaultX" : true,
					"GlobalX":defData.global,
					"VariantId" : defData.key,
					"Vbtyp" : "S",
					"VariantText" : defData.text,
					"Columns" : defData.columns
				};

			} else {
				data = {
					"DefaultX" : true,
					"VariantId" : 'STANDARD',
					"Vbtyp" : "S",
					"VariantText" : 'Standard',
					"Columns" : ''
				};
			}
			datacontext.variant.update(data);
		}

		_loadAndSetVariants(false, view);
	},

	handleSaveAndSetVariant = function(event, view) {
		var column, variantColumnsIds;
		var variantName = core.byId("idVariantName").getValue();
		if (variantName == "") {
			core.byId("idVariantName").setValueState("Error");
			return sap.m.MessageToast.show("Please enter Variant Name");
		}
		var variantDefault = core.byId("idVariantDefault").getSelected();
        var variantGlobal  = core.byId("idVariantGlobal").getSelected();
		var sortedData = _.sortBy(view.getModel("variantFields").getData(),
				function(data) {
					return data.updown;
				});
		// getting variant Columns
		var table = view.byId("lineItemsTable");
		var data = core.getModel("variantColumns").getData();
		var standardVariantColumns = _.pluck(data, "standard")[0];
		if (variantDefault) {
			var removedColumns = table.removeAllColumns();
		}
		_.each(sortedData, function(data) {
			if (variantColumnsIds == undefined)
				variantColumnsIds = data.fieldKey;
			else
				variantColumnsIds = variantColumnsIds + '/' + data.fieldKey;
			if (variantDefault) {
				column = _.find(standardVariantColumns,
								function(variantColumn) {
									return (variantColumn.sId.indexOf(data.fieldKey) > 0);
								});
				if (column)
					table.addColumn(column);
			}
		});

		view.getController()._oVariantNameSaveDialog.close();
		view.getController()._oVariantCreateDialog.close();
		var busyDlg = view.byId('busyDlg');
		var data = {
			"DefaultX" : variantDefault,
			"GlobalX":variantGlobal,
			"VariantId" : "CREATE",
			"Vbtyp" : "S",
			"VariantText" : variantName,
			"Columns" : variantColumnsIds
		};
		_saveVariant(data, busyDlg, view).always(function(data) {
			busyDlg.close();
		});
	},

	_saveVariant = function(data, busyDlg, view) {
		var deferred = $.Deferred(function(defer) {
			busyDlg.setText('Saving Variant into SAP.');
			busyDlg.open();
			datacontext.variant.create(data).done(function(data) {
				defer.resolve(data);
			}).fail(function(msg) {
				defer.reject(msg);
			})
		}).done(function() {
			sap.m.MessageToast.show("Variant is saved");
			_loadAndSetVariants(false, view);
		}).fail();

		return deferred;
	},

    addFieldtoVariant = function(event,viewController){
 	   var model = viewController.getView().getModel("layoutFields");
 	   var oLayoutData = model.getData( );
 	   var path = event.getSource().getParent().getBindingContextPath();
 	   var element = model.getProperty(path);
       var filterData = _.filter(oLayoutData, function(row){ return row.fieldKey != element.fieldKey });
       model.setData(filterData);
       var oVariantModel= viewController.getView().getModel("variantFields");
 	   var oVariantData =  oVariantModel.getData( );
 	   element.updown = oVariantData.length + 1;
 	   oVariantData.push(element) ;
 	   oVariantModel.setData( oVariantData );
    } ,
    removeFieldFromVariant = function(event,viewController) {
 	   var model= viewController.getView().getModel("variantFields");
 	   var oLayoutData = model.getData( );
 	   var path = event.getSource().getParent().getBindingContextPath();
 	   var element = model.getProperty(path);
       var filterData = _.filter(oLayoutData, function(row){ return row.fieldKey != element.fieldKey });
        sortedData = _.sortBy(filterData, function(data){ return data.updown; });
        _.each( sortedData,function(data,n){data.updown = n + 1;});
        model.setData( sortedData);
       var oVariantModel= viewController.getView().getModel("layoutFields");
 	   var oVariantData =  oVariantModel.getData( );
 	   element.updown = 0;
 	   oVariantData.push(element) ;
 	   oVariantModel.setData( oVariantData );                   	   
    } , 
    moveUpFieldInVariant=function(event,viewController){
 	   var model= viewController.getView().getModel("variantFields");
 	   var oVariantData = model.getData( );
 	   var path = event.getSource().getParent().getBindingContextPath();
 	   var currentElement = model.getProperty(path);
 	   var currIndex = currentElement.updown;
 	   if(currIndex != 1){                   		   
 		   var preIndex   = currIndex - 1;
 		   var predataElement = _.filter(oVariantData, function(element){ return ( element.updown == preIndex ) } );
 	       var filterData = _.filter(oVariantData, function(element){ return ( element.updown != currentElement.updown && element.updown != preIndex ); });
 	       currentElement.updown = currIndex - 1;
 	       var preElement = predataElement[0];
 	       preElement.updown = currIndex ;
 	       filterData.push(currentElement);
 	       filterData.push(preElement);
 	       model.setData(filterData);
 	       model.refresh("variantFields");
 	   }
        
    },
    
    moveDownFieldInVariant=function(event,viewController){
 	   var model= viewController.getView().getModel("variantFields");
 	   var oVariantData = model.getData( );
 	   var path = event.getSource().getParent().getBindingContextPath();
 	   var currentElement = model.getProperty(path);
 	   var currIndex = currentElement.updown;
 	   if(currIndex != oVariantData.length){                   		   
 		   var postIndex   = currIndex + 1;
 		   var postdataElement = _.filter(oVariantData, function(element){ return ( element.updown == postIndex ) } );
 	       var filterData = _.filter(oVariantData, function(element){ return ( element.updown != currentElement.updown && element.updown != postIndex ); });
 	       currentElement.updown = currIndex + 1;
 	       var postElement = postdataElement[0];
 	       postElement.updown = currIndex ;
 	       filterData.push(currentElement);
 	       filterData.push(postElement);
 	       model.setData(filterData);
 	       model.refresh("variantFields");
 	   }                    	   
    } 	
	
	
	
	
	
	
	return {
		initialize_variant : initialize_variant,
		manageVariant : manageVariant,
		_setDefaultVariantLayout : _setDefaultVariantLayout,
		handleSaveAndSetVariant : handleSaveAndSetVariant,
		addFieldtoVariant: addFieldtoVariant,
		removeFieldFromVariant:removeFieldFromVariant,
		moveUpFieldInVariant:moveUpFieldInVariant,
		moveDownFieldInVariant:moveDownFieldInVariant
	}

})($, sap.ui.getCore(), _, gdt.salesui.data.DataContext,
		gdt.salesui.data.DataLoader);