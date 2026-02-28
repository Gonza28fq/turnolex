"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, message: 'Token requerido' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRol = decoded.rol;
        req.estudioId = decoded.estudioId;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRol)) {
            res.status(403).json({
                success: false,
                message: 'No tenés permisos para realizar esta acción'
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
