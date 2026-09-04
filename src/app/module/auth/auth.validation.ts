import z from "zod";

const UserRegistrationZodSchema = z.object({
	name: z
		.string("Not A String!!!!!")
		.min(3, "Name must atleast 3 characters long!!!")
		.max(30, "Name lenth must be within 30 characters long!!!"),
	email: z.email("Not an email"),
	password: z
		.string()
		.min(6)
		.refine((val) => /[A-Z]/.test(val), "Add at least one uppercase letter")
		.refine((val) => /[a-z]/.test(val), "Add at least one lowercase letter")
		.refine((val) => /[^A-Za-z0-9]/.test(val), "Needs special char")
		.refine((val) => /[0-9]/.test(val), "Add at least one number"),
    phone:z.string().length(11, "Mobile number must be at least 11 characters long"),
	donorProfile: z.object({
		bloodGroup: z.string().min(10, "Blood Group is required, Example: A_POSITIVE, B_Negative, O_Positive etc"),
	}).optional()
    
});

const userLoginZodSchema = z.object({
	email: z.email("Not an email"),
	password: z
		.string()
		.min(8, "Password Must Minimum 8 Characters Long.")
		.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
		.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

		.regex(/[0-9]/, "Password must contain atleast 1 Number")
		.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
});

const forgotPasswordZodSchema = z.object({
	email: z.email("Email not found"),
});
const resetPasswordZodSchema = z.object({
	email: z.email("Email not found"),
	newPassword: z
		.string()
		.min(8, "Password Must Minimum 8 Characters Long.")
		.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
		.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

		.regex(/[0-9]/, "Password must contain atleast 1 Number")
		.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
	otp: z.string().length(6, "OTP Must be 6 Characters long"),
});
const emailVerifyZodSchema = z.object({
	email: z.email("Email not found"),
	otp: z.string().length(6, "OTP Must be 6 Characters long"),
});
export const userValidation = {
	UserRegistrationZodSchema,
	emailVerifyZodSchema,
	userLoginZodSchema,
	forgotPasswordZodSchema,
	resetPasswordZodSchema,
};
