"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEstudio = exports.getEstudio = void 0;
const fs_1 = __importDefault(require("fs"));
const Estudio_1 = __importDefault(require("../models/Estudio"));
const cloudinary_1 = require("../utils/cloudinary");
const seguridad_1 = require("../utils/seguridad");
const borrarTemporal = (req) => { if (req.file)
    fs_1.default.unlink(req.file.path, () => { }); };
// Obtener estudio
const getEstudio = async (req, res) => {
    try {
        const estudio = await Estudio_1.default.findById(req.estudioId);
        if (!estudio) {
            res.status(404).json({ success: false, message: 'Estudio no encontrado' });
            return;
        }
        res.status(200).json({ success: true, data: { estudio } });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al obtener el estudio', error);
    }
};
exports.getEstudio = getEstudio;
// Actualizar estudio
const updateEstudio = async (req, res) => {
    try {
        const { nombre, email, telefono, direccion } = req.body;
        if (req.params.id !== req.estudioId) {
            borrarTemporal(req);
            res.status(403).json({ success: false, message: 'No tenés permiso para modificar este estudio' });
            return;
        }
        if ((nombre !== undefined && nombre !== '' && !(0, seguridad_1.esTexto)(nombre, 2, 120)) || (email !== undefined && email !== '' && !(0, seguridad_1.esEmail)(email))) {
            borrarTemporal(req);
            res.status(400).json({ success: false, message: 'Nombre o email inválidos' });
            return;
        }
        const estudio = await Estudio_1.default.findById(req.params.id);
        if (!estudio) {
            res.status(404).json({ success: false, message: 'Estudio no encontrado' });
            return;
        }
        if (estudio._id.toString() !== req.estudioId) {
            res.status(403).json({ success: false, message: 'No tenés permiso para modificar este estudio' });
            return;
        }
        if (nombre)
            estudio.nombre = nombre;
        if (email)
            estudio.email = email;
        if (telefono)
            estudio.telefono = telefono;
        if (direccion)
            estudio.direccion = direccion;
        // Subir logo a Cloudinary si se envió archivo
        if (req.file) {
            const logoUrl = await (0, cloudinary_1.uploadImage)(req.file.path, 'logos');
            estudio.logo = logoUrl;
            // Borrar archivo temporal
            borrarTemporal(req);
        }
        await estudio.save();
        res.status(200).json({
            success: true,
            message: 'Estudio actualizado correctamente',
            data: { estudio }
        });
    }
    catch (error) {
        borrarTemporal(req);
        (0, seguridad_1.errorInterno)(res, 'Error al actualizar el estudio', error);
    }
};
exports.updateEstudio = updateEstudio;
