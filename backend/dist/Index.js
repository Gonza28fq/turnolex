"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const PORT = process.env.PORT || 5000;
const app = (0, app_1.crearApp)();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ JWT_SECRET falta o tiene menos de 32 caracteres: conviene usar uno largo y aleatorio');
}
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch((err) => console.error('Error MongoDB:', err));
app.listen(PORT, () => {
    console.log(`Servidor en el puerto ${PORT}`);
});
exports.default = app;
