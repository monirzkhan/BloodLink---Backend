import z from "zod";

export const updateDonorOfferStatusValidation = z.object({
	status: z.enum(["ACCEPTED", "DECLINED"]),
});
