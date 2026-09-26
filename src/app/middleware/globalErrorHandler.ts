import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";

import config from "../config";
import { AppError } from "../utility/AppError";

export const globalErrorHandler = (
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	console.error("Error from Global Error Handler:", err);

	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let errorMessage = "Internal Server Error";
	let errorDetails: unknown = undefined;

	// =========================
	// App Error
	// =========================
	if (err instanceof AppError) {
		statusCode = err.statusCode;
		errorMessage = err.message;
	}

	// =========================
	// Zod Validation Error
	// =========================
	else if (err instanceof ZodError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorMessage = "Validation error";

		errorDetails = err.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));
	}

	// =========================
	// Prisma Validation Error
	// =========================
	else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorMessage = "Invalid data provided. Please check your request fields.";
	}

	// =========================
	// Prisma Known Request Error
	// =========================
	else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		switch (err.code) {
			case "P2002":
				statusCode = httpStatus.CONFLICT;
				errorMessage = "A record with this value already exists.";
				break;

			case "P2003":
				statusCode = httpStatus.BAD_REQUEST;
				errorMessage = "Foreign key constraint failed.";
				break;

			case "P2025":
				statusCode = httpStatus.NOT_FOUND;
				errorMessage = "The requested record was not found.";
				break;

			default:
				statusCode = httpStatus.BAD_REQUEST;
				errorMessage = "Database request failed.";
		}
	}

	// =========================
	// Prisma Initialization Error
	// =========================
	else if (err instanceof Prisma.PrismaClientInitializationError) {
		if (err.errorCode === "P1000") {
			statusCode = httpStatus.UNAUTHORIZED;
			errorMessage = "Authentication failed against the database server.";
		} else if (err.errorCode === "P1001") {
			statusCode = httpStatus.SERVICE_UNAVAILABLE;
			errorMessage = "Cannot reach the database server.";
		} else {
			statusCode = httpStatus.SERVICE_UNAVAILABLE;
			errorMessage = "Database connection failed.";
		}
	}

	// =========================
	// Prisma Unknown Error
	// =========================
	else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		errorMessage = "An error occurred while executing the database query.";
	}

	// =========================
	// Normal JavaScript Error
	// =========================
	else if (err instanceof Error) {
		errorMessage = err.message || "Internal Server Error";
	}

	// =========================
	// Response
	// =========================
	res.status(statusCode).json({
		success: false,
		statusCode,
		message: errorMessage,
		...(errorDetails ? { errors: errorDetails } : {}),
		...(config.node_env === "development"
			? {
					name: err instanceof Error ? err.name : "UnknownError",
					stack: err instanceof Error ? err.stack : undefined,
				}
			: {}),
	});
};
