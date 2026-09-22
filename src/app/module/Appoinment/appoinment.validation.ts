import z from "zod";

export const createAppointmentValidation = z.object({
	requestId: z.uuid(),

	appointmentDate: z.coerce.date().refine((date) => date > new Date(), {
		message: "Appointment date must be in the future",
	}),
});
