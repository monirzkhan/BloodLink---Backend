import { z } from "zod";

export const adminUserFilterValidation = z.object({
  search: z.string().optional(),

  role: z.string().optional(),

  status: z.string().optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminRequestFilterValidation = z.object({
  status: z.string().optional(),

  bloodGroup: z.string().optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditLogFilterValidation = z.object({
  actorId: z.string().uuid().optional(),

  action: z.string().optional(),

  entity: z.string().optional(),

  entityId: z.string().optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const updateUserStatusValidation = z.object({
  status: z.string(),
});

export const verifyEntityValidation = z.object({
  approved: z.boolean(),

  note: z.string().max(500).optional(),
});

export const updateRequestStatusValidation = z.object({
  status: z.string(),

  note: z.string().max(500).optional(),
});