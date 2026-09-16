import { HttpStatusCode } from "axios";
import app from "../../../app";
import { BloodGroup } from "../../../generated/prisma/enums";
import type { UserWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import type { IUserProfileUpdatePayload } from "./user.interface";
import { tr } from "zod/locales";

const getAllUsers = async (query: IQuery) => {
	// ================================
	// Pagination
	// ================================

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;

	// ================================
	// Sorting
	// ================================

	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder || "desc";

	// ================================
	// Conditions
	// ================================

	const andConditions: UserWhereInput[] = [];

	// ================================
	// Search
	// ================================

	const searchTerm = query.searchTerm?.trim();

	if (searchTerm) {
		const orConditions: UserWhereInput[] = [
			// ----------------------------
			// User fields
			// ----------------------------

			{
				name: {
					contains: searchTerm,
					mode: "insensitive",
				},
			},

			{
				email: {
					contains: searchTerm,
					mode: "insensitive",
				},
			},

			{
				phone: {
					contains: searchTerm,
					mode: "insensitive",
				},
			},

			// ----------------------------
			// Donor profile
			// ----------------------------

			{
				donorProfile: {
					is: {
						district: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
				},
			},

			{
				donorProfile: {
					is: {
						division: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
				},
			},

			{
				donorProfile: {
					is: {
						area: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
				},
			},
		];

		// ================================
		// Blood Group Enum Search
		// ================================

		const bloodGroupMap: Record<string, string> = {
			"A+": BloodGroup.A_POSITIVE,
			"A-": BloodGroup.A_NEGATIVE,
			"B+": BloodGroup.B_POSITIVE,
			"B-": BloodGroup.B_NEGATIVE,
			"AB+": BloodGroup.AB_POSITIVE,
			"AB-": BloodGroup.AB_NEGATIVE,
			"O+": BloodGroup.O_POSITIVE,
			"O-": BloodGroup.O_NEGATIVE,
		};

		const bloodGroup = bloodGroupMap[searchTerm.toUpperCase()];

		if (bloodGroup) {
			orConditions.push({
				donorProfile: {
					is: {
						bloodGroup: {
							equals: bloodGroup as any,
						},
					},
				},
			});
		}

		// ================================
		// Add OR conditions
		// ================================

		andConditions.push({
			OR: orConditions,
		});
	}

	// ================================
	// Blood Group Filter
	// ================================

	if (query.bloodGroup) {
		andConditions.push({
			donorProfile: {
				is: {
					bloodGroup: {
						equals: query.bloodGroup as BloodGroup,
					},
				},
			},
		});
	}

	// ================================
	// Email Filter
	// ================================

	if (query.email) {
		andConditions.push({
			email: {
				contains: query.email.trim(),
				mode: "insensitive",
			},
		});
	}

	// ================================
	// Get Users
	// ================================

	const users = await prisma.user.findMany({
		where: {
			AND: andConditions,
		},

		orderBy: {
			[sortBy]: sortOrder,
		},

		skip,
		take: limit,

		include: {
			donorProfile: true,
			patientProfile: true,
			hospitalProfile: true,
		},

		omit: {
			password: true,
		},
	});

	return users;
};

const updateProfile = async (
	userId: string,
	payload: IUserProfileUpdatePayload,
) => {
	// ============================================
	// Find User
	// ============================================

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		include: {
			donorProfile: true,
			patientProfile: true,
			hospitalProfile: true,
		},
	});

	if (!user) {
		throw new AppError(HttpStatusCode.NotFound, "User not found");
	}

	// ============================================
	// Check User Status
	// ============================================

	if (user.status === "BLOCKED") {
		throw new AppError(HttpStatusCode.Conflict, "User is blocked");
	}

	// ============================================
	// Separate User & Profile Data
	// ============================================

	const { donorProfile, patientProfile, hospitalProfile, ...userData } =
		payload;

	// ============================================
	// Transaction
	// ============================================

	const updatedUser = await prisma.$transaction(async (tx) => {
		// --------------------------------------------
		// Update User
		// --------------------------------------------

		await tx.user.update({
			where: {
				id: userId,
			},
			data: userData,
		});

		// --------------------------------------------
		// Update Donor Profile
		// --------------------------------------------

		if (donorProfile && user.donorProfile) {
			await tx.donorProfile.update({
				where: {
					userId: userId,
				},
				data: donorProfile,
			});
		}

		// --------------------------------------------
		// Update Patient Profile
		// --------------------------------------------

		if (patientProfile && user.patientProfile) {
			await tx.patientProfile.update({
				where: {
					userId: userId,
				},
				data: patientProfile,
			});
		}

		// --------------------------------------------
		// Update Hospital Profile
		// --------------------------------------------

		if (hospitalProfile && user.hospitalProfile) {
			await tx.hospitalProfile.update({
				where: {
					userId: userId,
				},
				data: hospitalProfile,
			});
		}

		// --------------------------------------------
		// Get Updated User
		// --------------------------------------------

		return tx.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				donorProfile: true,
				patientProfile: true,
				hospitalProfile: true,
			},
			omit: {
				password: true,
			},
		});
	});

	return updatedUser;
};

export const userService = {
	getAllUsers,
	updateProfile,
};
