import express from "express";
import jwt from "jsonwebtoken";
import { AccountModel, UserModel } from "./db";
import { JWT_SECRET } from "./config";
import { UserMiddleware } from "./middleware";
import cors from "cors";
import { startSession } from "mongoose";


const app = express();
app.use(express.json());
app.use(cors());


app.post("/api/v1/signup", async (req, res) => {

    //Todo:Add zod validation,hash the password

    const username = req.body.username;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    try {
        const newUser = await UserModel.create({
            username: username,
            firstName: firstName,
            lastName: lastName,
            password: password
        })



        await AccountModel.create({
            balance: 1 + Math.random() * 10000,
            userId: newUser._id
        })

        res.json({
            message: "User created successfully"
        })

    } catch (e) {
        res.status(411).json({
            message: "User already exists"
        })
    }

})

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await UserModel.findOne({
        username,
        password
    })
    if (user) {
        const token = jwt.sign({
            id: user._id
        }, JWT_SECRET);
        res.json({
            message: "Signin Successful",
            token: token
        });
    } else {
        res.status(403).json({
            message: "Incorrect Credentials"
        });
    }
})

app.put("/api/v1/user", UserMiddleware, async (req, res) => {
    const new_password = req.body.new_password;
    const new_firstName = req.body.new_firstName;
    const new_lastName = req.body.new_lastName;



    try {
        await UserModel.updateOne({
            //@ts-ignore
            _id: req.userId
        }, {
            password: new_password,
            firstName: new_firstName,
            lastName: new_lastName,

        })

        res.json({
            message: "Updated successfully"
        })
    }
    catch (e) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }
})

app.get("/api/v1/user/bulk", UserMiddleware, async (req, res) => {
    const filter = req.query.filter || "";
    const users = await UserModel.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map((user) => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })

})

app.get("/api/v1/account/balance", UserMiddleware, async (req, res) => {

    const account = await AccountModel.findOne({
        //@ts-ignore
        userId: req.userId
    })

    res.json({
        balance: account?.balance
    })
})

app.post("/api/v1/account/transfer",UserMiddleware, async (req, res) => {
    const session = await startSession();

    session.startTransaction();

    const toId = req.body.toId;
    const amount = req.body.amount;

    //Fetch the accounts 
    try{
    const account = await AccountModel.findOne({
        //@ts-ignore
        userId: req.userId
    }).session(session)

    if(!account){
        await session.abortTransaction();
        res.status(400).json({
            message: "you haven't logged in"
        });
        return;
    }

    else if(account.balance < amount|| account.balance < 0) {
        await session.abortTransaction();
        res.status(400).json({
            message: "Insufficient balance"
        });
        return;
    }


    const toAccount = await AccountModel.findOne({
        userId: toId
    }).session(session)

    if (!toAccount) {
        await session.abortTransaction();
        res.status(400).json({
            message: "Invalid account"
        });
        return;
    }

    //Perform the transfer
    await AccountModel.updateOne({
        //@ts-ignore
        userId: req.userId
    }, {
        $inc: {
            balance: -amount 
        }
    }).session(session)
    await AccountModel.updateOne({
        userId: toId
    }, {
        $inc: {
            balance: amount
        }
    }).session(session)

    //commit the transaction
    await session.commitTransaction();

    res.json({
        message:"Transfer successful"
    });
    }catch(e){
        await session.abortTransaction();
        res.status(500).json({
            message:"Error occured during Transfer"
        });
    }

})


app.listen(3000);


