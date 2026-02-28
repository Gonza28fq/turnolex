"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCancelacionTurno = exports.sendRecordatorioTurno = exports.sendConfirmacionTurno = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// Email confirmación de turno
const sendConfirmacionTurno = async (data) => {
    const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-AR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const horaFormateada = new Date(data.fecha).toLocaleTimeString('es-AR', {
        hour: '2-digit', minute: '2-digit'
    });
    await transporter.sendMail({
        from: `"${data.estudioNombre}" <${process.env.EMAIL_USER}>`,
        to: data.clienteEmail,
        subject: `✅ Turno confirmado — ${data.estudioNombre}`,
        html: `
      <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
        <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.5rem;">
            ⚖️ Turno<span style="color: #d97706;">Lex</span>
          </h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 0.9rem;">${data.estudioNombre}</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #16a34a; margin: 0 0 8px;">✅ Turno confirmado</h2>
          <p style="color: #6b7280; margin: 0 0 24px;">Hola <strong>${data.clienteNombre}</strong>, tu turno fue registrado exitosamente.</p>

          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem; width: 130px;">📅 Fecha</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${fechaFormateada}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">🕐 Hora</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${horaFormateada}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">⏱ Duración</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${data.duracion} minutos</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">👨‍⚖️ Abogado</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${data.abogadoNombre}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">📋 Motivo</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${data.motivo}</td>
              </tr>
              ${data.numeroCaso ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">🔢 Nº Caso</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${data.numeroCaso}</td>
              </tr>` : ''}
            </table>
          </div>

          <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">
            Si necesitás cancelar o reprogramar tu turno, comunicate con el estudio con anticipación.
          </p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 0.75rem; margin-top: 16px;">
          © ${new Date().getFullYear()} TurnoLex — Sistema de gestión para estudios jurídicos
        </p>
      </div>
    `,
    });
};
exports.sendConfirmacionTurno = sendConfirmacionTurno;
// Email recordatorio 24hs antes
const sendRecordatorioTurno = async (data) => {
    const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-AR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const horaFormateada = new Date(data.fecha).toLocaleTimeString('es-AR', {
        hour: '2-digit', minute: '2-digit'
    });
    await transporter.sendMail({
        from: `"${data.estudioNombre}" <${process.env.EMAIL_USER}>`,
        to: data.clienteEmail,
        subject: `⏰ Recordatorio: tenés un turno mañana — ${data.estudioNombre}`,
        html: `
      <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
        <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.5rem;">
            ⚖️ Turno<span style="color: #d97706;">Lex</span>
          </h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 0.9rem;">${data.estudioNombre}</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #d97706; margin: 0 0 8px;">⏰ Recordatorio de turno</h2>
          <p style="color: #6b7280; margin: 0 0 24px;">Hola <strong>${data.clienteNombre}</strong>, te recordamos que mañana tenés un turno agendado.</p>

          <div style="background: #fef9ee; border-radius: 12px; padding: 20px; border: 1px solid #fde68a; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem; width: 130px;">📅 Fecha</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${fechaFormateada}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">🕐 Hora</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${horaFormateada}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">👨‍⚖️ Abogado</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${data.abogadoNombre}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 0.875rem;">📋 Motivo</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 0.875rem;">${data.motivo}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">
            Por favor llegá con 10 minutos de anticipación. Si necesitás cancelar, comunicate a la brevedad.
          </p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 0.75rem; margin-top: 16px;">
          © ${new Date().getFullYear()} TurnoLex — Sistema de gestión para estudios jurídicos
        </p>
      </div>
    `,
    });
};
exports.sendRecordatorioTurno = sendRecordatorioTurno;
// Email cancelación
const sendCancelacionTurno = async (data) => {
    const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-AR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    await transporter.sendMail({
        from: `"${data.estudioNombre}" <${process.env.EMAIL_USER}>`,
        to: data.clienteEmail,
        subject: `❌ Turno cancelado — ${data.estudioNombre}`,
        html: `
      <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
        <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.5rem;">
            ⚖️ Turno<span style="color: #d97706;">Lex</span>
          </h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #ef4444; margin: 0 0 8px;">❌ Turno cancelado</h2>
          <p style="color: #6b7280; margin: 0 0 24px;">Hola <strong>${data.clienteNombre}</strong>, tu turno del <strong>${fechaFormateada}</strong> fue cancelado.</p>
          <p style="color: #6b7280; font-size: 0.85rem;">Comunicate con el estudio para reprogramarlo.</p>
        </div>
      </div>
    `,
    });
};
exports.sendCancelacionTurno = sendCancelacionTurno;
