import {
	AppointmentStatus,
	BloodRequestStatus,
	DonationStatus,
	DonorAvailability,
	PaymentStatus,
	UserRole,
	UserStatus,
	VerificationStatus,
} from "../../../generated/prisma/enums";
import type {
	AuditLogWhereInput,
	BloodRequestWhereInput,
	UserWhereInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import { findAndMatchDonors } from "../bloodRequest/bloodRequestDonor.service";
import type {
	IAdminRequestFilters,
	IAdminUserFilters,
	IAuditLogFilters,
	IVerifyBloodRequest,
} from "./admin.interface";
import httpStatus from "http-status";

const getDashboardStats = async () => {
	const [
		totalUsers,
		activeUsers,
		blockedUsers,

		totalDonors,
		verifiedDonors,
		availableDonors,

		totalHospitals,
		verifiedHospitals,

		totalRequests,
		pendingRequests,
		searchingRequests,
		donorFoundRequests,
		partiallyFulfilledRequests,
		fulfilledRequests,
		cancelledRequests,
		expiredRequests,
		rejectedRequests,

		totalDonations,
		scheduledDonations,
		completedDonations,
		cancelledDonations,

		totalAppointments,
		scheduledAppointments,
		completedAppointments,
		cancelledAppointments,

		totalPayments,
		successfulPayments,
		pendingPayments,
		failedPayments,
		refundedPayments,
	] = await Promise.all([
		prisma.user.count(),

		prisma.user.count({
			where: {
				status: UserStatus.ACTIVE,
			},
		}),

		prisma.user.count({
			where: {
				status: UserStatus.BLOCKED,
			},
		}),

		prisma.user.count({
			where: {
				role: UserRole.DONOR,
			},
		}),

		prisma.donorProfile.count({
			where: {
				isVerified: true,
			},
		}),

		prisma.donorProfile.count({
			where: {
				availability: DonorAvailability.AVAILABLE,
			},
		}),

		prisma.hospitalProfile.count(),

		prisma.hospitalProfile.count({
			where: {
				isVerified: true,
			},
		}),

		prisma.bloodRequest.count(),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.PENDING_VERIFICATION,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.SEARCHING_DONORS,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.DONOR_FOUND,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.PARTIALLY_FULFILLED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.FULFILLED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.CANCELLED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.EXPIRED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.REJECTED,
			},
		}),

		prisma.donation.count(),

		prisma.donation.count({
			where: {
				donationStatus: DonationStatus.SCHEDULED,
			},
		}),

		prisma.donation.count({
			where: {
				donationStatus: DonationStatus.DONATED,
			},
		}),

		prisma.donation.count({
			where: {
				donationStatus: DonationStatus.CANCELLED,
			},
		}),

		prisma.appointment.count(),

		prisma.appointment.count({
			where: {
				status: AppointmentStatus.SCHEDULED,
			},
		}),

		prisma.appointment.count({
			where: {
				status: AppointmentStatus.CONFIRMED,
			},
		}),

		prisma.appointment.count({
			where: {
				status: AppointmentStatus.CANCELLED,
			},
		}),

		prisma.payment.count(),

		prisma.payment.count({
			where: {
				status: PaymentStatus.SUCCESS,
			},
		}),

		prisma.payment.count({
			where: {
				status: PaymentStatus.PENDING,
			},
		}),

		prisma.payment.count({
			where: {
				status: PaymentStatus.FAILED,
			},
		}),

		prisma.payment.count({
			where: {
				status: PaymentStatus.REFUNDED,
			},
		}),
	]);

	const paymentAmount = await prisma.payment.aggregate({
		where: {
			status: PaymentStatus.SUCCESS,
		},
		_sum: {
			amount: true,
		},
	});

	return {
		users: {
			total: totalUsers,
			active: activeUsers,
			blocked: blockedUsers,
		},

		donors: {
			total: totalDonors,
			verified: verifiedDonors,
			available: availableDonors,
			unavailable: totalDonors - availableDonors,
		},

		hospitals: {
			total: totalHospitals,
			verified: verifiedHospitals,
			pending: totalHospitals - verifiedHospitals,
		},

		bloodRequests: {
			total: totalRequests,
			pendingVerification: pendingRequests,
			searchingDonors: searchingRequests,
			donorFound: donorFoundRequests,
			partiallyFulfilled: partiallyFulfilledRequests,
			fulfilled: fulfilledRequests,
			cancelled: cancelledRequests,
			expired: expiredRequests,
			rejected: rejectedRequests,
		},

		donations: {
			total: totalDonations,
			scheduled: scheduledDonations,
			completed: completedDonations,
			cancelled: cancelledDonations,
		},

		appointments: {
			total: totalAppointments,
			scheduled: scheduledAppointments,
			completed: completedAppointments,
			cancelled: cancelledAppointments,
		},

		payments: {
			total: totalPayments,
			successful: successfulPayments,
			pending: pendingPayments,
			failed: failedPayments,
			refunded: refundedPayments,
			totalAmount: Number(paymentAmount._sum.amount ?? 0),
		},
	};
};

