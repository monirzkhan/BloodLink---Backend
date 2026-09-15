import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { pushNotificationService } from "./pushNotification.service";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status"


const subscribe = catchAsync(
    async(req: Request, res: Response)=>{

        const userId= req.user?.userId
       const  payload= req.body

       const result = await pushNotificationService.subscribeToPush(userId as string, payload)

        sendResponse(res,{
            statusCode: httpStatus.CREATED,
            success: true,
            message:"User Allowed for Push Notification Subscription",
            data: result
        })

    }
)

export const pushNotificationController={
    subscribe
}