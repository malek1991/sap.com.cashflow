import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Format from "sap/viz/ui5/api/env/Format";
import ChartFormatter from "sap/viz/ui5/format/ChartFormatter";
import BindingMode from "sap/ui/model/BindingMode";
import UI5Element from "sap/ui/core/Element";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import List from "sap/m/List";
import StandardListItem from "sap/m/StandardListItem";
import { ButtonType } from "sap/m/library";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import SearchField from "sap/m/SearchField";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

/**
 * @namespace sap.com.cashflow.controller
 */
export default class Stock extends BaseController {
	public _symbol: string = "";
	public oVizFrame: UI5Element;
	public oDefaultDialog: Dialog;
	public _data: {
		annualReports: object[];
		quarterlyReports: object[];
	};
	public settings: {
		dataset: {
			name: "Dataset";
			defaultSelected: 1;
			values: [
				{
					name: "Small";
					value: "/betterSmall.json";
				},
				{
					name: "Medium";
					value: "/betterMedium.json";
				},
				{
					name: "Large";
					value: "/betterLarge.json";
				}
			];
		};
		series: {
			name: "Series";
			defaultSelected: 0;
			values: [
				{
					name: "1 Series";
					value: ["Revenue"];
				},
				{
					name: "2 Series";
					value: ["Revenue", "Cost"];
				}
			];
		};
		dataLabel: {
			name: "Value Label";
			defaultState: true;
		};
		axisTitle: {
			name: "Axis Title";
			defaultState: false;
		};
		dimensions: {
			fiscalDateEnding: [
				{
					name: "Fiscal Date Ending";
					value: "{fiscalDateEnding}";
				}
			];
		};
		measures: [
			{
				name: "Operating Cash Flow";
				value: "{operatingCashflow} {reportedCurrency}";
			}
		];
	};

	public onInit(): void {
		this.getRouter()
			.getRoute("stock")
			.attachPatternMatched(this._onRouteMatched, this);
	}

	private _onRouteMatched(oEvent: any) {
		this._symbol = oEvent.getParameter("arguments").symbol;
		this._getCompanyOverview();
		this._initVizFrame();
	}

	private _getCompanyOverview(): void {
		/*getCompanyOverview(this._symbol)
			.then((response) => {
				const responseData = response.data;
				let oModel = new JSONModel();

				oModel.setData(responseData);
				this.setModel(oModel, "StockModel");
			})
			.catch((error) => {
				console.error("get axios error:", error.message);
			});*/

		let oModel = new JSONModel();
		oModel.loadData("../model/data/data.json");
		this.setModel(oModel, "StockModel");
	}

	private _initVizFrame(): void {
		// @ts-ignore
		Format.numericFormatter(ChartFormatter.getInstance());
		let formatPattern = ChartFormatter.DefaultPattern;
		// set explored app's demo model on this sample
		let oModel = new JSONModel(this.settings);
		oModel.setDefaultBindingMode(BindingMode.OneWay);
		this.getView().setModel(oModel);

		let oVizFrame = (this.oVizFrame = this.getView().byId("idVizFrame"));
		// @ts-ignore
		oVizFrame.setVizProperties({
			plotArea: {
				dataLabel: {
					formatString: formatPattern.SHORTFLOAT_MFD2,
					visible: true,
				},
			},
			valueAxis: {
				label: {
					formatString: formatPattern.SHORTFLOAT,
				},
				title: {
					visible: false,
				},
			},
			categoryAxis: {
				title: {
					visible: false,
				},
			},
			title: {
				visible: false,
				text: "Revenue by City and Store Name",
			},
		});

		fetch("../model/data/cashFlow.json")
			.then((response) => response.json())
			.then((json) => {
				this._data = json;
				let model = new JSONModel();
				model.setProperty("/dataset", this._data["annualReports"]);
				oVizFrame.setModel(model);
			});

		let oPopOver = this.getView().byId("idPopOver");
		// @ts-ignore
		oPopOver.connect(oVizFrame.getVizUid());
		// @ts-ignore
		oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
	}

	public onDimensionSelected(oEvent: Event): void {
		// @ts-ignore
		let datasetRadio = oEvent.getSource();
		if (this.oVizFrame) {
			let selectIndex = datasetRadio.getSelectedIndex();
			let path = selectIndex === 0 ? "annualReports" : "quarterlyReports";
			let model = new JSONModel();

			// @ts-ignore
			model.setProperty("/dataset", this._data[path]);
			this.oVizFrame.setModel(model);
		}
	}

	public onComparePressed(): void {
		if (!this.oDefaultDialog) {
			//let oModel = new JSONModel();
			//oModel.loadData("../model/list.json");

			this.oDefaultDialog = new Dialog({
				title: "Active Stock/ETFs",
				content: new List({
					items: {
						path: "/dataset",
						template: new StandardListItem({
							title: "{name}",
							info: "{symbol}",
						}),
					},
					headerToolbar: new OverflowToolbar({
						content: [
							new ToolbarSpacer({}),
							new SearchField({
								liveChange: function (oEvent) {
									// add filter for search
									var aFilters = [];
									var sQuery = oEvent.getSource().getValue();
									if (sQuery && sQuery.length > 0) {
										var filter = new Filter(
											"symbol",
											FilterOperator.Contains,
											sQuery
										);
										//var filter2 = new Filter("name", FilterOperator.Contains, sQuery);
										aFilters.push(filter);
										//aFilters.push(filter2);
									}

									// update list binding
									//var oList = this.byId("wTable");
									// @ts-ignore
									var oBinding = this.getParent()
										.getParent()
										.getBinding("items");
									// @ts-ignore
									oBinding.filter(aFilters, "Application");
								},
								placeholder: "Search by symbol..",
								width: "20rem",
							}),
						],
					}),
				}),
				beginButton: new Button({
					type: ButtonType.Emphasized,
					text: "OK",
					press: function () {
						// @ts-ignore
						this.oDefaultDialog.close();
					}.bind(this),
				}),
				endButton: new Button({
					text: "Close",
					press: function () {
						// @ts-ignore
						this.oDefaultDialog.close();
					}.bind(this),
				}),
			});

			fetch("../model/data/list.json")
				.then((response) => response.json())
				.then((json) => {
					this._data = json;
					let model = new JSONModel();
					model.setProperty("/dataset", json);
					this.oDefaultDialog.setModel(model);
				});

			// to get access to the controller's model
			this.getView().addDependent(this.oDefaultDialog);
		}

		this.oDefaultDialog.open();
	}
}