const getUserAnalytics = async () => {
	const [
		total,
		admins,
		donors,
		hospitals,
		callers,
		active,
		blocked,
		verifiedEmail,
	] = await Promise.all([
		prisma.user.count(),

		prisma.user.count({
			where: {
				role: {
					in: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
				},
			},
		}),

		prisma.user.count({
			where: {
				role: UserRole.DONOR,
			},
		}),

		prisma.user.count({
			where: {
				role: UserRole.HOSPITAL,
			},
		}),

		prisma.user.count({
			where: {
				role: UserRole.CALLER,
			},
		}),

		prisma.user.count({
			where: {
				status: UserStatus.ACTIVE,
			},
		}),

		prisma.user.count({
			where: {
				status: UserStatus.BLOCKED,
			},
		}),

		prisma.user.count({
			where: {
				emailVerified: true,
			},
		}),
	]);

	return {
		total,
		admins,
		donors,
		hospitals,
		callers,
		active,
		blocked,
		emailVerified: verifiedEmail,
		emailUnverified: total - verifiedEmail,
	};
};

const getBloodRequestAnalytics = async () => {
	const [
		total,
		pendingVerification,
		searchingDonors,
		donorFound,
		partiallyFulfilled,
		fulfilled,
		cancelled,
		expired,
		rejected,
	] = await Promise.all([
		prisma.bloodRequest.count(),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.PENDING_VERIFICATION,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.SEARCHING_DONORS,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.DONOR_FOUND,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.PARTIALLY_FULFILLED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.FULFILLED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.CANCELLED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.EXPIRED,
			},
		}),

		prisma.bloodRequest.count({
			where: {
				status: BloodRequestStatus.REJECTED,
			},
		}),
	]);

	return {
		total,

		byStatus: {
			pendingVerification,
			searchingDonors,
			donorFound,
			partiallyFulfilled,
			fulfilled,
			cancelled,
			expired,
			rejected,
		},
	};
};

const getBloodGroupAnalytics = async () => {
	const result = await prisma.donorProfile.groupBy({
		by: ["bloodGroup"],
		_count: {
			bloodGroup: true,
		},
	});

	const requestResult = await prisma.bloodRequest.groupBy({
		by: ["bloodGroup"],
		_count: {
			bloodGroup: true,
		},
	});

	return {
		donors: result.map((item) => ({
			bloodGroup: item.bloodGroup,
			count: item._count.bloodGroup,
		})),

		requests: requestResult.map((item) => ({
			bloodGroup: item.bloodGroup,
			count: item._count.bloodGroup,
		})),
	};
};

const getDonationAnalytics = async () => {
	const [total, scheduled, completed, cancelled] = await Promise.all([
		prisma.donation.count(),

		prisma.donation.count({
			where: {
				donationStatus: DonationStatus.SCHEDULED,
			},
		}),

		prisma.donation.count({
			where: {
				donationStatus: DonationStatus.DONATED,
			},
		}),

		prisma.donation.count({
			where: {
				donationStatus: DonationStatus.CANCELLED,
			},
		}),
	]);

	return {
		total,
		scheduled,
		completed,
		cancelled,

		completionRate:
			total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 0,
	};
};

const getPaymentAnalytics = async () => {
	const [total, successful, pending, failed, refunded] = await Promise.all([
		prisma.payment.count(),

		prisma.payment.count({
			where: {
				status: PaymentStatus.SUCCESS,
			},
		}),

		prisma.payment.count({
			where: {
				status: PaymentStatus.PENDING,
			},
		}),

		prisma.payment.count({
			where: {
				status: PaymentStatus.FAILED,
			},
		}),

		prisma.payment.count({
			where: {
				status: PaymentStatus.REFUNDED,
			},
		}),
	]);

	const aggregate = await prisma.payment.aggregate({
		where: {
			status: PaymentStatus.SUCCESS,
		},

		_sum: {
			amount: true,
		},
	});

	return {
		total,
		successful,
		pending,
		failed,
		refunded,

		totalRevenue: Number(aggregate._sum.amount ?? 0),

		successRate:
			total > 0 ? Number(((successful / total) * 100).toFixed(2)) : 0,
	};
};

