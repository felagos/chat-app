import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import * as controller from './controller';

const router = Router();

router.use(authenticate);

router.get('/search', controller.searchUsers);
router.get('/:id', controller.getUser);

export default router;
