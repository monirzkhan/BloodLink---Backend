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

export default app;
