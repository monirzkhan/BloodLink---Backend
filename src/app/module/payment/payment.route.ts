import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { zoDvalidation } from "../../middleware/zodValidation";
import {
	createPaymentValidation,
	executePaymentValidation,
} from "./payment.validation";

const router = Router();

router.post(
	"/bkash/create-payment",
	auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
	zoDvalidation(createPaymentValidation),
	paymentController.createPayment,
);

router.post(
	"/bkash/execute-payment",
	auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
	zoDvalidation(executePaymentValidation),
	paymentController.executePayment,
);

router.post("/bkash/callback", paymentController.bkashCallback);

export const paymentRoute = router;
