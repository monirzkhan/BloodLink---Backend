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
router.post('/verify-blood-request/:id', 
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN,),
    bloodRequestController.verifyBloodRequestByAdmin)


export const bloodRequestRoute= router