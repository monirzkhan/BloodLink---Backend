import {
	DonorOfferStatus,
	PaymentItemType,
	PaymentStatus,
	ReservationStatus,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import httpStatus from "http-status";

import {
	createBkashPayment,
	executeBkashPayment,
	queryBkashPayment,
} from "./bkash.service";

import type { ICreatePayment } from "./payment.interface";
import path from "node:path";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";

// const createPayment = async () => {
// 	const bkashIdToken = await getGrantToken();
// 	if (!bkashIdToken) {
// 		throw new AppError(httpStatus.NOT_FOUND, "No Bkash Access Token Found!");
// 	}
// 	// console.log(bkashIdToken, "from Payment Service");

// 	const bkashCreatePaymentResponse = await fetch(
// 		`
//         ${config.bkash_base_url}/tokenized/checkout/create`,
// 		{
// 			method: "POST",
// 			headers: {
// 				"Content-Type": "application/json",
// 				Accept: "application/json",
// 				Authorization: bkashIdToken,
// 				"X-App-Key": config.bkash_app_key,
// 			},
// 			body: JSON.stringify({
// 				mode: "0011",
// 				// payerReference: "0123456789", //user email or phone number
// 				payerReference: "01886051120", //user email or phone number
// 				callbackURL: `${config.bkash_callback_url}/donationRequest/confirm/payment/callback`,
// 				amount: "10",
// 				currency: "BDT",
// 				intent: "sale",
// 				// merchantInvoiceNumber: "Inv4" // apppointment id
// 				merchantInvoiceNumber: "1234567", // apppointment id
// 			}),
// 		},
// 	);
// 	const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();
// 	return bkashCreatePaymentResult;
// };

const generatePaymentNumber = () => {
	return `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, "0")}`;
};

const generateMerchantInvoiceNumber = (requestNumber: string) => {
	return `${requestNumber}-${Date.now()}`;
};

const createPayment = async (userId: string, payload: ICreatePayment) => {
	const { requestId } = payload;

	const request = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
		include: {
			createdBy: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
			donors: {
				where: {
					status: DonorOfferStatus.ACCEPTED,
				},
				include: {
					donor: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
					reservation: true,
				},
			},
			payments: {
				where: {
					status: PaymentStatus.SUCCESS,
				},
				select: {
					id: true,
				},
			},
		},
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
	}

	if (request.createdById !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only the requester can make this payment",
		);
	}

	if (request.payments.length > 0) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Payment has already been completed for this request",
		);
	}

	const acceptedOffer = request.donors[0];

	if (!acceptedOffer) {
		throw new AppError(
			httpStatus.CONFLICT,
			"No donor has accepted this request yet",
		);
	}

	if (!acceptedOffer.reservation) {
		throw new AppError(httpStatus.CONFLICT, "Donor reservation was not found");
	}

	if (
		acceptedOffer.reservation.status !== ReservationStatus.RESERVED &&
		acceptedOffer.reservation.status !== ReservationStatus.PAYMENT_PENDING
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Donor reservation is no longer available for payment",
		);
	}

	/**
	 *  business fee calculation.
	 */
	const platformServiceFee = 49;

	const transportFee = 300;

	const totalAmount = platformServiceFee + transportFee;

	const paymentNumber = generatePaymentNumber();

	const merchantInvoiceNumber = generateMerchantInvoiceNumber(
		request.requestNumber,
	);

	const payment = await prisma.$transaction(
		async (tx) => {
			const existingPayment = await tx.payment.findFirst({
				where: {
					requestId,
					status: {
						in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
					},
				},
			});

			if (existingPayment) {
				return existingPayment;
			}

			const createdPayment = await tx.payment.create({
				data: {
					paymentNumber,
					requestId,
					payerId: userId,
					provider: "BKASH",
					amount: totalAmount,
					currency: "BDT",
					merchantInvoiceNumber,
					payerReference: request.createdBy.phone || undefined,
					status: PaymentStatus.PROCESSING,
				},
			});

			await tx.paymentItem.createMany({
				data: [
					{
						paymentId: createdPayment.id,
						type: PaymentItemType.PLATFORM_SERVICE,
						description: "Blood Link platform service fee",
						amount: platformServiceFee,
					},
					{
						paymentId: createdPayment.id,
						type: PaymentItemType.TRANSPORT,
						description: "Blood donor transport fee",
						amount: transportFee,
					},
				],
			});

			await tx.donorReservation.update({
				where: {
					id: acceptedOffer.reservation!.id,
				},
				data: {
					status: ReservationStatus.PAYMENT_PENDING,
				},
			});

			return createdPayment;
		},
		{
			isolationLevel: "Serializable",
		},
	);

	const bkashResponse = await createBkashPayment({
		payerReference: request.createdBy.phone || `${request.requestNumber}`,
		amount: totalAmount.toFixed(2),
		currency: "BDT",
		merchantInvoiceNumber,
	});

	const bkashPaymentId = bkashResponse.paymentID || bkashResponse.paymentId;

	await prisma.payment.update({
		where: {
			id: payment.id,
		},
		data: {
			bkashPaymentId,
			gatewayResponse: bkashResponse as object,
		},
	});

	return {
		paymentId: payment.id,
		paymentNumber: payment.paymentNumber,
		amount: totalAmount,
		currency: "BDT",
		bkashPaymentId,
		bkashURL: bkashResponse.bkashURL || bkashResponse.bKashURL,
	};
};

