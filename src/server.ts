import app from "./app";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { redis } from "./app/lib/redis";
import { seedSuperAdmin, seedTesterAdmin, seedTesterDonor } from "./app/lib/seed";
// import { seedSuperAdmin, seedTesterAdmin, seedTesterDonor } from "./app/lib/seed";

const port = config.port;

const main=async()=>{
    try {
        await prisma.$connect()
        console.log("Prisma Connected Successfully");

        await seedSuperAdmin();
        await seedTesterAdmin()
        await seedTesterDonor()

        // redis.on("error", (err) => {
        // console.error("Redis error:", err);
        // });

        await redis.connect();

        console.log("Redis connected");

        app.listen({port},()=>{
            console.log(`Server is Listening from port ${port}`);
        })
       
      

    } catch (error) {
        console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
        
    }
}

main()