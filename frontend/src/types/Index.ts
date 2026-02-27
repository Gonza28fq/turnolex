export interface Estudio {
  _id: string;
  nombre: string;
  slug: string;
  email: string;
  telefono?: string;
  direccion?: string;
  logo?: string;
  plan: 'free' | 'pro';
}

export interface User {
  _id: string;
  nombre: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'abogado' | 'cliente';
  estudio?: Estudio;
  telefono?: string;
  avatar?: string;
  activo: boolean;
}

export interface Turno {
  _id: string;
  estudio: string;
  abogado: User;
  cliente: User;
  fecha: string;
  duracion: number;
  motivo: string;
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';
  notas?: string;
  archivos: string[];
  pago?: Pago;
  numeroCaso?: string;
  createdAt: string;
}

export interface Pago {
  _id: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';
  mpPaymentId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}