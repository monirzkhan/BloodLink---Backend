import { BloodGroup } from "../../../generated/prisma/enums";

export const generateRequestNumber = (): string => {
	const timestamp = Date.now();

	const random = Math.floor(
		1000 + Math.random() * 9000
	);

	return `BL-${timestamp}-${random}`;
};

const compatibleBloodGroups: Record<
	BloodGroup,
	BloodGroup[]
> = {
	A_POSITIVE: [
		"A_POSITIVE",
		"A_NEGATIVE",
		"O_POSITIVE",
		"O_NEGATIVE",
	],

	A_NEGATIVE: [
		"A_NEGATIVE",
		"O_NEGATIVE",
	],

	B_POSITIVE: [
		"B_POSITIVE",
		"B_NEGATIVE",
		"O_POSITIVE",
		"O_NEGATIVE",
	],

	B_NEGATIVE: [
		"B_NEGATIVE",
		"O_NEGATIVE",
	],

	AB_POSITIVE: [
		"A_POSITIVE",
		"A_NEGATIVE",
		"B_POSITIVE",
		"B_NEGATIVE",
		"AB_POSITIVE",
		"AB_NEGATIVE",
		"O_POSITIVE",
		"O_NEGATIVE",
	],

	AB_NEGATIVE: [
		"A_NEGATIVE",
		"B_NEGATIVE",
		"AB_NEGATIVE",
		"O_NEGATIVE",
	],

	O_POSITIVE: [
		"O_POSITIVE",
		"O_NEGATIVE",
	],

	O_NEGATIVE: [
		"O_NEGATIVE",
	],
};

export const getCompatibleBloodGroups = (
	bloodGroup: BloodGroup,
): BloodGroup[] => {
	return compatibleBloodGroups[bloodGroup];
};

export const isEligibleToDonate = (
    lastDonationDate: Date | null,
): boolean => {

    if (!lastDonationDate) {
        return true;
    }

    const today = new Date();

    const diffDays = Math.floor(
        (today.getTime() - lastDonationDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return diffDays >= 120;
};