import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia, Chat, Contact, Message, MessageSendOptions } from 'whatsapp-web.js';
import { StoreService } from 'src/store/store.service';
import { Socket } from 'socket.io';
import { SaverService } from '../database/saver.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DBChat } from 'src/database/schemas/chat.schema';
import { convertJidToPhone, convertPhoneToJid } from 'src/database/utils';

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
    client: Client;
    connected: boolean = false;
    phone: string;
    me_id: string | undefined;

    constructor(
        private readonly cacheManager: StoreService,
        private readonly saverService: SaverService,
        @InjectModel(DBChat.name) private readonly chatModel: Model<DBChat>
    ) { }

    async init(phone: string, socket: Socket, name?: string) {
        this.phone = phone;
        await this.saverService.savePhone({
            name: name || this.phone,
            phoneNumber: this.phone,
            jid: convertPhoneToJid(this.phone)
        });

        if (this.client && this.connected) {
            socket.emit(Events.SUCCESS_LOGIN, this.me_id);
            return this.me_id;
        }

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: name || this.phone,
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
                    '--disable-gpu'
                ],
            },
        });

        this.client.on('qr', (qr: string) => {
            socket.emit(Events.QR, qr);
        });

        this.client.on('ready', () => {
            this.me_id = this.client.info.wid._serialized;
            this.connected = true;
            socket.emit(Events.SUCCESS_LOGIN, this.me_id);
            this.cacheManager.set("wa:connected", true);
        });

        this.client.on('auth_failure', () => {
            this.connected = false;
            this.cacheManager.del("wa:connected");
            socket.emit(Events.CLOSED_CONNECTION);
        });

        this.client.on('disconnected', () => {
            this.connected = false;
            this.cacheManager.del("wa:connected");
            socket.emit(Events.CLOSED_CONNECTION);
        });

        this.client.on('message', (message: Message) => {
            if (message.fromMe) {
                socket.emit(Events.SEND_MESSAGE, [message]);
            } else {
                socket.emit(Events.NEW_MESSAGE, [message]);
            }
            // this.saverService.saveMessages([message], this.phone);
        });

        this.client.initialize();

        return this.me_id;
    }

    async logout() {
        await this.client.logout();
        this.connected = false;
        this.cacheManager.del("wa:connected");
    }

    async sendMessage(to: string, message: string | MessageMedia, options?: MessageSendOptions) {
        if (!to) throw new Error('No chatId provided');
        if (!message) throw new Error('No message provided');
        if (!this.client) throw new Error('Client not initialized');
        if (!to.endsWith('@c.us')) {
            to = to + '@c.us';
        }
        const exist = await this.client.isRegisteredUser(to);

        console.log(to + " " + exist);
        if (!exist) {
            throw new Error('User not registered');
        }
        await this.client.sendMessage(to, message, options);
    }

    async archiveChat(chatId: string) {
        const chat = await this.client.getChatById(chatId);
        await chat.archive();
        await chat.mute();
        return chat;
    }

    async listChats(userId?: string) {
        const chats = await this.getChats(userId);
        return chats;
    }

    async getChatMessages(chatId: string, limit?: number, fromMe?: boolean) {
        const chat = await this.client.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: limit || 10, fromMe: fromMe || false });
        return messages;
    }

    async getProfilePic(chatId: string) {
        return this.client.getProfilePicUrl(chatId);
    }

    async getContacts() {
        const contacts = await this.client.getContacts();
        return contacts;
    }

    async getChats(userId?: string) {
        if (userId) {
            const userChats = await this.chatModel.find({ user: userId }).exec();
            return userChats.map((dbChat) => dbChat.chat);
        }
        const chats = await this.client.getChats();
        return chats;
    }

    async getContactById(contactId: string) {
        const contact = await this.client.getContactById(contactId);
        return contact;
    }

    async muteChat(chatId: string) {
        const chat = await this.client.getChatById(chatId);
        await chat.mute();
        return { success: true, message: `Chat ${chatId} muted.` };
    }

    async unmuteChat(chatId: string) {
        const chat = await this.client.getChatById(chatId);
        await chat.unmute();
        return { success: true, message: `Chat ${chatId} unmuted.` };
    }

    async blockContact(contactId: string) {
        const contact = await this.client.getContactById(contactId);
        await contact.block();
        return { success: true, message: `Contact ${contactId} blocked.` };
    }

    async unblockContact(contactId: string) {
        const contact = await this.client.getContactById(contactId);
        await contact.unblock();
        return { success: true, message: `Contact ${contactId} unblocked.` };
    }

    async markChatAsRead(chatId: string) {
        const chat = await this.client.getChatById(chatId);
        await chat.sendSeen();
        return { success: true, message: `Chat ${chatId} marked as read.` };
    }

    async markChatAsUnread(chatId: string) {
        const chat = await this.client.getChatById(chatId);
        await chat.markUnread();
        return { success: true, message: `Chat ${chatId} marked as unread.` };
    }

    async createGroup(name: string, participants: string[]) {
        const group = await this.client.createGroup(name, participants);
        return group;
    }
}
