interface ISmsProvider {
	send(
		phone: string,
		message: string,
	): Promise<void>;
}

export class ConsoleSmsProvider implements ISmsProvider {
	async send(
		phone: string,
		message: string,
	) {
		console.log(
			`SMS → ${phone}: ${message}`,
		);
	}
}