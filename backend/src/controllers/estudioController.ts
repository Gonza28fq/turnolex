import { Response } from 'express';
import fs from 'fs';
import Estudio from '../models/Estudio';
import { AuthRequest } from '../middleware/auth';
import { uploadImage } from '../utils/cloudinary';
import { errorInterno, esEmail, esTexto } from '../utils/seguridad';

const borrarTemporal = (req: AuthRequest) => { if (req.file) fs.unlink(req.file.path, () => {}); };

// Obtener estudio
export const getEstudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const estudio = await Estudio.findById(req.estudioId);
    if (!estudio) {
      res.status(404).json({ success: false, message: 'Estudio no encontrado' });
      return;
    }
    res.status(200).json({ success: true, data: { estudio } });
  } catch (error) {
    errorInterno(res, 'Error al obtener el estudio', error);
  }
};

// Actualizar estudio
export const updateEstudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, email, telefono, direccion } = req.body;
    if (req.params.id !== req.estudioId) {
      borrarTemporal(req);
      res.status(403).json({ success: false, message: 'No tenés permiso para modificar este estudio' });
      return;
    }
    if ((nombre !== undefined && nombre !== '' && !esTexto(nombre, 2, 120)) || (email !== undefined && email !== '' && !esEmail(email))) {
      borrarTemporal(req);
      res.status(400).json({ success: false, message: 'Nombre o email inválidos' });
      return;
    }
    const estudio = await Estudio.findById(req.params.id);

    if (!estudio) {
      res.status(404).json({ success: false, message: 'Estudio no encontrado' });
      return;
    }

    if (estudio._id.toString() !== req.estudioId) {
      res.status(403).json({ success: false, message: 'No tenés permiso para modificar este estudio' });
      return;
    }

    if (nombre) estudio.nombre = nombre;
    if (email) estudio.email = email;
    if (telefono) estudio.telefono = telefono;
    if (direccion) estudio.direccion = direccion;

    // Subir logo a Cloudinary si se envió archivo
    if (req.file) {
      const logoUrl = await uploadImage(req.file.path, 'logos');
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
  } catch (error) {
    borrarTemporal(req);
    errorInterno(res, 'Error al actualizar el estudio', error);
  }
};