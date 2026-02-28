import { Router } from 'express';
import { getEstudio, updateEstudio } from '../controllers/estudioController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/:id', getEstudio);
router.put('/:id', authorize('admin'), upload.single('logo'), updateEstudio);

export default router;