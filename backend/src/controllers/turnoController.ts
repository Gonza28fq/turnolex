import { Response } from 'express';
import Turno from '../models/Turno';
import { AuthRequest } from '../middleware/auth';

// Obtener turnos del estudio
export const getTurnos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { estado, abogadoId, fecha } = req.query;
    const filter: any = { estudio: req.estudioId };

    if (estado) filter.estado = estado;
    if (abogadoId) filter.abogado = abogadoId;
    if (fecha) {
      const dia = new Date(fecha as string);
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener turnos', error: error.message });
  }
};

// Obtener turno por ID
export const getTurnoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await Turno.findOne({ _id: req.params.id, estudio: req.estudioId })
      .populate('abogado', 'nombre email avatar')
      .populate('cliente', 'nombre email telefono')
      .populate('pago');

    if (!turno) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    res.status(200).json({ success: true, data: { turno } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener turno', error: error.message });
  }
};

// Crear turno
export const createTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { abogadoId, fecha, duracion, motivo, notas, numeroCaso } = req.body;

    if (!abogadoId || !fecha || !motivo) {
      res.status(400).json({ success: false, message: 'Abogado, fecha y motivo son obligatorios' });
      return;
    }

    // Verificar que no haya conflicto de horario
    const fechaTurno = new Date(fecha);
    const fechaFin = new Date(fechaTurno.getTime() + (duracion || 60) * 60000);

    const conflicto = await Turno.findOne({
      abogado: abogadoId,
      estado: { $in: ['pendiente', 'confirmado'] },
      fecha: { $lt: fechaFin, $gte: fechaTurno }
    });

    if (conflicto) {
      res.status(400).json({ success: false, message: 'El abogado ya tiene un turno en ese horario' });
      return;
    }

    const turno = await Turno.create({
      estudio: req.estudioId,
      abogado: abogadoId,
      cliente: req.userId,
      fecha: fechaTurno,
      duracion: duracion || 60,
      motivo,
      notas,
      numeroCaso,
    });

    const turnoPopulado = await Turno.findById(turno._id)
      .populate('abogado', 'nombre email')
      .populate('cliente', 'nombre email telefono');

    res.status(201).json({ success: true, message: 'Turno creado exitosamente', data: { turno: turnoPopulado } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al crear turno', error: error.message });
  }
};

// Actualizar estado del turno
export const updateTurnoEstado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { estado, notas } = req.body;

    const turno = await Turno.findOne({ _id: req.params.id, estudio: req.estudioId });

    if (!turno) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    if (estado) turno.estado = estado;
    if (notas) turno.notas = notas;

    await turno.save();

    res.status(200).json({ success: true, message: 'Turno actualizado', data: { turno } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar turno', error: error.message });
  }
};

// Eliminar turno
export const deleteTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await Turno.findOneAndDelete({ _id: req.params.id, estudio: req.estudioId });

    if (!turno) {
      res.status(404).json({ success: false, message: 'Turno no encontrado' });
      return;
    }

    res.status(200).json({ success: true, message: 'Turno eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar turno', error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener turnos', error: error.message });
  }
};