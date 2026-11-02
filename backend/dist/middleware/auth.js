"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Estudio_1 = __importDefault(require("../models/Estudio"));
const authenticate = async (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
        res.status(401).json({ success: false, message: 'Token requerido' });
        return;
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    }
    catch {
        res.status(401).json({ success: false, message: 'Sesión vencida o inválida' });
        return;
    }
    try {
        // El token no alcanza: el usuario puede haber sido desactivado o el estudio dado de baja después de emitirlo
        const user = await User_1.default.findById(decoded.id).select('rol estudio activo').lean();
        if (!user || !user.activo) {
            res.status(401).json({ success: false, message: 'Usuario desactivado' });
            return;
        }
        const estudioId = user.estudio ? String(user.estudio) : undefined;
        if (!estudioId && user.rol !== 'superadmin') {
            res.status(403).json({ success: false, message: 'Usuario sin estudio' });
            return;
        }
        if (estudioId) {
            const estudio = await Estudio_1.default.findById(estudioId).select('activo aprobado').lean();
            if (!estudio || !estudio.activo || !estudio.aprobado) {
                res.status(403).json({ success: false, message: 'El estudio no está habilitado' });
                return;
            }
        }
        // rol y estudio salen de la base, no del token (si cambian, rige lo nuevo)
        req.userId = String(user._id);
        req.userRol = user.rol;
        req.estudioId = estudioId;
        next();
    }
    catch (err) {
        console.error('[auth]', err);
        res.status(500).json({ success: false, message: 'Error de autenticación' });
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
