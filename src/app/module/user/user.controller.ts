import { type Request, response, type Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { userService } from "./user.service";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const users = await userService.getAllUsers(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "All users fetched successfully",
		data: users,
	});
});
const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const payload = req.body;

	const result = await userService.updateProfile(userId as string, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User Profile Updated Successfully",
		data: result,
	});
});

const profileImageUpdate = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new Error("No image uploaded");
	}
	const userId = req.user?.userId;

	const result = await userService.uploadProfileImage(
		req.file?.buffer,
		userId!,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Profile Image Updated Successfully",
		data: {
			result,
		},
	});
});

export const userController = {
	getAllUsers,
	updateUserProfile,
	profileImageUpdate,
};
