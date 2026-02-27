import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Obtener todos los usuarios del estudio
export const getUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rol } = req.query;
    const filter: any = { estudio: req.estudioId };
    if (rol) filter.rol = rol;

    const usuarios = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: usuarios.length, data: { usuarios } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener usuario por ID
export const getUsuarioById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuario = await User.findOne({
      _id: req.params.id,
      estudio: req.estudioId
    }).select('-password');

    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ success: true, data: { usuario } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener usuario', error: error.message });
  }
};

// Crear abogado (solo admin)
export const crearAbogado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
      return;
    }

    const existe = await User.findOne({ email });
    if (existe) {
      res.status(400).json({ success: false, message: 'El email ya está registrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const abogado = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol: 'abogado',
      estudio: req.estudioId,
      telefono,
    });

    const abogadoSinPassword = await User.findById(abogado._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Abogado creado exitosamente',
      data: { usuario: abogadoSinPassword }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al crear abogado', error: error.message });
  }
};

// Registrar cliente (público)
export const registrarCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, email, password, telefono, estudioSlug } = req.body;

    if (!nombre || !email || !password || !estudioSlug) {
      res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
      return;
    }

    // Buscar el estudio por slug
    const Estudio = (await import('../models/Estudio')).default;
    const estudio = await Estudio.findOne({ slug: estudioSlug, activo: true });

    if (!estudio) {
      res.status(404).json({ success: false, message: 'Estudio no encontrado' });
      return;
    }

    const existe = await User.findOne({ email });
    if (existe) {
      res.status(400).json({ success: false, message: 'El email ya está registrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const cliente = await User.create({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al registrar cliente', error: error.message });
  }
};

// Actualizar usuario
export const updateUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, telefono, activo } = req.body;

    const usuario = await User.findOne({
      _id: req.params.id,
      estudio: req.estudioId
    });

    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (nombre !== undefined) usuario.nombre = nombre;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (activo !== undefined) usuario.activo = activo;

    await usuario.save();

    const usuarioActualizado = await User.findById(usuario._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado',
      data: { usuario: usuarioActualizado }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar usuario
export const deleteUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuario = await User.findOneAndDelete({
      _id: req.params.id,
      estudio: req.estudioId
    });

    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar usuario', error: error.message });
  }
};