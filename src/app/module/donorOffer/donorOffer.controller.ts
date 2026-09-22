// donorOffer.controller.ts

import type { Request, Response } from "express";
import httpStatus from "http-status";

import { donorOfferService } from "./donorOffer.service";
import { catchAsync } from "../../utility/catchAsync";

const updateDonorOfferStatus = catchAsync(
	async (req: Request, res: Response) => {
		const { offerId } = req.params;
		const userId = req.user?.userId;
		const payload = req.body;

		const result = await donorOfferService.updateDonorOfferStatus(
			userId as string,
			offerId as string,
			payload,
		);

		res.status(httpStatus.OK).json({
			success: true,
			message:
				req.body.status === "ACCEPTED"
					? "Blood request accepted successfully"
					: "Blood request declined successfully",
			data: result,
		});
	},
);
const markOfferAsViewed = catchAsync(async (req: Request, res: Response) => {
	const { offerId } = req.params;
	const userId = req.user?.userId;

	const result = await donorOfferService.markOfferAsViewed(
		userId as string,
		offerId as string,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Blood Request Viewed by a donor",
		data: result,
	});
});

export const donorOfferController = {
	updateDonorOfferStatus,
	markOfferAsViewed,
};