const getUsers = async (filters: IAdminUserFilters) => {
	const { search, role, status, page = 1, limit = 20 } = filters;

	const where: UserWhereInput = {};

	if (search) {
		where.OR = [
			{
				name: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				email: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				phone: {
					contains: search,
				},
			},
		];
	}

	if (role) {
		where.role = role;
	}

	if (status) {
		where.status = status;
	}

	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.user.findMany({
			where,
			skip,
			take: limit,

			orderBy: {
				createdAt: "desc",
			},

			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				role: true,
				status: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
			},
		}),

		prisma.user.count({
			where,
		}),
	]);

	return {
		data,

		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getBloodRequests = async (filters: IAdminRequestFilters) => {
	const { status, bloodGroup, page = 1, limit = 20 } = filters;

	const where: BloodRequestWhereInput = {};

	if (status) {
		where.status = status;
	}

	if (bloodGroup) {
		where.bloodGroup = bloodGroup;
	}

	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.bloodRequest.findMany({
			where,

			skip,
			take: limit,

			orderBy: {
				createdAt: "desc",
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
					select: {
						id: true,
						donorId: true,
						matchScore: true,
						distanceKm: true,
						status: true,
					},
				},

				_count: {
					select: {
						donors: true,
						appointments: true,
						donations: true,
						payments: true,
					},
				},
			},
		}),

		prisma.bloodRequest.count({
			where,
		}),
	]);

	return {
		data,

		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getRecentActivity = async (limit = 20) => {
	const logs = await prisma.auditLog.findMany({
		take: limit,

		orderBy: {
			createdAt: "desc",
		},

		include: {
			actor: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		},
	});

	return logs;
};

const getAuditLogs = async (filters: IAuditLogFilters) => {
	const {
		userId,
		action,
		entity,
		entityId,
		startDate,
		endDate,
		page = 1,
		limit = 50,
	} = filters;

	const where: AuditLogWhereInput = {};

	if (userId) {
		where.actorId = userId;
	}

	if (action) {
		where.action = action;
	}

	if (entity) {
		where.entity = entity;
	}

	if (entityId) {
		where.entityId = entityId;
	}

	if (startDate || endDate) {
		where.createdAt = {
			...(startDate && {
				gte: startDate,
			}),

			...(endDate && {
				lte: endDate,
			}),
		};
	}

	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,

			skip,
			take: limit,

			orderBy: {
				createdAt: "desc",
			},

			include: {
				actor: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
			},
		}),

		prisma.auditLog.count({
			where,
		}),
	]);

	return {
		data,

		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const updateUserStatus = async (
	userId: string,
	status: UserStatus,
	adminId: string,
	ipAddress: string,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	if (user.role === UserRole.SUPER_ADMIN && status === UserStatus.BLOCKED) {
		throw new Error("SUPER_ADMIN cannot be blocked");
	}

	const updatedUser = await prisma.$transaction(async (tx) => {
		const updated = await tx.user.update({
			where: {
				id: userId,
			},

			data: {
				status,
			},

			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
			},
		});

		await tx.auditLog.create({
			data: {
				actorId: adminId,
				action: "USER_STATUS_UPDATED",
				entity: "USER",
				entityId: userId,
				ipAddress,

				// Details Logs

				oldData: {
					status: user.status,
				},
				newData: {
					status,
				},
			},
		});

		return updated;
	});

	return updatedUser;
};

