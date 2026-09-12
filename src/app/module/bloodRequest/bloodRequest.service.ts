import path from "node:path";
import {
	BloodRequestStatus,
	UserRole,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";

import { AppError } from "../../utility/AppError";
import { getCoordinates } from "../../utility/coordinates";

import {
	ICreateBloodRequest,
} from "./bloodRequest.interface";

import {
	generateRequestNumber,
} from "./bloodRequest.utils";

import httpStatus from "http-status";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";

const ALLOWED_ROLES: UserRole[] = [
	UserRole.DONOR,
	UserRole.CALLER,
	UserRole.PATIENT,
	UserRole.HOSPITAL,
];

const createBloodRequest = async (
	userId: string,
	userRole: UserRole,
	requestData: ICreateBloodRequest
) => {

	// --------------------------------
	// 1. Check creator role
	// --------------------------------

	if (!ALLOWED_ROLES.includes(userRole)) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only donor, caller, patient or hospital can create a blood request"
		);
	}


	// --------------------------------
	// 2. Get authenticated user
	// --------------------------------

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"User not found"
		);
	}


	// --------------------------------
	// 3. Generate request number
	// --------------------------------

	const requestNumber = generateRequestNumber();


	// --------------------------------
	// 4. Validate role-specific data
	// --------------------------------

	if (userRole === UserRole.PATIENT) {

		if (
			requestData.patientId &&
			requestData.patientId !== userId
		) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Patient can only create request for himself"
			);
		}
	}

	if (userRole === UserRole.CALLER) {

		if (
			requestData.callerId &&
			requestData.callerId !== userId
		) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Caller can only create request as himself"
			);
		}
	}


	// --------------------------------
	// 5. Set creator relationship
	// --------------------------------

	const patientId =
		userRole === UserRole.PATIENT
			? userId
			: requestData.patientId;

	const callerId =
		userRole === UserRole.CALLER
			? userId
			: requestData.callerId;

	const hospitalId =
		userRole === UserRole.HOSPITAL
			? userId
			: requestData.hospitalId;


	// --------------------------------
	// 6. Hospital validation
	// --------------------------------

	if (userRole === UserRole.HOSPITAL) {

		const hospitalProfile =
			await prisma.hospitalProfile.findUnique({
				where: {
					id: userId,
				},
			});

		if (!hospitalProfile) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Hospital profile not found"
			);
		}
	}


	// --------------------------------
	// 7. Validate units
	// --------------------------------

	if (requestData.unitsRequired <= 0) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Units required must be greater than zero"
		);
	}

  // --------------------------------
	// 8. Find Coordinates for the request address
	// --------------------------------


  const address = `${requestData.area}, ${requestData.district}, ${requestData.division}, Bangladesh`;
  const coordinates= await getCoordinates(address);

	// --------------------------------
	// 9. Create request
	// --------------------------------

	const createdRequest =
		await prisma.bloodRequest.create({

			data: {

				requestNumber,

				createdById: userId,

				patientId,

				callerId,

				hospitalId,

				bloodGroup:
					requestData.bloodGroup,

				component:
					requestData.component ??
					"WHOLE_BLOOD",

				unitsRequired:
					requestData.unitsRequired,

				unitsFulfilled: 0,

				urgency:
					requestData.urgency ??
					"URGENT",

				requiredDate:
					requestData.requiredDate,

				requiredTime:
					requestData.requiredTime,

				division:
					requestData.division,

				district:
					requestData.district,

				area:
					requestData.area,

				address:
					requestData.address,

				latitude:
					coordinates.latitude,

				longitude:
					coordinates.longitude,

				contactName:
					requestData.contactName ??
					user.name,

				contactPhone:
					requestData.contactPhone ??
					user.phone,

				reason:
					requestData.reason,

				notes:
					requestData.notes,

				status:
					BloodRequestStatus.PENDING_VERIFICATION,

				verificationStatus:
					"PENDING",

				expiresAt:
					requestData.expiresAt,
			},
		});

  //send Email with OTP
	const templatePath = path.join(
		process.cwd(),
		"/src/app/templates/blood-request/new-blood.request.ejs",
	);
	const templateData = {
	requestNumber: requestNumber,

	bloodGroup: requestData.bloodGroup,

	component: requestData.component,

	unitsRequired: requestData.unitsRequired,

	urgency: requestData.urgency,

	requiredDate: requestData.requiredDate.toLocaleDateString(
		"en-BD",
		{
			timeZone: "Asia/Dhaka",
		}
	),

	requiredTime: requestData.requiredTime
		? requestData.requiredTime.toLocaleTimeString(
				"en-BD",
				{
					timeZone: "Asia/Dhaka",
					hour: "2-digit",
					minute: "2-digit",
				}
		  )
		: null,

	requesterName: user.name,

	requesterEmail: user.email,

	requesterPhone: user.phone,

	requesterRole: user.role,

	division: requestData.division,

	district: requestData.district,

	area: requestData.area,

	address: requestData.address,

	contactName: requestData.contactName,

	contactPhone: requestData.contactPhone,

	reason: requestData.reason,

	notes: requestData.notes,

	adminRequestUrl:
		`${config.frontend_url}/admin/blood-requests/${requestData.id}`,
};

	const html = await ejs.renderFile(templatePath, templateData);
  const subject =
	`🩸 New Blood Request ${requestNumber} — Verification Required`;

	await transporter.sendMail({
		from: `"BloodLink" <${config.smtp_sender}>`,
		to: "mmonirz.dev@gmail.com",// admin email will set
		subject,
		html,
	});

	return createdRequest;

};

const verifyBloodRequestByAdmin=async(userId: string, id:string, payload: any)=>{

  const isBloodRequestExists= await prisma.bloodRequest.findUnique({
    where:{
      id,
      
    }
  })
  if(!isBloodRequestExists){
    throw new AppError(httpStatus.NOT_FOUND, "Blood Request Not Found")
  }

  const verifyRequest= await prisma.bloodRequest.update({
    where:{
      id
    },
    data:{
      ...payload
    }
    
  })
  return verifyRequest
}


export const bloodRequestService = {
	createBloodRequest,
  verifyBloodRequestByAdmin
};