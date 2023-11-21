import { AxiosResponse } from "axios";
import { ICompanyOverview } from "../../interface/ICompanyOverview";
import { get } from "../BaseApi";
import { API_KEY } from "../../utils/Constants";
import { ICompanyCashflow } from "../../interface/ICompanyCashflow";

export const getAllActiveStocks = (): Promise<any> => {
	return get(
		`https://www.alphavantage.co/query?function=LISTING_STATUS&date=2014-07-10&apikey=${API_KEY}`
	);
};

export const getCompanyOverview = (
	symbol: string
): Promise<AxiosResponse<any, ICompanyOverview>> => {
	return get(
		`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`
	);
};

export const getCompanyCashflow = (
	symbol: string
): Promise<AxiosResponse<any, ICompanyCashflow>> => {
	return get(
		`https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${symbol}&apikey=${API_KEY}`
	);
};
