import { z } from "zod";

export const createPaymentValidation = z.object({
	requestId: z.string().uuid(),
});

export const executePaymentValidation = z.object({
	paymentId: z.string().min(1),
});
