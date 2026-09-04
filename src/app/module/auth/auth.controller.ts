import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus  from "http-status";


const generateOTP = catchAsync(async(req: Request, res: Response)=>{
    const payload= req.body
    const result = await authService.createAccount(payload)

    	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "OTP Sent to email Successfully",
		data: {result},
	
	});

})
const createAccount = catchAsync(async(req: Request, res: Response)=>{
    const payload= req.body
    const result = await authService.createAccount(payload)

    	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "User Created Successfully",
		data: {result},
	
	});

})

export const authController={
    createAccount,
	generateOTP
}