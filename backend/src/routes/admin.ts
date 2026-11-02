import { Router, Request, Response } from 'express';
import Estudio from '../models/Estudio';
import { transporter } from '../utils/email';
import { esc, soloSuperadmin, verificarAccionEstudio, esObjectId } from '../utils/seguridad';

const router = Router();

const pagina = (titulo: string, texto: string, color: string) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title></head>
<body style="margin:0;background:#f3f4f6"><div style="font-family:Segoe UI,sans-serif;max-width:500px;margin:80px auto;text-align:center;padding:32px;background:white;border-radius:16px;border:1px solid #e5e7eb">
<h2 style="color:${color};margin:0 0 8px">${esc(titulo)}</h2><p style="color:#6b7280">${esc(texto)}</p></div></body></html>`;

// GET /api/admin/estudios — listar estudios (secreto SOLO por header x-superadmin-secret)
router.get('/estudios', soloSuperadmin, async (req: Request, res: Response) => {
  try {
    const filter = req.query.todos === 'true' ? {} : { aprobado: false, activo: true };
    const estudios = await Estudio.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: estudios.length, data: { estudios } });
  } catch (err) {
    console.error('[admin/estudios]', err);
    res.status(500).json({ success: false, message: 'Error al listar estudios' });
  }
});

// Aprobar / rechazar desde el link del mail: el link lleva una firma (HMAC) que vence a los 7 días.
// Sin firma válida no pasa nada. Solo actúa sobre estudios pendientes (no se puede "re-aprobar" uno rechazado).
const accion = (tipo: 'aprobar' | 'rechazar') => async (req: Request, res: Response) => {
  const id = String(req.params.id);
  res.set('Content-Type', 'text/html; charset=utf-8');
  if (!esObjectId(id) || !verificarAccionEstudio(id, tipo, req.query.v, req.query.f)) {
    res.status(401).send(pagina('Link inválido o vencido', 'Pedí un link nuevo desde el panel de superadmin.', '#dc2626'));
    return;
  }
  try {
    const cambio = tipo === 'aprobar' ? { aprobado: true } : { activo: false };
    const estudio = await Estudio.findOneAndUpdate({ _id: id, aprobado: false, activo: true }, cambio, { new: true });
    if (!estudio) {
      res.status(409).send(pagina('Sin cambios', 'El estudio no existe o ya fue aprobado o rechazado.', '#6b7280'));
      return;
    }
    const FRONTEND_URL = process.env.FRONTEND_URL as string;
    try {
      await transporter.sendMail({
        from: `"TurnoLex" <${process.env.EMAIL_USER}>`,
        to: estudio.email,
        subject: tipo === 'aprobar' ? 'Tu estudio fue aprobado — TurnoLex' : 'Solicitud de acceso a TurnoLex',
        html: tipo === 'aprobar'
          ? `<div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:32px">
              <h2 style="color:#16a34a">¡Tu estudio fue aprobado!</h2>
              <p style="color:#374151">El estudio <strong>${esc(estudio.nombre)}</strong> ya tiene acceso a TurnoLex.</p>
              <a href="${esc(FRONTEND_URL)}/login" style="display:inline-block;background:#d97706;color:white;padding:12px 24px;text-decoration:none;border-radius:10px;font-weight:700">Iniciar sesión</a>
            </div>`
          : `<div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:32px">
              <h2 style="color:#1f2937">Solicitud no aprobada</h2>
              <p style="color:#374151">La solicitud del estudio <strong>${esc(estudio.nombre)}</strong> no fue aprobada. Si creés que es un error, respondé este mail.</p>
            </div>`,
      });
    } catch (emailErr) {
      console.error('Error enviando email al estudio:', emailErr);
    }
    res.send(tipo === 'aprobar'
      ? pagina('Estudio aprobado', `"${estudio.nombre}" ya tiene acceso. Se le avisó por mail.`, '#16a34a')
      : pagina('Estudio rechazado', `"${estudio.nombre}" fue notificado.`, '#dc2626'));
  } catch (err) {
    console.error('[admin/accion]', err);
    res.status(500).send(pagina('Error', 'No se pudo completar la acción.', '#dc2626'));
  }
};

router.get('/estudios/:id/aprobar', accion('aprobar'));
router.get('/estudios/:id/rechazar', accion('rechazar'));

export default router;
