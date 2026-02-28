"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.registerEstudio = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Estudio_1 = __importDefault(require("../models/Estudio"));
const generateToken = (id, rol, estudioId) => {
    return jsonwebtoken_1.default.sign({ id, rol, estudioId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
// Registrar estudio + admin
const registerEstudio = async (req, res) => {
    try {
        const { nombreEstudio, nombreAdmin, email, password, telefono } = req.body;
        if (!nombreEstudio || !nombreAdmin || !email || !password) {
            res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
            return;
        }
        // Verificar si el email ya existe
        const existeUser = await User_1.default.findOne({ email });
        if (existeUser) {
            res.status(400).json({ success: false, message: 'El email ya está registrado' });
            return;
        }
        // Generar slug único del estudio
        const slug = nombreEstudio
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
        // Crear estudio
        const estudio = await Estudio_1.default.create({
            nombre: nombreEstudio,
            slug,
            email,
            telefono,
        });
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Crear admin del estudio
        const admin = await User_1.default.create({
            nombre: nombreAdmin,
            email,
            password: hashedPassword,
            rol: 'admin',
            estudio: estudio._id,
            telefono,
        });
        const token = generateToken(admin._id.toString(), admin.rol, estudio._id.toString());
        res.status(201).json({
            success: true,
            message: 'Estudio registrado exitosamente',
            data: {
                token,
                user: {
                    id: admin._id,
                    nombre: admin.nombre,
                    email: admin.email,
                    rol: admin.rol,
                },
                estudio: {
                    id: estudio._id,
                    nombre: estudio.nombre,
                    slug: estudio.slug,
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar', error: error.message });
    }
};
exports.registerEstudio = registerEstudio;
// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
            return;
        }
        const user = await User_1.default.findOne({ email }).populate('estudio');
        if (!user) {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            return;
        }
        if (!user.activo) {
            res.status(401).json({ success: false, message: 'Usuario desactivado' });
            return;
        }
        const passwordOk = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordOk) {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            return;
        }
        const estudioId = user.estudio?._id?.toString();
        const token = generateToken(user._id.toString(), user.rol, estudioId);
        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: user._id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol,
                    avatar: user.avatar,
                    estudio: user.estudio,
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
    }
};
exports.login = login;
// Me
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId)
            .select('-password')
            .populate('estudio');
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json({ success: true, data: { user } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};
exports.getMe = getMe;
