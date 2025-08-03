// auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DBAccount } from '../database/schemas/accounts.schema';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    @InjectModel(DBAccount.name) private readonly accountModel: Model<DBAccount>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    const user = await this.validateUser(token);
    if (!user) {
      throw new WsException('Unauthorized: Invalid token');
    }
    
    (client as any).user = user; // Attach user object to socket
    return true;
  }

  private async validateUser(uuid: string): Promise<DBAccount | null> {
    if (!uuid) {
      return null;
    }
    const user = await this.accountModel.findOne({ uuid }).exec();
    return user;
  }
}
