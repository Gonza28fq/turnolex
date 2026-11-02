import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import turnoRoutes from './routes/turnos';
import userRoutes from './routes/users';
import estudioRoutes from './routes/estudios';
import adminRoutes from './routes/admin';
import { sanitizarBody } from './utils/seguridad';

// La app sin conectar a la base ni escuchar un puerto (así se puede probar)
export const crearApp = () => {
  const app = express();
  app.set('trust proxy', 1); // Railway pone un proxy adelante: hace falta para que el límite de intentos vea la IP real
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(sanitizarBody);

  // Límite de intentos en login y registros (fuerza bruta / spam de altas)
  const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_AUTH || 20),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
  });
  app.use(['/api/auth/login', '/api/auth/register', '/api/users/register-cliente'], limiteAuth);

  app.get('/', (_req, res) => {
    res.json({ message: 'TurnoLex API funcionando' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/turnos', turnoRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/estudios', estudioRoutes);
  app.use('/api/admin', adminRoutes);

  // Errores no controlados (ej. multer, JSON mal formado): sin detalles internos
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    if (status >= 500) console.error('[error no controlado]', err);
    const mensaje = status >= 500 ? 'Error interno'
      : err?.type === 'entity.parse.failed' ? 'El cuerpo de la solicitud no es JSON válido'
      : err?.type === 'entity.too.large' ? 'La solicitud es demasiado grande'
      : err?.name === 'MulterError' || /Solo se permiten/.test(err?.message || '') ? err.message
      : 'Solicitud inválida';
    res.status(status).json({ success: false, message: mensaje });
  });

  return app;
};
