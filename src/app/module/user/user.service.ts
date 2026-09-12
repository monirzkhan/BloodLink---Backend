import { BloodGroup } from "../../../generated/prisma/enums";
import { UserWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";

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

		const bloodGroup =
			bloodGroupMap[searchTerm.toUpperCase()];

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
						equals: query.bloodGroup as any,
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

export const userService = {
	getAllUsers,
};