import { prisma } from "../lib/prisma";
import webpush from "../lib/pushNotification";

interface IPushPayload {
	title: string;
	body: string;
	icon?: string;
	url?: string;
	data?: Record<string, unknown>;
}

export const sendPushNotification = async (
	userId: string,
	payload: IPushPayload,
) => {
	const subscriptions = await prisma.pushSubscription.findMany({
		where: {
			userId,
		},
	});

	const results = await Promise.allSettled(
		subscriptions.map(async (subscription) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: subscription.endpoint,
						keys: {
							p256dh: subscription.p256dh,
							auth: subscription.auth,
						},
					},
					JSON.stringify(payload),
				);
			} catch (error: any) {
				// Subscription expired / invalid
				if (error.statusCode === 404 || error.statusCode === 410) {
					await prisma.pushSubscription.delete({
						where: {
							id: subscription.id,
						},
					});
				}

				throw error;
			}
		}),
	);

	return results;
};

export const sendPushNotificationToUsers = async (
	userIds: string[],
	payload: IPushPayload,
) => {
	await Promise.allSettled(
		userIds.map((userId) => sendPushNotification(userId, payload)),
	);
};
