import config from "../../config";
import { getGrantToken } from "../../lib/bkash";
import httpStatus from "http-status";
import { AppError } from "../../utility/AppError";

const createPayment = async () => {
	const bkashIdToken = await getGrantToken();
	if (!bkashIdToken) {
		throw new AppError(httpStatus.NOT_FOUND, "No Bkash Access Token Found!");
	}
	console.log(bkashIdToken, "from Payment Service");

	const bkashCreatePaymentResponse = await fetch(
		`
        ${config.bkash_base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: bkashIdToken,
				"X-App-Key": config.bkash_app_key,
			},
			body: JSON.stringify({
				mode: "0011",
				// payerReference: "0123456789", //user email or phone number
				payerReference: "01886051120", //user email or phone number
				callbackURL: `${config.bkash_callback_url}/donationRequest/confirm/payment/callback`,
				amount: "10",
				currency: "BDT",
				intent: "sale",
				// merchantInvoiceNumber: "Inv4" // apppointment id
				merchantInvoiceNumber: "1234567", // apppointment id
			}),
		},
	);
	const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();
	return bkashCreatePaymentResult;
};

export const paymentService = {
	createPayment,
};
