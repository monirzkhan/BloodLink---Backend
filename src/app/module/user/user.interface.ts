import type { BloodGroup } from "../../../generated/prisma/enums";

export interface IUserProfileUpdatePayload {
	name?: string;
	donorProfile?: {
		bloodGroup?: BloodGroup;
		dateOfBirth?: Date;
		gender?: string;
		lastDonationDate?: Date;
		division?: string;
		district?: string;
		area?: string;
	};
	patientProfile?: {
		bloodGroup?: BloodGroup;
		dateOfBirth?: Date;
		gender?: string;
		emergencyContact?: string;
		emergencyPhone?: string;
	};
	hospitalProfile?: {
		hospitalName?: string;
		division?: string;
		district?: string;
		area?: string;
		address?: string;
	};
}
