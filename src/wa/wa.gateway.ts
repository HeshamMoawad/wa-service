import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { WaService } from './wa.service';
import { Socket } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { StoreService } from '../store/store.service';
import { SaverService } from '../database/saver.service';
import { Chat, Contact } from 'whatsapp-web.js';

@WebSocketGateway(1050, {})
export class WaGateway {
  //  implements OnGatewayConnection
  @WebSocketServer() server: Server;
  private cache: Record<string, { chats: Chat[]; contacts: Contact[] }> = {};
  constructor(
    private readonly waService: WaService,
    private readonly cacheService: StoreService,
    private readonly saverService: SaverService,
  ) {}

  @SubscribeMessage('init')
  async init(
    @MessageBody('phone') phone: string,
    @ConnectedSocket() socket: Socket,
    @MessageBody('name') name?: string,
  ): Promise<void> {
    if (!phone) {
      socket.emit('init', { success: false, error: 'phone is required' });
      return;
    }

    if (this.cache[phone]) {
      socket.emit('init', {
        success: true,
        chats: this.cache[phone].chats,
        contacts: this.cache[phone].contacts,
      });
      return;
    }

    try {
      await this.waService.init(phone, socket, name);

      const onReady = (): void => {
        Promise.all([this.waService.getChats(), this.waService.getContacts()])
          .then(([chats, contacts]) => {
            this.cache[phone] = { chats, contacts };
            socket.emit('init', { success: true, chats, contacts });
          })
          .catch((error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            socket.emit('init', { success: false, error: errorMessage });
          });
      };

      this.waService.client.client.on('ready', onReady);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize';
      socket.emit('init', { success: false, error: errorMessage });
    }
  }

  @SubscribeMessage('logout')
  async logout() {
    await this.waService.logout();
  }
  @SubscribeMessage('getChatMessages')
  async getChatMessages(
    @MessageBody('chatId') chatId: string,
    @ConnectedSocket() socket: Socket,
    @MessageBody('limit') limit = 50,
    @MessageBody('fromMe') fromMe?: boolean,
  ): Promise<void> {
    try {
      const messages = await this.waService.getChatMessages(
        chatId,
        limit,
        fromMe,
      );
      socket.emit('getChatMessages', { success: true, messages });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get chat messages';
      socket.emit('getChatMessages', { success: false, error: errorMessage });
    }
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody()
    message: { to: string; message: string; options?: Record<string, unknown> },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    try {
      await this.waService.sendMessage(
        message.to,
        message.message,
        message.options,
      );
      socket.emit('sendMessage', { success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message';
      socket.emit('sendMessage', { success: false, error: errorMessage });
    }
  }

  @SubscribeMessage('archiveChat')
  async archiveChat(
    @MessageBody('chatId') chatId: string,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    try {
      await this.waService.archiveChat(chatId);
      await this.syncChats(socket);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to archive chat';
      socket.emit('archiveChat', { success: false, error: errorMessage });
    }
  }

  @SubscribeMessage('unarchiveChat')
  async unarchiveChat(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.unarchiveChat(chatId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('unarchiveChat', { success: false, error: error.message });
    }
  }
  @SubscribeMessage('listChats')
  async listChats(@ConnectedSocket() socket: Socket): Promise<void> {
    try {
      const chats = await this.waService.listChats();
      socket.emit('listChats', { success: true, chats });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to list chats';
      socket.emit('listChats', { success: false, error: errorMessage });
    }
  }
  @SubscribeMessage('getProfilePic')
  async getProfilePic(
    @MessageBody('chatId') chatId: string,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    try {
      const profilePic = await this.waService.getProfilePic(chatId);
      socket.emit('getProfilePic', { success: true, profilePic });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to get profile picture';
      socket.emit('getProfilePic', { success: false, error: errorMessage });
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
      await this.waService.muteChat(chatId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('muteChat', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('unmuteChat')
  async unmuteChat(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.unmuteChat(chatId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('unmuteChat', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('blockContact')
  async blockContact(@MessageBody('contactId') contactId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.blockContact(contactId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('blockContact', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('unblockContact')
  async unblockContact(@MessageBody('contactId') contactId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.unblockContact(contactId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('unblockContact', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('markChatAsRead')
  async markChatAsRead(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.markChatAsRead(chatId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('markChatAsRead', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('markChatAsUnread')
  async markChatAsUnread(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.markChatAsUnread(chatId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('markChatAsUnread', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('createGroup')
  async createGroup(@MessageBody() data: { name: string, participants: string[] }, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.createGroup(data.name, data.participants);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('createGroup', { success: false, error: error.message });
    }
  }
}
