import { Injectable } from '@nestjs/common';
import { WaStateService } from './waState.service';
import { WAClient,Events } from './waclient';
import { AnyMessageContent, WAMessage, MiscMessageGenerationOptions , downloadMediaMessage } from '@whiskeysockets/baileys';
import { StoreService } from 'src/store/store.service';
import { Socket } from 'socket.io';
import { SaverService } from '../database/saver.service';
import { convertJidToPhone , convertPhoneToJid } from 'src/database/utils';
import { MessageMedia } from 'whatsapp-web.js';



@Injectable()
export class WaService {
    client: WAClient;
    connected: boolean = false;
    phone: string;
    constructor(
        private readonly cacheManager: StoreService,
        private readonly saverService: SaverService
    ) {}

    async init(phone: string,socket:Socket, name?: string ) {
        this.phone = phone;
        await this.saverService.savePhone({
            name: name || this.phone,
            phoneNumber: this.phone,
            jid: convertPhoneToJid(this.phone)
        })
        const connected = await this.cacheManager.get("wa:connected");
        if(connected){
            return this.client?.me_id;
        }
        this.client = new WAClient(name || this.phone);
        console.log("assign client");
        this.client.on(Events.QR, (qr) => {
            socket.emit(Events.QR, qr);
        });
        this.client.on(Events.SUCCESS_LOGIN, async () => {
            socket.emit(Events.SUCCESS_LOGIN,this.client?.me_id );
            this.connected = true;
            
        });
        this.client.on(Events.CLOSED_CONNECTION, () => {
            socket.emit(Events.CLOSED_CONNECTION);
            this.connected = false;
        });
        this.client.on(Events.LOGGED_OUT, () => {
            socket.emit(Events.LOGGED_OUT);
        });
        this.client.on(Events.LOAD_MESSAGES, (messages) => {
            socket.emit(Events.LOAD_MESSAGES, messages);
            // this.saverService.saveMessages(messages,this.phone);
        });
        this.client.on(Events.LOAD_CHATS, (chats) => {
            socket.emit(Events.LOAD_CHATS, chats);
            // this.saverService.saveChats(chats,this.phone);
        });
        this.client.on(Events.LOAD_CONTACTS, (contacts) => {
            socket.emit(Events.LOAD_CONTACTS, contacts);
            // this.saverService.saveContacts(contacts,this.phone);
        });
        this.client.on(Events.NEW_MESSAGE, (messages) => {
            socket.emit(Events.NEW_MESSAGE, messages);
            // this.saverService.saveMessages(messages,this.phone);
        });
        this.client.on(Events.SEND_MESSAGE, (messages) => {
            socket.emit(Events.SEND_MESSAGE, messages);
            // this.saverService.saveMessages(messages,this.phone);
        });
        this.client.on(Events.CALL, (call) => {
            socket.emit(Events.CALL, call);
        });
        return this.client?.me_id;
    }
    async logout() {
        await this.client.logout();

    }
    async sendMessage(to: string, message: string | MessageMedia, options?: MiscMessageGenerationOptions) {
        await this.client.sendMessage(to, message, options);
    }
    async archiveChat(chatId: string) {
        return await this.client.archiveChat(chatId);
    }
    async listChats() {
        const chats = await this.client.getChats();
        return chats;
    }
    async getChatMessages(chatId: string , limit?: number , fromMe?: boolean) {
        const messages = await this.client.getChatMessages(chatId,limit,fromMe);
        return messages;
    }
    async getProfilePic(chatId: string) {
        const profilePic = await this.client.getProfilePic(chatId);
        return profilePic;
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
