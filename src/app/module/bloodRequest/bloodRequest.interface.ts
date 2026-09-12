import {
	BloodComponent,
	BloodGroup,
	RequestUrgency,
} from "../../../generated/prisma/enums";

export interface ICreateBloodRequest {
	patientId?: string;
	callerId?: string;
	hospitalId?: string;

	bloodGroup: BloodGroup;
	component?: BloodComponent;

	unitsRequired: number;

	urgency?: RequestUrgency;

	requiredDate: Date;
	requiredTime?: Date;

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