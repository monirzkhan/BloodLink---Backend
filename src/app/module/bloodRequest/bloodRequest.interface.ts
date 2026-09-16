import type {
	BloodComponent,
	BloodGroup,
	RequestUrgency,
} from "../../../generated/prisma/enums";

export interface ICreateBloodRequest {
	id?: string;
	patientId?: string;
	callerId?: string;
	hospitalId?: string;

	bloodGroup: BloodGroup;
	component?: BloodComponent;

	unitsRequired: number;

	urgency?: RequestUrgency;

	requiredDate: Date;
	requiredTime: string;

	division?: string;
	district?: string;
	area?: string;
	address?: string;

	latitude?: number;
	longitude?: number;

	contactName?: string;
	contactPhone?: string;

	reason?: string;
	notes?: string;

	expiresAt?: Date;
}

export interface IVerifyBloodRequest {
	verificationStatus: string;
	rejectionReason?: string;
}

// export interface Candidate  {
//     donorId: string;
//     distanceKm: number | null;
//     matchScore: number;
// };

export type Candidate = {
	donorId: string;
	distanceKm: number | null;
	matchScore: number;
};
