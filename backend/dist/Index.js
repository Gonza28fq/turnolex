"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const turnos_1 = __importDefault(require("./routes/turnos"));
const users_1 = __importDefault(require("./routes/users"));
const estudios_1 = __importDefault(require("./routes/estudios"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Conexión a MongoDB
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch((err) => console.error('❌ Error MongoDB:', err));
// Rutas
app.get('/', (req, res) => {
    res.json({ message: '⚖️ TurnoLex API funcionando' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/turnos', turnos_1.default);
app.use('/api/users', users_1.default);
app.use('/api/estudios', estudios_1.default);
app.use('/api/admin', admin_1.default);
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
exports.default = app;
