import { get } from "../BaseApi";

export const getAllActiveStocks = (): Promise<any> => {
	return get(
		"https://www.alphavantage.co/query?function=LISTING_STATUS&date=2014-07-10&state=delisted&apikey=demo"
	);
};
