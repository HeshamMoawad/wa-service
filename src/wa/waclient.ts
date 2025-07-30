import { Client, LocalAuth, MessageMedia, Chat, Contact, Message } from 'whatsapp-web.js';
import { EventEmitter } from 'events';


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

export class WAClient extends EventEmitter {
    client: Client;
    me_id: string | undefined;

    constructor(private clientId: string) {
        super();
        this.connect();
    }

    private connect() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: this.clientId,
                dataPath: './data',
            }),
            puppeteer: { headless: true },
        });

        this.client.on('qr', (qr: string) => {
            this.emit(Events.QR, qr);
        });

        this.client.on('ready', () => {
            this.me_id = this.client.info.wid.toString();
            this.onOpenConnection();
        });

        this.client.on('authenticated', () => {
            this.emit(Events.SUCCESS_LOGIN);
        });

        this.client.on('auth_failure', () => {
            this.emit(Events.CLOSED_CONNECTION);
        });

        this.client.on('disconnected', () => {
            this.emit(Events.CLOSED_CONNECTION);
        });

        this.client.on('message', (message: Message) => {
            if (message.fromMe) {
                this.emit(Events.SEND_MESSAGE, [message]);
            } else {
                this.emit(Events.NEW_MESSAGE, [message]);
            }
        });

        this.client.on('message_create', (message: Message) => {
            // Handle sent messages if needed
        });

        this.client.on('message_ack', (message: Message) => {
            // Handle message acknowledgement if needed
        });

        this.client.on('chats_received', (chats: Chat[]) => {
            this.onLoadChats(chats);
        });

        this.client.on('contacts_received', (contacts: Contact[]) => {
            this.onLoadContacts(contacts);
        });

        this.client.initialize();
    }

    private onLoadChats(chats: Chat[]) {
        this.emit(Events.LOAD_CHATS, chats);
    }

    private onLoadContacts(contacts: Contact[]) {
        this.emit(Events.LOAD_CONTACTS, contacts);
    }

    async archiveChat(chatId: string) {
        const chat = await this.client.getChatById(chatId);
        await chat.archive();
        await chat.mute();
        return chat;
    }

    private async onOpenConnection() {
        this.emit(Events.SUCCESS_LOGIN);
    }

    async logout() {
        await this.client.logout();
        this.emit(Events.CLOSED_CONNECTION);
        this.emit(Events.LOGGED_OUT);
    }

    async sendMessage(to: string, message: string | MessageMedia, options?: any) {
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
    async getChatMessages(chatId: string , limit?: number , fromMe?: boolean) {
        const chat = await this.client.getChatById(chatId);
        const messages = await chat.fetchMessages({limit: limit || 10 , fromMe: fromMe || false });
        return messages;
    }
    async getProfilePic(chatId: string) {
        return this.client.getProfilePicUrl(chatId);
    }
    async getContacts() {
        const contacts = await this.client.getContacts();
        return contacts;
    }
    async getChats() {
        const chats = await this.client.getChats();
        return chats;
    }
}