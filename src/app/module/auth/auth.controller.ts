import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus  from "http-status";


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
    createAccount
}