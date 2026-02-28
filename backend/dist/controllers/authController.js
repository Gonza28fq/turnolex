"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.registerEstudio = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Estudio_1 = __importDefault(require("../models/Estudio"));
const email_1 = require("../utils/email");
const generateToken = (id, rol, estudioId) => {
    return jsonwebtoken_1.default.sign({ id, rol, estudioId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
// Registrar estudio + admin
const registerEstudio = async (req, res) => {
    try {
        const { nombreEstudio, nombreAdmin, email, password, telefono } = req.body;
        if (!nombreEstudio || !nombreAdmin || !email || !password) {
            res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
            return;
        }
        // Verificar si el email ya existe
        const existeUser = await User_1.default.findOne({ email });
        if (existeUser) {
            res.status(400).json({ success: false, message: 'El email ya está registrado' });
            return;
        }
        // Generar slug único del estudio
        const slug = nombreEstudio
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
        // Crear estudio con aprobado: false
        const estudio = await Estudio_1.default.create({
            nombre: nombreEstudio,
            slug,
            email,
            telefono,
            aprobado: false,
        });
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Crear admin del estudio
        const admin = await User_1.default.create({
            nombre: nombreAdmin,
            email,
            password: hashedPassword,
            rol: 'admin',
            estudio: estudio._id,
            telefono,
        });
        // Email al superadmin
        const superadminEmail = process.env.SUPERADMIN_EMAIL;
        const backendUrl = process.env.BACKEND_URL;
        try {
            await email_1.transporter.sendMail({
                from: `"TurnoLex" <${process.env.EMAIL_USER}>`,
                to: superadminEmail,
                subject: '🏛 Nuevo estudio pendiente de aprobación — TurnoLex',
                html: `
          <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
            <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 1.5rem;">
                ⚖️ Turno<span style="color: #d97706;">Lex</span>
              </h1>
              <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">Panel de Superadmin</p>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #1f2937; margin: 0 0 8px;">🏛 Nuevo estudio registrado</h2>
              <p style="color: #6b7280; margin: 0 0 24px;">Un nuevo estudio solicita acceso a TurnoLex.</p>
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 28px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem; width: 120px;">🏛 Estudio</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${nombreEstudio}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">👤 Admin</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${nombreAdmin}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">📧 Email</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">📞 Teléfono</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${telefono || '—'}</td>
                  </tr>
                </table>
              </div>
              <div style="display: flex; gap: 12px;">
                <a href="${backendUrl}/api/admin/estudios/${estudio._id}/aprobar"
                   style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1rem; margin-right: 12px;">
                  ✅ Aprobar estudio
                </a>
                <a href="${backendUrl}/api/admin/estudios/${estudio._id}/rechazar"
                   style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1rem;">
                  ❌ Rechazar estudio
                </a>
              </div>
            </div>
          </div>
        `,
            });
        }
        catch (emailErr) {
            console.error('Error enviando email al superadmin:', emailErr);
        }
        res.status(201).json({
            success: true,
            message: 'Registro exitoso. Tu estudio está pendiente de aprobación. Te notificaremos por email.',
            data: { pendienteAprobacion: true }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar', error: error.message });
    }
};
exports.registerEstudio = registerEstudio;
// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
            return;
        }
        const user = await User_1.default.findOne({ email }).populate('estudio');
        if (!user) {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            return;
        }
        if (!user.activo) {
            res.status(401).json({ success: false, message: 'Usuario desactivado' });
            return;
        }
        const passwordOk = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordOk) {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            return;
        }
        // Verificar aprobación del estudio
        const estudio = await Estudio_1.default.findById(user.estudio?._id);
        if (estudio && !estudio.aprobado) {
            res.status(403).json({
                success: false,
                message: 'Tu estudio está pendiente de aprobación. Te notificaremos por email cuando esté listo.',
                pendienteAprobacion: true
            });
            return;
        }
        const estudioId = user.estudio?._id?.toString();
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
    }
};
exports.login = login;
// Me
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId)
            .select('-password')
            .populate('estudio');
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json({ success: true, data: { user } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};
exports.getMe = getMe;
