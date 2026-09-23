import {
	AppointmentStatus,
	BloodRequestStatus,
	DonationStatus,
	ScreeningStatus,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import httpStatus from "http-status";

import type { ICompleteDonation, IUpdateScreening } from "./donation.interface";

const getDonationById = async (donationId: string) => {
	const donation = await prisma.donation.findUnique({
		where: {
			id: donationId,
		},
		include: {
			request: true,

			donor: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					donorProfile: true,
				},
			},

			appointment: true,

			hospital: true,
		},
	});

	if (!donation) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
	}

	return donation;
};

const updateScreening = async (
	donationId: string,
	payload: IUpdateScreening,
) => {
	const donation = await prisma.donation.findUnique({
		where: {
			id: donationId,
		},
		include: {
			appointment: true,
		},
	});

	if (!donation) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
	}

	if (
		donation.donationStatus === DonationStatus.DONATED ||
		donation.donationStatus === DonationStatus.CANCELLED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Donation can no longer be screened",
		);
	}

	const updated = await prisma.$transaction(
		async (tx) => {
			const updatedDonation = await tx.donation.update({
				where: {
					id: donationId,
				},
				data: {
					screeningStatus: payload.screeningStatus,

					notes: payload.screeningNotes,

					donationStatus:
						payload.screeningStatus === ScreeningStatus.PASSED
							? DonationStatus.ELIGIBLE
							: payload.screeningStatus === ScreeningStatus.FAILED
								? DonationStatus.INELIGIBLE
								: DonationStatus.SCREENING,
				},
			});

			if (payload.screeningStatus === ScreeningStatus.PASSED) {
				await tx.appointment.update({
					where: {
						id: donation.appointmentId,
					},
					data: {
						screeningStatus: ScreeningStatus.PASSED,

						status: AppointmentStatus.ELIGIBLE,
					},
				});
			}

			if (payload.screeningStatus === ScreeningStatus.FAILED) {
				await tx.appointment.update({
					where: {
						id: donation.appointmentId,
					},
					data: {
						screeningStatus: ScreeningStatus.FAILED,

						status: AppointmentStatus.INELIGIBLE,
					},
				});
			}

			return updatedDonation;
		},
		{
			isolationLevel: "Serializable",
		},
	);

	return updated;
};

export const completeDonation = async (
	donationId: string,
	payload: ICompleteDonation,
) => {
	const donation = await prisma.donation.findUnique({
		where: {
			id: donationId,
		},
		include: {
			request: true,
			appointment: true,
			donor: {
				include: {
					donorProfile: true,
				},
			},
		},
	});

	if (!donation) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
	}

	if (donation.donationStatus === DonationStatus.DONATED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Donation has already been completed",
		);
	}

	if (donation.donationStatus === DonationStatus.CANCELLED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Cancelled donation cannot be completed",
		);
	}

	if (donation.screeningStatus !== ScreeningStatus.PASSED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Donor must be eligible before completing donation",
		);
	}

	const units = payload.units ?? donation.units;

	if (units < 1) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Donation units must be at least 1",
		);
	}

	const remainingUnits =
		donation.request.unitsRequired - donation.request.unitsFulfilled;

	if (units > remainingUnits) {
		throw new AppError(
			httpStatus.CONFLICT,
			`Only ${remainingUnits} unit(s) are still required`,
		);
	}

	const donatedAt = new Date();

	const result = await prisma.$transaction(
		async (tx) => {
			/*
			 * Re-read the donation inside transaction.
			 * This protects against two requests completing
			 * the same donation simultaneously.
			 */
			const currentDonation = await tx.donation.findUnique({
				where: {
					id: donationId,
				},
				include: {
					request: true,
					appointment: true,
				},
			});

			if (!currentDonation) {
				throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
			}

			if (currentDonation.donationStatus === DonationStatus.DONATED) {
				throw new AppError(
					httpStatus.CONFLICT,
					"Donation has already been completed",
				);
			}

			const currentRemaining =
				currentDonation.request.unitsRequired -
				currentDonation.request.unitsFulfilled;

			if (units > currentRemaining) {
				throw new AppError(
					httpStatus.CONFLICT,
					`Only ${currentRemaining} unit(s) are still required`,
				);
			}

			/*
			 * 1. Update donation
			 */
			const updatedDonation = await tx.donation.update({
				where: {
					id: donationId,
				},
				data: {
					units,

					donationStatus: DonationStatus.DONATED,

					donatedAt,

					notes: payload.notes ?? currentDonation.notes,
				},
			});

			/*
			 * 2. Update appointment
			 */
			await tx.appointment.update({
				where: {
					id: currentDonation.appointmentId,
				},
				data: {
					status: AppointmentStatus.DONATED,

					completedAt: donatedAt,
				},
			});

			/*
			 * 3. Update BloodRequest.unitsFulfilled
			 */
			const newUnitsFulfilled = currentDonation.request.unitsFulfilled + units;

			const requestStatus =
				newUnitsFulfilled >= currentDonation.request.unitsRequired
					? BloodRequestStatus.COMPLETED
					: currentDonation.request.status;

			await tx.bloodRequest.update({
				where: {
					id: currentDonation.requestId,
				},
				data: {
					unitsFulfilled: newUnitsFulfilled,

					status: requestStatus,
				},
			});

			/*
			 * 4. Update donor statistics
			 */
			await tx.donorProfile.update({
				where: {
					userId: currentDonation.donorId,
				},
				data: {
					totalDonations: {
						increment: units,
					},

					lastDonationDate: donatedAt,
				},
			});

			return updatedDonation;
		},
		{
			isolationLevel: "Serializable",
		},
	);

	return result;
};

export const donationService = {
	getDonationById,
	updateScreening,
	completeDonation,
};
