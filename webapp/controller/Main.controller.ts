import JSONModel from "sap/ui/model/json/JSONModel";
import { getAllActiveStocks } from "../model/common/StocksApi";
import BaseController from "./BaseController";
import { parse } from "papaparse";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

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
			aFilters.push(filter);
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
				let parsedData = {};

				parse(responseData, {
					header: true,
					dynamicTyping: true,
					complete: (result) => {
						// Handle the parsed data
						parsedData = result.data;
					},
					error: (error: Error) => {
						// Handle parsing errors
						console.error("CSV Parsing Error:", error.message);
					},
				});

				var oModel = new JSONModel();

				oModel.setData(parsedData);
				this.setModel(oModel, "WorklistModel");
			})
			.catch((error) => {
				console.error("get axios error:", error.message);
			});
	}
}
