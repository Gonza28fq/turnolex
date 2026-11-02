// Levanta la API con una base MongoDB en memoria y datos de ejemplo (para probar el front sin tocar nada real).
// uso: npx ts-node --transpile-only tests/dev-memoria.ts   → API en http://localhost:5000
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET ||= 'dev-'.repeat(12);
process.env.SUPERADMIN_SECRET ||= 'dev-superadmin-secret';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

(async () => {
  const { crearApp } = await import('../src/app');
  const Estudio = (await import('../src/models/Estudio')).default;
  const User = (await import('../src/models/User')).default;
  const { transporter } = await import('../src/utils/email');
  (transporter as any).sendMail = async (m: any) => { console.log('[mail simulado]', m.subject); return {}; };

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const hash = await bcrypt.hash('demo-12345', 10);
  const e = await Estudio.create({ nombre: 'Estudio Demo', slug: 'estudio-demo', email: 'demo@estudio.com', aprobado: true, telefono: '381 400-0000', direccion: 'San Martín 500, Tucumán' });
  await User.create({ nombre: 'Laura Admin', email: 'admin@demo.com', password: hash, rol: 'admin', estudio: e._id });
  await User.create({ nombre: 'Dr. Pablo Ruiz', email: 'pablo@demo.com', password: hash, rol: 'abogado', estudio: e._id });
  await User.create({ nombre: 'María Gómez', email: 'maria@demo.com', password: hash, rol: 'cliente', estudio: e._id, telefono: '381 555-1234' });
  crearApp().listen(5000, () => console.log('API demo en :5000 (admin@demo.com / demo-12345)'));
})();
