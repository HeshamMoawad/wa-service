// connection-manager.service.ts
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class ConnectionManagerService {
  private readonly userConnections = new Map<string, Socket[]>();

  addConnection(userId: string, socket: Socket) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections?.get(userId)?.push(socket);
  }

  removeConnection(socket: Socket|undefined) {
    for (const [userId, sockets] of this.userConnections.entries()) {
      this.userConnections.set(
        userId,
        sockets.filter(s => s.id !== socket?.id)
      );
      if (this.userConnections?.get(userId)?.length === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  getConnections(userId: string): Socket[] {
    return this.userConnections?.get(userId) || [];
  }
}