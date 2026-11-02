"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esObjectId = exports.esEmail = exports.esTexto = exports.errorInterno = exports.sanitizarBody = exports.soloSuperadmin = exports.verificarAccionEstudio = exports.firmarAccionEstudio = exports.esc = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Escapa texto que va dentro de HTML (mails, páginas de respuesta)
const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
exports.esc = esc;
const igualesSeguro = (a, b) => {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && crypto_1.default.timingSafeEqual(ba, bb);
};
const secretoSuperadmin = () => {
    const s = process.env.SUPERADMIN_SECRET;
    return s && s.length >= 16 ? s : null; // sin secreto configurado (o muy corto) no se aprueba nada
};
// Firma para los links de aprobar / rechazar que van en el mail al superadmin.
// Vence a los 7 días y está atada al estudio y a la acción.
const firmarAccionEstudio = (estudioId, accion, vence = Date.now() + 7 * 864e5) => {
    const secreto = secretoSuperadmin();
    if (!secreto)
        throw new Error('SUPERADMIN_SECRET no configurado (mínimo 16 caracteres)');
    const firma = crypto_1.default.createHmac('sha256', secreto).update(`${estudioId}:${accion}:${vence}`).digest('hex');
    return { vence, firma };
};
exports.firmarAccionEstudio = firmarAccionEstudio;
const verificarAccionEstudio = (estudioId, accion, vence, firma) => {
    const secreto = secretoSuperadmin();
    if (!secreto || typeof firma !== 'string' || typeof vence !== 'string')
        return false;
    const v = Number(vence);
    if (!Number.isFinite(v) || v < Date.now())
        return false;
    const esperada = crypto_1.default.createHmac('sha256', secreto).update(`${estudioId}:${accion}:${v}`).digest('hex');
    return igualesSeguro(esperada, firma);
};
exports.verificarAccionEstudio = verificarAccionEstudio;
// Solo por header (nunca por query string: queda en logs e historial)
const soloSuperadmin = (req, res, next) => {
    const secreto = secretoSuperadmin();
    const enviado = req.headers['x-superadmin-secret'];
    if (!secreto || typeof enviado !== 'string' || !igualesSeguro(enviado, secreto)) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
    }
    next();
};
exports.soloSuperadmin = soloSuperadmin;
// Saca claves con "$" o "." del body (evita inyección de operadores de Mongo como {"email": {"$ne": null}})
const limpiar = (v) => {
    if (Array.isArray(v))
        return v.map(limpiar);
    if (v && typeof v === 'object') {
        const out = {};
        for (const [k, val] of Object.entries(v))
            if (!k.startsWith('$') && !k.includes('.'))
                out[k] = limpiar(val);
        return out;
    }
    return v;
};
const sanitizarBody = (req, _res, next) => {
    if (req.body && typeof req.body === 'object')
        req.body = limpiar(req.body);
    next();
};
exports.sanitizarBody = sanitizarBody;
// Error 500 sin filtrar detalles internos al cliente
const errorInterno = (res, mensaje, err) => {
    console.error(`[${mensaje}]`, err);
    res.status(500).json({ success: false, message: mensaje });
};
exports.errorInterno = errorInterno;
const esTexto = (v, min = 1, max = 500) => typeof v === 'string' && v.trim().length >= min && v.length <= max;
exports.esTexto = esTexto;
const esEmail = (v) => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
exports.esEmail = esEmail;
const esObjectId = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);
exports.esObjectId = esObjectId;
