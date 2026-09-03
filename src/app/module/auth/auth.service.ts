import { prisma } from "../../lib/prisma"

const createAccount =async(payload: any)=>{
    const {name,email, password, phone} = payload
    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password,
            phone
        }
    })
    return createdUser

}

export const authService={
    createAccount
}