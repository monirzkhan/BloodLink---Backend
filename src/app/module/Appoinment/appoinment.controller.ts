import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utility/catchAsync";
import { sendResponse } from "../../utility/sendResponse";
import { appointmentService } from "./appoinment.service";

const createAppointment = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const payload = req.body;

	const result = await appointmentService.createAppointment(
		userId as string,
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Appointment booked successfully",
		data: result,
	});
});

export const appointmentController = {
	createAppointment,
};
