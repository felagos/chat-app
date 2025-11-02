import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import prisma from '../../config/prisma';
import type { ConversationWithLastMessage, ConversationWithParticipants, MessageWithUser } from '../../shared/types';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversations: ConversationWithLastMessage[] = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId
          }
        }
      },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, type, participantIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation: ConversationWithParticipants = await prisma.conversation.create({
      data: {
        name,
        type: type || 'private',
        participants: {
          connect: [
            { id: userId },
            ...participantIds.map((id: string) => ({ id }))
          ]
        }
      },
      include: {
        participants: true
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation: ConversationWithParticipants | null = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const isParticipant = conversation.participants.some((p: { id: string }) => p.id === userId);
    if (!isParticipant) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { skip = 0, take = 50 } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const isParticipant = conversation.participants.some((p: { id: string }) => p.id === userId);
    if (!isParticipant) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const messages: MessageWithUser[] = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
      skip: Number(skip),
      take: Number(take),
      include: {
        user: true,
        media: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
