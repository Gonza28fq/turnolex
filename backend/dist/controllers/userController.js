"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.deleteUsuario = exports.updateUsuario = exports.registrarCliente = exports.crearAbogado = exports.getUsuarioById = exports.getUsuarios = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
// Obtener todos los usuarios del estudio
const getUsuarios = async (req, res) => {
    try {
        const { rol } = req.query;
        const filter = { estudio: req.estudioId };
        if (rol)
            filter.rol = rol;
        const usuarios = await User_1.default.find(filter).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: usuarios.length, data: { usuarios } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
    }
};
exports.getUsuarios = getUsuarios;
// Obtener usuario por ID
const getUsuarioById = async (req, res) => {
    try {
        const usuario = await User_1.default.findOne({
            _id: req.params.id,
            estudio: req.estudioId
        }).select('-password');
        if (!usuario) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json({ success: true, data: { usuario } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener usuario', error: error.message });
    }
};
exports.getUsuarioById = getUsuarioById;
// Crear abogado (solo admin)
const crearAbogado = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;
        if (!nombre || !email || !password) {
            res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
            return;
        }
        const existe = await User_1.default.findOne({ email });
        if (existe) {
            res.status(400).json({ success: false, message: 'El email ya está registrado' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const abogado = await User_1.default.create({
            nombre,
            email,
            password: hashedPassword,
            rol: 'abogado',
            estudio: req.estudioId,
            telefono,
        });
        const abogadoSinPassword = await User_1.default.findById(abogado._id).select('-password');
        res.status(201).json({
            success: true,
            message: 'Abogado creado exitosamente',
            data: { usuario: abogadoSinPassword }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear abogado', error: error.message });
    }
};
exports.crearAbogado = crearAbogado;
// Registrar cliente (público)
const registrarCliente = async (req, res) => {
    try {
        const { nombre, email, password, telefono, estudioSlug } = req.body;
        if (!nombre || !email || !password || !estudioSlug) {
            res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
            return;
        }
        // Buscar el estudio por slug
        const Estudio = (await Promise.resolve().then(() => __importStar(require('../models/Estudio')))).default;
        const estudio = await Estudio.findOne({ slug: estudioSlug, activo: true });
        if (!estudio) {
            res.status(404).json({ success: false, message: 'Estudio no encontrado' });
            return;
        }
        const existe = await User_1.default.findOne({ email });
        if (existe) {
            res.status(400).json({ success: false, message: 'El email ya está registrado' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const cliente = await User_1.default.create({
            nombre,
            email,
            password: hashedPassword,
            rol: 'cliente',
            estudio: estudio._id,
            telefono,
        });
        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            data: {
                usuario: {
                    id: cliente._id,
                    nombre: cliente.nombre,
                    email: cliente.email,
                    rol: cliente.rol,
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar cliente', error: error.message });
    }
};
exports.registrarCliente = registrarCliente;
// Actualizar usuario
const updateUsuario = async (req, res) => {
    try {
        const { nombre, telefono, activo } = req.body;
        const usuario = await User_1.default.findOne({
            _id: req.params.id,
            estudio: req.estudioId
        });
        if (!usuario) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        if (nombre !== undefined)
            usuario.nombre = nombre;
        if (telefono !== undefined)
            usuario.telefono = telefono;
        if (activo !== undefined)
            usuario.activo = activo;
        await usuario.save();
        const usuarioActualizado = await User_1.default.findById(usuario._id).select('-password');
        res.status(200).json({
            success: true,
            message: 'Usuario actualizado',
            data: { usuario: usuarioActualizado }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar usuario', error: error.message });
    }
};
exports.updateUsuario = updateUsuario;
// Eliminar usuario
const deleteUsuario = async (req, res) => {
    try {
        const usuario = await User_1.default.findOneAndDelete({
            _id: req.params.id,
            estudio: req.estudioId
        });
        if (!usuario) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar usuario', error: error.message });
    }
};
exports.deleteUsuario = deleteUsuario;
// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        if (!passwordActual || !passwordNueva) {
            res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
            return;
        }
        if (passwordNueva.length < 6) {
            res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
            return;
        }
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        const ok = await bcryptjs_1.default.compare(passwordActual, user.password);
        if (!ok) {
            res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
            return;
        }
        user.password = await bcryptjs_1.default.hash(passwordNueva, 12);
        await user.save();
        res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al cambiar contraseña', error: error.message });
    }
};
exports.changePassword = changePassword;
