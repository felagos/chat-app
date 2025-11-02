import { Prisma } from '@prisma/client';

// Define reusable validators with Prisma.validator
const conversationWithParticipantsValidator = Prisma.validator<Prisma.ConversationDefaultArgs>()({
  include: { participants: true }
});

const conversationWithLastMessageValidator = Prisma.validator<Prisma.ConversationDefaultArgs>()({
  include: {
    participants: true,
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1
    }
  }
});

const conversationWithRelationsValidator = Prisma.validator<Prisma.ConversationDefaultArgs>()({
  include: {
    participants: true,
    messages: true
  }
});

const messageWithUserValidator = Prisma.validator<Prisma.MessageDefaultArgs>()({
  include: {
    user: true,
    media: true
  }
});

// Extract types from validators
export type ConversationWithParticipants = Prisma.ConversationGetPayload<
  typeof conversationWithParticipantsValidator
>;

export type ConversationWithLastMessage = Prisma.ConversationGetPayload<
  typeof conversationWithLastMessageValidator
>;

export type ConversationWithRelations = Prisma.ConversationGetPayload<
  typeof conversationWithRelationsValidator
>;

export type MessageWithUser = Prisma.MessageGetPayload<
  typeof messageWithUserValidator
>;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    conversations: true;
    messages: true;
  };
}>;
