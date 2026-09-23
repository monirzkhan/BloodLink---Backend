import type { ScreeningStatus } from "../../../generated/prisma/enums";

export interface IUpdateScreening {
	screeningStatus: ScreeningStatus;

	screeningNotes?: string;
}

export interface ICompleteDonation {
	notes?: string;
	units?: number;
}
