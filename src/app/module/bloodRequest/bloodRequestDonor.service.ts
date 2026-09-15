import { BloodRequestStatus, DonorAvailability, DonorOfferStatus, RequestUrgency, UserRole, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import  HttpStatus  from "http-status";
import {  getCompatibleBloodGroups, isEligibleToDonate } from "./bloodRequest.utils";
import { calculateDistanceKm } from "../../utility/distance";
import { Candidate } from "./bloodRequest.interface";
import { sendPushNotificationToUsers } from "../../utility/sendPushNotification";
import config from "../../config";
import path from "node:path";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs"



export const findAndMatchDonors = async (
	requestId: string,
) => {
    
	const request = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!request) {
		throw new AppError(
			HttpStatus.NOT_FOUND,
			"Blood request not found",
		);
	}
    

    const compatibleGroups = getCompatibleBloodGroups(
	request.bloodGroup);

    //Find Existing Offer
    const existingOffers = await prisma.bloodRequestDonor.findMany({
		where: {
			requestId: request.id,
		},
		select: {
			donorId: true,
		},
	});

    const existingDonorIds = existingOffers.map(
		(offer) => offer.donorId,
	);


	// Find Donors
    const donors = await prisma.user.findMany({
	where: {
        id:{
            notIn:existingDonorIds
        },
        
		role: UserRole.DONOR,

		status: UserStatus.ACTIVE,

		donorProfile: {
			is: {
				bloodGroup: {
					in: compatibleGroups,
				},

				availability:
					DonorAvailability.AVAILABLE,

				isVerified: true,
			},
		},
	},
    select:{
        id: true,
        donorProfile:{
            select:{
            bloodGroup: true,
            availability: true,
            latitude: true,
            longitude: true,
            district: true,
            area: true,
            lastDonationDate: true,
            }
        }
    }

	// include: {
	// 	donorProfile: true,
	// },
});
    // const donorLat = donors[0].donorProfile?.latitude
	// 	? Number(donors[0].donorProfile?.latitude)
	// 	: null;
    // const donorLong = donors[0].donorProfile?.longitude
	// 	? Number(donors[0].donorProfile.longitude)
	// 	: null;

    
    const calculateMatchScore = (
	distanceKm: number | null,
) => {
	if (distanceKm === null) {
		return 30;
	}

	if (distanceKm <= 5) {
		return 100;
	}

	if (distanceKm <= 10) {
		return 85;
	}

	if (distanceKm <= 20) {
		return 70;
	}

	if (distanceKm <= 30) {
		return 50;
	}

	return 30;
};
    
    const candidates: Candidate[] = donors
	.map((donor) => {
		const profile = donor.donorProfile;

		if (!profile) {
			return null;
		}

		if (
			!isEligibleToDonate(
				profile.lastDonationDate,
			)
		) {
			return null;
		}

		let distanceKm: number | null = null;

		if (
			request.latitude &&
			request.longitude &&
			profile.latitude &&
			profile.longitude
		) {
			distanceKm = calculateDistanceKm(
				Number(request.latitude),
				Number(request.longitude),
				Number(profile.latitude),
				Number(profile.longitude),
			);
		}
        const matchScore=calculateMatchScore(distanceKm);

		return {
			donorId: donor.id,
			distanceKm,
            matchScore
		};
	})
	.filter(
	(
		candidate,
	): candidate is {
		donorId: string;
		distanceKm: number | null;
		matchScore: number;
	} => candidate !== null
);


candidates.sort((a, b) => {

    if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
    }

    return (
        (a.distanceKm ?? Infinity) -
        (b.distanceKm ?? Infinity)
    );
});


const donorLimit: Record<RequestUrgency, number> = {
	EMERGENCY: 50,
	URGENT: 30,
	NORMAL: 15,
};

const selectedDonors = candidates.slice(
		0,
		donorLimit[request.urgency],
	);

if (selectedDonors.length === 0) {

	await prisma.bloodRequest.update({
		where: {
			id: request.id,
		},
		data: {
			status:
				BloodRequestStatus.NO_DONOR_FOUND,
		},
	});

	return [];
}

// await prisma.$transaction([
// 	prisma.bloodRequestDonor.createMany({
// 		data: selectedDonors.map((donor) => ({
// 		requestId: request.id,
// 		donorId: donor.donorId,
// 		matchScore: donor.matchScore,
// 		distanceKm: donor.distanceKm,
// 		status: DonorOfferStatus.OFFERED,
// 	})),
// 	skipDuplicates: true,
// 	}),

// 	prisma.bloodRequest.update({
// 		where: {
// 			id: request.id,
// 		},
// 		data: {
//         status:
//             selectedDonors.length > 0
//                 ? BloodRequestStatus.DONOR_FOUND
//                 : BloodRequestStatus.SEARCHING_DONORS,
//     },
// 	}),

