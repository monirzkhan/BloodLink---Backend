import { Router } from "express";
import { donorOfferController } from "./donorOffer.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { zoDvalidation } from "../../middleware/zodValidation";
import { updateDonorOfferStatusValidation } from "./donorOffer.validation";

const router = Router ()

router.patch('/:offerId/status', 
    auth(UserRole.DONOR),
    zoDvalidation(updateDonorOfferStatusValidation)
    ,donorOfferController.updateDonorOfferStatus)

router.patch('/:offerId/view', 
    auth(UserRole.DONOR)
    ,donorOfferController.markOfferAsViewed)

export const donorOfferRouter= router