const verifyBloodRequest = async (
	requestId: string,
	adminId: string,
	payload: IVerifyBloodRequest,
	ipAddress?: string,
) => {
	// ============================================
	// 1. Verify Admin
	// ============================================

	const admin = await prisma.user.findUnique({
		where: {
			id: adminId,
		},
		select: {
			id: true,
			role: true,
			status: true,
		},
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
	}

	if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only admin can verify blood requests",
		);
	}

	// admin Active check
	if (admin.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.FORBIDDEN, "Admin account is not active");
	}

	// ============================================
	// 2. Find Blood Request
	// ============================================

	const bloodRequest = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!bloodRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
	}

	// ============================================
	// 3. Check Current Status
	// ============================================

	if (bloodRequest.status !== BloodRequestStatus.PENDING_VERIFICATION) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending blood requests can be verified",
		);
	}

	// ============================================
	// 4. Determine Verification Result
	// ============================================

	const isRejected = payload.verificationStatus === VerificationStatus.REJECTED;

	const newStatus = isRejected
		? BloodRequestStatus.REJECTED
		: BloodRequestStatus.SEARCHING_DONORS;

	const newVerificationStatus = isRejected
		? VerificationStatus.REJECTED
		: VerificationStatus.APPROVED;

	// ============================================
	// 5. Update Request + Create Audit Log
	//    in ONE transaction
	// ============================================

	const updatedRequest = await prisma.$transaction(async (tx) => {
		const updated = await tx.bloodRequest.update({
			where: {
				id: requestId,
			},

			data: {
				verificationStatus: newVerificationStatus,

				status: newStatus,

				verifiedById: adminId,

				verifiedAt: new Date(),

				rejectionReason: isRejected ? payload.rejectionReason : null,
			},
		});

		await tx.auditLog.create({
			data: {
				actorId: adminId,

				action: isRejected
					? "BLOOD_REQUEST_REJECTED"
					: "BLOOD_REQUEST_APPROVED",

				entity: "BLOOD_REQUEST",

				entityId: requestId,

				ipAddress,

				oldData: {
					status: bloodRequest.status,
					verificationStatus: bloodRequest.verificationStatus,
					rejectionReason: bloodRequest.rejectionReason,
				},

				newData: {
					status: newStatus,
					verificationStatus: newVerificationStatus,
					rejectionReason: isRejected ? payload.rejectionReason : null,
				},
			},
		});

		return updated;
	});

	// ============================================
	// 6. Start Donor Matching ONLY AFTER
	//    Transaction Has Successfully Committed
	// ============================================

	if (!isRejected) {
		try {
			const selectedDonors = await findAndMatchDonors(updatedRequest.id);

			console.log(
				`Donor matching completed for request ${updatedRequest.id}: ${selectedDonors.length} donors`,
			);
		} catch (error) {
			console.error(
				`Donor matching failed for request ${updatedRequest.id}:`,
				error,
			);
		}
	}

	return updatedRequest;
};

const verifyDonor = async (
	donorId: string,
	adminId: string,
	approved: boolean,
	note?: string,
	ipAddress?: string,
) => {
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorId,
		},
	});

	if (!donor) {
		throw new Error("Donor profile not found");
	}

	const updated = await prisma.$transaction(async (tx) => {
		const profile = await tx.donorProfile.update({
			where: {
				userId: donorId,
			},

			data: {
				isVerified: approved,
			},
		});

		await tx.auditLog.create({
			data: {
				actorId: adminId,

				action: approved ? "DONOR_VERIFIED" : "DONOR_VERIFICATION_REJECTED",

				entity: "DONOR_PROFILE",

				entityId: donorId,
				ipAddress,

				oldData: {
					status: donor.isVerified,
				},
				newData: {
					approved,
				},
			},
		});

		return profile;
	});

	return updated;
};

const verifyHospital = async (
	hospitalId: string,
	adminId: string,
	approved: boolean,
	note?: string,
	ipAddress?: string,
) => {
	const hospital = await prisma.hospitalProfile.findUnique({
		where: {
			id: hospitalId,
		},
	});

	if (!hospital) {
		throw new Error("Hospital profile not found");
	}

	const updated = await prisma.$transaction(async (tx) => {
		const profile = await tx.hospitalProfile.update({
			where: {
				id: hospitalId,
			},

			data: {
				isVerified: approved,
			},
		});

		await tx.auditLog.create({
			data: {
				actorId: adminId,

				action: approved
					? "HOSPITAL_VERIFIED"
					: "HOSPITAL_VERIFICATION_REJECTED",

				entity: "HOSPITAL_PROFILE",

				entityId: hospitalId,
				ipAddress: ipAddress,

				oldData: {
					status: hospital.isVerified,
				},
				newData: {
					approved,
				},
			},
		});

		return profile;
	});

	return updated;
};

export const adminService = {
	getDashboardStats,
	getUserAnalytics,
	getBloodRequestAnalytics,
	getBloodGroupAnalytics,
	getDonationAnalytics,
	getPaymentAnalytics,
	getUsers,
	getBloodRequests,
	getRecentActivity,
	getAuditLogs,
	updateUserStatus,
	verifyBloodRequest,
	verifyDonor,
	verifyHospital,
};
