import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import prisma from '../../config/prisma';
import { getIOInstance } from '../../config/socketio';
import { WebSocketEvent } from '../../shared/types/websocket';
import { safeUserSelect } from '../../shared/types';
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
        participants: { select: safeUserSelect },
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
    const { name, type, participantIds, username } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let finalParticipantIds = participantIds;

    // Si viene un username, buscar el usuario
    if (username && !participantIds) {
      const targetUser = await prisma.user.findUnique({
        where: { username }
      });

      if (!targetUser) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      finalParticipantIds = [targetUser.id];
    }

    // Verificar si ya existe una conversación privada con estos participantes
    if (!name && type !== 'group') {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'private',
          participants: {
            every: {
              id: {
                in: [userId, ...finalParticipantIds]
              }
            }
          }
        },
        include: {
          participants: { select: safeUserSelect }
        }
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        res.status(200).json(existingConversation);
        return;
      }
    }

    const conversation: ConversationWithParticipants = await prisma.conversation.create({
      data: {
        name,
        type: type || 'private',
        participants: {
          connect: [
            { id: userId },
            ...finalParticipantIds.map((id: string) => ({ id }))
          ]
        }
      },
      include: {
        participants: { select: safeUserSelect }
      }
    });

    // Notify all participants about the new conversation via WebSocket
    try {
      const io = getIOInstance();
      conversation.participants.forEach((participant) => {
        io.to(`user:${participant.id}`).emit(WebSocketEvent.CONVERSATION_CREATED, conversation);
      });
    } catch (error) {
      console.error('Failed to emit conversation created event:', error);
      // Don't fail the request if socket emission fails
    }

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
        participants: { select: safeUserSelect },
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
      include: { participants: { select: { id: true } } }
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
      orderBy: { createdAt: 'asc' },
      skip: Number(skip),
      take: Number(take),
      include: {
        user: { select: safeUserSelect },
        media: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: { select: { id: true } } }
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

    await prisma.conversation.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
