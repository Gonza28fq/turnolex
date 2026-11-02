"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.deleteUsuario = exports.updateUsuario = exports.registrarCliente = exports.crearAbogado = exports.getUsuarioById = exports.getUsuarios = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const Estudio_1 = __importDefault(require("../models/Estudio"));
const Turno_1 = __importDefault(require("../models/Turno"));
const seguridad_1 = require("../utils/seguridad");
const authController_1 = require("./authController");
const ROLES_FILTRABLES = ['admin', 'abogado', 'cliente'];
const validarAlta = (body) => {
    const { nombre, email, password, telefono } = body;
    if (!(0, seguridad_1.esTexto)(nombre, 2, 120) || !(0, seguridad_1.esEmail)(email) || typeof password !== 'string')
        return 'Nombre, email válido y contraseña son obligatorios';
    if (password.length < authController_1.PASSWORD_MIN || password.length > 128)
        return `La contraseña debe tener al menos ${authController_1.PASSWORD_MIN} caracteres`;
    if (telefono !== undefined && telefono !== '' && !(0, seguridad_1.esTexto)(telefono, 6, 30))
        return 'Teléfono inválido';
    return null;
};
// Obtener todos los usuarios del estudio
const getUsuarios = async (req, res) => {
    try {
        const { rol } = req.query;
        const filter = { estudio: req.estudioId };
        if (typeof rol === 'string' && ROLES_FILTRABLES.includes(rol))
            filter.rol = rol;
        const usuarios = await User_1.default.find(filter).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: usuarios.length, data: { usuarios } });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al obtener usuarios', error);
    }
};
exports.getUsuarios = getUsuarios;
// Obtener usuario por ID
const getUsuarioById = async (req, res) => {
    try {
        if (!(0, seguridad_1.esObjectId)(req.params.id)) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        const usuario = await User_1.default.findOne({ _id: req.params.id, estudio: req.estudioId }).select('-password');
        if (!usuario) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json({ success: true, data: { usuario } });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al obtener usuario', error);
    }
};
exports.getUsuarioById = getUsuarioById;
// Crear abogado (solo admin)
const crearAbogado = async (req, res) => {
    try {
        const error = validarAlta(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error });
            return;
        }
        const { nombre, password, telefono } = req.body;
        const email = req.body.email.trim().toLowerCase();
        if (await User_1.default.findOne({ email })) {
            res.status(400).json({ success: false, message: 'El email ya está registrado' });
            return;
        }
        const abogado = await User_1.default.create({
            nombre: nombre.trim(),
            email,
            password: await bcryptjs_1.default.hash(password, 12),
            rol: 'abogado',
            estudio: req.estudioId,
            telefono,
        });
        const abogadoSinPassword = await User_1.default.findById(abogado._id).select('-password');
        res.status(201).json({ success: true, message: 'Abogado creado exitosamente', data: { usuario: abogadoSinPassword } });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al crear abogado', error);
    }
};
exports.crearAbogado = crearAbogado;
// Registrar cliente (público, desde el link del estudio)
const registrarCliente = async (req, res) => {
    try {
        const error = validarAlta(req.body);
        if (error || !(0, seguridad_1.esTexto)(req.body.estudioSlug, 1, 120)) {
            res.status(400).json({ success: false, message: error || 'Falta el estudio' });
            return;
        }
        const { nombre, password, telefono, estudioSlug } = req.body;
        const email = req.body.email.trim().toLowerCase();
        // solo estudios activos Y aprobados aceptan clientes
        const estudio = await Estudio_1.default.findOne({ slug: estudioSlug, activo: true, aprobado: true });
        if (!estudio) {
            res.status(404).json({ success: false, message: 'Estudio no encontrado' });
            return;
        }
        if (await User_1.default.findOne({ email })) {
            res.status(400).json({ success: false, message: 'El email ya está registrado' });
            return;
        }
        const cliente = await User_1.default.create({
            nombre: nombre.trim(),
            email,
            password: await bcryptjs_1.default.hash(password, 12),
            rol: 'cliente',
            estudio: estudio._id,
            telefono,
        });
        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            data: { usuario: { id: cliente._id, nombre: cliente.nombre, email: cliente.email, rol: cliente.rol } }
        });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al registrar cliente', error);
    }
};
exports.registrarCliente = registrarCliente;
// Actualizar usuario (admin)
const updateUsuario = async (req, res) => {
    try {
        const { nombre, telefono, activo } = req.body;
        if (!(0, seguridad_1.esObjectId)(req.params.id)) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        if (nombre !== undefined && !(0, seguridad_1.esTexto)(nombre, 2, 120)) {
            res.status(400).json({ success: false, message: 'Nombre inválido' });
            return;
        }
        if (activo !== undefined && typeof activo !== 'boolean') {
            res.status(400).json({ success: false, message: 'Valor inválido para activo' });
            return;
        }
        if (activo === false && req.params.id === req.userId) {
            res.status(400).json({ success: false, message: 'No podés desactivarte a vos mismo' });
            return;
        }
        const usuario = await User_1.default.findOne({ _id: req.params.id, estudio: req.estudioId });
        if (!usuario) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        if (nombre !== undefined)
            usuario.nombre = nombre.trim();
        if (telefono !== undefined)
            usuario.telefono = telefono;
        if (activo !== undefined)
            usuario.activo = activo;
        await usuario.save();
        const usuarioActualizado = await User_1.default.findById(usuario._id).select('-password');
        res.status(200).json({ success: true, message: 'Usuario actualizado', data: { usuario: usuarioActualizado } });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al actualizar usuario', error);
    }
};
exports.updateUsuario = updateUsuario;
// Eliminar usuario (admin). Si tiene turnos no se borra: se desactiva, para no dejar turnos huérfanos.
const deleteUsuario = async (req, res) => {
    try {
        if (!(0, seguridad_1.esObjectId)(req.params.id)) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        if (req.params.id === req.userId) {
            res.status(400).json({ success: false, message: 'No podés eliminar tu propio usuario' });
            return;
        }
        const usuario = await User_1.default.findOne({ _id: req.params.id, estudio: req.estudioId });
        if (!usuario) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        const tieneTurnos = await Turno_1.default.exists({ $or: [{ abogado: usuario._id }, { cliente: usuario._id }] });
        if (tieneTurnos) {
            usuario.activo = false;
            await usuario.save();
            res.status(200).json({ success: true, message: 'El usuario tiene turnos: se desactivó en lugar de eliminarse', data: { desactivado: true } });
            return;
        }
        await usuario.deleteOne();
        res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente' });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al eliminar usuario', error);
    }
};
exports.deleteUsuario = deleteUsuario;
// Cambiar la contraseña propia
const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        if (typeof passwordActual !== 'string' || typeof passwordNueva !== 'string' || !passwordActual || !passwordNueva) {
            res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
            return;
        }
        if (passwordNueva.length < authController_1.PASSWORD_MIN || passwordNueva.length > 128) {
            res.status(400).json({ success: false, message: `La contraseña debe tener al menos ${authController_1.PASSWORD_MIN} caracteres` });
            return;
        }
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        if (!(await bcryptjs_1.default.compare(passwordActual, user.password))) {
            res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' }); // 400, no 401: el 401 cierra la sesión en el front
            return;
        }
        user.password = await bcryptjs_1.default.hash(passwordNueva, 12);
        await user.save();
        res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al cambiar contraseña', error);
    }
};
exports.changePassword = changePassword;
