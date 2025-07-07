import { Injectable } from '@nestjs/common';
import { WaStateService } from './waState.service';
import { WAClient,Events } from './waclient';
import { AnyMessageContent, MiscMessageGenerationOptions } from '@whiskeysockets/baileys';
import { StoreService } from 'src/store/store.service';
import { Socket } from 'socket.io';
import { SaverService } from '../database/saver.service';
import { convertJidToPhone , convertPhoneToJid } from 'src/database/utils';
@Injectable()
export class WaService {
    private client: WAClient;
    connected: boolean = false;
    phone: string;
    constructor(
        private readonly waStateService: WaStateService,
        private readonly cacheManager: StoreService,
        private readonly saverService: SaverService
    ) {}

    async init(phone: string,socket:Socket) {
        this.phone = phone;
        await this.saverService.savePhone({
            phoneNumber: this.phone,
            jid: convertPhoneToJid(this.phone)
        })
        const connected = await this.cacheManager.get("wa:connected");
        if(connected){
            return this.client?.me;
        }
        const { state, saveCreds } = await this.waStateService.getAuthState(this.phone);
        this.client = new WAClient(state,saveCreds);
        this.client.on(Events.QR, (qr) => {
            socket.emit(Events.QR, qr);
        });
        this.client.on(Events.SUCCESS_LOGIN, () => {
            socket.emit(Events.SUCCESS_LOGIN,this.client?.me);
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
            this.saverService.saveMessages(messages,this.phone);
        });
        this.client.on(Events.LOAD_CHATS, (chats) => {
            socket.emit(Events.LOAD_CHATS, chats);
            this.saverService.saveChats(chats,this.phone);
        });
        this.client.on(Events.LOAD_CONTACTS, (contacts) => {
            socket.emit(Events.LOAD_CONTACTS, contacts);
            this.saverService.saveContacts(contacts,this.phone);
        });
        this.client.on(Events.NEW_MESSAGE, (messages) => {
            socket.emit(Events.NEW_MESSAGE, messages);
            this.saverService.saveMessages(messages,this.phone);
        });
        this.client.on(Events.SEND_MESSAGE, (messages) => {
            socket.emit(Events.SEND_MESSAGE, messages);
            this.saverService.saveMessages(messages,this.phone);
        });
        this.client.on(Events.CALL, (call) => {
            socket.emit(Events.CALL, call);
            // this.saverService.saveCall(call,this.phone);
        });
        return this.client?.me;
    }
    async logout() {
        await this.client.logout();

    }
    async sendMessage(to: string, message: AnyMessageContent, options?: MiscMessageGenerationOptions) {
        await this.client.sendMessage(convertPhoneToJid(to), message, options);
    }
}
