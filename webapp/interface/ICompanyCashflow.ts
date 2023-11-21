export interface ICashflow {
	fiscalDateEnding: string;
	reportedCurrency: string;
	operatingCashflow: string;
	competitorOperatingCashflow: string;
	paymentsForOperatingActivities: string;
	proceedsFromOperatingActivities: string;
	changeInOperatingLiabilities: string;
	changeInOperatingAssets: string;
	depreciationDepletionAndAmortization: string;
	capitalExpenditures: string;
	changeInReceivables: string;
	changeInInventory: string;
	profitLoss: string;
	cashflowFromInvestment: string;
	cashflowFromFinancing: string;
	proceedsFromRepaymentsOfShortTermDebt: string;
	paymentsForRepurchaseOfCommonStock: string;
	paymentsForRepurchaseOfEquity: string;
	paymentsForRepurchaseOfPreferredStock: string;
	dividendPayout: string;
	dividendPayoutCommonStock: string;
	dividendPayoutPreferredStock: string;
	proceedsFromIssuanceOfCommonStock: string;
	proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet: string;
	proceedsFromIssuanceOfPreferredStock: string;
	proceedsFromRepurchaseOfEquity: string;
	proceedsFromSaleOfTreasuryStock: string;
	changeInCashAndCashEquivalents: string;
	changeInExchangeRate: string;
	netIncome: string;
}

export interface ICompanyCashflow {
	symbol: string;
	annualReports: ICashflow[];
	quarterlyReports: ICashflow[];
}
