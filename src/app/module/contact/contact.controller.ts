import { Request, Response } from "express";
import httpStatus from "http-status";

import * as contactService from "./contact.service";

export const getContacts = async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const requestId = req.params.requestId;
	const result = await contactService.getBloodRequestContacts(
		userId as string,
		requestId as string,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Contact details retrieved successfully",
		data: result,
	});
};
