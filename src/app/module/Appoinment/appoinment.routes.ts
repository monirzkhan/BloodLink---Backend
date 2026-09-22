import express, { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { zoDvalidation } from "../../middleware/zodValidation";
import { createAppointmentValidation } from "./appoinment.validation";
import { auth } from "../../middleware/checkAuth";
import { appointmentController } from "./appoinment.controller";

const router = Router();

router.post(
	"/create-appointment",
	auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
	zoDvalidation(createAppointmentValidation),
	appointmentController.createAppointment,
);

export const appointmentRoutes = router;
