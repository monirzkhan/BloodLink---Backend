import { Router } from "express";
import { authController } from "./auth.controller";
import { userValidation } from "./auth.validation";
import { zoDvalidation } from "../../middleware/zodValidation";
import { auth } from "../../middleware/checkAuth";

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
router.get(
	"/me",
	auth("ADMIN","CALLER","DONOR","HOSPITAL","SUPER_ADMIN","PATIENT"),
	authController.getMe
);

router.post(
	"/refresh-token",
	authController.refreshToken
);

export const authRoute = router;
