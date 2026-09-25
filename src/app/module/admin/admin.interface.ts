import { BloodGroup, BloodRequestStatus, UserRole, UserStatus } from "../../../generated/prisma/enums";


export interface IAdminDashboardStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    pending: number;
  };

  donors: {
    total: number;
    verified: number;
    available: number;
    unavailable: number;
  };

  hospitals: {
    total: number;
    verified: number;
    pending: number;
  };

  bloodRequests: {
    total: number;
    pendingVerification: number;
    searchingDonors: number;
    donorFound: number;
    partiallyFulfilled: number;
    fulfilled: number;
    cancelled: number;
    expired: number;
    rejected: number;
  };

  donations: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };

  appointments: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };

  payments: {
    total: number;
    successful: number;
    pending: number;
    failed: number;
    refunded: number;
    totalAmount: number;
  };
}

export interface IAdminUserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface IAdminRequestFilters {
  status?: BloodRequestStatus;
  bloodGroup?: BloodGroup;
  page?: number;
  limit?: number;
}

export interface IAuditLogFilters {
  actorId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface IReportDateRange {
  startDate?: Date;
  endDate?: Date;
}