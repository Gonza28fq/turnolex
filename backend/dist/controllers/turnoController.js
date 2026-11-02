"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTurnoPDF = exports.getMisTurnos = exports.deleteTurno = exports.updateTurnoEstado = exports.createTurno = exports.getTurnoById = exports.getMisTurnosCliente = exports.getTurnos = void 0;
const Turno_1 = __importDefault(require("../models/Turno"));
const User_1 = __importDefault(require("../models/User"));
const Estudio_1 = __importDefault(require("../models/Estudio"));
const email_1 = require("../utils/email");
const pdf_1 = require("../utils/pdf");
const seguridad_1 = require("../utils/seguridad");
const ESTADOS = ['pendiente', 'confirmado', 'cancelado', 'completado'];
const DURACION_MIN = 15, DURACION_MAX = 480;
// Qué turnos puede ver cada rol: el cliente solo los suyos; abogados y admin, los del estudio
const alcance = (req, extra = {}) => {
    const filtro = { estudio: req.estudioId, ...extra };
    if (req.userRol === 'cliente')
        filtro.cliente = req.userId;
    return filtro;
};
// Choque real de horarios: [inicio, fin) se pisa con un turno existente si empieza antes de que termine
// el nuevo y termina después de que empieza (antes solo se miraban los que EMPEZABAN dentro).
const hayChoque = async (abogadoId, inicio, fin, excluirId) => {
    const candidatos = await Turno_1.default.find({
        abogado: abogadoId,
        estado: { $in: ['pendiente', 'confirmado'] },
        fecha: { $lt: fin, $gte: new Date(inicio.getTime() - DURACION_MAX * 60000) },
        ...(excluirId ? { _id: { $ne: excluirId } } : {}),
    }).select('fecha duracion').lean();
    return candidatos.some(t => new Date(t.fecha).getTime() + (t.duracion || 60) * 60000 > inicio.getTime());
};
// Obtener turnos del estudio (admin / abogado)
const getTurnos = async (req, res) => {
    try {
        const { estado, abogadoId, fecha } = req.query;
        const filter = { estudio: req.estudioId };
        if (typeof estado === 'string' && ESTADOS.includes(estado))
            filter.estado = estado;
        if ((0, seguridad_1.esObjectId)(abogadoId))
            filter.abogado = abogadoId;
        if (typeof fecha === 'string' && !Number.isNaN(Date.parse(fecha))) {
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
        (0, seguridad_1.errorInterno)(res, 'Error al obtener turnos', error);
    }
};
exports.getTurnos = getTurnos;
// Turnos del cliente logueado
const getMisTurnosCliente = async (req, res) => {
    try {
        const turnos = await Turno_1.default.find({ estudio: req.estudioId, cliente: req.userId })
            .populate('abogado', 'nombre')
            .sort({ fecha: -1 });
        res.status(200).json({ success: true, count: turnos.length, data: { turnos } });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al obtener turnos', error);
    }
};
exports.getMisTurnosCliente = getMisTurnosCliente;
// Obtener turno por ID (el cliente solo puede ver los suyos)
const getTurnoById = async (req, res) => {
    try {
        if (!(0, seguridad_1.esObjectId)(req.params.id)) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        const turno = await Turno_1.default.findOne(alcance(req, { _id: req.params.id }))
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
        (0, seguridad_1.errorInterno)(res, 'Error al obtener turno', error);
    }
};
exports.getTurnoById = getTurnoById;
// Crear turno: el cliente lo pide para sí mismo; el admin lo carga para un cliente del estudio
const createTurno = async (req, res) => {
    try {
        const { abogadoId, clienteId, fecha, duracion, motivo, notas, numeroCaso } = req.body;
        if (!(0, seguridad_1.esObjectId)(abogadoId) || typeof fecha !== 'string' || !(0, seguridad_1.esTexto)(motivo, 3, 500)) {
            res.status(400).json({ success: false, message: 'Abogado, fecha y motivo son obligatorios' });
            return;
        }
        const dur = duracion === undefined || duracion === '' ? 60 : Number(duracion);
        if (!Number.isInteger(dur) || dur < DURACION_MIN || dur > DURACION_MAX) {
            res.status(400).json({ success: false, message: `La duración debe ser entre ${DURACION_MIN} y ${DURACION_MAX} minutos` });
            return;
        }
        const inicio = new Date(fecha);
        if (Number.isNaN(inicio.getTime())) {
            res.status(400).json({ success: false, message: 'Fecha inválida' });
            return;
        }
        if (inicio.getTime() < Date.now() - 5 * 60000) {
            res.status(400).json({ success: false, message: 'No se pueden dar turnos en el pasado' });
            return;
        }
        if (notas !== undefined && notas !== '' && !(0, seguridad_1.esTexto)(notas, 1, 2000)) {
            res.status(400).json({ success: false, message: 'Notas demasiado largas' });
            return;
        }
        if (numeroCaso !== undefined && numeroCaso !== '' && !(0, seguridad_1.esTexto)(numeroCaso, 1, 60)) {
            res.status(400).json({ success: false, message: 'Número de caso inválido' });
            return;
        }
        // el abogado tiene que ser de ESTE estudio y estar activo
        const abogado = await User_1.default.findOne({ _id: abogadoId, estudio: req.estudioId, rol: { $in: ['abogado', 'admin'] }, activo: true }).select('_id');
        if (!abogado) {
            res.status(400).json({ success: false, message: 'El abogado no pertenece al estudio' });
            return;
        }
        // a quién es el turno
        let cliente = req.userId;
        if (req.userRol === 'admin') {
            if (!(0, seguridad_1.esObjectId)(clienteId)) {
                res.status(400).json({ success: false, message: 'Elegí el cliente del turno' });
                return;
            }
            const c = await User_1.default.findOne({ _id: clienteId, estudio: req.estudioId, rol: 'cliente', activo: true }).select('_id');
            if (!c) {
                res.status(400).json({ success: false, message: 'El cliente no pertenece al estudio' });
                return;
            }
            cliente = String(c._id);
        }
        const fin = new Date(inicio.getTime() + dur * 60000);
        if (await hayChoque(abogadoId, inicio, fin)) {
            res.status(409).json({ success: false, message: 'El abogado ya tiene un turno en ese horario' });
            return;
        }
        const turno = await Turno_1.default.create({
            estudio: req.estudioId,
            abogado: abogadoId,
            cliente,
            fecha: inicio,
            duracion: dur,
            motivo: motivo.trim(),
            notas,
            numeroCaso,
        });
        const turnoPopulado = await Turno_1.default.findById(turno._id)
            .populate('abogado', 'nombre email')
            .populate('cliente', 'nombre email telefono');
        try {
            const t = turnoPopulado;
            const estudio = await Estudio_1.default.findById(req.estudioId).select('nombre').lean();
            await (0, email_1.sendConfirmacionTurno)({
                clienteNombre: t.cliente.nombre,
                clienteEmail: t.cliente.email,
                abogadoNombre: t.abogado.nombre,
                estudioNombre: estudio?.nombre || 'TurnoLex',
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
        (0, seguridad_1.errorInterno)(res, 'Error al crear turno', error);
    }
};
exports.createTurno = createTurno;
// Actualizar estado del turno: el admin, cualquiera del estudio; el abogado, solo los suyos
const updateTurnoEstado = async (req, res) => {
    try {
        const { estado, notas } = req.body;
        if (estado !== undefined && !ESTADOS.includes(estado)) {
            res.status(400).json({ success: false, message: 'Estado inválido' });
            return;
        }
        if (notas !== undefined && notas !== '' && !(0, seguridad_1.esTexto)(notas, 1, 2000)) {
            res.status(400).json({ success: false, message: 'Notas demasiado largas' });
            return;
        }
        if (!(0, seguridad_1.esObjectId)(req.params.id)) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        const filtro = { _id: req.params.id, estudio: req.estudioId };
        if (req.userRol === 'abogado')
            filtro.abogado = req.userId;
        const turno = await Turno_1.default.findOne(filtro);
        if (!turno) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        const estabaCancelado = turno.estado === 'cancelado';
        if (estado)
            turno.estado = estado;
        if (notas !== undefined)
            turno.notas = notas;
        await turno.save();
        if (estado === 'cancelado' && !estabaCancelado) {
            try {
                const turnoData = await Turno_1.default.findById(turno._id)
                    .populate('cliente', 'nombre email')
                    .populate('abogado', 'nombre');
                const t = turnoData;
                const estudio = await Estudio_1.default.findById(req.estudioId).select('nombre').lean();
                await (0, email_1.sendCancelacionTurno)({
                    clienteNombre: t.cliente.nombre,
                    clienteEmail: t.cliente.email,
                    abogadoNombre: t.abogado.nombre,
                    estudioNombre: estudio?.nombre || 'TurnoLex',
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
        (0, seguridad_1.errorInterno)(res, 'Error al actualizar turno', error);
    }
};
exports.updateTurnoEstado = updateTurnoEstado;
// Eliminar turno (admin)
const deleteTurno = async (req, res) => {
    try {
        if (!(0, seguridad_1.esObjectId)(req.params.id)) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        const turno = await Turno_1.default.findOneAndDelete({ _id: req.params.id, estudio: req.estudioId });
        if (!turno) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        res.status(200).json({ success: true, message: 'Turno eliminado exitosamente' });
    }
    catch (error) {
        (0, seguridad_1.errorInterno)(res, 'Error al eliminar turno', error);
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
        (0, seguridad_1.errorInterno)(res, 'Error al obtener turnos', error);
    }
};
exports.getMisTurnos = getMisTurnos;
// PDF del turno (el cliente solo el suyo)
const getTurnoPDF = async (req, res) => {
    try {
        if (!(0, seguridad_1.esObjectId)(req.params.id)) {
            res.status(404).json({ success: false, message: 'Turno no encontrado' });
            return;
        }
        const turno = await Turno_1.default.findOne(alcance(req, { _id: req.params.id }))
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
        (0, seguridad_1.errorInterno)(res, 'Error al generar PDF', error);
    }
};
exports.getTurnoPDF = getTurnoPDF;
