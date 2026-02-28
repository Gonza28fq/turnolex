"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Estudio_1 = __importDefault(require("../models/Estudio"));
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;
// Middleware: solo el superadmin puede acceder (via secret en header o query)
const isSuperAdmin = (req, res, next) => {
    const secret = req.query.secret || req.headers['x-superadmin-secret'];
    if (secret !== process.env.SUPERADMIN_SECRET) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
    }
    next();
};
// GET /api/admin/estudios?secret=xxx — listar estudios pendientes
router.get('/estudios', isSuperAdmin, async (req, res) => {
    try {
        const { todos } = req.query;
        const filter = todos === 'true' ? {} : { aprobado: false, activo: true };
        const estudios = await Estudio_1.default.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, count: estudios.length, data: { estudios } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// GET /api/admin/estudios/:id/aprobar — aprobar desde link del email
router.get('/estudios/:id/aprobar', async (req, res) => {
    try {
        const estudio = await Estudio_1.default.findByIdAndUpdate(req.params.id, { aprobado: true }, { new: true });
        if (!estudio) {
            res.status(404).send('<h2 style="font-family:sans-serif;color:#dc2626">Estudio no encontrado</h2>');
            return;
        }
        // Email al admin del estudio
        try {
            await email_1.transporter.sendMail({
                from: `"TurnoLex" <${process.env.EMAIL_USER}>`,
                to: estudio.email,
                subject: '✅ Tu estudio fue aprobado — TurnoLex',
                html: `
          <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
            <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 1.5rem;">
                ⚖️ Turno<span style="color: #d97706;">Lex</span>
              </h1>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #16a34a; margin: 0 0 8px;">✅ ¡Tu estudio fue aprobado!</h2>
              <p style="color: #6b7280; margin: 0 0 24px;">
                El estudio <strong>${estudio.nombre}</strong> ya tiene acceso completo a TurnoLex.
                Podés iniciar sesión y empezar a gestionar tus turnos.
              </p>
              <a href="${FRONTEND_URL}/login"
                 style="display: inline-block; background: #d97706; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 1rem;">
                Iniciar sesión →
              </a>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 0.75rem; margin-top: 16px;">
              © ${new Date().getFullYear()} TurnoLex — Sistema de gestión para estudios jurídicos
            </p>
          </div>
        `,
            });
        }
        catch (emailErr) {
            console.error('Error enviando email al estudio:', emailErr);
        }
        res.send(`
      <div style="font-family: Segoe UI, sans-serif; max-width: 500px; margin: 80px auto; text-align: center; padding: 32px; background: white; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
        <h2 style="color: #16a34a; margin: 0 0 8px;">Estudio aprobado</h2>
        <p style="color: #6b7280;">"${estudio.nombre}" ahora tiene acceso a TurnoLex.</p>
        <p style="color: #9ca3af; font-size: 0.85rem;">Se envió un email de confirmación al estudio.</p>
      </div>
    `);
    }
    catch (err) {
        res.status(500).send('<h2 style="font-family:sans-serif;color:#dc2626">Error: ' + err.message + '</h2>');
    }
});
// GET /api/admin/estudios/:id/rechazar — rechazar desde link del email
router.get('/estudios/:id/rechazar', async (req, res) => {
    try {
        const estudio = await Estudio_1.default.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
        if (!estudio) {
            res.status(404).send('<h2 style="font-family:sans-serif;color:#dc2626">Estudio no encontrado</h2>');
            return;
        }
        try {
            await email_1.transporter.sendMail({
                from: `"TurnoLex" <${process.env.EMAIL_USER}>`,
                to: estudio.email,
                subject: 'Solicitud de acceso a TurnoLex',
                html: `
          <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
            <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 1.5rem;">
                ⚖️ Turno<span style="color: #d97706;">Lex</span>
              </h1>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #1f2937; margin: 0 0 8px;">Solicitud no aprobada</h2>
              <p style="color: #6b7280; margin: 0 0 16px;">
                Lamentablemente la solicitud para el estudio <strong>${estudio.nombre}</strong> no fue aprobada en esta ocasión.
              </p>
              <p style="color: #6b7280; font-size: 0.875rem;">
                Si creés que es un error o querés más información, respondé este email y nos ponemos en contacto.
              </p>
            </div>
          </div>
        `,
            });
        }
        catch (emailErr) {
            console.error('Error enviando email al estudio:', emailErr);
        }
        res.send(`
      <div style="font-family: Segoe UI, sans-serif; max-width: 500px; margin: 80px auto; text-align: center; padding: 32px; background: white; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2 style="color: #dc2626; margin: 0 0 8px;">Estudio rechazado</h2>
        <p style="color: #6b7280;">"${estudio.nombre}" fue notificado del rechazo.</p>
      </div>
    `);
    }
    catch (err) {
        res.status(500).send('<h2 style="font-family:sans-serif;color:#dc2626">Error: ' + err.message + '</h2>');
    }
});
exports.default = router;
