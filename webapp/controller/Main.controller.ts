import JSONModel from "sap/ui/model/json/JSONModel";
import { getAllActiveStocks } from "../model/common/StocksApi";
import BaseController from "./BaseController";
import { parse } from "papaparse";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import { IActiveStock } from "../interface/IActiveStock";
import list from "../model/list.json";

/**
 * @namespace sap.com.cashflow.controller
 */
export default class Main extends BaseController {
	public onInit(): void {
		this._getAllActiveStocks();
	}

	public onSearch(oEvent: any): void {
		// add filter for search
		var aFilters = [];
		var sQuery = oEvent.getSource().getValue();
		if (sQuery && sQuery.length > 0) {
			var filter = new Filter("symbol", FilterOperator.Contains, sQuery);
			//var filter2 = new Filter("name", FilterOperator.Contains, sQuery);
			aFilters.push(filter);
			//aFilters.push(filter2);
		}

		// update list binding
		var oList = this.byId("wTable");
		var oBinding = oList.getBinding("items");
		// @ts-ignore
		oBinding.filter(aFilters, "Application");
	}

	public onPress(oEvent: any): void {
		const symbol = oEvent
			.getSource()
			.getBindingContext("WorklistModel")
			.getProperty("symbol");
		this.getRouter().navTo("stock", {
			symbol: symbol,
		});
	}

	private _getAllActiveStocks() {
		getAllActiveStocks()
			.then((response) => {
				const responseData = response.data;
				let parsedData: IActiveStock[] = [];

				if (Object.keys(responseData).length === 0) {
					let oModel = new JSONModel();

					oModel.loadData("../model/list.json");
					this.setModel(oModel, "WorklistModel");
					return;
				}

				parse(responseData, {
					header: true,
					dynamicTyping: true,
					complete: (result) => {
						// Handle the parsed data
						// @ts-ignore
						parsedData = result.data;
						delete parsedData[6568];
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
			.catch((error) => {
				console.error("get axios error:", error.message);
			});
	}
}
