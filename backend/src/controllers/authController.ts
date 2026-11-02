import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Estudio from '../models/Estudio';
import { transporter } from '../utils/email';
import { esc, esEmail, esTexto, errorInterno, firmarAccionEstudio } from '../utils/seguridad';

export const PASSWORD_MIN = 8;
const HASH_FALSO = bcrypt.hashSync('no-existe', 12); // para comparar igual cuando el usuario no existe

const generateToken = (id: string, rol: string, estudioId?: string) => {
  return jwt.sign(
    { id, rol, estudioId },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
};

// Registrar estudio + admin
export const registerEstudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombreEstudio, nombreAdmin, email, password, telefono } = req.body;

    if (!esTexto(nombreEstudio, 2, 120) || !esTexto(nombreAdmin, 2, 120) || !esEmail(email) || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Completá nombre del estudio, tu nombre, un email válido y una contraseña' });
      return;
    }
    if (password.length < PASSWORD_MIN || password.length > 128) {
      res.status(400).json({ success: false, message: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` });
      return;
    }
    if (telefono !== undefined && telefono !== '' && !esTexto(telefono, 6, 30)) {
      res.status(400).json({ success: false, message: 'Teléfono inválido' });
      return;
    }
    const emailNorm = email.trim().toLowerCase();

    const existeUser = await User.findOne({ email: emailNorm });
    if (existeUser) {
      res.status(400).json({ success: false, message: 'El email ya está registrado' });
      return;
    }

    const slug = nombreEstudio
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 60) + '-' + Date.now().toString(36);

    const estudio = await Estudio.create({
      nombre: nombreEstudio.trim(),
      slug,
      email: emailNorm,
      telefono,
      aprobado: false,
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      nombre: nombreAdmin.trim(),
      email: emailNorm,
      password: hashedPassword,
      rol: 'admin',
      estudio: estudio._id,
      telefono,
    });

    // Mail al superadmin con links firmados (vencen en 7 días)
    try {
      const backendUrl = process.env.BACKEND_URL as string;
      const id = String(estudio._id);
      const ap = firmarAccionEstudio(id, 'aprobar');
      const re = firmarAccionEstudio(id, 'rechazar');
      const link = (accion: string, s: { vence: number; firma: string }) =>
        `${backendUrl}/api/admin/estudios/${id}/${accion}?v=${s.vence}&f=${s.firma}`;
      await transporter.sendMail({
        from: `"TurnoLex" <${process.env.EMAIL_USER}>`,
        to: process.env.SUPERADMIN_EMAIL as string,
        subject: 'Nuevo estudio pendiente de aprobación — TurnoLex',
        html: `
          <div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:32px">
            <h2 style="color:#1f2937;margin:0 0 8px">Nuevo estudio registrado</h2>
            <table style="border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:6px 16px 6px 0;color:#6b7280">Estudio</td><td><strong>${esc(nombreEstudio)}</strong></td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#6b7280">Admin</td><td>${esc(nombreAdmin)}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#6b7280">Email</td><td>${esc(emailNorm)}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#6b7280">Teléfono</td><td>${esc(telefono || '—')}</td></tr>
            </table>
            <a href="${esc(link('aprobar', ap))}" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:10px;font-weight:700;margin-right:12px">Aprobar</a>
            <a href="${esc(link('rechazar', re))}" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:10px;font-weight:700">Rechazar</a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">Los links vencen en 7 días.</p>
          </div>`,
      });
    } catch (emailErr) {
      console.error('Error enviando email al superadmin:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. Tu estudio está pendiente de aprobación. Te notificaremos por email.',
      data: { pendienteAprobacion: true }
    });
  } catch (error) {
    errorInterno(res, 'Error al registrar', error);
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
      return;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).populate('estudio');
    // mismo mensaje y mismo costo de tiempo exista o no el usuario
    const passwordOk = await bcrypt.compare(password, user?.password || HASH_FALSO);
    if (!user || !passwordOk) {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
      return;
    }

    if (!user.activo) {
      res.status(401).json({ success: false, message: 'Usuario desactivado' });
      return;
    }

    const estudio = user.estudio as any;
    if (estudio && !estudio.activo) {
      res.status(403).json({ success: false, message: 'El estudio no está habilitado' });
      return;
    }
    if (estudio && !estudio.aprobado) {
      res.status(403).json({
        success: false,
        message: 'Tu estudio está pendiente de aprobación. Te notificaremos por email cuando esté listo.',
        pendienteAprobacion: true
      });
      return;
    }

    const estudioId = estudio?._id?.toString();
    const token = generateToken(user._id.toString(), user.rol, estudioId);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          avatar: user.avatar,
          estudio: user.estudio,
        }
      }
    });
  } catch (error) {
    errorInterno(res, 'Error al iniciar sesión', error);
  }
};

// Me
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('estudio');

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    errorInterno(res, 'Error al obtener el usuario', error);
  }
};
