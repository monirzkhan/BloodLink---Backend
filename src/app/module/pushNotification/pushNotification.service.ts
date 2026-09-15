import { prisma } from "../../lib/prisma";

const subscribeToPush = async (
	userId: string,
	payload: {
		endpoint: string;
		keys: {
			p256dh: string;
			auth: string;
		};
	},
) => {
	const { endpoint, keys } = payload;

	return prisma.pushSubscription.upsert({
		where: {
			endpoint,
		},
		update: {
			userId,
			p256dh: keys.p256dh,
			auth: keys.auth,
		},
		create: {
			userId,
			endpoint,
			p256dh: keys.p256dh,
			auth: keys.auth,
		},
	});
};

export const pushNotificationService={
    subscribeToPush

}