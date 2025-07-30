import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { WaService } from './wa.service';
import { Socket  } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { StoreService } from '../store/store.service';
import { SaverService } from '../database/saver.service';
import { OnGatewayConnection } from '@nestjs/websockets';
import { instrument } from "@socket.io/admin-ui";
import { WAMessage } from '@whiskeysockets/baileys';
import { Chat, Contact } from 'whatsapp-web.js';



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
  async init(@MessageBody('phone') phone: string , @ConnectedSocket() socket: Socket, @MessageBody('name') name?: string) {
    // console.log("\ninit\n");
    if (phone === undefined || phone === null || phone === "") {
      socket.emit("init",{success:false,error:"phone is required"});
      return;
    }
    if(this.cache[phone]){
      socket.emit("init",{success:true , chats: this.cache[phone].chats , contacts: this.cache[phone].contacts});
      return;
    }
    await this.waService.init(phone,socket,name);
    console.log("after init");
    await this.waService.client.client.on("ready",async()=>{
      console.log("\nready\n");
      this.cache[phone] = {
        chats: await this.waService.getChats() ,
        contacts: await this.waService.getContacts()
      }
      socket.emit("init",{success:true , chats: this.cache[phone].chats , contacts: this.cache[phone].contacts});
    })
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
}

