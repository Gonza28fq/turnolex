import { Router } from 'express';
import {
  getUsuarios,
  getUsuarioById,
  crearAbogado,
  registrarCliente,
  updateUsuario,
  deleteUsuario,
  changePassword,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Ruta pública — registro de clientes
router.post('/register-cliente', registrarCliente);

// Rutas protegidas
router.use(authenticate);

router.get('/', authorize('admin'), getUsuarios);
router.get('/:id', authorize('admin'), getUsuarioById);
router.post('/abogado', authorize('admin'), crearAbogado);
router.put('/:id/password', changePassword);
router.put('/:id', authorize('admin'), updateUsuario);
router.delete('/:id', authorize('admin'), deleteUsuario);

export default router;