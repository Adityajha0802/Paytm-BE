import {Request,Response,NextFunction}from "express";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config";
export const UserMiddleware=(req:Request,res:Response,next:NextFunction):void=>{
    const header=req.headers["authorization"];

    try{
        const decodeduser = jwt.verify(header as string, JWT_SECRET) ;
        //@ts-ignore
        req.userId = decodeduser.id;
        next();
    } catch (error: any) {
        console.log('JWT verification failed:', error.message);
        res.status(403).json({
            message: "Invalid or expired token"
        });
        return;
        }
    }
   

