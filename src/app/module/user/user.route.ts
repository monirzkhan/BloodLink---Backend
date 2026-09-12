import { Router } from "express";
import { userController } from "./user.controller";

const route =Router();

route.get("/get-users", userController.getAllUsers)

export const userRoute = route;