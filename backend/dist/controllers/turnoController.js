"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTurnoPDF = exports.getMisTurnos = exports.deleteTurno = exports.updateTurnoEstado = exports.createTurno = exports.getTurnoById = exports.getTurnos = void 0;
const Turno_1 = __importDefault(require("../models/Turno"));
const email_1 = require("../utils/email");
const pdf_1 = require("../utils/pdf");
const Estudio_1 = __importDefault(require("../models/Estudio"));
// Obtener turnos del estudio
const getTurnos = async (req, res) => {
    try {
        const { estado, abogadoId, fecha } = req.query;
        const filter = { estudio: req.estudioId };
        if (estado)
            filter.estado = estado;
        if (abogadoId)
            filter.abogado = abogadoId;
        if (fecha) {
            const dia = new Date(fecha);
            const siguiente = new Date(dia);
            siguiente.setDate(siguiente.getDate() + 1);
            filter.fecha = { $gte: dia, $lt: siguiente };
        }
        const turnos = await Turno_1.default.find(filter)
            .populate('abogado', 'nombre email avatar')
            .populate('cliente', 'nombre email telefono')
            .populate('pago')
            .sort({ fecha: 1 });
        res.status(200).json({ success: true, count: turnos.length, data: { turnos } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener turnos', error: error.message });
    }
};
exports.getTurnos = getTurnos;
// Obtener turno por ID
const getTurnoById = async (req, res) => {
    try {
        const turno = await Turno_1.default.findOne({ _id: req.params.id, estudio: req.estudioId })
            .populate('abogado', 'nombre email avatar')
            .populate('cliente', 'nombre email telefono')
            .populate('pago');
        if (!turno) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        res.status(200).json({ success: true, data: { turno } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener turno', error: error.message });
    }
};
exports.getTurnoById = getTurnoById;
// Crear turno
const createTurno = async (req, res) => {
    try {
        const { abogadoId, fecha, duracion, motivo, notas, numeroCaso } = req.body;
        if (!abogadoId || !fecha || !motivo) {
            res.status(400).json({ success: false, message: 'Abogado, fecha y motivo son obligatorios' });
            return;
        }
        const fechaTurno = new Date(fecha);
        const fechaFin = new Date(fechaTurno.getTime() + (duracion || 60) * 60000);
        const conflicto = await Turno_1.default.findOne({
            abogado: abogadoId,
            estado: { $in: ['pendiente', 'confirmado'] },
            fecha: { $lt: fechaFin, $gte: fechaTurno }
        });
        if (conflicto) {
            res.status(400).json({ success: false, message: 'El abogado ya tiene un turno en ese horario' });
            return;
        }
        const turno = await Turno_1.default.create({
            estudio: req.estudioId,
            abogado: abogadoId,
            cliente: req.userId,
            fecha: fechaTurno,
            duracion: duracion || 60,
            motivo,
            notas,
            numeroCaso,
        });
        const turnoPopulado = await Turno_1.default.findById(turno._id)
            .populate('abogado', 'nombre email')
            .populate('cliente', 'nombre email telefono');
        // Enviar email de confirmación
        try {
            const t = turnoPopulado;
            await (0, email_1.sendConfirmacionTurno)({
                clienteNombre: t.cliente.nombre,
                clienteEmail: t.cliente.email,
                abogadoNombre: t.abogado.nombre,
                estudioNombre: 'TurnoLex',
                fecha: t.fecha,
                duracion: t.duracion,
                motivo: t.motivo,
                numeroCaso: t.numeroCaso,
            });
        }
        catch (emailErr) {
            console.error('Error enviando email:', emailErr);
        }
        res.status(201).json({ success: true, message: 'Turno creado exitosamente', data: { turno: turnoPopulado } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear turno', error: error.message });
    }
};
exports.createTurno = createTurno;
// Actualizar estado del turno
const updateTurnoEstado = async (req, res) => {
    try {
        const { estado, notas } = req.body;
        const turno = await Turno_1.default.findOne({ _id: req.params.id, estudio: req.estudioId });
        if (!turno) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        if (estado)
            turno.estado = estado;
        if (notas)
            turno.notas = notas;
        await turno.save();
        // Enviar email si se cancela
        if (estado === 'cancelado') {
            try {
                const turnoData = await Turno_1.default.findById(turno._id)
                    .populate('cliente', 'nombre email')
                    .populate('abogado', 'nombre');
                const t = turnoData;
                await (0, email_1.sendCancelacionTurno)({
                    clienteNombre: t.cliente.nombre,
                    clienteEmail: t.cliente.email,
                    abogadoNombre: t.abogado.nombre,
                    estudioNombre: 'TurnoLex',
                    fecha: t.fecha,
                    duracion: t.duracion,
                    motivo: t.motivo,
                });
            }
            catch (emailErr) {
                console.error('Error enviando email:', emailErr);
            }
        }
        res.status(200).json({ success: true, message: 'Turno actualizado', data: { turno } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar turno', error: error.message });
    }
};
exports.updateTurnoEstado = updateTurnoEstado;
// Eliminar turno
const deleteTurno = async (req, res) => {
    try {
        const turno = await Turno_1.default.findOneAndDelete({ _id: req.params.id, estudio: req.estudioId });
        if (!turno) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        res.status(200).json({ success: true, message: 'Turno eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar turno', error: error.message });
    }
};
exports.deleteTurno = deleteTurno;
// Obtener turnos del abogado logueado
const getMisTurnos = async (req, res) => {
    try {
        const turnos = await Turno_1.default.find({
            abogado: req.userId,
            estudio: req.estudioId
        })
            .populate('cliente', 'nombre email telefono')
            .sort({ fecha: 1 });
        res.status(200).json({ success: true, count: turnos.length, data: { turnos } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener turnos', error: error.message });
    }
};
exports.getMisTurnos = getMisTurnos;
const getTurnoPDF = async (req, res) => {
    try {
        const turno = await Turno_1.default.findOne({ _id: req.params.id, estudio: req.estudioId })
            .populate('abogado', 'nombre email')
            .populate('cliente', 'nombre email telefono');
        if (!turno) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        const estudio = await Estudio_1.default.findById(req.estudioId);
        (0, pdf_1.generateTurnoPDF)({
            clienteNombre: turno.cliente.nombre,
            clienteEmail: turno.cliente.email,
            clienteTelefono: turno.cliente.telefono,
            abogadoNombre: turno.abogado.nombre,
            estudioNombre: estudio.nombre,
            estudioEmail: estudio.email,
            estudioTelefono: estudio.telefono,
            estudioDireccion: estudio.direccion,
            fecha: turno.fecha,
            duracion: turno.duracion,
            motivo: turno.motivo,
            numeroCaso: turno.numeroCaso,
            notas: turno.notas,
        }, res);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al generar PDF', error: error.message });
    }
};
exports.getTurnoPDF = getTurnoPDF;
