import { PaymentItemType } from "../../../generated/prisma/enums";

export interface ICreatePayment {
	requestId: string;
}

export interface IPaymentItem {
	type: PaymentItemType;
	description: string;
	amount: number;
}

export interface IBkashCreatePaymentResponse {
	paymentID?: string;
	paymentId?: string;
	bkashURL?: string;
	bKashURL?: string;
	transactionStatus?: string;
	statusCode?: string;
	statusMessage?: string;
	errorCode?: string;
	errorMessage?: string;
	[key: string]: unknown;
}

export interface IBkashExecutePaymentResponse {
	paymentID?: string;
	paymentId?: string;
	trxID?: string;
	transactionStatus?: string;
	statusCode?: string;
	statusMessage?: string;
	errorCode?: string;
	errorMessage?: string;
	amount?: string;
	currency?: string;
	merchantInvoiceNumber?: string;
	[key: string]: unknown;
}
