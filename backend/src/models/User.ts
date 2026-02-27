import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  nombre: string;
  email: string;
  password: string;
  rol: 'superadmin' | 'admin' | 'abogado' | 'cliente';
  estudio?: mongoose.Types.ObjectId;
  telefono?: string;
  avatar?: string;
  activo: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  rol: {
    type: String,
    enum: ['superadmin', 'admin', 'abogado', 'cliente'],
    required: true
  },
  estudio: { type: Schema.Types.ObjectId, ref: 'Estudio' },
  telefono: { type: String },
  avatar: { type: String },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);