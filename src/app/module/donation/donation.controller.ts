import type { Request, Response } from "express";
import httpStatus from "http-status";
import { donationService } from "./donation.service";
import { sendResponse } from "../../utility/sendResponse";
import { catchAsync } from "../../utility/catchAsync";

const getDonationById = catchAsync(async (req: Request, res: Response) => {
	const donationId = req.params.donationId;
	const result = await donationService.getDonationById(donationId as string);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Donation retrieved successfully",
		data: result,
	});
});

const updateScreening = catchAsync(async (req: Request, res: Response) => {
	const donationId = req.params.donationId;
	const payload = req.body;
	const result = await donationService.updateScreening(
		donationId as string,
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Donation screening updated successfully",
		data: result,
	});
});

const completeDonation = catchAsync(async (req: Request, res: Response) => {
	const donationId = req.params.donationId;
	const payload = req.body;
	const result = await donationService.completeDonation(
		donationId as string,
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Donation completed successfully",
		data: result,
	});
});

export const donationController = {
	getDonationById,
	updateScreening,
	completeDonation,
};
