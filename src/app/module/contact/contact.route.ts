import express from "express";

import * as contactController from "./contact.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";

const router = express.Router();

router.get(
	"/:requestId",
	auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
	contactController.getContacts,
);

export const contactRoutes = router;
