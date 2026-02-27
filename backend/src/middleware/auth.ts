import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

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
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, message: 'Token requerido' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      rol: string;
      estudioId?: string;
    };

    req.userId = decoded.id;
    req.userRol = decoded.rol;
    req.estudioId = decoded.estudioId;

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido' });
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