import z from "zod";

export const pushSubscriptionValidation = z.object({
	body: z.object({
		endpoint: z.string().url(),
		keys: z.object({
			p256dh: z.string().min(1),
			auth: z.string().min(1),
		}),
	}),
});
