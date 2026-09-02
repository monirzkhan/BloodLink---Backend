import app from "./app";
import config from "./app/config";
import { prisma } from "./lib/prisma";

const port = config.port;

const main=async()=>{
    try {
        await prisma.$connect()
        console.log("Prisma Connected Successfully");

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