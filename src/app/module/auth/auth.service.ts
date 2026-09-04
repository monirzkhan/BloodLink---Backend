import { userInfo } from "node:os"
import config from "../../config"
import { prisma } from "../../lib/prisma"
import bcrypt from "bcrypt"
import { jwtUtils } from "../../utility/jwt"
import { SignOptions } from "jsonwebtoken"
import { ICreateAccountPayload } from "./auth.interface"

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

}

const createAccount =async(payload: ICreateAccountPayload)=>{
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
    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            phone,
            donorProfile:{
                create: {
                    bloodGroup: donorProfile?.bloodGroup      
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
    return { user: createdUser, accessToken, refreshToken }

}

export const authService={
    createAccount
}