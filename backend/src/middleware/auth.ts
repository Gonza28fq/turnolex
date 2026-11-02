import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Estudio from '../models/Estudio';

export interface AuthRequest extends Request {
  userId?: string;
  userRol?: string;
  estudioId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: 'Token requerido' });
    return;
  }

  let decoded: { id: string; rol: string; estudioId?: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string, { algorithms: ['HS256'] }) as typeof decoded;
  } catch {
    res.status(401).json({ success: false, message: 'Sesión vencida o inválida' });
    return;
  }

  try {
    // El token no alcanza: el usuario puede haber sido desactivado o el estudio dado de baja después de emitirlo
    const user = await User.findById(decoded.id).select('rol estudio activo').lean();
    if (!user || !user.activo) {
      res.status(401).json({ success: false, message: 'Usuario desactivado' });
      return;
    }
    const estudioId = user.estudio ? String(user.estudio) : undefined;
    if (!estudioId && user.rol !== 'superadmin') {
      res.status(403).json({ success: false, message: 'Usuario sin estudio' });
      return;
    }
    if (estudioId) {
      const estudio = await Estudio.findById(estudioId).select('activo aprobado').lean();
      if (!estudio || !estudio.activo || !estudio.aprobado) {
        res.status(403).json({ success: false, message: 'El estudio no está habilitado' });
        return;
      }
    }
    // rol y estudio salen de la base, no del token (si cambian, rige lo nuevo)
    req.userId = String(user._id);
    req.userRol = user.rol;
    req.estudioId = estudioId;
    next();
  } catch (err) {
    console.error('[auth]', err);
    res.status(500).json({ success: false, message: 'Error de autenticación' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.userRol as string)) {
      res.status(403).json({
        success: false,
        message: 'No tenés permisos para realizar esta acción'
      });
      return;
    }
    next();
  };
};
