import webpush from "web-push";
import config from "../config";


webpush.setVapidDetails(
	config.vapid_email,
	config.vapid_public_key,
	config.vapid_private_key
);

export default webpush;