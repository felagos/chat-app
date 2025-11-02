import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.getConversations);
router.post('/', controller.createConversation);
router.get('/:id', controller.getConversation);
router.get('/:id/messages', controller.getMessages);

export default router;
