import mongoose, { model, Schema } from "mongoose";
import  dotenv from 'dotenv';

dotenv.config();

const databaseUrl:any=process.env.DATABASE_URL;
mongoose.connect(databaseUrl);

const UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true }
})

export const UserModel = model("users", UserSchema);

const AccountSchema= new Schema({
    balance:{type:Number,required:true},
    userId:{type:mongoose.Types.ObjectId,ref:'users',required:true}
})

export const AccountModel=model("accounts",AccountSchema);