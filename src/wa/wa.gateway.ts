import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { WaService } from './wa.service';
import { Socket  } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { StoreService } from '../store/store.service';
import { SaverService } from '../database/saver.service';
import { OnGatewayConnection } from '@nestjs/websockets';
import { instrument } from "@socket.io/admin-ui";

import { Chat, Contact } from 'whatsapp-web.js';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../user/auth.guard';



@UseGuards(WsAuthGuard)
@WebSocketGateway(96,{}) 
export class WaGateway { //  implements OnGatewayConnection
  @WebSocketServer() server: Server;
  private cache : Record<string,{chats: Chat[],contacts: Contact[]}> = {};
  constructor(
    private readonly waService: WaService,
    private readonly cacheService: StoreService,
    private readonly saverService: SaverService
  ) {}


  @SubscribeMessage('init')
  async init(@MessageBody('phone') phone: string, @ConnectedSocket() socket: Socket, @MessageBody('name') name?: string) {
    if (!phone) {
      socket.emit("init", { success: false, error: "phone is required" });
      return;
    }

    if (this.cache[phone]) {
      socket.emit("init", { success: true, chats: this.cache[phone].chats, contacts: this.cache[phone].contacts });
      return;
    }

    try {
      socket.emit("init", "loading ... ");

      socket.once('success_login', async () => {
        try {
          const userId = (socket as any).user?._id;
          const chats = await this.waService.getChats(userId);
          const contacts = await this.waService.getContacts();

          this.cache[phone] = { chats, contacts };

          socket.emit("init", { success: true, chats, contacts });
        } catch (error) {
          socket.emit("init", { success: false, error: error.message });
        }
      });

      await this.waService.init(phone, socket, name);

    } catch (error) {
      socket.removeAllListeners('success_login');
      socket.emit("init", { success: false, error: error.message });
    }
  }

  @SubscribeMessage('logout')
  async logout() {
    await this.waService.logout();
  }
  @SubscribeMessage('getChatMessages')
  async getChatMessages(@MessageBody('chatId') chatId: string ,@ConnectedSocket() socket: Socket, @MessageBody('limit') limit?: number , @MessageBody('fromMe') fromMe?: boolean) {
    console.log("\ngetChatMessages\n");
    try {
      const messages = await this.waService.getChatMessages(chatId,limit,fromMe);
      socket.emit('getChatMessages', { success: true, messages });
    } catch (error) {
      socket.emit('getChatMessages', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(@MessageBody() message: {to: string, message: any, options?: any}) {
    await this.waService.sendMessage(message.to, message.message, message.options);
  }

  @SubscribeMessage('archiveChat')
  async archiveChat(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.archiveChat(chatId);
      socket.emit('archiveChat', { success: true, chatId });
    } catch (error) {
      socket.emit('archiveChat', { success: false, error: error.message });
    }
  }
  @SubscribeMessage('listChats')
  async listChats(@ConnectedSocket() socket: Socket) {
    try {
      const userId = (socket as any).user?._id;
      const chats = await this.waService.listChats(userId);
      socket.emit('listChats', { success: true, chats });
    } catch (error) {
      socket.emit('listChats', { success: false, error: error.message });
    }
  }
  @SubscribeMessage('getProfilePic')
  async getProfilePic(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      const profilePic = await this.waService.getProfilePic(chatId);
      socket.emit('getProfilePic', { success: true, profilePic });
    } catch (error) {
      socket.emit('getProfilePic', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('getContactById')
  async getContactById(@MessageBody('contactId') contactId: string, @ConnectedSocket() socket: Socket) {
    try {
      const contact = await this.waService.getContactById(contactId);
      socket.emit('getContactById', { success: true, contact });
    } catch (error) {
      socket.emit('getContactById', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('muteChat')
  async muteChat(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      const result = await this.waService.muteChat(chatId);
      socket.emit('muteChat', result);
    } catch (error) {
      socket.emit('muteChat', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('unmuteChat')
  async unmuteChat(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      const result = await this.waService.unmuteChat(chatId);
      socket.emit('unmuteChat', result);
    } catch (error) {
      socket.emit('unmuteChat', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('blockContact')
  async blockContact(@MessageBody('contactId') contactId: string, @ConnectedSocket() socket: Socket) {
    try {
      const result = await this.waService.blockContact(contactId);
      socket.emit('blockContact', result);
    } catch (error) {
      socket.emit('blockContact', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('unblockContact')
  async unblockContact(@MessageBody('contactId') contactId: string, @ConnectedSocket() socket: Socket) {
    try {
      const result = await this.waService.unblockContact(contactId);
      socket.emit('unblockContact', result);
    } catch (error) {
      socket.emit('unblockContact', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('markChatAsRead')
  async markChatAsRead(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      const result = await this.waService.markChatAsRead(chatId);
      socket.emit('markChatAsRead', result);
    } catch (error) {
      socket.emit('markChatAsRead', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('markChatAsUnread')
  async markChatAsUnread(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      const result = await this.waService.markChatAsUnread(chatId);
      socket.emit('markChatAsUnread', result);
    } catch (error) {
      socket.emit('markChatAsUnread', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('createGroup')
  async createGroup(@MessageBody() data: { name: string, participants: string[] }, @ConnectedSocket() socket: Socket) {
    try {
      const group = await this.waService.createGroup(data.name, data.participants);
      socket.emit('createGroup', { success: true, group });
    } catch (error) {
      socket.emit('createGroup', { success: false, error: error.message });
    }
  }
}

