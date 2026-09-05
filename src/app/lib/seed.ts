
import { UserRole } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

export const seedSuperAdmin = async () => {
	try {
		const isSuperAdminExists = await prisma.user.findFirst({
			where: {
				role: UserRole.SUPER_ADMIN,
			},
		});

		if (isSuperAdminExists) {
			console.log("Super Admin Already Exists!");
			return;
		}

		const name = config.super_admin_name;
		const email = config.super_admin_email;
		const password = config.super_admin_password;
        const phone = config.super_admin_phone;

		if (!name || !email || !password || !phone) {
			throw new Error(
				"Super Admin name, email, password, or phone not found in env file",
			);
		}

		const hashPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const superAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPassword,
				role: UserRole.SUPER_ADMIN,
				phone,
				emailVerified: true,
			},
		});
		// console.log("Super Admin Created", superAdmin);
	} catch (error) {
		console.log("Super Admin Seeding Error", error);

		await prisma.user.delete({
			where: {
				email: config.super_admin_email,
			},
		});
	}
};
export const seedTesterAdmin = async () => {
	try {
		const isTesterAdminExists = await prisma.user.findUnique({
			where: {
				email: config.tester_admin_email,
			},
		});

		if (isTesterAdminExists) {
			console.log("Tester Admin Already Exists!");
			return;
		}

		const name = config.tester_admin_name;
		const email = config.tester_admin_email;
		const password = config.tester_admin_password;
        const phone = config.tester_admin_phone;

		if (!name || !email || !password ||!phone) {
			throw new Error(
				"Tester Admin name, email, password, Phone not found in env file",
			);
		}

		const hashPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const TesterAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPassword,
				role: UserRole.ADMIN,
				phone: phone,
				emailVerified: true,
			},
		});
		// console.log("Tester Admin Created", TesterAdmin);
	} catch (error) {
		console.log("Tester Admin Seeding Error", error);

		await prisma.user.delete({
			where: {
				email: config.tester_admin_email,
			},
		});
	}
};
export const seedTesterDonor = async () => {
	try {
		const isTesterDonorExists = await prisma.user.findUnique({
			where: {
				email: config.tester_donor_email,
			},
		});

		if (isTesterDonorExists) {
			console.log("Tester Donor Already Exists!");
			return;
		}

		const name = config.tester_donor_name;
		const email = config.tester_donor_email;
		const password = config.tester_donor_password;
		const phone = config.tester_donor_phone;        

		if (!name || !email || !password || !phone) {
			throw new Error(
				"Tester Donor name, email, password, phone not found in env file",
			);
		}

		const hashPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const TesterDonor = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPassword,
				role: UserRole.DONOR,
				phone: phone,
				emailVerified: true,
				// needPasswordChange: false,
			},
		});
		// console.log("Tester Donor Created", TesterDonor);
	} catch (error) {
		console.log("Tester Donor Seeding Error", error);

		await prisma.user.delete({
			where: {
				email: config.tester_donor_email,
			},
		});
	}
};
