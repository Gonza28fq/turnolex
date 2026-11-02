"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const turnos_1 = __importDefault(require("./routes/turnos"));
const users_1 = __importDefault(require("./routes/users"));
const estudios_1 = __importDefault(require("./routes/estudios"));
const admin_1 = __importDefault(require("./routes/admin"));
const seguridad_1 = require("./utils/seguridad");
// La app sin conectar a la base ni escuchar un puerto (así se puede probar)
const crearApp = () => {
    const app = (0, express_1.default)();
    app.set('trust proxy', 1); // Railway pone un proxy adelante: hace falta para que el límite de intentos vea la IP real
    app.disable('x-powered-by');
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '100kb' }));
    app.use(express_1.default.urlencoded({ extended: false, limit: '100kb' }));
    app.use(seguridad_1.sanitizarBody);
    // Límite de intentos en login y registros (fuerza bruta / spam de altas)
    const limiteAuth = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        limit: Number(process.env.RATE_LIMIT_AUTH || 20),
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { success: false, message: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
    });
    app.use(['/api/auth/login', '/api/auth/register', '/api/users/register-cliente'], limiteAuth);
    app.get('/', (_req, res) => {
        res.json({ message: 'TurnoLex API funcionando' });
    });
    app.use('/api/auth', auth_1.default);
    app.use('/api/turnos', turnos_1.default);
    app.use('/api/users', users_1.default);
    app.use('/api/estudios', estudios_1.default);
    app.use('/api/admin', admin_1.default);
    // Errores no controlados (ej. multer, JSON mal formado): sin detalles internos
    app.use((err, _req, res, _next) => {
        const status = err?.status || err?.statusCode || 500;
        if (status >= 500)
            console.error('[error no controlado]', err);
        const mensaje = status >= 500 ? 'Error interno'
            : err?.type === 'entity.parse.failed' ? 'El cuerpo de la solicitud no es JSON válido'
                : err?.type === 'entity.too.large' ? 'La solicitud es demasiado grande'
                    : err?.name === 'MulterError' || /Solo se permiten/.test(err?.message || '') ? err.message
                        : 'Solicitud inválida';
        res.status(status).json({ success: false, message: mensaje });
    });
    return app;
};
exports.crearApp = crearApp;
