import express, { Request, Response } from 'express';
import { publishMessage } from '../services/rabbitmq';

const router = express.Router();

router.post('/publish', async (req: Request, res: Response) => {
  try {
    const { exchangeName, routingKey, message } = req.body;

    if (!exchangeName || !routingKey || !message) {
      return res.status(400).json({
        error: 'Missing required fields: exchangeName, routingKey, message'
      });
    }

    await publishMessage(exchangeName, routingKey, message);

    res.json({
      success: true,
      message: 'Message published successfully',
      exchange: exchangeName,
      routingKey,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error publishing message:', error);
    res.status(500).json({
      error: 'Failed to publish message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
