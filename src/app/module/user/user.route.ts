import { Router } from "express";
import { userController } from "./user.controller";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

const route = Router();

route.get("/get-users", userController.getAllUsers);
route.patch(
	"/profile-update",
	auth(UserRole.CALLER, UserRole.DONOR, UserRole.HOSPITAL, UserRole.PATIENT),
	userController.updateUserProfile,
);

export const userRoute = route;
