import config from "../config";
import { AppError } from "../utility/AppError";
import { redis } from "./redis";
import httpStatus from "http-status";

export const getGrantToken = async () => {
	try {
		const idTokenKey = "bKash:IdToken";
		const refreshTokenKey = "bKash:RefreshToken";

		let bkashIdToken = await redis.get(idTokenKey);
		const bkashIdTokenTTL = await redis.ttl(idTokenKey);

		const bkashRfreshToken = await redis.get(refreshTokenKey);
		const bkashRefreshTokenTTL = await redis.ttl(refreshTokenKey);

		// console.log({
		//     bkashIdToken, bkashIdTokenTTL,
		//     bkashRfreshToken,
		//     bkashRefreshTokenTTL
		// });

		if (
			(!bkashIdToken || bkashIdTokenTTL <= 600) &&
			bkashRfreshToken &&
			bkashRefreshTokenTTL > 600
		) {
			const bkashRefreshTokenResponse = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
				{
					method: "POST",
					headers: {
						"Content-Type": "aplication/json",
						Accept: "aplication/json",
						username: config.bkash_username,
						password: config.bkash_password,
					},
					body: JSON.stringify({
						app_key: config.bkash_app_key,
						app_secret: config.bkash_app_secret,
						refresh_token: bkashRfreshToken,
					}),
				},
			);
			if (!bkashRefreshTokenResponse.ok) {
				throw new AppError(httpStatus.BAD_REQUEST, "Bkash Refresh token failed");
			}

			const bkashRefreshTokenResult = await bkashRefreshTokenResponse.json();
			bkashIdToken = bkashRefreshTokenResult.id_token as string;

			await redis.set(idTokenKey, bkashIdToken, {
				expiration: {
					type: "EX",
					value: 60 * 60,
				},
			});

			return bkashIdToken;
		}

		if (bkashIdTokenTTL > 600) {
			return bkashIdToken;
		}

		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "aplication/json",
					Accept: "aplication/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
				}),
			},
		);
		if (!response.ok) {
			throw new AppError(httpStatus.BAD_REQUEST, "Bkash Grant token failed");
		}
		const result = await response.json();

		await redis.set(idTokenKey, result.id_token, {
			expiration: {
				type: "EX",
				value: 60 * 60, //1 hrs
			},
		});
		await redis.set(refreshTokenKey, result.refresh_token, {
			expiration: {
				type: "EX",
				value: 60 * 60 * 24 * 28, //28 days
			},
		});

		bkashIdToken = result.id_token;

		return bkashIdToken;
	} catch (error: any) {
		throw new AppError(httpStatus.BAD_REQUEST, error.message);
	}
};