const executePayment = async (userId: string, bkashPaymentId: string) => {
	const payment = await prisma.payment.findUnique({
		where: {
			bkashPaymentId,
		},
		include: {
			request: {
				include: {
					donors: {
						where: {
							status: DonorOfferStatus.ACCEPTED,
						},
						include: {
							donor: true,
							reservation: true,
						},
					},
					createdBy: true,
				},
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (payment.payerId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not authorized to execute this payment",
		);
	}

	if (payment.status === PaymentStatus.SUCCESS) {
		return payment;
	}

	const bkashResponse = await executeBkashPayment(bkashPaymentId);

	if (
		bkashResponse.transactionStatus !== "Completed" &&
		bkashResponse.statusCode !== "0000"
	) {
		await prisma.payment.update({
			where: {
				id: payment.id,
			},
			data: {
				status: PaymentStatus.FAILED,
				failureReason:
					bkashResponse.statusMessage ||
					bkashResponse.errorMessage ||
					"bKash payment failed",
				gatewayResponse: bkashResponse as object,
			},
		});

		throw new AppError(
			httpStatus.BAD_REQUEST,
			bkashResponse.statusMessage || "bKash payment failed",
		);
	}

	const trxId = bkashResponse.trxID;

	const updatedPayment = await prisma.$transaction(
		async (tx) => {
			const updated = await tx.payment.update({
				where: {
					id: payment.id,
				},
				data: {
					status: PaymentStatus.SUCCESS,
					bkashTrxId: trxId,
					paidAt: new Date(),
					gatewayResponse: bkashResponse as object,
				},
			});

			const acceptedOffer = payment.request.donors[0];

			if (acceptedOffer?.reservation) {
				await tx.donorReservation.update({
					where: {
						id: acceptedOffer.reservation.id,
					},
					data: {
						status: ReservationStatus.CONFIRMED,
					},
				});
			}

			return updated;
		},
		{
			isolationLevel: "Serializable",
		},
	);

	/**
	 * Send requester/donor emails AFTER
	 * the transaction is committed.
	 */

	const request = await prisma.bloodRequest.findUnique({
		where: {
			id: payment.requestId,
		},
		include: {
			createdBy: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
			donors: {
				where: {
					status: DonorOfferStatus.ACCEPTED,
				},
				include: {
					donor: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
							donorProfile: true,
						},
					},
					reservation: true,
				},
			},
			payments: {
				where: {
					status: PaymentStatus.SUCCESS,
				},
				select: {
					id: true,
				},
			},
		},
	});
	const requester = request?.createdBy;
	const donors = request?.donors[0];
	//send email to requester
	if (requester?.email) {
		const templatePath = path.join(
			process.cwd(),
			"src",
			"app",
			"templates",
			"payment",
			"payment-confirmation-requester.ejs",
		);

		const templateData = {
			requesterName: requester.name,

			requestNumber: request?.requestNumber,
			bloodGroup: request?.bloodGroup,

			amountPaid: `৳${payment.amount}`,
			paymentMethod: "bKash",
			transactionId: payment.bkashTrxId,

			donorName: donors?.donor.name,
			donorBloodGroup: donors?.donor.donorProfile?.bloodGroup,
			donorPhone: donors?.donor.phone,
			donorEmail: donors?.donor.email,

			requestUrl: `${config.frontend_url}/blood-requests/${request?.id}`,
		};

		const html = await ejs.renderFile(templatePath, templateData);

		console.log(`Sending email to: ${requester?.email}`);

		await transporter.sendMail({
			from: `"BloodLink" <${config.smtp_sender}>`,
			to: requester.email,
			subject: `🩸 Payment Confirmation`,
			html,
		});

		console.log(`✅ Email sent to ${requester.email}`);
	} else {
		console.log(`⚠️ Requester ${requester?.name} has no email`);
	}

	//send email to donor
	if (donors?.donor.email) {
		const templatePath = path.join(
			process.cwd(),
			"src",
			"app",
			"templates",
			"payment",
			"payment-confirmation-donor.ejs",
		);
		const templateData = {
			donorName: donors.donor.name,

			requestNumber: request?.requestNumber,
			bloodGroup: request?.bloodGroup,
			unitsRequired: request?.unitsRequired,

			requiredDate: request?.requiredDate,
			requiredTime: request?.requiredTime,

			requesterName: requester?.name,
			requesterPhone: requester?.phone,
			requesterEmail: requester?.email,

			appointmentUrl: `${config.frontend_url}/blood-requests/${request?.id}/appointment`,

			requestUrl: `${config.frontend_url}/blood-requests/${request?.id}`,
		};
		const html = await ejs.renderFile(templatePath, templateData);

		console.log(`Sending email to: ${donors.donor.email}`);

		await transporter.sendMail({
			from: `"BloodLink" <${config.smtp_sender}>`,
			to: donors.donor.email,
			subject: `🩸 Payment Confirmation`,
			html,
		});

		console.log(`✅ Email sent to ${donors.donor.email}`);
	} else {
		console.log(`⚠️ Donor ${donors?.donor.email} has no email`);
	}

	return updatedPayment;
};

const handleBkashCallback = async (bkashPaymentId: string) => {
	const payment = await prisma.payment.findUnique({
		where: {
			bkashPaymentId,
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (payment.status === PaymentStatus.SUCCESS) {
		return payment;
	}

	const result = await executeBkashPayment(bkashPaymentId);

	const success =
		result.transactionStatus === "Completed" || result.statusCode === "0000";

	if (!success) {
		await prisma.payment.update({
			where: {
				id: payment.id,
			},
			data: {
				status: PaymentStatus.FAILED,
				failureReason:
					result.statusMessage || result.errorMessage || "Payment failed",
				gatewayResponse: result as object,
			},
		});

		return null;
	}

	const updatedPayment = await prisma.$transaction(
		async (tx) => {
			const updated = await tx.payment.update({
				where: {
					id: payment.id,
				},
				data: {
					status: PaymentStatus.SUCCESS,
					bkashTrxId: result.trxID,
					paidAt: new Date(),
					gatewayResponse: result as object,
				},
			});

			const acceptedOffer = await tx.bloodRequestDonor.findFirst({
				where: {
					requestId: payment.requestId,
					status: DonorOfferStatus.ACCEPTED,
				},
				include: {
					reservation: true,
				},
			});

			if (acceptedOffer?.reservation) {
				await tx.donorReservation.update({
					where: {
						id: acceptedOffer.reservation.id,
					},
					data: {
						status: ReservationStatus.CONFIRMED,
					},
				});
			}

			return updated;
		},
		{
			isolationLevel: "Serializable",
		},
	);

	return updatedPayment;
};

export const paymentService = {
	createPayment,
	executePayment,
	handleBkashCallback,
};
