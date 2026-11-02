import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { crearApp } from './app';

const PORT = process.env.PORT || 5000;
const app = crearApp();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️ JWT_SECRET falta o tiene menos de 32 caracteres: conviene usar uno largo y aleatorio');
}

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Error MongoDB:', err));

app.listen(PORT, () => {
  console.log(`Servidor en el puerto ${PORT}`);
});

export default app;
