// import { createClient } from "redis";
// import config from "../config";

// export const redis = createClient({
// 	username: config.redis_username,
// 	password: config.redis_password,
// 	socket: {
// 		host: config.redis_host,
// 		port: Number(config.redis_port),
// 	},
// });

import { createClient } from "redis";
import config from "../config";

export const redis = createClient({
    username: config.redis_username,
    password: config.redis_password,

    socket: {
        host: config.redis_host,
        port: Number(config.redis_port),

        reconnectStrategy: (retries) => {
            console.log(`Redis reconnect attempt: ${retries}`);

            return Math.min(retries * 500, 5000);
        },
    },
});

redis.on("connect", () => {
    console.log("Redis: connecting...");
});

redis.on("ready", () => {
    console.log("Redis: READY");
});

redis.on("error", (error) => {
    console.error("Redis Error:", error);
});

redis.on("reconnecting", () => {
    console.log("Redis: reconnecting...");
});

redis.on("reconnecting", () => {
    console.log("Redis: reconnecting...");
});
