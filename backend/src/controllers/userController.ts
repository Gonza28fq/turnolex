import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Estudio from '../models/Estudio';
import Turno from '../models/Turno';
import { AuthRequest } from '../middleware/auth';
import { errorInterno, esEmail, esObjectId, esTexto } from '../utils/seguridad';
import { PASSWORD_MIN } from './authController';

const ROLES_FILTRABLES = ['admin', 'abogado', 'cliente'];

const validarAlta = (body: any): string | null => {
  const { nombre, email, password, telefono } = body;
  if (!esTexto(nombre, 2, 120) || !esEmail(email) || typeof password !== 'string') return 'Nombre, email válido y contraseña son obligatorios';
  if (password.length < PASSWORD_MIN || password.length > 128) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  if (telefono !== undefined && telefono !== '' && !esTexto(telefono, 6, 30)) return 'Teléfono inválido';
  return null;
};

// Obtener todos los usuarios del estudio
export const getUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rol } = req.query;
    const filter: any = { estudio: req.estudioId };
    if (typeof rol === 'string' && ROLES_FILTRABLES.includes(rol)) filter.rol = rol;
    const usuarios = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: usuarios.length, data: { usuarios } });
  } catch (error) {
    errorInterno(res, 'Error al obtener usuarios', error);
  }
};

// Obtener usuario por ID
export const getUsuarioById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!esObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }
    const usuario = await User.findOne({ _id: req.params.id, estudio: req.estudioId }).select('-password');
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }
    res.status(200).json({ success: true, data: { usuario } });
  } catch (error) {
    errorInterno(res, 'Error al obtener usuario', error);
  }
};

// Crear abogado (solo admin)
export const crearAbogado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const error = validarAlta(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error });
      return;
    }
    const { nombre, password, telefono } = req.body;
    const email = req.body.email.trim().toLowerCase();

    if (await User.findOne({ email })) {
      res.status(400).json({ success: false, message: 'El email ya está registrado' });
      return;
    }

    const abogado = await User.create({
      nombre: nombre.trim(),
      email,
      password: await bcrypt.hash(password, 12),
      rol: 'abogado',
      estudio: req.estudioId,
      telefono,
    });

    const abogadoSinPassword = await User.findById(abogado._id).select('-password');
    res.status(201).json({ success: true, message: 'Abogado creado exitosamente', data: { usuario: abogadoSinPassword } });
  } catch (error) {
    errorInterno(res, 'Error al crear abogado', error);
  }
};

// Registrar cliente (público, desde el link del estudio)
export const registrarCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const error = validarAlta(req.body);
    if (error || !esTexto(req.body.estudioSlug, 1, 120)) {
      res.status(400).json({ success: false, message: error || 'Falta el estudio' });
      return;
    }
    const { nombre, password, telefono, estudioSlug } = req.body;
    const email = req.body.email.trim().toLowerCase();

    // solo estudios activos Y aprobados aceptan clientes
    const estudio = await Estudio.findOne({ slug: estudioSlug, activo: true, aprobado: true });
    if (!estudio) {
      res.status(404).json({ success: false, message: 'Estudio no encontrado' });
      return;
    }

    if (await User.findOne({ email })) {
      res.status(400).json({ success: false, message: 'El email ya está registrado' });
      return;
    }

    const cliente = await User.create({
      nombre: nombre.trim(),
      email,
      password: await bcrypt.hash(password, 12),
      rol: 'cliente',
      estudio: estudio._id,
      telefono,
    });

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      data: { usuario: { id: cliente._id, nombre: cliente.nombre, email: cliente.email, rol: cliente.rol } }
    });
  } catch (error) {
    errorInterno(res, 'Error al registrar cliente', error);
  }
};

// Actualizar usuario (admin)
export const updateUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, telefono, activo } = req.body;
    if (!esObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }
    if (nombre !== undefined && !esTexto(nombre, 2, 120)) {
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

    const usuario = await User.findOne({ _id: req.params.id, estudio: req.estudioId });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (nombre !== undefined) usuario.nombre = nombre.trim();
    if (telefono !== undefined) usuario.telefono = telefono;
    if (activo !== undefined) usuario.activo = activo;
    await usuario.save();

    const usuarioActualizado = await User.findById(usuario._id).select('-password');
    res.status(200).json({ success: true, message: 'Usuario actualizado', data: { usuario: usuarioActualizado } });
  } catch (error) {
    errorInterno(res, 'Error al actualizar usuario', error);
  }
};

// Eliminar usuario (admin). Si tiene turnos no se borra: se desactiva, para no dejar turnos huérfanos.
export const deleteUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!esObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }
    if (req.params.id === req.userId) {
      res.status(400).json({ success: false, message: 'No podés eliminar tu propio usuario' });
      return;
    }
    const usuario = await User.findOne({ _id: req.params.id, estudio: req.estudioId });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }
    const tieneTurnos = await Turno.exists({ $or: [{ abogado: usuario._id }, { cliente: usuario._id }] });
    if (tieneTurnos) {
      usuario.activo = false;
      await usuario.save();
      res.status(200).json({ success: true, message: 'El usuario tiene turnos: se desactivó en lugar de eliminarse', data: { desactivado: true } });
      return;
    }
    await usuario.deleteOne();
    res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    errorInterno(res, 'Error al eliminar usuario', error);
  }
};

// Cambiar la contraseña propia
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    if (typeof passwordActual !== 'string' || typeof passwordNueva !== 'string' || !passwordActual || !passwordNueva) {
      res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
      return;
    }
    if (passwordNueva.length < PASSWORD_MIN || passwordNueva.length > 128) {
      res.status(400).json({ success: false, message: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (!(await bcrypt.compare(passwordActual, user.password))) {
      res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' }); // 400, no 401: el 401 cierra la sesión en el front
      return;
    }

    user.password = await bcrypt.hash(passwordNueva, 12);
    await user.save();

    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    errorInterno(res, 'Error al cambiar contraseña', error);
  }
};
