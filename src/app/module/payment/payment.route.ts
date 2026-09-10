import { Router } from "express";
import { paymentController } from "./payment.controller";

const router =Router();

router.post('/bkash/create-payment',paymentController.createPayment);

export const paymentRoute = router;