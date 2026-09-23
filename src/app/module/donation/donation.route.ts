import express, { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { donationController } from "./donation.controller";
import { zoDvalidation } from "../../middleware/zodValidation";
import {
	completeDonationValidation,
	updateScreeningValidation,
} from "./donation.validation";

const router = Router();

router.get(
	"/:donationId",
	auth(
		UserRole.ADMIN,
		UserRole.CALLER,
		UserRole.DONOR,
		UserRole.HOSPITAL,
		UserRole.PATIENT,
		UserRole.SUPER_ADMIN,
	),
	donationController.getDonationById,
);

router.patch(
	"/:donationId/screening-result",
	auth(
		UserRole.ADMIN,
		UserRole.CALLER,
		UserRole.DONOR,
		UserRole.HOSPITAL,
		UserRole.PATIENT,
		UserRole.SUPER_ADMIN,
	),
	zoDvalidation(updateScreeningValidation),
	donationController.updateScreening,
);

router.patch(
	"/:donationId/complete",
	auth(
		UserRole.ADMIN,
		UserRole.CALLER,
		UserRole.DONOR,
		UserRole.HOSPITAL,
		UserRole.PATIENT,
		UserRole.SUPER_ADMIN,
	),
	zoDvalidation(completeDonationValidation),

	donationController.completeDonation,
);

export const donationRoutes = router;
