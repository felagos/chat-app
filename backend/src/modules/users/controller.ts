import { Response } from 'express';
import prisma from '../../config/prisma';
import type { AuthRequest } from '../../shared/middleware/auth';

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username } = req.query;
    const userId = req.user?.id;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Username query parameter is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
        // Excluir al usuario actual
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
      take: 10,
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
