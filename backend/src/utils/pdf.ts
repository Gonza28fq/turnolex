import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface TurnoPDF {
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono?: string;
  abogadoNombre: string;
  estudioNombre: string;
  estudioEmail: string;
  estudioTelefono?: string;
  estudioDireccion?: string;
  fecha: Date;
  duracion: number;
  motivo: string;
  numeroCaso?: string;
  notas?: string;
}

export const generateTurnoPDF = (data: TurnoPDF, res: Response): void => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=turno-${Date.now()}.pdf`);
  doc.pipe(res);

  // Header con fondo oscuro
  doc.rect(0, 0, doc.page.width, 120).fill('#1f2937');

  // Logo/título
  doc.fontSize(28).fillColor('#d97706').font('Helvetica-Bold').text('TurnoLex', 50, 35);
  doc.fontSize(11).fillColor('white').font('Helvetica').text(data.estudioNombre, 50, 68);
  if (data.estudioDireccion) {
    doc.fontSize(9).fillColor('rgba(255,255,255,0.6)').text(data.estudioDireccion, 50, 85);
  }

  // Badge "Comprobante de Turno"
  doc.rect(doc.page.width - 210, 35, 160, 50).fill('#d97706');
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
    .text('COMPROBANTE', doc.page.width - 210, 48, { width: 160, align: 'center' });
  doc.fontSize(9).font('Helvetica')
    .text('DE TURNO', doc.page.width - 210, 62, { width: 160, align: 'center' });

  // Línea dorada
  doc.rect(0, 120, doc.page.width, 4).fill('#d97706');

  let y = 150;

  // Estado
  doc.rect(50, y, 120, 28).fill('#f0fdf4');
  doc.fontSize(10).fillColor('#16a34a').font('Helvetica-Bold')
    .text('✓ CONFIRMADO', 50, y + 8, { width: 120, align: 'center' });

  // Número de caso
  if (data.numeroCaso) {
    doc.rect(doc.page.width - 200, y, 150, 28).fill('#fef3c7');
    doc.fontSize(9).fillColor('#d97706').font('Helvetica-Bold')
      .text(`Caso: ${data.numeroCaso}`, doc.page.width - 200, y + 9, { width: 150, align: 'center' });
  }

  y += 50;

  // Sección fecha y hora
  doc.rect(50, y, doc.page.width - 100, 80).fill('#f9fafb').stroke('#e5e7eb');

  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const horaFormateada = new Date(data.fecha).toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit'
  });

  doc.fontSize(9).fillColor('#6b7280').font('Helvetica').text('FECHA', 70, y + 15);
  doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold')
    .text(fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1), 70, y + 28);

  doc.fontSize(9).fillColor('#6b7280').font('Helvetica').text('HORA', 70, y + 50);
  doc.fontSize(12).fillColor('#d97706').font('Helvetica-Bold').text(horaFormateada, 70, y + 62);

  doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
    .text('DURACIÓN', doc.page.width - 170, y + 15);
  doc.fontSize(12).fillColor('#1f2937').font('Helvetica-Bold')
    .text(`${data.duracion} min`, doc.page.width - 170, y + 28);

  y += 105;

  // Función para sección
  const drawSection = (title: string, fields: { label: string; value: string }[], yPos: number): number => {
    doc.fontSize(11).fillColor('#1f2937').font('Helvetica-Bold').text(title, 50, yPos);
    doc.rect(50, yPos + 16, doc.page.width - 100, 1).fill('#e5e7eb');

    let fieldY = yPos + 24;
    fields.forEach(({ label, value }) => {
      doc.fontSize(9).fillColor('#9ca3af').font('Helvetica').text(label, 50, fieldY);
      doc.fontSize(10).fillColor('#1f2937').font('Helvetica').text(value, 180, fieldY);
      fieldY += 20;
    });
    return fieldY + 16;
  };

  // Datos del cliente
  y = drawSection('👤 Datos del Cliente', [
    { label: 'Nombre', value: data.clienteNombre },
    { label: 'Email', value: data.clienteEmail },
    { label: 'Teléfono', value: data.clienteTelefono || '—' },
  ], y);

  // Datos del turno
  y = drawSection('📋 Datos del Turno', [
    { label: 'Abogado', value: data.abogadoNombre },
    { label: 'Motivo', value: data.motivo },
    ...(data.notas ? [{ label: 'Notas', value: data.notas }] : []),
  ], y);

  // Datos del estudio
  y = drawSection('🏛 Datos del Estudio', [
    { label: 'Estudio', value: data.estudioNombre },
    { label: 'Email', value: data.estudioEmail },
    ...(data.estudioTelefono ? [{ label: 'Teléfono', value: data.estudioTelefono }] : []),
    ...(data.estudioDireccion ? [{ label: 'Dirección', value: data.estudioDireccion }] : []),
  ], y);

  // Footer
  doc.rect(0, doc.page.height - 60, doc.page.width, 60).fill('#1f2937');
  doc.fontSize(8).fillColor('rgba(255,255,255,0.5)').font('Helvetica')
    .text(
      `Comprobante generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} — TurnoLex`,
      50, doc.page.height - 38, { align: 'center', width: doc.page.width - 100 }
    );

  doc.end();
};