import { Prisma } from '@prisma/client';

export const safeUserSelect = {
  id: true,
  email: true,
  username: true,
  avatar: true,
  status: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

const conversationWithParticipantsValidator = Prisma.validator<Prisma.ConversationDefaultArgs>()({
  include: { participants: { select: safeUserSelect } }
});

const conversationWithLastMessageValidator = Prisma.validator<Prisma.ConversationDefaultArgs>()({
  include: {
    participants: { select: safeUserSelect },
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1
    }
  }
});

const messageWithUserValidator = Prisma.validator<Prisma.MessageDefaultArgs>()({
  include: {
    user: { select: safeUserSelect },
    media: true
  }
});

export type ConversationWithParticipants = Prisma.ConversationGetPayload<
  typeof conversationWithParticipantsValidator
>;

export type ConversationWithLastMessage = Prisma.ConversationGetPayload<
  typeof conversationWithLastMessageValidator
>;

export type MessageWithUser = Prisma.MessageGetPayload<
  typeof messageWithUserValidator
>;
