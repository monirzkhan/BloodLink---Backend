import webpush from "../../lib/pushNotification";
import { prisma } from "../../lib/prisma";
import { IPushPayload, IPushSubscription } from "./notification.interface";


const savePushSubscription = async (
	userId: string,
	payload: IPushSubscription,
	userAgent?: string
) => {

	const subscription =
		await prisma.pushSubscription.upsert({

			where: {
				endpoint: payload.endpoint,
			},

			update: {
				p256dh: payload.keys.p256dh,
				auth: payload.keys.auth,
				userAgent,
			},

			create: {
				userId,

				endpoint:
					payload.endpoint,

				p256dh:
					payload.keys.p256dh,

				auth:
					payload.keys.auth,

				userAgent,
			},
		});

	return subscription;
};

const sendPushNotification = async (
	userId: string,
	payload: IPushPayload
) => {

	const subscriptions =
		await prisma.pushSubscription.findMany({
			where: {
				userId,
			},
		});

	for (const subscription of subscriptions) {

		try {

			await webpush.sendNotification(

				{
					endpoint:
						subscription.endpoint,

					keys: {
						p256dh:
							subscription.p256dh,

						auth:
							subscription.auth,
					},
				},

				JSON.stringify(payload)
			);

		} catch (error: any) {

			// Subscription expired or is no longer valid
			if (error.statusCode === 404 ||
				error.statusCode === 410) {

				await prisma.pushSubscription.delete({
					where: {
						id: subscription.id,
					},
				});
			}
		}
	}
};

export const notificationService = {
	sendPushNotification,
};