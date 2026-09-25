import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { adminService } from "./admin.service";
import { sendResponse } from "../../utility/sendResponse";

const getDashboard = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await adminService.getDashboardStats();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin dashboard retrieved successfully",
      data: result,
    });
  }
);

const getAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const [
      users,
      bloodRequests,
      bloodGroups,
      donations,
      payments,
    ] = await Promise.all([
      adminService.getUserAnalytics(),

      adminService.getBloodRequestAnalytics(),

      adminService.getBloodGroupAnalytics(),

      adminService.getDonationAnalytics(),

      adminService.getPaymentAnalytics(),
    ]);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Analytics retrieved successfully",

      data: {
        users,
        bloodRequests,
        bloodGroups,
        donations,
        payments,
      },
    });
  }
);

const getUsers = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await adminService.getUsers(
        req.query as any
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  }
);

const getBloodRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await adminService.getBloodRequests(
        req.query as any
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Blood requests retrieved successfully",
      data: result,
    });
  }
);

const getAuditLogs = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await adminService.getAuditLogs(
        req.query as any
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Audit logs retrieved successfully",
      data: result,
    });
  }
);

const getRecentActivity = catchAsync(
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 20;

    const result =
      await adminService.getRecentActivity(limit);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Recent activity retrieved successfully",
      data: result,
    });
  }
);

const updateUserStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const ipAddress = req.ip === "::1" ? "127.0.0.1" : req.ip;

    const { status } = req.body;

    const adminId = req.user?.userId;

    const result =
      await adminService.updateUserStatus(
        userId as string,
        status,
        adminId as string,
        ipAddress as string
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User status updated successfully",
      data: result,
    });
  }
);

const verifyBloodRequest = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const ipAddress = req.ip === "::1" ? "127.0.0.1" : req.ip;

    const {
      approved,
      note,
    } = req.body;

    const adminId = req.user?.userId;

    const result =
      await adminService.verifyBloodRequest(
        requestId as string,
        adminId as string,
        approved,
        note,
        ipAddress as string
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: approved
        ? "Blood request approved successfully"
        : "Blood request rejected successfully",

      data: result,
    });
  }
);

const verifyDonor = catchAsync(
  async (req: Request, res: Response) => {
    const { donorId } = req.params;
    const ipAddress = req.ip === "::1" ? "127.0.0.1" : req.ip;

    const {
      approved,
      note,
    } = req.body;

    const adminId = req.user?.userId;

    const result =
      await adminService.verifyDonor(
        donorId as string,
        adminId as string,
        approved,
        note,
        ipAddress as string
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: approved
        ? "Donor verified successfully"
        : "Donor verification rejected",

      data: result,
    });
  }
);

const verifyHospital = catchAsync(
  async (req: Request, res: Response) => {
    const { hospitalId } = req.params;
    const ipAddress = req.ip === "::1" ? "127.0.0.1" : req.ip;

    const {
      approved,
      note,
    } = req.body;

    const adminId = req.user?.userId;

    const result =
      await adminService.verifyHospital(
        hospitalId as string,
        adminId as string,
        approved,
        note,
        ipAddress as string
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: approved
        ? "Hospital verified successfully"
        : "Hospital verification rejected",

      data: result,
    });
  }
);

export const adminController={
    getDashboard,
    getAnalytics,
    getUsers,
    getBloodRequests,
    getAuditLogs,
    getRecentActivity,
    updateUserStatus,
    verifyBloodRequest,
    verifyDonor,
    verifyHospital
}