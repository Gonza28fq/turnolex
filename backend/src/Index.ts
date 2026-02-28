import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import turnoRoutes from './routes/turnos';
import userRoutes from './routes/users';
import estudioRoutes from './routes/estudios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Error MongoDB:', err));

// Rutas
app.get('/', (req, res) => {
  res.json({ message: '⚖️ TurnoLex API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/estudios', estudioRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;