/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import {
  Client,
  LocalAuth,
  MessageMedia,
  Message,
  MessageSendOptions,
} from 'whatsapp-web.js';
import { StoreService } from 'src/store/store.service';
import { Socket } from 'socket.io';
import { SaverService } from '../database/saver.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DBChat } from 'src/database/schemas/chat.schema';
import { convertPhoneToJid } from 'src/database/utils';

export enum Events {
  OPEN_CONNECTION = 'open_connection',
  CLOSED_CONNECTION = 'closed_connection',
  LOGGED_OUT = 'logged_out',
  LOAD_MESSAGES = 'load_messages',
  LOAD_CHATS = 'load_chats',
  LOAD_CONTACTS = 'load_contacts',
  NEW_MESSAGE = 'new_message',
  SEND_MESSAGE = 'send_message',
  QR = 'qr',
  SUCCESS_LOGIN = 'success_login',
  CALL = 'call',
}

@Injectable()
export class WaService {
  client: Client | null = null;
  connected: boolean = false;
  phone: string;
  me_id: string | undefined;

  constructor(
    private readonly cacheManager: StoreService,
    private readonly saverService: SaverService,
    @InjectModel(DBChat.name) private readonly chatModel: Model<DBChat>,
  ) {}

  private initPromise: Promise<string> | null = null;
  private clientInitialized: boolean = false;
  private socket: Socket | null = null;

