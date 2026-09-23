import { z } from "zod";
import { ScreeningStatus } from "../../../generated/prisma/enums";

export const updateScreeningValidation = z.object({
	screeningStatus: z.enum([
		ScreeningStatus.FAILED,
		ScreeningStatus.PASSED,
		ScreeningStatus.PENDING,
	]),

	screeningNotes: z.string().optional(),
});

export const completeDonationValidation = z.object({
	units: z.number().int().min(1).max(20).optional(),

	notes: z.string().optional(),
});
