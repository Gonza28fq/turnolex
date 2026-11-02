import { Response } from 'express';
import Turno from '../models/Turno';
import User from '../models/User';
import Estudio from '../models/Estudio';
import { AuthRequest } from '../middleware/auth';
import { sendConfirmacionTurno, sendCancelacionTurno } from '../utils/email';
import { generateTurnoPDF } from '../utils/pdf';
import { errorInterno, esObjectId, esTexto } from '../utils/seguridad';

const ESTADOS = ['pendiente', 'confirmado', 'cancelado', 'completado'] as const;
const DURACION_MIN = 15, DURACION_MAX = 480;

// Qué turnos puede ver cada rol: el cliente solo los suyos; abogados y admin, los del estudio
const alcance = (req: AuthRequest, extra: Record<string, unknown> = {}) => {
  const filtro: Record<string, unknown> = { estudio: req.estudioId, ...extra };
  if (req.userRol === 'cliente') filtro.cliente = req.userId;
  return filtro;
};

// Choque real de horarios: [inicio, fin) se pisa con un turno existente si empieza antes de que termine
// el nuevo y termina después de que empieza (antes solo se miraban los que EMPEZABAN dentro).
const hayChoque = async (abogadoId: string, inicio: Date, fin: Date, excluirId?: string) => {
  const candidatos = await Turno.find({
    abogado: abogadoId,
    estado: { $in: ['pendiente', 'confirmado'] },
    fecha: { $lt: fin, $gte: new Date(inicio.getTime() - DURACION_MAX * 60000) },
    ...(excluirId ? { _id: { $ne: excluirId } } : {}),
  }).select('fecha duracion').lean();
  return candidatos.some(t => new Date(t.fecha).getTime() + (t.duracion || 60) * 60000 > inicio.getTime());
};

// Obtener turnos del estudio (admin / abogado)
export const getTurnos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { estado, abogadoId, fecha } = req.query;
    const filter: any = { estudio: req.estudioId };

    if (typeof estado === 'string' && (ESTADOS as readonly string[]).includes(estado)) filter.estado = estado;
    if (esObjectId(abogadoId)) filter.abogado = abogadoId;
    if (typeof fecha === 'string' && !Number.isNaN(Date.parse(fecha))) {
      const dia = new Date(fecha);
      const siguiente = new Date(dia);
      siguiente.setDate(siguiente.getDate() + 1);
      filter.fecha = { $gte: dia, $lt: siguiente };
    }

    const turnos = await Turno.find(filter)
      .populate('abogado', 'nombre email avatar')
      .populate('cliente', 'nombre email telefono')
      .populate('pago')
      .sort({ fecha: 1 });

    res.status(200).json({ success: true, count: turnos.length, data: { turnos } });
  } catch (error) {
    errorInterno(res, 'Error al obtener turnos', error);
  }
};

// Turnos del cliente logueado
export const getMisTurnosCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turnos = await Turno.find({ estudio: req.estudioId, cliente: req.userId })
      .populate('abogado', 'nombre')
      .sort({ fecha: -1 });
    res.status(200).json({ success: true, count: turnos.length, data: { turnos } });
  } catch (error) {
    errorInterno(res, 'Error al obtener turnos', error);
  }
};

// Obtener turno por ID (el cliente solo puede ver los suyos)
export const getTurnoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!esObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }
    const turno = await Turno.findOne(alcance(req, { _id: req.params.id }))
      .populate('abogado', 'nombre email avatar')
      .populate('cliente', 'nombre email telefono')
      .populate('pago');

    if (!turno) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    res.status(200).json({ success: true, data: { turno } });
  } catch (error) {
    errorInterno(res, 'Error al obtener turno', error);
  }
};

