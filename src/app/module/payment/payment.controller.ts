import type { Request, Response } from "express";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

const createPayment = async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const payload = req.body;
	const result = await paymentService.createPayment(userId as string, payload);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Payment created successfully",
		data: result,
	});
};

const executePayment = async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const paymentId = req.body.paymentId;

	const result = await paymentService.executePayment(
		userId as string,
		paymentId,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Payment executed successfully",
		data: result,
	});
};

const bkashCallback = async (req: Request, res: Response) => {
	const paymentId = req.query.paymentID || req.body.paymentID;

	if (!paymentId || typeof paymentId !== "string") {
		return res.status(httpStatus.BAD_REQUEST).json({
			success: false,
			message: "bKash payment ID is required",
		});
	}

	const result = await paymentService.handleBkashCallback(paymentId);

	return res.status(httpStatus.OK).json({
		success: true,
		message: result ? "Payment processed successfully" : "Payment failed",
		data: result,
	});
};
export const paymentController = {
	createPayment,
	executePayment,
	bkashCallback,
};
