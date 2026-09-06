import { Router } from "express";
import { authController } from "./auth.controller";
import { userValidation } from "./auth.validation";
import { zoDvalidation } from "../../middleware/zodValidation";

const router = Router();

router.post(
	"/register",
	zoDvalidation(userValidation.UserRegistrationZodSchema),
	authController.generateOTP,
);
router.post(
	"/verify-email-otp",
	zoDvalidation(userValidation.emailVerifyZodSchema),
	authController.verifyEmailOTP,
);
router.post(
	"/login",
	zoDvalidation(userValidation.userLoginZodSchema),
	authController.loginUser,
);

export const authRoute = router;
