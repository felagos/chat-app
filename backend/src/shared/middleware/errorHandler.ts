import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export const errorHandler = (
  error: Error,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  if (error.message === 'Unauthorized') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (error.message === 'Not Found') {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
};
