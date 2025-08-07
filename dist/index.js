"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = require("mongoose");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Todo:Add zod validation,hash the password
    const username = req.body.username;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    try {
        const newUser = yield db_1.UserModel.create({
            username: username,
            firstName: firstName,
            lastName: lastName,
            password: password
        });
        yield db_1.AccountModel.create({
            balance: 1 + Math.random() * 10000,
            userId: newUser._id
        });
        res.json({
            message: "User created successfully"
        });
    }
    catch (e) {
        res.status(411).json({
            message: "User already exists"
        });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const user = yield db_1.UserModel.findOne({
        username,
        password
    });
    if (user) {
        const token = jsonwebtoken_1.default.sign({
            id: user._id
        }, config_1.JWT_SECRET);
        res.json({
            message: "Signin Successful",
            token: token
        });
    }
    else {
        res.status(403).json({
            message: "Incorrect Credentials"
        });
    }
}));
app.put("/api/v1/user", middleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const new_password = req.body.new_password;
    const new_firstName = req.body.new_firstName;
    const new_lastName = req.body.new_lastName;
    try {
        yield db_1.UserModel.updateOne({
            //@ts-ignore
            _id: req.userId
        }, {
            password: new_password,
            firstName: new_firstName,
            lastName: new_lastName,
        });
        res.json({
            message: "Updated successfully"
        });
    }
    catch (e) {
        res.status(411).json({
            message: "Error while updating information"
        });
    }
}));
app.get("/api/v1/user/bulk", middleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = req.query.filter || "";
    const users = yield db_1.UserModel.find({
        $or: [{
                firstName: {
                    "$regex": filter
                }
            }, {
                lastName: {
                    "$regex": filter
                }
            }]
    });
    res.json({
        user: users.map((user) => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    });
}));
app.get("/api/v1/account/balance", middleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield db_1.AccountModel.findOne({
        //@ts-ignore
        userId: req.userId
    });
    res.json({
        balance: account === null || account === void 0 ? void 0 : account.balance
    });
}));
app.post("/api/v1/account/transfer", middleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    session.startTransaction();
    const toId = req.body.toId;
    const amount = req.body.amount;
    //Fetch the accounts 
    try {
        const account = yield db_1.AccountModel.findOne({
            //@ts-ignore
            userId: req.userId
        }).session(session);
        if (!account) {
            yield session.abortTransaction();
            res.status(400).json({
                message: "you haven't logged in"
            });
            return;
        }
        else if (account.balance < amount || account.balance < 0) {
            yield session.abortTransaction();
            res.status(400).json({
                message: "Insufficient balance"
            });
            return;
        }
        const toAccount = yield db_1.AccountModel.findOne({
            userId: toId
        }).session(session);
        if (!toAccount) {
            yield session.abortTransaction();
            res.status(400).json({
                message: "Invalid account"
            });
            return;
        }
        //Perform the transfer
        yield db_1.AccountModel.updateOne({
            //@ts-ignore
            userId: req.userId
        }, {
            $inc: {
                balance: -amount
            }
        }).session(session);
        yield db_1.AccountModel.updateOne({
            userId: toId
        }, {
            $inc: {
                balance: amount
            }
        }).session(session);
        //commit the transaction
        yield session.commitTransaction();
        res.json({
            message: "Transfer successful"
        });
    }
    catch (e) {
        yield session.abortTransaction();
        res.status(500).json({
            message: "Error occured during Transfer"
        });
    }
}));
app.listen(3000);
