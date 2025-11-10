import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'message-consumer',
    message: 'Consumer is running and processing messages',
    timestamp: new Date().toISOString()
  });
});

export default router;
