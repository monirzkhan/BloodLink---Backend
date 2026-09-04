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

}