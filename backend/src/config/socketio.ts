import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setIOInstance = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getIOInstance = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.io instance not initialized');
  }
  return ioInstance;
};
