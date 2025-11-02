import { PrismaClient } from '@prisma/client';
import type {
  ConversationWithParticipants,
  ConversationWithLastMessage,
  MessageWithUser
} from '../shared/types';

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  model: {
    $allModels: {
    }
  },
  client: {
    async getConversationsForUser(userId: string): Promise<ConversationWithLastMessage[]> {
      return basePrisma.conversation.findMany({
        where: {
          participants: {
            some: { id: userId }
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
    },

    async getConversationMessages(
      conversationId: string,
      skip: number = 0,
      take: number = 50
    ): Promise<MessageWithUser[]> {
      return basePrisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: true,
          media: true
        }
      });
    },

    async isUserParticipant(conversationId: string, userId: string): Promise<boolean> {
      const participant = await basePrisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          participants: {
            where: { id: userId },
            select: { id: true }
          }
        }
      });
      return !!participant?.participants.length;
    }
  }
});

export default prisma;
export type PrismaWithExtensions = typeof prisma;
