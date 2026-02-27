import { Router } from 'express';
import {
  getTurnos,
  getTurnoById,
  createTurno,
  updateTurnoEstado,
  deleteTurno,
  getMisTurnos,
} from '../controllers/turnoController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/', authorize('admin', 'abogado'), getTurnos);
router.get('/mis-turnos', authorize('abogado'), getMisTurnos);
router.get('/:id', getTurnoById);
router.post('/', authorize('admin', 'cliente'), createTurno);
router.put('/:id/estado', authorize('admin', 'abogado'), updateTurnoEstado);
router.delete('/:id', authorize('admin'), deleteTurno);

export default router;