import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Error MongoDB:', err));

// Rutas (las agregamos después)
app.get('/', (req, res) => {
  res.json({ message: '⚖️ TurnoLex API funcionando' });
});
import authRoutes from './routes/auth';

app.use('/api/auth', authRoutes);
import turnoRoutes from './routes/turnos';

app.use('/api/turnos', turnoRoutes);
import userRoutes from './routes/users';

app.use('/api/users', userRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;