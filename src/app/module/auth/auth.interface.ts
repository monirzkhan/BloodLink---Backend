import type { BloodGroup } from "../../../generated/prisma/enums";

export interface ICreateAccountPayload {
	name: string;
	email: string;
	password: string;
	phone: string;
	donorProfile: {
		bloodGroup: BloodGroup;
	};
}
export interface IRedisRegistrationPayload {
	name: string;
	email: string;
	password: string;
	phone: string;
	donorProfile: {
		bloodGroup: BloodGroup;
	};
}
export interface IVerifyEmailOTPPayload {
	otp: string;
	email: string;
}

export interface ILoginUserPayload {
	email: string;
	password: string;
}