  async init(phone: string, socket: Socket, name?: string): Promise<string> {
    // If already initialized and connected, return immediately
    if (this.client && this.connected && this.me_id) {
      console.log('Using existing WhatsApp client instance');
      return this.me_id;
    }

    // If already initializing, return the existing promise
    if (this.initPromise) {
      console.log('Client initialization already in progress');
      return this.initPromise;
    }

    if (!phone) {
      throw new Error('Phone number is required');
    }

    console.log('Starting WhatsApp client initialization...');

    this.phone = phone;
    this.socket = socket;

    this.initPromise = new Promise<string>(async (resolve, reject) => {
      try {
        await this.saverService.savePhone({
          name: name || this.phone,
          phoneNumber: this.phone,
          jid: convertPhoneToJid(this.phone),
        });

        if (this.client && this.connected && this.me_id) {
          console.log('Using existing WhatsApp session');
          this.clientInitialized = true;
          socket.emit(Events.SUCCESS_LOGIN, this.me_id);
          return resolve(this.me_id);
        }

        // Clear any existing client
        if (this.client) {
          try {
            await this.client.destroy();
          } catch (e) {
            console.error('Error destroying existing client:', e);
          }
          this.client = null;
        }

        console.log('Creating new WhatsApp client instance...');
        this.client = new Client({
          authStrategy: new LocalAuth({
            clientId: (name || this.phone).replace(/[^a-zA-Z0-9]/g, '_'),
            dataPath: './data',
          }),
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--single-process',
              '--disable-setuid-sandbox',
              '--disable-web-security',
              '--disable-features=IsolateOrigins,site-per-process',
              '--disable-site-isolation-trials',
            ],
            ignoreDefaultArgs: ['--disable-extensions'],
          },
        });

        // Set up event handlers
        this.setupEventHandlers(socket, resolve, reject);

        console.log('Initializing WhatsApp client...');
        await this.client.initialize();
      } catch (error) {
        console.error('Error in WhatsApp client initialization:', error);
        this.initPromise = null;
        socket.emit(Events.CLOSED_CONNECTION);
        reject(
          new Error(`Failed to initialize WhatsApp client: ${error.message}`),
        );
      }
    });

    return this.initPromise;
  }

  private setupEventHandlers(
    socket: Socket,
    resolve: (value: string) => void,
    reject: (reason?: any) => void,
  ) {
    if (!this.client) {
      const error = new Error('Client not initialized');
      console.error(error);
      reject(error);
      return;
    }

    console.log('Setting up WhatsApp client event handlers...');

    // QR Code handler
    this.client.on('qr', (qr: string) => {
      console.log('QR code received, emitting to client...');
      socket.emit(Events.QR, qr);
    });

    // Ready handler
    this.client.on('ready', () => {
      try {
        console.log('WhatsApp client is ready!');
        this.connected = true;
        this.clientInitialized = true;
        this.me_id = this.client?.info?.wid?._serialized;

        if (!this.me_id) {
          throw new Error('Failed to get WhatsApp user ID');
        }

        console.log('WhatsApp user ID:', this.me_id);
        socket.emit(Events.SUCCESS_LOGIN, this.me_id);
        resolve(this.me_id);
      } catch (error) {
        console.error('Error in ready handler:', error);
        this.connected = false;
        this.clientInitialized = false;
        reject(error);
      }
    });

    // Authentication failure handler
    this.client.on('auth_failure', (msg) => {
      const errorMsg = `Authentication failed: ${msg}`;
      console.error(errorMsg);
      this.connected = false;
      this.clientInitialized = false;
      this.cleanup();
      socket.emit(Events.CLOSED_CONNECTION, { error: errorMsg });
      reject(new Error(errorMsg));
    });

    // Disconnected handler
    this.client.on('disconnected', (reason) => {
      console.log('Client was logged out:', reason);
      this.connected = false;
      this.clientInitialized = false;
      this.cleanup();
      socket.emit(Events.LOGGED_OUT, {
        reason: reason || 'Disconnected from WhatsApp',
      });
    });

    // Message handler
    this.client.on('message', (message: Message) => {
      if (message.fromMe) {
        socket.emit(Events.SEND_MESSAGE, [message]);
      } else {
        socket.emit(Events.NEW_MESSAGE, [message]);
      }
    });
  }

  private cleanup() {
    this.initPromise = null;
    this.connected = false;
    this.me_id = undefined;
  }

  async logout() {
    try {
      if (this.client) {
        await this.client.logout();
        this.connected = false;
        this.cacheManager.del('wa:connected');
        this.cleanup();
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with cleanup even if logout fails
      this.connected = false;
      this.cleanup();
      throw error;
    }
  }

  async sendMessage(
    to: string,
    message: string | MessageMedia,
    options?: MessageSendOptions,
  ) {
    try {
      if (!to) throw new Error('No chatId provided');
      if (!message) throw new Error('No message provided');

      // Ensure client is properly initialized
      if (!this.client || !this.connected || !this.clientInitialized) {
        const state = {
          hasClient: !!this.client,
          isConnected: this.connected,
          isInitialized: this.clientInitialized,
          meId: this.me_id,
        };
        console.error('Client not ready:', state);
        throw new Error(
          'WhatsApp client is not ready. Please ensure you have called init() and scanned the QR code.',
        );
      }

      // Ensure proper JID format
      const recipientJid = to.endsWith('@c.us') ? to : `${to}@c.us`;

      // Check if recipient is registered
      const exist = await this.client.isRegisteredUser(recipientJid);
      console.log(`Sending to ${recipientJid}, registered: ${exist}`);

      if (!exist) {
        throw new Error(
          `Recipient ${recipientJid} is not a registered WhatsApp user`,
        );
      }

      // Send the message and return the result
      return await this.client.sendMessage(
        recipientJid,
        message,
        options || {},
      );
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  async archiveChat(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    await chat.archive();
    return chat;
  }

  async unarchiveChat(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    await chat.unarchive();
    return chat;
  }

  async pinChat(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    await chat.pin();
    return { success: true, message: `Chat ${chatId} pinned.` };
  }

  async listChats(userId?: string) {
    const chats = await this.getChats(userId);
    return chats;
  }

  async getChatMessages(chatId: string, limit?: number, fromMe?: boolean) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    const messages = await chat.fetchMessages({
      limit: limit || 10,
      fromMe: fromMe || false,
    });
    return messages;
  }

  async getProfilePic(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    return this.client.getProfilePicUrl(chatId);
  }

  async getContacts() {
    if (!this.client) throw new Error('Client not initialized');
    const contacts = await this.client.getContacts();
    return contacts;
  }

  async getChats(userId?: string) {
    if (userId) {
      const userChats = await this.chatModel.find({ user: userId }).exec();
      return userChats.map((dbChat) => dbChat.chat);
    }
    if (!this.client) throw new Error('Client not initialized');
    const chats = await this.client.getChats();
    return chats;
  }

  async getContactById(contactId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const contact = await this.client.getContactById(contactId);
    return contact;
  }

  async muteChat(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    await chat.mute();
    return { success: true, message: `Chat ${chatId} muted.` };
  }

  async unmuteChat(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    await chat.unmute();
    return { success: true, message: `Chat ${chatId} unmuted.` };
  }

  async blockContact(contactId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const contact = await this.client.getContactById(contactId);
    await contact.block();
    return { success: true, message: `Contact ${contactId} blocked.` };
  }

  async unblockContact(contactId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const contact = await this.client.getContactById(contactId);
    await contact.unblock();
    return { success: true, message: `Contact ${contactId} unblocked.` };
  }

  async markChatAsRead(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    await chat.sendSeen();
    return { success: true, message: `Chat ${chatId} marked as read.` };
  }

  async markChatAsUnread(chatId: string) {
    if (!this.client) throw new Error('Client not initialized');
    const chat = await this.client.getChatById(chatId);
    await chat.markUnread();
    return { success: true, message: `Chat ${chatId} marked as unread.` };
  }

  async createGroup(name: string, participants: string[]) {
    if (!this.client) throw new Error('Client not initialized');
    const group = await this.client.createGroup(name, participants);
    return group;
  }
}
