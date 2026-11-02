import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Escapa texto que va dentro de HTML (mails, páginas de respuesta)
export const esc = (valor: unknown): string =>
  String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
  )[c]);

const igualesSeguro = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const secretoSuperadmin = (): string | null => {
  const s = process.env.SUPERADMIN_SECRET;
  return s && s.length >= 16 ? s : null; // sin secreto configurado (o muy corto) no se aprueba nada
};

// Firma para los links de aprobar / rechazar que van en el mail al superadmin.
// Vence a los 7 días y está atada al estudio y a la acción.
export const firmarAccionEstudio = (estudioId: string, accion: 'aprobar' | 'rechazar', vence = Date.now() + 7 * 864e5) => {
  const secreto = secretoSuperadmin();
  if (!secreto) throw new Error('SUPERADMIN_SECRET no configurado (mínimo 16 caracteres)');
  const firma = crypto.createHmac('sha256', secreto).update(`${estudioId}:${accion}:${vence}`).digest('hex');
  return { vence, firma };
};

export const verificarAccionEstudio = (estudioId: string, accion: string, vence: unknown, firma: unknown): boolean => {
  const secreto = secretoSuperadmin();
  if (!secreto || typeof firma !== 'string' || typeof vence !== 'string') return false;
  const v = Number(vence);
  if (!Number.isFinite(v) || v < Date.now()) return false;
  const esperada = crypto.createHmac('sha256', secreto).update(`${estudioId}:${accion}:${v}`).digest('hex');
  return igualesSeguro(esperada, firma);
};

// Solo por header (nunca por query string: queda en logs e historial)
export const soloSuperadmin = (req: Request, res: Response, next: NextFunction): void => {
  const secreto = secretoSuperadmin();
  const enviado = req.headers['x-superadmin-secret'];
  if (!secreto || typeof enviado !== 'string' || !igualesSeguro(enviado, secreto)) {
    res.status(401).json({ success: false, message: 'No autorizado' });
    return;
  }
  next();
};

// Saca claves con "$" o "." del body (evita inyección de operadores de Mongo como {"email": {"$ne": null}})
const limpiar = (v: any): any => {
  if (Array.isArray(v)) return v.map(limpiar);
  if (v && typeof v === 'object') {
    const out: any = {};
    for (const [k, val] of Object.entries(v)) if (!k.startsWith('$') && !k.includes('.')) out[k] = limpiar(val);
    return out;
  }
  return v;
};
export const sanitizarBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') req.body = limpiar(req.body);
  next();
};

// Error 500 sin filtrar detalles internos al cliente
export const errorInterno = (res: Response, mensaje: string, err: unknown): void => {
  console.error(`[${mensaje}]`, err);
  res.status(500).json({ success: false, message: mensaje });
};

export const esTexto = (v: unknown, min = 1, max = 500): v is string =>
  typeof v === 'string' && v.trim().length >= min && v.length <= max;

export const esEmail = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const esObjectId = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);
