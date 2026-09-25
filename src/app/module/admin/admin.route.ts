import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { adminController } from "./admin.controller";


const router = Router();

router.get(
  "/dashboard",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.getDashboard
);

router.get(
  "/analytics",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.getAnalytics
);

router.get(
  "/users",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.getUsers
);

router.get(
  "/blood-requests",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.getBloodRequests
);

router.get(
  "/activity",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.getRecentActivity
);

router.get(
  "/audit-logs",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.getAuditLogs
);

router.patch(
  "/users/:userId/status",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.updateUserStatus
);

router.patch(
  "/blood-requests/:requestId/verify",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.verifyBloodRequest
);

router.patch(
  "/donors/:donorId/verify",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.verifyDonor
);

router.patch(
  "/hospitals/:hospitalId/verify",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  adminController.verifyHospital
);

export const adminRouters= router