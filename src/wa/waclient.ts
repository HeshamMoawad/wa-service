import { 
    makeWASocket, 
    useMultiFileAuthState , 
    AuthenticationState,
    DisconnectReason,
    proto,
    WASocket,
    Chat,
    Contact,
    WAMessage,
    AnyMessageContent,
    MiscMessageGenerationOptions
    } from '@whiskeysockets/baileys';
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

export class WAClient extends EventEmitter{
    private client: WASocket;
    me: Contact | undefined;
    constructor(private readonly authState: AuthenticationState,private readonly saveCreds: () => Promise<void>) {
        super();
        this.connect();
    }
    
    private async connect() {
        this.client = makeWASocket({
            auth: this.authState,
        });
        this.client.ev.on('creds.update', this.saveCreds);
        this.me = this.client.user;
        this.client.ev.on('connection.update', (update) => {
            const { connection , lastDisconnect , qr } = update;
            if (qr) {
                this.emit(Events.QR, qr);
            }
            else if (connection === 'close') {
                this.onClosedConnection(lastDisconnect);
            }
            else if (connection === 'open') {
                this.onOpenConnection();
            }
        });
        this.client.ev.on('messaging-history.set', (data:{chats: Chat[],contacts: Contact[],messages: WAMessage[],isLatest?: boolean,progress?: number,syncType?: proto.HistorySync.HistorySyncType,peerDataRequestSessionId?: string})=>{
            this.onLoadMessages(data.messages);
            this.onLoadChats(data.chats);
            this.onLoadContacts(data.contacts);
        });
        this.client.ev.on('messages.upsert', (messages) => {
            const newMessages = messages.messages.filter((message) => message.key.fromMe === false);
            if (newMessages.length > 0) {
                this.emit(Events.NEW_MESSAGE, newMessages);
            }
            const sendedMessages = messages.messages.filter((message) => message.key.fromMe === true);
            if (sendedMessages.length > 0) {
                this.emit(Events.SEND_MESSAGE, sendedMessages);
            }
        });
        this.client.ev.on('contacts.upsert', (contacts) => {
            this.emit(Events.LOAD_CONTACTS, contacts);
        });
        this.client.ev.on('chats.upsert', (chats) => {
            this.emit(Events.LOAD_CHATS, chats);
        });
        this.client.ev.on('call', (call) => {
            this.emit(Events.CALL, call);
        });

    }

    private onLoadMessages(messages: WAMessage[]) {
        this.emit(Events.LOAD_MESSAGES, messages);
    }

    private onLoadChats(chats: Chat[]) {
        this.emit(Events.LOAD_CHATS, chats);
    }

    private onLoadContacts(contacts: Contact[]) {
        this.emit(Events.LOAD_CONTACTS, contacts);
    }

    private async onOpenConnection() {
        this.emit(Events.SUCCESS_LOGIN);
    }
    private async onClosedConnection(lastDisconnect: any) {
        const reason = (lastDisconnect?.error)?.output?.statusCode;
        switch (reason) {
            case DisconnectReason.restartRequired:
                this.connect();
                break;
            case DisconnectReason.connectionLost:
                this.connect();
                break;
            case DisconnectReason.timedOut:
                this.connect();
                break;
            case DisconnectReason.loggedOut:
                this.logout();
                break;
            case DisconnectReason.connectionClosed:
                this.logout();
                break;
            default:
                this.emit(Events.CLOSED_CONNECTION);
                console.log("Closed connection",reason);
                break;
        }
    }
    
    async logout() {
        this.client.logout();
        this.emit(Events.CLOSED_CONNECTION);
        this.emit(Events.LOGGED_OUT);
    }
    
    async sendMessage(to: string, message: AnyMessageContent, options?: MiscMessageGenerationOptions) {
        if (!to) throw new Error('No jid provided');
        if (!message) throw new Error('No message provided');
        if (!this.client) throw new Error('Client not initialized');
        if (!to.endsWith('@s.whatsapp.net')) {
            if (!to.endsWith('@c.us')) {
                to = to + '@s.whatsapp.net';            
            }
        }
        this.client.sendMessage(to, message,options);
    }
    
}