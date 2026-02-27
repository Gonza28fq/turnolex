import mongoose, { Document, Schema } from 'mongoose';

export interface ITurno extends Document {
  estudio: mongoose.Types.ObjectId;
  abogado: mongoose.Types.ObjectId;
  cliente: mongoose.Types.ObjectId;
  fecha: Date;
  duracion: number; // minutos
  motivo: string;
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';
  notas?: string;
  archivos: string[]; // URLs de Cloudinary
  pago?: mongoose.Types.ObjectId;
  numeroCaso?: string;
  createdAt: Date;
}

const TurnoSchema = new Schema<ITurno>({
  estudio: { type: Schema.Types.ObjectId, ref: 'Estudio', required: true },
  abogado: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cliente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: Date, required: true },
  duracion: { type: Number, default: 60 },
  motivo: { type: String, required: true, trim: true },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'cancelado', 'completado'],
    default: 'pendiente'
  },
  notas: { type: String },
  archivos: [{ type: String }],
  pago: { type: Schema.Types.ObjectId, ref: 'Pago' },
  numeroCaso: { type: String },
}, { timestamps: true });

export default mongoose.model<ITurno>('Turno', TurnoSchema);