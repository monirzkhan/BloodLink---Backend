import { userInfo } from "node:os";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { jwtUtils } from "../../utility/jwt";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import type {
	ICreateAccountPayload,
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRedisRegistrationPayload,
	IRequestUser,
	IResetPasswordPayload,
	IVerifyEmailOTPPayload,
} from "./auth.interface";
import crypto from "crypto";
import { redis } from "../../lib/redis";
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer";
import { AuthProvider, UserRole, UserStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../utility/AppError";
import httpStatus from "http-status";
import { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";

const generateOTP = async (payload: ICreateAccountPayload) => {
	const { name, password, phone, donorProfile } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});
	if (isUserExist) {
		throw new Error("User Already Exist");
	}

	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds),
	);
	const emailOTP = crypto.randomInt(100000, 1000000);
	const emailKey = `User-Registration-OTP:${email}`;
	const expirationSeconds = 60 * 5;

	await redis.set(emailKey, emailOTP, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	const redisDataPayload = {
		name,
		email,
		password: hashedPassword,
		phone,
		donorProfile: {
			bloodGroup: donorProfile?.bloodGroup,
		},
	};
	const redisDataKey = `User-Registration-Data:${email}`;

	await redis.set(redisDataKey, JSON.stringify(redisDataPayload), {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	//send Email with OTP
	const templatePath = path.join(
		process.cwd(),
		"/src/app/templates/registration-verification.ejs",
	);
	const templateData = {
		name,
		otp: emailOTP,
		expirationTime: expirationSeconds / 60,
	};

	const html = await ejs.renderFile(templatePath, templateData);
	await transporter.sendMail({
		from: `"BloodLink" <${config.smtp_sender}>`,
		to: email,
		subject: "Verify Your Email for Registration",
		html,
	});
};

const createAccount = async (payload: IVerifyEmailOTPPayload) => {
	const otp = payload.otp;
	const email = payload.email.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (isUserExist?.status === "BLOCKED") {
		throw new Error("User is Blocked");
	}
	if (isUserExist?.emailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "User is already verified");
	}
	// if (isUserExist?.isDeleted && isUserExist.status === "DELETED") {
	// 	throw new AppError(httpStatus.NOT_FOUND, "User is Deleted");
	// }

	const emailKey = `User-Registration-OTP:${email}`;

	const redisOTP = await redis.get(emailKey);
	if (!redisOTP) {
		throw new AppError(httpStatus.NOT_FOUND, "OTP not found");
	}
	if (redisOTP !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}
	await redis.del([emailKey]);

	const redisDataKey = `User-Registration-Data:${email}`;
	const redisDataPayload = await redis.get(redisDataKey);
	if (!redisDataPayload) {
		throw new AppError(httpStatus.NOT_FOUND,"User data not found in Redis");
	}

	const userDataPayload: IRedisRegistrationPayload =
		JSON.parse(redisDataPayload);

	const createdUser = await prisma.user.create({
		data: {
			name: userDataPayload.name,
			email: userDataPayload.email,
			password: userDataPayload.password,
			phone: userDataPayload.phone,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			donorProfile: {
				create: {
					bloodGroup: userDataPayload.donorProfile.bloodGroup,
				},
			},
		},
		include: {
			donorProfile: true,
		},
		omit: {
			password: true,
		},
	});

	const { ...user } = createdUser;

	// Generate JWT tokens
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	//Set Token
	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	//send Welcome Email
	const templatePath = path.join(
		process.cwd(),
		"/src/app/templates/welcome-email.ejs",
	);
	const templateData = {
		name: userDataPayload.name,
		email: userDataPayload.email,
		loginUrl: `${config.frontend_url}/login`,
	};

	const html = await ejs.renderFile(templatePath, templateData);
	await transporter.sendMail({
		from: `"BloodLink" <${config.smtp_sender}>`,
		to: email,
		subject: "Welcome! Registration Complete",
		html,
	});
	await redis.del([redisDataKey]);

	return { user: createdUser, accessToken, refreshToken };
};

const loginUser = async (payload: ILoginUserPayload, ipAddress: string) => {
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new Error("User not found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	// if (user.isDeleted || user.status === UserStatus.DELETED) {
	// 	throw new AppError(httpStatus.NOT_FOUND, "User is deleted");
	// }

	if (user.password === null && user.googleId !== null) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User Already has account with Google. Please try to login with google",
		);
	}

	const isPasswordMatched = await bcrypt.compare(
		password,
		user.password as string,
	);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	//send Welcome Email
	const templatePath = path.join(
		process.cwd(),
		"/src/app/templates/login-successful.ejs",
	);
	const templateData = {
		name: user.name,
		email: user.email,
		loginUrl: "https://localhost:5000/login",
		loginTime: new Date().toLocaleString("en-US", {
			timeZone: "Asia/Dhaka",
			hour12: true,
		}),
		device: userInfo().username,
		ipAddress: ipAddress,
	};

	const html = await ejs.renderFile(templatePath, templateData);
	await transporter.sendMail({
		from: `"BloodLink" <${config.smtp_sender}>`,
		to: email,
		subject: "Login Notification",
		html,
	});

	return {
		accessToken,
		refreshToken,
	};
};

