import { BloodGroup } from "../../../generated/prisma/enums";

export interface ICreateAccountPayload {
	name: string;
	email: string;
	password: string;
	phone: string;
	donorProfile: {
		bloodGroup: BloodGroup;
	};
}