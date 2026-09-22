import {
	DonorOfferStatus,
	PaymentStatus,
	ReservationStatus,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import httpStatus from "http-status";

export const getBloodRequestContacts = async (
	userId: string,
	requestId: string,
) => {
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
					paidAt: true,
				},
			},
		},
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
	}

	const acceptedOffer = request.donors[0];

	if (!acceptedOffer?.reservation) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Confirmed donor reservation not found",
		);
	}

	if (acceptedOffer.reservation.status !== ReservationStatus.CONFIRMED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Contact details are not unlocked yet",
		);
	}

	if (request.payments.length === 0) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Successful payment is required before viewing contact details",
		);
	}

	const donor = acceptedOffer.donor;

	if (userId === request.createdById) {
		return {
			role: "REQUESTER",
			requester: {
				name: request.createdBy.name,
			},
			donor: {
				id: donor.id,
				name: donor.name,
				email: donor.email,
				phone: donor.phone,
			},
		};
	}

	if (userId === donor.id) {
		return {
			role: "DONOR",
			requester: {
				id: request.createdBy.id,
				name: request.createdBy.name,
				email: request.createdBy.email,
				phone: request.createdBy.phone,
			},
			donor: {
				name: donor.name,
			},
		};
	}

	throw new AppError(
		httpStatus.FORBIDDEN,
		"You are not part of this blood request",
	);
};