const getMe = async (user: IRequestUser) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			donorProfile: true,
		},
		omit: {
			password: true,
		},
	});

	if (!isUserExists) {
		throw new Error("User not found");
	}

	return isUserExists;
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new AppError(httpStatus.UNAUTHORIZED,
			config.node_env === "development"
				? verifiedRefreshToken.error
				: "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: data.userId },
	});

	if (!user || user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.NOT_FOUND, "User is inactive or not found");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const { email } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}
	if (isUserExist.status === "BLOCKED") {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}
	if (!isUserExist.emailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
	}
	// if (isUserExist.isDeleted && isUserExist.status === "DELETED") {
	// 	throw new AppError(httpStatus.NOT_FOUND, "User is Deleted");
	// }
	if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
		throw new AppError(httpStatus.BAD_REQUEST, "User account with google");
	}

	const otp = crypto.randomInt(100000, 1000000);
	const key = `Forgot-Password-OTP: ${isUserExist.email}`;
	const expirationSeconds = 5 * 60;

	await redis.set(key, otp, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	//Send Email Template using EJS
	const templatePath = path.join(
		process.cwd(),
		"/src/app/templates/forgot-password.ejs",
	);
	const templateData = {
		name: isUserExist.name,
		email: isUserExist.email,
		otp,
		expirationTime: expirationSeconds / 60,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: `"BloodLink"<${config.smtp_sender}>`,
		to: email,
		subject: "Forgot Password",
		html,
	});
};

const resetPassword = async (payload: IResetPasswordPayload, ipAddress: string) => {
	const { email, newPassword, otp } = payload;
	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}
	if (isUserExist.status === "BLOCKED") {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}
	if (!isUserExist.emailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
	}
		// if (isUserExist.isDeleted && isUserExist.status === "DELETED") {
		// 	throw new AppError(httpStatus.NOT_FOUND, "User is Deleted");
		// }
	if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
		throw new AppError(httpStatus.BAD_REQUEST, "User account with google");
	}

	const key = `Forgot-Password-OTP: ${isUserExist.email}`;
	const redisOTP = await redis.get(key);


	if (!redisOTP) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP not found");
	}

	if (redisOTP !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const newHashPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	const updatedUser = await prisma.user.update({
		where: {
			email
		},
		data: {
			password: newHashPassword,
		},
	});
	await redis.del([key]);

	//Send Email Template using EJS
	const templatePath = path.join(
		process.cwd(),
		"/src/app/templates/password-changed.ejs",
	);

	const templateData = {
		name: isUserExist.name,
		email: isUserExist.email,
		changedAt: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        hour12: true,
    }),

    ipAddress,

    loginUrl: `${config.frontend_url}/login`,
		
	};

	const html = await ejs.renderFile(templatePath, templateData);
	await transporter.sendMail({
		from: `"BloodLink"<${config.smtp_sender}>`,
		to: email,
		subject: "Changed Password",
		html
	});
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googleIdTokenPayload: TokenPayload | undefined | null = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});

		googleIdTokenPayload = ticket.getPayload();
		console.log(googleIdTokenPayload, "Google Token");
	} catch (error) {
		console.log("Google ID Token Verification Failed", error);
		throw new AppError(httpStatus.BAD_REQUEST,"Invalid Or Expired Google Id Token");
	}
	if (!googleIdTokenPayload) {
		throw new AppError(httpStatus.BAD_REQUEST,"Invalid Or Expired Google Id Token");
	}

	if (!googleIdTokenPayload.email) {
		throw new AppError(httpStatus.NOT_FOUND,"Google Email Not Found");
	}
	if (!googleIdTokenPayload.name) {
		throw new AppError(httpStatus.NOT_FOUND,"Google Email User Name Not Found");
	}

	const ifUserExistWithGoogleAuth = await prisma.user.findUnique({
		where: {
			email: googleIdTokenPayload.email,
			role: UserRole.CALLER || UserRole.PATIENT || UserRole.DONOR,
			googleId: googleIdTokenPayload.sub,
		},
	});

	let user = ifUserExistWithGoogleAuth;

	if (!ifUserExistWithGoogleAuth) {
		const ifUserExistWithCredentials = await prisma.user.findUnique({
			where: {
				email: googleIdTokenPayload.email,
				role: UserRole.CALLER || UserRole.PATIENT || UserRole.DONOR,
				authProvider: AuthProvider.CREDENTIALS,
			},
		});

		if (ifUserExistWithCredentials) {
			if (!ifUserExistWithCredentials.emailVerified) {
				throw new AppError(httpStatus.CONFLICT,"Email not varified");
			}
			if (ifUserExistWithCredentials.status === UserStatus.BLOCKED) {
				throw new AppError(httpStatus.CONFLICT,"User Is Blocked");
			}

			// if (
			// 	ifPatientExistWithCredentials.isDeleted ||
			// 	ifPatientExistWithCredentials.status === UserStatus.DELETED
			// ) {
			// 	throw new Error("User Is Deleted");
			// }

			user = await prisma.user.update({
				where: {
					id: ifUserExistWithCredentials.id,
				},
				data: {
					googleId: googleIdTokenPayload.sub,
				},
			});
		} else {
			user = await prisma.user.create({
				data: {
					name: googleIdTokenPayload.name,
					email: googleIdTokenPayload.email,
					phone: "",
					role: UserRole.DONOR,
					googleId: googleIdTokenPayload.sub,
					authProvider: AuthProvider.GOOGLE,
					emailVerified: true,
					donorProfile: {
						create: {
							bloodGroup:"B_POSITIVE"
						},
					},
				},
			});
		}
	}
	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND,"User Not Found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.BAD_REQUEST,"User Is Blocked");
	}

	// if (user.isDeleted || user.status === UserStatus.DELETED) {
	// 	throw new Error("User Is Deleted");
	// }
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};


export const authService = {
	createAccount,
	generateOTP,
	loginUser,
	getMe,
	refreshToken,
	forgotPassword,
	resetPassword,
	googleLogin
};
