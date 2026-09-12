import { Request, response, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { userService } from "./user.service";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status";

const getAllUsers= catchAsync(
    async (req: Request, res:Response) => {
        
        const users = await userService.getAllUsers(req.query);

        sendResponse(res,{
            statusCode: httpStatus.OK,
            success: true,
            message: "All users fetched successfully",
            data: users,
        })
    }
)

export const userController = {    
    getAllUsers,
}