import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import cors from "cors";
import config from "./app/config";
import cookieParser from "cookie-parser";
import httpStatus from "http-status";
import { authRoute } from "./app/module/auth/auth.route";
import { paymentRoute } from "./app/module/payment/payment.route";
import { userRoute } from "./app/module/user/user.route";
import { bloodRequestRoute } from "./app/module/bloodRequest/bloodRequest.route";
import { pushNotificationRouter } from "./app/module/pushNotification/pushNotification.route";
import { donorOfferRouter } from "./app/module/donorOffer/donorOffer.route";
import { contactRoutes } from "./app/module/contact/contact.route";
import { appointmentRoutes } from "./app/module/Appoinment/appoinment.routes";
import { notFound } from "./app/middleware/notFound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { donationRoutes } from "./app/module/donation/donation.route";
import { adminRouters } from "./app/module/admin/admin.route";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/request", bloodRequestRoute);
app.use("/api/v1/donorOffers", donorOfferRouter);
app.use("/api/v1/push-notification", pushNotificationRouter);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/appointment", appointmentRoutes);
app.use("/api/v1/donation", donationRoutes);
app.use("/api/v1/admin",adminRouters);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to BloodLink Backend System",
		description: "BloodLink — Connect donors with people in need",
		version: "1.0",
		Author: "Mohammad Moniruzzaman",
		email: "mmonirz.dev@gmail.com",
	});
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
