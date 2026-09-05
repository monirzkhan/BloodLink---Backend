import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default{
    database_url:process.env.DATABASE_URL,
    port:process.env.PORT,
    frontend_url:process.env.FRONTEND_URL,
    jwt_access_secret:process.env.JWT_ACCESS_SECRET!,
    jwt_refresh_secret:process.env.JWT_REFRESH_SECRET!,
    jwt_access_expires_in:process.env.JWT_ACCESS_EXPIRES_IN!,
    jwt_refresh_expires_in:process.env.JWT_REFRESH_EXPIRES_IN!,
    bcrypt_salt_rounds:process.env.BCRYPT_SALT_ROUNDS!,
    redis_username: process.env.REDIS_USERNAME!,
	redis_password: process.env.REDIS_PASSWORD!,
	redis_host: process.env.REDIS_HOST!,
	redis_port: process.env.REDIS_PORT!,
    super_admin_name: process.env.SUPER_ADMIN_NAME!,
    super_admin_email: process.env.SUPER_ADMIN_EMAIL!,
    super_admin_password: process.env.SUPER_ADMIN_PASSWORD!,
    super_admin_phone: process.env.SUPER_ADMIN_PHONE!,
    tester_admin_name: process.env.TESTER_ADMIN_NAME!,
    tester_admin_email: process.env.TESTER_ADMIN_EMAIL!,
    tester_admin_password: process.env.TESTER_ADMIN_PASSWORD!,
    tester_admin_phone: process.env.TESTER_ADMIN_PHONE!,    
    tester_donor_name: process.env.TESTER_DONOR_NAME!,
    tester_donor_email: process.env.TESTER_DONOR_EMAIL!,
    tester_donor_password: process.env.TESTER_DONOR_PASSWORD!,
    tester_donor_phone: process.env.TESTER_DONOR_PHONE!,
    smtp_user: process.env.SMTP_USER!,
    smtp_password: process.env.SMTP_PASSWORD!,
    smtp_sender: process.env.SMTP_SENDER!
}