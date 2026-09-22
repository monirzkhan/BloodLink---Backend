import config from "../../config";
import { AppError } from "../../utility/AppError";
import httpStatus from "http-status";
import type {
	IBkashCreatePaymentResponse,
	IBkashExecutePaymentResponse,
} from "./payment.interface";

const getBkashHeaders = async () => {
	const idToken = await getGrantToken();

	return {
		"Content-Type": "application/json",
		Accept: "application/json",
		Authorization: idToken,
		"X-App-Key": config.bkash_app_key,
	};
};

export const getGrantToken = async (): Promise<string> => {
	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/token/grant`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				username: config.bkash_username,
				password: config.bkash_password,
			},
			body: JSON.stringify({
				app_key: config.bkash_app_key,
				app_secret: config.bkash_app_secret,
			}),
		},
	);

	const data = await response.json();

	if (!response.ok || !data.id_token) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			data.errorMessage || "Failed to get bKash grant token",
		);
	}

	return data.id_token;
};

export const createBkashPayment = async (payload: {
	payerReference: string;
	amount: string;
	currency: string;
	merchantInvoiceNumber: string;
}) => {
	const headers = await getBkashHeaders();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				mode: "0011",
				payerReference: payload.payerReference,
				callbackURL: `${config.bkash_callback_url}/payment/bkash/callback`,
				amount: payload.amount,
				currency: payload.currency,
				intent: "sale",
				merchantInvoiceNumber: payload.merchantInvoiceNumber,
			}),
		},
	);

	const data = (await response.json()) as IBkashCreatePaymentResponse;

	if (!response.ok || data.errorCode) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			data.errorMessage || "Failed to create bKash payment",
		);
	}

	if (!data.paymentID && !data.paymentId) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"bKash did not return a payment ID",
		);
	}

	return data;
};

export const executeBkashPayment = async (
	paymentId: string,
): Promise<IBkashExecutePaymentResponse> => {
	const headers = await getBkashHeaders();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/execute`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				paymentID: paymentId,
			}),
		},
	);

	const data = (await response.json()) as IBkashExecutePaymentResponse;

	if (!response.ok || data.errorCode) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			data.errorMessage || "Failed to execute bKash payment",
		);
	}

	return data;
};

export const queryBkashPayment = async (paymentId: string) => {
	const headers = await getBkashHeaders();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/payment/status`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				paymentID: paymentId,
			}),
		},
	);

	const data = await response.json();

	if (!response.ok || data.errorCode) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			data.errorMessage || "Failed to query bKash payment",
		);
	}

	return data;
};
