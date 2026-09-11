import type { BloodGroup, UserRole } from "../../../generated/prisma/enums";

export interface ICreateAccountPayload {
	name: string;
	email: string;
	password: string;
	phone: string;
	role: UserRole;
	donorProfile: {
		bloodGroup: BloodGroup;
		division?: string;
		district?: string;
		area?: string;
	};
}
export interface IRedisRegistrationPayload {
	name: string;
	email: string;
	password: string;
	phone: string;
	role: UserRole;
	donorProfile: {
		bloodGroup: BloodGroup;
		lastDonationDate?: string;
		dateOfBirth?: string;
		gender?: string;
		division?: string;
		district?: string;
		area?: string;
		totalDonations?: number;
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
export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: UserRole;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
}

export interface IGoogleLoginPayload {
	idToken: string
}