import mongoose, { Document, Schema } from 'mongoose';

export interface IPago extends Document {
  estudio: mongoose.Types.ObjectId;
  turno: mongoose.Types.ObjectId;
  cliente: mongoose.Types.ObjectId;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';
  mpPaymentId?: string; // ID de MercadoPago
  mpStatus?: string;
  createdAt: Date;
}

const PagoSchema = new Schema<IPago>({
  estudio: { type: Schema.Types.ObjectId, ref: 'Estudio', required: true },
  turno: { type: Schema.Types.ObjectId, ref: 'Turno', required: true },
  cliente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, default: 'ARS' },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado', 'cancelado'],
    default: 'pendiente'
  },
  mpPaymentId: { type: String },
  mpStatus: { type: String },
}, { timestamps: true });

export default mongoose.model<IPago>('Pago', PagoSchema);