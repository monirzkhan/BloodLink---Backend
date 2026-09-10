import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

const createPayment =catchAsync(
    async (req: Request, res: Response) => {
        
        const result = await paymentService.createPayment();
        res.status(httpStatus.OK).json({
            success: true,
            message: "Payment URL created successfully",
            data: result
        });
    }
)

export const paymentController = {
    createPayment
}