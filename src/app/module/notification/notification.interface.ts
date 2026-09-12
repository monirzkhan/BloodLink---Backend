export interface IPushSubscription {
	endpoint: string;

	expirationTime?: number | null;

	keys: {
		p256dh: string;
		auth: string;
	};
}

export interface IPushPayload {
	title: string;
	body: string;
	url?: string;
	icon?: string;
}