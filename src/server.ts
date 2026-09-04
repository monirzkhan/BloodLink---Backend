import app from "./app";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { seedSuperAdmin } from "./app/lib/seed";
// import { seedSuperAdmin, seedTesterAdmin, seedTesterDonor } from "./app/lib/seed";

const port = config.port;

const main=async()=>{
    try {
        await prisma.$connect()
        console.log("Prisma Connected Successfully");

        await seedSuperAdmin();

        app.listen({port},()=>{
            console.log(`Server is Listening from port ${port}`);
        })
       
        // await seedTesterAdmin()
        // await seedTesterDonor()

    } catch (error) {
        console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
        
    }
}

main()