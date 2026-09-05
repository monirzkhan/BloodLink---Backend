import { userInfo } from "node:os"
import config from "../../config"
import { prisma } from "../../lib/prisma"
import bcrypt from "bcrypt"
import { jwtUtils } from "../../utility/jwt"
import { SignOptions } from "jsonwebtoken"
import { ICreateAccountPayload, IRedisRegistrationPayload, IVerifyEmailOTPPayload } from "./auth.interface"
import crypto from "crypto"
import { redis } from "../../lib/redis"
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer"
import { UserStatus } from "../../../generated/prisma/enums"

const generateOTP =async(payload: ICreateAccountPayload)=>{
    const {name, password, phone, donorProfile} = payload
    const email = payload.email.trim().toLowerCase();

    const isUserExist = await prisma.user.findUnique({
        where: {
            email
        }
    })
    if(isUserExist){
        throw new Error("User Already Exist")
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds))
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


}

const createAccount =async(payload: IVerifyEmailOTPPayload)=>{
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
		throw new Error("User is already varified");
	}
	// if (isUserExist?.isDeleted && isUserExist.status === "DELETED") {
	// 	throw new Error("User is Deleted");
	// }

	const emailKey = `User-Registration-OTP:${email}`;

	const redisOTP = await redis.get(emailKey);
	if (!redisOTP) {
		throw new Error("OTP not found");
	}
	if (redisOTP !== otp) {
		throw new Error("OTP does not match");
	}
	await redis.del([emailKey]);

	const redisDataKey = `User-Registration-Data:${email}`;
	const redisDataPayload = await redis.get(redisDataKey);
	if (!redisDataPayload) {
		throw new Error("User data not found in Redis");
	}

	const userDataPayload: IRedisRegistrationPayload=
		JSON.parse(redisDataPayload);
    
   
    const createdUser = await prisma.user.create({
        data: {
            name: userDataPayload.name,
            email: userDataPayload.email,
            password: userDataPayload.password,
            phone: userDataPayload.phone,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            donorProfile:{
                create: {
                    bloodGroup: userDataPayload.donorProfile.bloodGroup      
                }
            }
        },
        include: {
            donorProfile: true
        },
        omit: {
            password: true
        }
    })

    const {...user}= createdUser

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
		loginUrl: "https://localhost:5000/login",
	};

	const html = await ejs.renderFile(templatePath, templateData);
	await transporter.sendMail({
		from: `"BloodLink" <${config.smtp_sender}>`,
		to: email,
		subject: "Welcome! Registration Complete",
		html,
	});
	await redis.del([redisDataKey]);

    return { user: createdUser, accessToken, refreshToken }

}

export const authService={
    createAccount,
    generateOTP
}