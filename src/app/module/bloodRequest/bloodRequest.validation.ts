import z from "zod";

export const createBloodRequestValidation = z.object({
	bloodGroup: z.enum([
		"A_POSITIVE",
		"A_NEGATIVE",
		"B_POSITIVE",
		"B_NEGATIVE",
		"AB_POSITIVE",
		"AB_NEGATIVE",
		"O_POSITIVE",
		"O_NEGATIVE",
	]),

	component: z
		.enum([
			"WHOLE_BLOOD",
			"RED_BLOOD_CELLS",
			"PLASMA",
			"PLATELETS",
			"CRYOPRECIPITATE",
		])
		.default("WHOLE_BLOOD"),

	unitsRequired: z.coerce
		.number()
		.int()
		.min(1, "At least 1 unit is required")
		.max(20, "Maximum 20 units allowed"),

	urgency: z
		.enum([
			"NORMAL",
			"URGENT",
			"EMERGENCY",
		])
		.default("URGENT"),

	requiredDate: z.coerce.date(),

	requiredTime: z.coerce.date().optional(),

	division: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.optional(),

	district: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.optional(),

	area: z
		.string()
		.trim()
		.min(1)
		.max(150)
		.optional(),

	address: z
		.string()
		.trim()
		.min(5)
		.max(500)
		.optional(),

	latitude: z
		.coerce
		.number()
		.min(-90)
		.max(90)
		.optional(),

	longitude: z
		.coerce
		.number()
		.min(-180)
		.max(180)
		.optional(),

	contactName: z
		.string()
		.trim()
		.min(2)
		.max(100)
		.optional(),

	contactPhone: z
		.string()
		.trim()
		.regex(
			/^(?:\+8801|01)[3-9]\d{8}$/,
			"Invalid Bangladesh phone number"
		)
		.optional(),

	reason: z
		.string()
		.trim()
		.min(5)
		.max(500)
		.optional(),

	notes: z
		.string()
		.trim()
		.max(1000)
		.optional(),

	expiresAt: z.coerce.date().optional(),
});