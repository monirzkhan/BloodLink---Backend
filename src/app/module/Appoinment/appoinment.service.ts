import {
	AppointmentStatus,
	BloodRequestStatus,
	DonationStatus,
	DonorOfferStatus,
	PaymentStatus,
	ReservationStatus,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import httpStatus from "http-status";
import type { ICreateAppointment } from "./appoinment.interface";

const generateAppointmentNumber = () => {
	return `APT-${Date.now()}-${Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, "0")}`;
};

const generateDonationNumber = () => {
	return `DON-${Date.now()}-${Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, "0")}`;
};

export const createAppointment = async (
	donorId: string,
	payload: ICreateAppointment,
) => {
	const { requestId, appointmentDate } = payload;

	const date = new Date(appointmentDate);

	if (Number.isNaN(date.getTime())) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid appointment date");
	}

	if (date <= new Date()) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Appointment date must be in the future",
		);
	}

	const request = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
		include: {
			donors: {
				where: {
					donorId,
					status: DonorOfferStatus.ACCEPTED,
				},
				include: {
					donor: {
						include: {
							donorProfile: true,
						},
					},
					reservation: {
						include: {
							appointment: true,
						},
					},
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

	const acceptedOffer = request.donors[0];

	if (!acceptedOffer) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have an accepted donor offer for this request",
		);
	}

	const reservation = acceptedOffer.reservation;

	if (!reservation) {
		throw new AppError(httpStatus.NOT_FOUND, "Donor reservation not found");
	}

	if (reservation.status !== ReservationStatus.CONFIRMED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Payment must be completed before booking an appointment",
		);
	}

	if (request.payments.length === 0) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Successful payment is required before booking an appointment",
		);
	}

	if (reservation.appointment) {
		throw new AppError(
			httpStatus.CONFLICT,
			"An appointment already exists for this reservation",
		);
	}

	/*
	 * Don't allow appointment after the
	 * request has already been completed.
	 */
	if (
		request.status === BloodRequestStatus.COMPLETED ||
		request.status === BloodRequestStatus.CANCELLED ||
		request.status === BloodRequestStatus.EXPIRED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This blood request is no longer active",
		);
	}

	const result = await prisma.$transaction(
		async (tx) => {
			const appointment = await tx.appointment.create({
				data: {
					appointmentNumber: generateAppointmentNumber(),

					requestId,

					donorId,

					reservationId: reservation.id,

					appointmentDate: date,

					status: AppointmentStatus.SCHEDULED,

					screeningStatus: "PENDING",
				},
			});

			const donation = await tx.donation.create({
				data: {
					donationNumber: generateDonationNumber(),

					requestId,

					donorId,

					hospitalId: request.hospitalId,

					appointmentId: appointment.id,

					bloodGroup: request.bloodGroup,

					component: request.component,

					units: 1,

					screeningStatus: "PENDING",

					donationStatus: DonationStatus.SCHEDULED,
				},
			});

			return {
				appointment,
				donation,
			};
		},
		{
			isolationLevel: "Serializable",
		},
	);

	return result;
};

export const appointmentService = {
	createAppointment,
};
