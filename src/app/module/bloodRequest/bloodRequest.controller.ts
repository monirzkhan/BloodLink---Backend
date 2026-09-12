import { Request, Response } from "express";
import httpStatus from "http-status";
import { bloodRequestService } from "./bloodRequest.service";
import { catchAsync } from "../../utility/catchAsync";
import { sendResponse } from "../../utility/sendResponse";
import { AppError } from "../../utility/AppError";

const createBloodRequest = catchAsync(
    async (req: Request, res: Response) => {

        const userId= req.user?.userId;
        const role= req.user?.role;
        const payload= req.body

        if (!userId || !role) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"User authentication information is missing"
			);
		}

	const result =
		await bloodRequestService.createBloodRequest(userId, role, payload);

        sendResponse(res,{
            statusCode: httpStatus.CREATED,
            success: true,
            message:"Blood request created successfully and is waiting for verification",
            data: result
        })
}
);


export const bloodRequestController = {
	createBloodRequest,
};