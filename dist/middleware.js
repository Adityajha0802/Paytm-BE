"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const UserMiddleware = (req, res, next) => {
    const header = req.headers["authorization"];
    try {
        const decodeduser = jsonwebtoken_1.default.verify(header, config_1.JWT_SECRET);
        //@ts-ignore
        req.userId = decodeduser.id;
        next();
    }
    catch (error) {
        console.log('JWT verification failed:', error.message);
        res.status(403).json({
            message: "Invalid or expired token"
        });
        return;
    }
};
exports.UserMiddleware = UserMiddleware;