// Crear turno: el cliente lo pide para sí mismo; el admin lo carga para un cliente del estudio
export const createTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { abogadoId, clienteId, fecha, duracion, motivo, notas, numeroCaso } = req.body;

    if (!esObjectId(abogadoId) || typeof fecha !== 'string' || !esTexto(motivo, 3, 500)) {
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
    if (notas !== undefined && notas !== '' && !esTexto(notas, 1, 2000)) {
      res.status(400).json({ success: false, message: 'Notas demasiado largas' });
      return;
    }
    if (numeroCaso !== undefined && numeroCaso !== '' && !esTexto(numeroCaso, 1, 60)) {
      res.status(400).json({ success: false, message: 'Número de caso inválido' });
      return;
    }

    // el abogado tiene que ser de ESTE estudio y estar activo
    const abogado = await User.findOne({ _id: abogadoId, estudio: req.estudioId, rol: { $in: ['abogado', 'admin'] }, activo: true }).select('_id');
    if (!abogado) {
      res.status(400).json({ success: false, message: 'El abogado no pertenece al estudio' });
      return;
    }

    // a quién es el turno
    let cliente = req.userId;
    if (req.userRol === 'admin') {
      if (!esObjectId(clienteId)) {
        res.status(400).json({ success: false, message: 'Elegí el cliente del turno' });
        return;
      }
      const c = await User.findOne({ _id: clienteId, estudio: req.estudioId, rol: 'cliente', activo: true }).select('_id');
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

    const turno = await Turno.create({
      estudio: req.estudioId,
      abogado: abogadoId,
      cliente,
      fecha: inicio,
      duracion: dur,
      motivo: motivo.trim(),
      notas,
      numeroCaso,
    });

    const turnoPopulado = await Turno.findById(turno._id)
      .populate('abogado', 'nombre email')
      .populate('cliente', 'nombre email telefono');

    try {
      const t = turnoPopulado as any;
      const estudio = await Estudio.findById(req.estudioId).select('nombre').lean();
      await sendConfirmacionTurno({
        clienteNombre: t.cliente.nombre,
        clienteEmail: t.cliente.email,
        abogadoNombre: t.abogado.nombre,
        estudioNombre: estudio?.nombre || 'TurnoLex',
        fecha: t.fecha,
        duracion: t.duracion,
        motivo: t.motivo,
        numeroCaso: t.numeroCaso,
      });
    } catch (emailErr) {
      console.error('Error enviando email:', emailErr);
    }

    res.status(201).json({ success: true, message: 'Turno creado exitosamente', data: { turno: turnoPopulado } });
  } catch (error) {
    errorInterno(res, 'Error al crear turno', error);
  }
};

// Actualizar estado del turno: el admin, cualquiera del estudio; el abogado, solo los suyos
export const updateTurnoEstado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { estado, notas } = req.body;
    if (estado !== undefined && !(ESTADOS as readonly string[]).includes(estado)) {
      res.status(400).json({ success: false, message: 'Estado inválido' });
      return;
    }
    if (notas !== undefined && notas !== '' && !esTexto(notas, 1, 2000)) {
      res.status(400).json({ success: false, message: 'Notas demasiado largas' });
      return;
    }
    if (!esObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    const filtro: any = { _id: req.params.id, estudio: req.estudioId };
    if (req.userRol === 'abogado') filtro.abogado = req.userId;
    const turno = await Turno.findOne(filtro);

    if (!turno) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    const estabaCancelado = turno.estado === 'cancelado';
    if (estado) turno.estado = estado;
    if (notas !== undefined) turno.notas = notas;

    await turno.save();

    if (estado === 'cancelado' && !estabaCancelado) {
      try {
        const turnoData = await Turno.findById(turno._id)
          .populate('cliente', 'nombre email')
          .populate('abogado', 'nombre');
        const t = turnoData as any;
        const estudio = await Estudio.findById(req.estudioId).select('nombre').lean();
        await sendCancelacionTurno({
          clienteNombre: t.cliente.nombre,
          clienteEmail: t.cliente.email,
          abogadoNombre: t.abogado.nombre,
          estudioNombre: estudio?.nombre || 'TurnoLex',
          fecha: t.fecha,
          duracion: t.duracion,
          motivo: t.motivo,
        });
      } catch (emailErr) {
        console.error('Error enviando email:', emailErr);
      }
    }

    res.status(200).json({ success: true, message: 'Turno actualizado', data: { turno } });
  } catch (error) {
    errorInterno(res, 'Error al actualizar turno', error);
  }
};

// Eliminar turno (admin)
export const deleteTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!esObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }
    const turno = await Turno.findOneAndDelete({ _id: req.params.id, estudio: req.estudioId });

    if (!turno) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    res.status(200).json({ success: true, message: 'Turno eliminado exitosamente' });
  } catch (error) {
    errorInterno(res, 'Error al eliminar turno', error);
  }
};

// Obtener turnos del abogado logueado
export const getMisTurnos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turnos = await Turno.find({
      abogado: req.userId,
      estudio: req.estudioId
    })
      .populate('cliente', 'nombre email telefono')
      .sort({ fecha: 1 });

    res.status(200).json({ success: true, count: turnos.length, data: { turnos } });
  } catch (error) {
    errorInterno(res, 'Error al obtener turnos', error);
  }
};

// PDF del turno (el cliente solo el suyo)
export const getTurnoPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!esObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }
    const turno = await Turno.findOne(alcance(req, { _id: req.params.id }))
      .populate('abogado', 'nombre email')
      .populate('cliente', 'nombre email telefono') as any;

    if (!turno) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    const estudio = await Estudio.findById(req.estudioId) as any;

    generateTurnoPDF({
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
  } catch (error) {
    errorInterno(res, 'Error al generar PDF', error);
  }
};
