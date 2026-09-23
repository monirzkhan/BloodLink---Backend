import { Router } from "express";
import { userController } from "./user.controller";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { upload } from "../../lib/multer";

const router = Router();

router.get("/get-users", userController.getAllUsers);
router.patch(
	"/profile-update",
	auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
	userController.updateUserProfile,
);

router.patch(
	"/image-upload",
	auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
	upload.single("profileImage"),
	userController.profileImageUpdate,
);

export const userRoute = router;
