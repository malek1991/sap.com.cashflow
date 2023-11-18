import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import axios from "axios";
import JSONModel from "sap/ui/model/json/JSONModel";
import { parse } from "papaparse";

/**
 * @namespace sap.com.cashflow.controller
 */
export default class Main extends BaseController {
	public onInit(): void {
		this.sayHello();
	}

	public sayHello(): void {
		//MessageBox.show("Hello World!");

		this._get(
			"https://www.alphavantage.co/query?function=LISTING_STATUS&date=2014-07-10&state=delisted&apikey=demo",
			"csv"
		);
	}

	private _get(apiEndpoint: string, responseFormat: string = "json"): void {
		//const papa = require("papaparse");
		// Make the API call using Axios
		axios
			.get(apiEndpoint)
			.then((response) => {
				// Handle the API response data
				const responseData = response.data;
				console.log(responseData);
				if (responseFormat === "cvs") {
					parse(response.data, {
						header: true, // Assumes the first row in the CSV file contains headers
						dynamicTyping: true, // Automatically detect and convert numeric values
						complete: (result: any) => {
							// Handle the parsed data
							const parsedData = result.data;
							console.log(parsedData);

							// Perform further actions with the parsed data, e.g., update the model
						},
						error: (error: any) => {
							// Handle parsing errors
							console.error("CSV Parsing Error:", error.message);

							// Show an error message to the user
							MessageBox.error("Error parsing CSV data");
						},
					});
				}

				var oModel = new JSONModel();

				oModel.setData(response);

				return oModel;
			})
			.catch((error) => {
				//nReject(error);
				// Show an error message to the user
				MessageBox.error("Error fetching data from the API");
			});
	}
}
