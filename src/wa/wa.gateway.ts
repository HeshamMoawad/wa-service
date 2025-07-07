import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { WaService } from './wa.service';
import { Socket  } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { StoreService } from '../store/store.service';
import { SaverService } from '../database/saver.service';

@WebSocketGateway({namespace:"/whatsapp"})
export class WaGateway {
  @WebSocketServer() server: Server;
  constructor(
    private readonly waService: WaService,
    private readonly cacheService: StoreService,
    private readonly saverService: SaverService
  ) {}


  @SubscribeMessage('init')
  async init(@MessageBody('phone') phone: string , @ConnectedSocket() socket: Socket) {
    socket.emit("init",{phone});
    if (phone === undefined || phone === null || phone === "") {
      socket.emit("init",{error:"phone is required"});
      return;
    }
    await this.waService.init(phone,socket);
    socket.emit("init",{success:true});
  }

  @SubscribeMessage('logout')
  async logout() {
    await this.waService.logout();
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(@MessageBody() message: {to: string, message: any, options?: any}) {
    await this.waService.sendMessage(message.to, message.message, message.options);
  }
}
