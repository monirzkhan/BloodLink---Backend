import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";

const createAccount=catchAsync(async(req: Request, res: Response)=>{
    console.log("Hi from Register");
    res.send('Hlw World')

})

export const authController={
    createAccount
}