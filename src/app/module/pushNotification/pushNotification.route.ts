import { Router } from "express";
import { pushNotificationController } from "./pushNotification.controller";
import { zoDvalidation } from "../../middleware/zodValidation";
import { pushSubscriptionValidation } from "./pushNotification.validation";

const router = Router();

router.post(
	"/subscribe",
	zoDvalidation(pushSubscriptionValidation),
	pushNotificationController.subscribe,
);

export const pushNotificationRouter = router;
