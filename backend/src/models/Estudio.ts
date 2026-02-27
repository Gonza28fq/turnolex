import mongoose, { Document, Schema } from 'mongoose';

export interface IEstudio extends Document {
  nombre: string;
  slug: string; // identificador único ej: "estudio-garcia"
  email: string;
  telefono?: string;
  direccion?: string;
  logo?: string; // URL de Cloudinary
  plan: 'free' | 'pro';
  activo: boolean;
  createdAt: Date;
}

const EstudioSchema = new Schema<IEstudio>({
  nombre: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  telefono: { type: String },
  direccion: { type: String },
  logo: { type: String },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IEstudio>('Estudio', EstudioSchema);