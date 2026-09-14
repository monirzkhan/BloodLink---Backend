import { BloodRequestStatus, DonorAvailability, DonorOfferStatus, RequestUrgency, UserRole, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utility/AppError";
import  HttpStatus  from "http-status";
import {  getCompatibleBloodGroups, isEligibleToDonate } from "./bloodRequest.utils";
import { calculateDistanceKm } from "../../utility/distance";
import { Candidate } from "./bloodRequest.interface";



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

const selectedDonors =
	candidates.slice(
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

await prisma.$transaction([
	prisma.bloodRequestDonor.createMany({
		data: selectedDonors.map((donor) => ({
		requestId: request.id,
		donorId: donor.donorId,
		matchScore: donor.matchScore,
		distanceKm: donor.distanceKm,
		status: DonorOfferStatus.OFFERED,
	})),
	skipDuplicates: true,
	}),

	prisma.bloodRequest.update({
		where: {
			id: request.id,
		},
		data: {
        status:
            selectedDonors.length > 0
                ? BloodRequestStatus.DONOR_FOUND
                : BloodRequestStatus.SEARCHING_DONORS,
    },
	}),
]);

return selectedDonors

};