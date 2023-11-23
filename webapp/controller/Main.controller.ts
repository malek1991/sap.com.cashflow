import JSONModel from "sap/ui/model/json/JSONModel";
import { getAllActiveStocks } from "../model/common/StocksApi";
import BaseController from "./BaseController";
import { parse } from "papaparse";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import { IActiveStock } from "../interface/IActiveStock";
import { LOCAL_ENV } from "../utils/Constants";

/**
 * @namespace sap.com.cashflow.controller
 */
export default class Main extends BaseController {
	public onInit(): void {
		this._getAllActiveStocks();
	}

	/**
	 *  Search handler
	 * @param oEvent
	 */
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

	/**
	 * On drill down press
	 * @param oEvent
	 */
	public onPress(oEvent: any): void {
		const symbol = oEvent
			.getSource()
			.getBindingContext("WorklistModel")
			.getProperty("symbol");
		this.getRouter().navTo("stock", {
			symbol: symbol,
		});
	}

	/**
	 * API call for get all active stocks
	 */
	private _getAllActiveStocks() {
		if (LOCAL_ENV) {
			let oModel = new JSONModel();

			oModel.loadData("../model/data/list.json");
			this.setModel(oModel, "WorklistModel");
		} else {
			getAllActiveStocks()
				.then((response) => {
					const responseData = response.data;
					let parsedData: IActiveStock[] = [];

					if (Object.keys(responseData).length === 0) {
						let oModel = new JSONModel();

						oModel.loadData("../model/data/list.json");
						this.setModel(oModel, "WorklistModel");
						return;
					}

					parse(responseData, {
						header: true,
						dynamicTyping: true,
						complete: (result) => {							
							// @ts-ignore
							parsedData = result.data;
							parsedData.forEach((item: IActiveStock, index: number) => {
								if (typeof item.symbol !== "string") delete parsedData[index];
							});
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
}
