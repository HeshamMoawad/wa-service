/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable prettier/prettier */
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { WaService } from './wa.service';
import { Socket  } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { StoreService } from '../store/store.service';
import { SaverService } from '../database/saver.service';
import { Chat, Contact } from 'whatsapp-web.js';
import { pushWFM } from './wfm';


@WebSocketGateway() 
export class WaGateway { //  implements OnGatewayConnection
  @WebSocketServer() server: Server;
  private account:string | undefined;
  private user:string | undefined;
  private cache : Record<string,{chats: Chat[],contacts: Contact[]}> = {};
  constructor(
    private readonly waService: WaService,
    private readonly cacheService: StoreService,
    private readonly saverService: SaverService
  ) {}


  @SubscribeMessage('init')
  async init(@MessageBody('phone') phone: string, @ConnectedSocket() socket: Socket, @MessageBody('name') name?: string, @MessageBody('uuid') uuid?: string) {
    console.log("\nInitializing WhatsApp client for phone:", phone, "Name:", name, "UUID:", uuid);
    if (!uuid) {
      socket.emit("init", { success: false, error: "No UUID provided" });
      return;
    }    
    try {
        const userId = await this.waService.init(phone, socket, name);
        this.account = name;
        this.user = uuid;


        if (!userId) {
            throw new Error("Failed to initialize WhatsApp client: No user ID returned");
        }
        
        console.log("WhatsApp client initialized successfully for user:", userId);
        
        // Add a small delay to ensure the client is fully ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const chats = await this.waService.getChats(); // userId
            console.log("Fetched", chats?.length, "chats");
            
            const contacts = await this.waService.getContacts();
            console.log("Fetched", contacts?.length, "contacts");
            pushWFM(this.account!,this.user!,chats);
            this.cache[phone] = { chats, contacts };
            socket.emit("init", { success: true, chats, contacts });
        } catch (fetchError) {
            console.error("Error fetching chats/contacts:", fetchError);
            // Even if fetching chats/contacts fails, the client is still initialized
            socket.emit("init", { 
                success: true, 
                warning: `Client initialized but failed to load some data: ${fetchError.message}`,
                chats: [],
                contacts: []
            });
        }
    } catch (error) {
        console.error("Error in WhatsApp initialization:", error);
        // Try to clean up on error
        try {
            await this.waService.logout();
        } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
        }
        
        socket.emit("init", { 
            success: false, 
            error: error.message || "Failed to initialize WhatsApp client" 
        });
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
      const messages2 = await this.waService.getChatMessages(chatId,limit,!fromMe);
      socket.emit('getChatMessages', { success: true, messages:[...messages,...messages2] });
    } catch (error) {
      socket.emit('getChatMessages', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: { to: string; message: string | any; options?: any },
    @ConnectedSocket() socket: Socket
  ) {
    const { to, message, options } = data;
    console.log('Received sendMessage request:', { to, messageLength: String(message).length, options });
    
    try {
      // Input validation
      if (!to) {
        throw new Error('Recipient (to) is required');
      }
      
      if (!message) {
        throw new Error('Message content is required');
      }

      // Process message content
      let processedMessage = message;
      if (typeof message === 'string') {
        processedMessage = message.trim();
        if (!processedMessage) {
          throw new Error('Message cannot be empty');
        }
      }

      console.log('Sending message to:', to, 'Length:', String(processedMessage).length);
      
      // Send the message
      const messageResult = await this.waService.sendMessage(to, processedMessage, options);
      
      // Prepare success response
      const response = { 
        success: true,
        timestamp: new Date().toISOString(),
        to: to,
        messageId: messageResult?.id?.id || 'unknown',
        serverResponse: messageResult
      };
      
      console.log('Message sent successfully:', response);
      socket.emit('message_sent', response);
      
      // Update chats to reflect the new message
      try {
        await this.syncChats(socket);
      } catch (syncError) {
        console.error('Error syncing chats after message send:', syncError);
        // Don't fail the message send if sync fails
      }
      
      return response;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      socket.emit('message_error', { 
        success: false, 
        error: error.message || 'Failed to send message',
        originalMessage: { to, message: String(message).substring(0, 100) + '...' }
      });
      throw error; // This will trigger the global exception filter
    }
  }

  private async syncChats(socket: Socket) {
    try {
      const chats = await this.waService.listChats();
      pushWFM(this.account!,this.user!,chats);
      socket.emit('sync_chats', { success: true, chats });
    } catch (error) {
      socket.emit('sync_chats', { success: false, error: error.message });
    }
  }
  @SubscribeMessage('syncChats')
  async sync_chats(@ConnectedSocket() socket: Socket) {
    try {
      const chats = await this.waService.listChats();
      pushWFM(this.account!,this.user!,chats);
      socket.emit('sync_chats', { success: true, chats });
    } catch (error) {
      socket.emit('sync_chats', { success: false, error: error.message });
    }
  }
  @SubscribeMessage('pinChat')
  async pinChat(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.pinChat(chatId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('pinChat', { success: false, error: error.message });
    }
  }

  @SubscribeMessage('archiveChat')
  async archiveChat(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    try {
      await this.waService.archiveChat(chatId);
      await this.syncChats(socket);
    } catch (error) {
      socket.emit('archiveChat', { success: false, error: error.message });
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
  async listChats(@ConnectedSocket() socket: Socket) {
    try {
      const chats = await this.waService.listChats();
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
      if (!chatId) {
        throw new Error('Chat ID is required');
      }
      
      // const result = await this.waService.markChatAsRead(chatId);
      await this.syncChats(socket);
      this.waService.client?.sendSeen(chatId);  
      socket.emit('markChatAsRead', { 
        success: true, 
        chatId,
        message: "Chat marked as read" 
      });
      
      // Also emit a 'chatMarkedAsSeen' event for backward compatibility
      socket.emit('chatMarkedAsSeen', { 
        success: true, 
        chatId,
        message: "Chat marked as read" 
      });
    } catch (error) {
      console.error('Error marking chat as read:', error);
      const errorMsg = error.message || 'Failed to mark chat as read';
      socket.emit('markChatAsRead', { 
        success: false, 
        error: errorMsg 
      });
      // Also emit to 'chatMarkedAsSeen' for backward compatibility
      socket.emit('chatMarkedAsSeen', { 
        success: false, 
        error: errorMsg 
      });
    }
  }
  
  /**
   * Alias for markChatAsRead - marks all messages in a chat as seen
   */
  @SubscribeMessage('markChatAsSeen')
  async markChatAsSeen(@MessageBody('chatId') chatId: string, @ConnectedSocket() socket: Socket) {
    // Simply call markChatAsRead as they perform the same action
    return this.markChatAsRead(chatId, socket);
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