// ]);

const result = await prisma.$transaction(async (tx) => {
	const createdOffers: any = [];

	for (const donor of selectedDonors) {
		const offer = await tx.bloodRequestDonor.upsert({
			where: {
				requestId_donorId: {
					requestId: request.id,
					donorId: donor.donorId,
				},
			},
			update: {},
			create: {
				requestId: request.id,
				donorId: donor.donorId,
				matchScore: donor.matchScore,
				distanceKm: donor.distanceKm,
				status: DonorOfferStatus.OFFERED,
			},
		});

		createdOffers.push(offer);
	}

	await tx.bloodRequest.update({
		where: {
			id: request.id,
		},
		data: {
			status: BloodRequestStatus.DONOR_FOUND,
		},
	});

	return createdOffers;
});

await prisma.donorReservation.createMany({
	data: result.map((offer: any) => ({
		requestId: request.id,
		donorId: offer.donorId,
		donorOfferId: offer.id,
	})),
	skipDuplicates: true,
});

	//send Email and SMS
	const sendFakeSms = async (
	phone: string,
	message: string,
) => {
	console.log(`
========================================
📱 FAKE SMS
========================================
To: ${phone}

${message}
========================================
`);
};

// ========================================
// SEND EMAIL + FAKE SMS
// ========================================

const notificationResults = await Promise.allSettled(
	selectedDonors.map(async (candidate) => {
		try {
			const donor = await prisma.user.findUnique({
				where: {
					id: candidate.donorId,
				},
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			});

			if (!donor) {
				console.log(
					`Donor not found: ${candidate.donorId}`,
				);

				return;
			}

			console.log(
				`Preparing notification for donor: ${donor.name}`,
			);

			// ========================================
			// EMAIL
			// ========================================

			if (donor.email) {
				const templatePath = path.join(
					process.cwd(),
					"src",
					"app",
					"templates",
					"blood-request",
					"blood-request-donor.ejs",
				);

				console.log(
					"Email template:",
					templatePath,
				);

				const templateData = {
					donorName: donor.name,
					bloodGroup: request.bloodGroup,
					unitsRequired: request.unitsRequired,
					urgency: request.urgency,
					location: request.address,


					// Donor opens full request
				requestUrl: `${config.frontend_url}/blood-requests/${request.id}`,

				// Donor accepts this request
				acceptUrl: `${config.frontend_url}/blood-requests/${request.id}/accept`,

					requiredDate: request.requiredDate.toLocaleDateString(
					"en-BD",
					{
					timeZone: "Asia/Dhaka",
					}
					),

					requiredTime: request.requiredTime
						? request.requiredTime.toLocaleTimeString(
								"en-BD",
								{
									timeZone: "Asia/Dhaka",
									hour: "2-digit",
									minute: "2-digit",
								},
							)
						: null,

				};

				const html = await ejs.renderFile(
					templatePath,
					templateData,
				);

				console.log(
					`Sending email to: ${donor.email}`,
				);

				await transporter.sendMail({
					from: `"BloodLink" <${config.smtp_sender}>`,
					to: donor.email,
					subject:
						`🩸 Blood Link — ${request.bloodGroup} Blood Needed`,
					html,
				});

				console.log(
					`✅ Email sent to ${donor.email}`,
				);
			} else {
				console.log(
					`⚠️ Donor ${donor.name} has no email`,
				);
			}

			// ========================================
			// FAKE SMS
			// ========================================

			if (donor.phone) {
				await sendFakeSms(
					donor.phone,
					`Blood Link: ${request.bloodGroup} blood is urgently needed.`,
				);
			} else {
				console.log(
					`⚠️ Donor ${donor.name} has no phone number`,
				);
			}
		} catch (error) {
			console.error(
				`❌ Notification failed for donor ${candidate.donorId}`,
				error,
			);
		}
	}),
);

console.log(
	"Notification results:",
	notificationResults,
);
	

//send Push Notification
	const donorIds = selectedDonors.map(
	(donor) => donor.donorId,
);

try {
		await sendPushNotificationToUsers(
	donorIds,
	{
		title: "🩸 Urgent Blood Request",
		body: `${request.bloodGroup} blood is urgently needed near you.`,
		icon: "/src/app/icon/bloodLink-log.png", //frontend icon path/link
		url: `${config.frontend_url}/blood-requests/${request.id}`, //frontend URL
		data: {
			type: "BLOOD_REQUEST",
			bloodRequestId: request.id,
		},
	},
);
} catch (error) {
	console.error(
		"Failed to send donor push notifications:",
		error,
	);
	
}



return selectedDonors

};