import HttpStatus from "http-status";

import {
	BloodRequestStatus,
	DonorAvailability,
	DonorOfferStatus,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";

import type { IUpdateDonorOfferStatus } from "./donorOffer.interface";
import path from "path";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";

const updateDonorOfferStatus = async (
	donorId: string,
	offerId: string,
	payload: IUpdateDonorOfferStatus,
) => {
	const { status } = payload;

	const offer = await prisma.bloodRequestDonor.findUnique({
		where: {
			id: offerId,
		},
		include: {
			request: true,
			donor: {
				include: {
					donorProfile: true,
				},
			},
			reservation: true,
		},
	});

	if (!offer) {
		throw new AppError(HttpStatus.NOT_FOUND, "Donor offer not found");
	}

	// -----------------------------------------
	// 1. Authorization
	// -----------------------------------------

	if (offer.donorId !== donorId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to update this donor offer",
		);
	}

	// -----------------------------------------
	// 2. Offer must still be actionable
	// -----------------------------------------

	if (
		offer.status !== DonorOfferStatus.OFFERED &&
		offer.status !== DonorOfferStatus.VIEWED
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			`This offer cannot be responded to because its current status is ${offer.status}`,
		);
	}

	// -----------------------------------------
	// 3. Check offer expiration
	// -----------------------------------------

	if (offer.expiresAt && offer.expiresAt.getTime() <= Date.now()) {
		await prisma.bloodRequestDonor.update({
			where: {
				id: offer.id,
			},
			data: {
				status: DonorOfferStatus.EXPIRED,
			},
		});

		throw new AppError(HttpStatus.BAD_REQUEST, "This donor offer has expired");
	}

	// -----------------------------------------
	// 4. Request must still be active
	// -----------------------------------------

	const inactiveRequestStatuses: BloodRequestStatus[] = [
		BloodRequestStatus.COMPLETED,
		BloodRequestStatus.CANCELLED,
		BloodRequestStatus.EXPIRED,
	];

	if (inactiveRequestStatuses.includes(offer.request.status)) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"This blood request is no longer active",
		);
	}

	// -----------------------------------------
	// 5. DECLINE
	// -----------------------------------------

	if (status === DonorOfferStatus.DECLINED) {
		return await prisma.$transaction(async (tx) => {
			const updatedOffer = await tx.bloodRequestDonor.update({
				where: {
					id: offer.id,
				},
				data: {
					status: DonorOfferStatus.DECLINED,
					respondedAt: new Date(),
				},
			});

			return updatedOffer;
		});
	}

	// -----------------------------------------
	// 6. ACCEPT
	// -----------------------------------------

	const result = await prisma.$transaction(
		async (tx) => {
			// Re-read the offer inside transaction
			const currentOffer = await tx.bloodRequestDonor.findUnique({
				where: {
					id: offer.id,
				},
				include: {
					request: true,
				},
			});

			if (!currentOffer) {
				throw new AppError(HttpStatus.NOT_FOUND, "Donor offer not found");
			}

			if (
				currentOffer.status !== DonorOfferStatus.OFFERED &&
				currentOffer.status !== DonorOfferStatus.VIEWED
			) {
				throw new AppError(
					HttpStatus.BAD_REQUEST,
					"This offer has already been responded to",
				);
			}

			// Check expiry
			if (currentOffer.expiresAt && currentOffer.expiresAt <= new Date()) {
				await tx.bloodRequestDonor.update({
					where: {
						id: currentOffer.id,
					},
					data: {
						status: DonorOfferStatus.EXPIRED,
					},
				});

				throw new AppError(
					HttpStatus.BAD_REQUEST,
					"This donor offer has expired",
				);
			}

			// Check request
			if (
				currentOffer.request.status === BloodRequestStatus.COMPLETED ||
				currentOffer.request.status === BloodRequestStatus.CANCELLED ||
				currentOffer.request.status === BloodRequestStatus.EXPIRED
			) {
				throw new AppError(
					HttpStatus.BAD_REQUEST,
					"This blood request is no longer active",
				);
			}

			// -----------------------------------------
			// Count accepted donors
			// -----------------------------------------

			const acceptedCount = await tx.bloodRequestDonor.count({
				where: {
					requestId: currentOffer.requestId,
					status: DonorOfferStatus.ACCEPTED,
				},
			});

			// -----------------------------------------
			// Don't allow more donors than required
			// -----------------------------------------

			const remainingSlots =
				currentOffer.request.unitsRequired -
				currentOffer.request.unitsFulfilled -
				acceptedCount;

			if (remainingSlots <= 0) {
				throw new AppError(
					HttpStatus.CONFLICT,
					"All required donor slots have already been accepted",
				);
			}

			// -----------------------------------------
			// Accept donor offer
			// -----------------------------------------

			const updatedOffer = await tx.bloodRequestDonor.update({
				where: {
					id: currentOffer.id,
				},
				data: {
					status: DonorOfferStatus.ACCEPTED,
					respondedAt: new Date(),
				},
			});
			// -----------------------------------------
			// Update Unit Fulfilled
			// -----------------------------------------

			// const updatedUnits =
			// 	await tx.bloodRequest.update({
			// 		where: {
			// 			id: currentOffer.requestId,
			// 		},
			// 		data: {
			// 			unitsFulfilled: acceptedCount+1,
			// 		},
			// 	});

			// -----------------------------------------
			// Create reservation
			// -----------------------------------------

			const reservation = await tx.donorReservation.create({
				data: {
					requestId: currentOffer.requestId,
					donorId: currentOffer.donorId,
					donorOfferId: currentOffer.id,
				},
			});

			return {
				offer: updatedOffer,
				reservation,
				request: currentOffer.request,
			};
		},
		{
			isolationLevel: "Serializable",
		},
	);

	//send email
	const offerDetails = await prisma.bloodRequestDonor.findUnique({
		where: {
			id: result.offer.id,
		},
		include: {
			request: {
				include: {
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
				},
			},
			donor: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					donorProfile: {
						select: {
							bloodGroup: true,
						},
					},
				},
			},
		},
	});

	const requester = offerDetails?.request.createdBy;
	const donor = offerDetails?.donor;
	if (requester?.email) {
		const templatePath = path.join(
			process.cwd(),
			"src",
			"app",
			"templates",
			"donor-offer",
			"donorOffer-accept.ejs",
		);

		const templateData = {
			requesterName: requester.name,

			requestNumber: offerDetails?.request.requestNumber,
			bloodGroup: offerDetails?.request.bloodGroup,
			unitsRequired: offerDetails?.request.unitsRequired,

			donorName: donor?.name,
			donorBloodGroup: donor?.donorProfile?.bloodGroup,

			serviceFee: "৳349",

			paymentUrl: `${config.frontend_url}/blood-requests/${offerDetails?.id}/payment`,

			requestUrl: `${config.frontend_url}/blood-requests/${offerDetails?.requestId}`,
		};

		const html = await ejs.renderFile(templatePath, templateData);

		console.log(`Sending email to: ${requester?.email}`);

		await transporter.sendMail({
			from: `"BloodLink" <${config.smtp_sender}>`,
			to: requester.email,
			subject: `🩸 Donor Found`,
			html,
		});

		console.log(`✅ Email sent to ${requester.email}`);
	} else {
		console.log(`⚠️ Requester ${requester?.name} has no email`);
	}

	return result;
};

const markOfferAsViewed = async (donorId: string, offerId: string) => {
	const offer = await prisma.bloodRequestDonor.findUnique({
		where: {
			id: offerId,
		},
	});

	if (!offer) {
		throw new AppError(HttpStatus.NOT_FOUND, "Donor offer not found");
	}

	if (offer.donorId !== donorId) {
		throw new AppError(
			HttpStatus.FORBIDDEN,
			"You are not allowed to view this offer",
		);
	}

	if (offer.status !== DonorOfferStatus.OFFERED) {
		return offer;
	}

	return prisma.bloodRequestDonor.update({
		where: {
			id: offerId,
		},
		data: {
			status: DonorOfferStatus.VIEWED,
		},
	});
};

export const donorOfferService = {
	updateDonorOfferStatus,
	markOfferAsViewed,
};
