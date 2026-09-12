import { Router } from "express";
import { bloodRequestController } from "./bloodRequest.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { zoDvalidation } from "../../middleware/zodValidation";
import { createBloodRequestValidation } from "./bloodRequest.validation";

const router =Router ();

router.post('/create-blood-request', 
    auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
    zoDvalidation(createBloodRequestValidation)
    ,bloodRequestController.createBloodRequest)

export const bloodRequestRoute= router