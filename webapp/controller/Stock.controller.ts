import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Format from "sap/viz/ui5/api/env/Format";
import ChartFormatter from "sap/viz/ui5/format/ChartFormatter";
import BindingMode from "sap/ui/model/BindingMode";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import { ButtonType } from "sap/m/library";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import SearchField from "sap/m/SearchField";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import VBox from "sap/m/VBox";
import SelectList from "sap/m/SelectList";
import ListItem from "sap/ui/core/ListItem";
import { ICashflow, ICompanyCashflow } from "../interface/ICompanyCashflow";
import {
	getAllActiveStocks,
	getCompanyCashflow,
	getCompanyOverview,
} from "../model/common/StocksApi";
import { LOCAL_ENV } from "../utils/Constants";
import { ICompanyOverview } from "../interface/ICompanyOverview";
import RadioButtonGroup from "sap/m/RadioButtonGroup";
import VizFrame from "sap/viz/ui5/controls/VizFrame";
import FeedItem from "sap/viz/ui5/controls/common/feeds/FeedItem";
import FlattenedDataset from "sap/viz/ui5/data/FlattenedDataset";
import { IActiveStock } from "../interface/IActiveStock";
import { parse } from "papaparse";

/**
 * @namespace sap.com.cashflow.controller
 */
export default class Stock extends BaseController {
	public _symbol: string = "";
	public oVizFrame: VizFrame;
	public oDefaultDialog: Dialog;
	public _data: ICompanyCashflow;
	public settings: {
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
				value: "{operatingCashflow}";
			}
		];
	};

	/**
	 * life cycle methos on init
	 */
	public onInit(): void {
		this.getRouter()
			.getRoute("stock")
			.attachPatternMatched(this._onRouteMatched, this);
	}

	/**
	 * on Reset Pressed
	 */
	public onResetPressed(): void {
		var feedValueAxis = this.getView().byId("valueAxisFeed") as FeedItem;

		// @ts-ignore
		this._data.annualReports.forEach((cashflow: ICashflow) => {
			delete cashflow.competitorOperatingCashflow;
		});

		// @ts-ignore
		this._data.quarterlyReports.forEach((cashflow: ICashflow) => {
			delete cashflow.competitorOperatingCashflow;
		});

		this._resetVizFrameData();

		this.oVizFrame.removeFeed(feedValueAxis);
		feedValueAxis.setValues([this._data.symbol]);
		this.oVizFrame.addFeed(feedValueAxis);
	}

	/**
	 * on Dimension Selected
	 * @param oEvent
	 */
	public onDimensionSelected(oEvent: Event): void {
		// @ts-ignore
		let datasetRadio = oEvent.getSource();
		if (this.oVizFrame) {
			let selectIndex = datasetRadio.getSelectedIndex();
			let path = selectIndex === 0 ? "annualReports" : "quarterlyReports";
			let model = this.oVizFrame.getModel();
			// @ts-ignore
			model.setProperty("/dataset", this._data[path]);
			this.oVizFrame.setModel(model);
		}
	}

	public onChartTypeSelected(oEvent: { getSource: () => RadioButtonGroup }) {
		let datasetRadio = oEvent.getSource();
		let sType = datasetRadio.getSelectedButton().getText().toLowerCase();

		this.oVizFrame.setVizType(sType);
		this._resetVizFrameData();
	}

	/**
	 * on Compare Pressed
	 */
	public onComparePressed(): void {
		if (!this.oDefaultDialog) {
			let that = this;
			this.oDefaultDialog = new Dialog({
				title: "Active Stock/ETFs",
				contentWidth: "30rem",
				content: new VBox({
					items: [
						new OverflowToolbar({
							content: [
								new ToolbarSpacer({}),
								new SearchField({
									liveChange: function (oEvent) {
										var aFilters = [];
										var sQuery = oEvent.getSource().getValue();
										if (sQuery && sQuery.length > 0) {
											var filter = new Filter(
												"symbol",
												FilterOperator.Contains,
												sQuery
											);
											aFilters.push(filter);
										}
										// @ts-ignore
										var oBinding = this.getParent()
											.getParent()
											.getItems()[1]
											.getBinding("items");
										// @ts-ignore
										oBinding.filter(aFilters, "Application");
									},
									placeholder: "Search by symbol..",
									width: "10rem",
								}),
							],
						}),
						new SelectList("idMarketList", {
							showSecondaryValues: true,
							items: {
								path: "/dataset",
								template: new ListItem({
									text: "{name}",
									additionalText: "{symbol}",
								}),
							},
						}),
					],
				}),
				beginButton: new Button({
					type: ButtonType.Emphasized,
					text: "OK",
					press: function (oEvent: any) {
						// @ts-ignore
						that._onCompetetiveStockSelected(oEvent);
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

			if (LOCAL_ENV) {
				fetch("../model/data/list.json")
					.then((response) => response.json())
					.then((json) => {
						let model = new JSONModel();

						model.setProperty("/dataset", json);
						this.oDefaultDialog.setModel(model);
					});
			} else {
				getAllActiveStocks()
					.then((response: any) => {
						const responseData = response.data;
						let parsedData: IActiveStock[] = [];

						parse(responseData, {
							header: true,
							dynamicTyping: true,
							complete: (result) => {
								// @ts-ignore
								parsedData = result.data;
								//delete parsedData[6569];
								parsedData.forEach((item: IActiveStock, index: number) => {
									if (typeof item.symbol !== "string") delete parsedData[index];
								});

								let model = new JSONModel();

								model.setProperty("/dataset", parsedData);
								this.oDefaultDialog.setModel(model);
							},
							error: (error: Error) => {
								// Handle parsing errors
								console.error("CSV Parsing Error:", error.message);
							},
						});

						let oModel = new JSONModel();

						oModel.setData(parsedData);
						this.setModel(oModel, "WorklistModel");
					})
					.catch((error: Error) => {
						console.error("get axios error:", error.message);
					});
			}

			// to get access to the controller's model
			this.getView().addDependent(this.oDefaultDialog);
		}

		this.oDefaultDialog.open();
	}

	/**
	 * on Route Matched
	 * @param oEvent
	 */
	private _onRouteMatched(oEvent: any) {
		this._symbol = oEvent.getParameter("arguments").symbol;
		this._getCompanyOverview();
		this._initVizFrame();
	}

	/**
	 * get Company Overview
	 */
	private _getCompanyOverview(): void {
		if (LOCAL_ENV) {
			let oModel = new JSONModel();
			oModel.loadData("../model/data/data.json");
			this.setModel(oModel, "StockModel");
		} else {
			getCompanyOverview(this._symbol)
				.then((response) => {
					const responseData = response.data as ICompanyOverview;
					let oModel = new JSONModel();

					oModel.setData(responseData);
					this.setModel(oModel, "StockModel");
				})
				.catch((error) => {
					console.error("get axios error:", error.message);
				});
		}
	}

	/**
	 * init Viz Frame
	 */
	private _initVizFrame(): void {
		// @ts-ignore
		Format.numericFormatter(ChartFormatter.getInstance());
		let formatPattern = ChartFormatter.DefaultPattern;
		// set explored app's demo model on this sample
		let oModel = new JSONModel(this.settings);
		oModel.setDefaultBindingMode(BindingMode.OneWay);
		this.getView().setModel(oModel);

		let oVizFrame = (this.oVizFrame = this.getView().byId(
			"idVizFrame"
		) as VizFrame);
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
					visible: true,
				},
			},
			title: {
				visible: false,
				text: "Revenue by City and Store Name",
			},
		});

		if (LOCAL_ENV) {
			fetch("../model/data/cashFlow.json")
				.then((response) => response.json())
				.then((json) => {
					this._data = json;
					let model = new JSONModel();

					model.setProperty("/dataset", this._data.annualReports);
					model.setProperty("/companySymbol", [this._data.symbol]);
					oVizFrame.setModel(model);
				});
		} else {
			getCompanyCashflow(this._symbol)
				.then((response: any) => {
					const responseData = response.data as ICompanyCashflow;
					let model = new JSONModel();

					this._data = responseData;
					model.setProperty("/dataset", this._data.annualReports);
					model.setProperty("/companySymbol", [this._data.symbol]);
					model.setProperty("/mesures", [
						{ name: this._data.symbol, value: "{operatingCashflow}" },
					]);
					oVizFrame.setModel(model);
				})
				.catch((error: Error) => {
					console.error("get axios error:", error.message);
				});
		}

		let oPopOver = this.getView().byId("idPopOver");
		// @ts-ignore
		oPopOver.connect(oVizFrame.getVizUid());
		// @ts-ignore
		oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
	}

	/**
	 * on Competetive Stock Selected
	 * @param _oEvent
	 * @returns
	 */
	private _onCompetetiveStockSelected(_oEvent: Event): void {
		if (!this.oDefaultDialog) return;

		let oVox = this.oDefaultDialog.getContent()[0] as VBox;
		let oSelectList = oVox.getItems()[1] as SelectList;
		let oListItem = oSelectList.getSelectedItem() as ListItem;
		let symbol = oListItem.getAdditionalText();

		this._getCompetitorCompanyCachflow(symbol);
	}

	/**
	 * get Competitor Company Cachflow
	 * @param symbol
	 * @returns
	 */
	private _getCompetitorCompanyCachflow(symbol: string): void {
		if (!symbol || symbol === "") return;

		if (LOCAL_ENV) {
			fetch("../model/data/cashFlow2.json")
				.then((response) => response.json())
				.then((json) => {
					this._mergeCompetitorCashflow(json);
				});
		} else {
			getCompanyCashflow(symbol)
				.then((response: any) => {
					const responseData = response.data as ICompanyCashflow;
					this._mergeCompetitorCashflow(responseData);
				})
				.catch((error: Error) => {
					console.error("get axios error:", error.message);
				});
		}
	}

	/**
	 * merge Competitor Cashflow
	 * @param data
	 */
	private _mergeCompetitorCashflow(data: ICompanyCashflow): void {
		// @ts-ignore
		this._data.annualReports.forEach((cashflow: ICashflow) => {
			data.annualReports.forEach((competitorCashflow: ICashflow) => {
				if (cashflow.fiscalDateEnding === competitorCashflow.fiscalDateEnding) {
					cashflow.competitorOperatingCashflow =
						competitorCashflow.operatingCashflow;
				}
			});
		});

		// @ts-ignore
		this._data.quarterlyReports.forEach((cashflow: ICashflow) => {
			data.quarterlyReports.forEach((competitorCashflow: ICashflow) => {
				if (cashflow.fiscalDateEnding === competitorCashflow.fiscalDateEnding) {
					cashflow.competitorOperatingCashflow =
						competitorCashflow.operatingCashflow;
				}
			});
		});

		var dataset = {
			data: {
				path: "/dataset",
			},
		};

		// @ts-ignore
		dataset.dimensions = [
			{
				name: "Fiscal Date Ending",
				value: "{fiscalDateEnding}",
			},
		];
		// @ts-ignore
		dataset.measures = [
			{
				name: this._data.symbol,
				value: "{operatingCashflow}",
			},
			{
				name: data.symbol,
				value: "{competitorOperatingCashflow}",
			},
		];
		var oDataset = new FlattenedDataset(dataset);
		this.oVizFrame.setDataset(oDataset);

		this._resetVizFrameData(data.symbol);

		let feedValueAxis = this.getView().byId("valueAxisFeed") as FeedItem;
		this.oVizFrame.removeFeed(feedValueAxis);
		feedValueAxis.setValues([this._data.symbol, data.symbol]);
		this.oVizFrame.addFeed(feedValueAxis);
	}

	/**
	 *
	 * @param symbol
	 */
	private _resetVizFrameData(symbol?: string): void {
		let model = this.oVizFrame.getModel() as JSONModel;
		let oRadioButtonGroup = this.getView().byId(
			"datasetRadioGroup"
		) as RadioButtonGroup;
		let selectIndex = oRadioButtonGroup.getSelectedIndex();
		let path = selectIndex === 0 ? "annualReports" : "quarterlyReports";
		// @ts-ignore
		model.setProperty("/dataset", this._data[path]);
		if (symbol) {
			model.setProperty("/competitorCompanySymbol", [symbol]);
		}
		this.oVizFrame.setModel(model);
	}
}
